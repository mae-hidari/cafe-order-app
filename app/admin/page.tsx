"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getOrders, updateOrderStatus } from "@/lib/sheets";
import { Order } from "@/lib/sheets";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());
  const [seenOrders, setSeenOrders] = useState<Set<string>>(new Set());
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  // 効果音の再生
  const playNotificationSound = () => {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // 注文データの取得
  const fetchOrders = async () => {
    try {
      setError(null);
      const orderData = await getOrders();
      
      // 新しい注文があった場合に効果音を再生
      if (soundEnabled && orderData.length > lastOrderCount && lastOrderCount > 0) {
        playNotificationSound();
      }
      
      // 新規注文の検出（初回読み込み時は全て既存として扱う）
      if (orders.length > 0) {
        const currentOrderIds = new Set(orders.map(getOrderId));
        const newOrderIds = orderData
          .map(getOrderId)
          .filter(id => !currentOrderIds.has(id));
        
        // 新規注文以外を"見た"として記録
        const updatedSeenOrders = new Set(Array.from(seenOrders));
        orderData.forEach(order => {
          const orderId = getOrderId(order);
          if (!newOrderIds.includes(orderId)) {
            updatedSeenOrders.add(orderId);
          }
        });
        setSeenOrders(updatedSeenOrders);
      } else {
        // 初回読み込み時は全て既存として扱う
        const allOrderIds = new Set(orderData.map(getOrderId));
        setSeenOrders(allOrderIds);
      }
      
      setOrders(orderData);
      setLastOrderCount(orderData.length);
      setLoading(false);
    } catch (error) {
      console.error("注文データの取得に失敗しました:", error);
      const errorMessage = error instanceof Error ? error.message : "注文データの取得に失敗しました";
      setError(errorMessage);
      setLoading(false);
    }
  };

  // 初期化
  useEffect(() => {
    // ローカルストレージから完了済み注文を読み込み
    const savedCompleted = localStorage.getItem('admin-completed-orders');
    if (savedCompleted) {
      setCompletedOrders(new Set(JSON.parse(savedCompleted)));
    }
    
    // AudioContextを初期化
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    setAudioContext(ctx);
    
    fetchOrders();
    
    // 5秒間隔で注文データを取得
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // 音声コンテキストの初期化
  useEffect(() => {
    if (soundEnabled && !audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
    }
  }, [soundEnabled]);

  // 注文の完了状態を切り替え（ローカルストレージ + スプレッドシート更新）
  const toggleOrderStatus = async (order: Order, completed: boolean) => {
    const orderId = getOrderId(order);
    const newCompletedOrders = new Set(completedOrders);
    
    // ローディング状態を開始
    setUpdatingOrders(prev => new Set([...prev, orderId]));
    
    // ローカル状態を即座に更新（UX優先）
    if (completed) {
      // 完了済みから未完了に変更
      newCompletedOrders.delete(orderId);
      toast.success("注文を未完了に変更しました");
    } else {
      // 未完了から完了に変更
      newCompletedOrders.add(orderId);
      toast.success("注文を完了に変更しました");
      // 完了時に新規注文を"見た"として記録
      markOrderAsSeen(order);
    }
    
    setCompletedOrders(newCompletedOrders);
    localStorage.setItem('admin-completed-orders', JSON.stringify(Array.from(newCompletedOrders)));
    
    // 非同期でスプレッドシートを更新
    try {
      await updateOrderStatus(orderId, !completed);
    } catch (error) {
      console.error('スプレッドシートの更新に失敗しました:', error);
      // エラー時はローカル状態を元に戻す
      const revertedOrders = new Set(completedOrders);
      if (completed) {
        revertedOrders.add(orderId);
      } else {
        revertedOrders.delete(orderId);
      }
      setCompletedOrders(revertedOrders);
      localStorage.setItem('admin-completed-orders', JSON.stringify(Array.from(revertedOrders)));
      toast.error("スプレッドシートの更新に失敗しました");
    } finally {
      // ローディング状態を確実に終了
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // ユーザーごとの注文集計
  const userOrders = orders.reduce((acc, order) => {
    if (!acc[order.userId]) {
      acc[order.userId] = {
        nickname: order.nickname,
        animal: order.animal,
        orders: [],
        total: 0,
      };
    }
    acc[order.userId].orders.push(order);
    acc[order.userId].total += order.price;
    return acc;
  }, {} as Record<string, {
    nickname: string;
    animal: string;
    orders: Order[];
    total: number;
  }>);

  // 注文IDを取得（新しいorderIdプロパティを使用）
  const getOrderId = (order: Order) => order.orderId;
  
  // 注文を新しいものから降順でソート
  const sortedOrders = [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const pendingOrders = sortedOrders.filter(order => !completedOrders.has(getOrderId(order)));
  const completedOrdersList = sortedOrders.filter(order => completedOrders.has(getOrderId(order)));
  
  // 新規注文かどうかを判定
  const isNewOrder = (order: Order) => !seenOrders.has(getOrderId(order));
  
  // 新規注文を"見た"として記録する関数
  const markOrderAsSeen = (order: Order) => {
    const orderId = getOrderId(order);
    setSeenOrders(prev => new Set([...Array.from(prev), orderId]));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                🛠️ 管理者画面
              </h1>
              <a
                href="/"
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                🍽️ メニューに戻る
              </a>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  🔊 効果音
                </span>
              </label>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                5秒間隔で自動更新
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400 mr-3">⚠️</div>
              <div className="text-red-800 dark:text-red-200">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6 shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {pendingOrders.length}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              未完了注文
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6 shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
              {completedOrdersList.length}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              完了済み注文
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6 shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Object.keys(userOrders).length}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              利用者数
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6 shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">
              ¥{orders.reduce((sum, order) => sum + order.price, 0).toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              総売上
            </div>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedUser(null)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedUser === null
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              全注文 ({orders.length})
            </button>
            <button
              onClick={() => setSelectedUser('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedUser === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ユーザー別会計
            </button>
          </nav>
        </div>

        {/* 全注文一覧 */}
        {selectedUser === null && (
          <div className="space-y-6">
            {/* 未完了注文 */}
            {pendingOrders.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    🔄 未完了注文 ({pendingOrders.length})
                  </h2>
                </div>
                
                {/* デスクトップ版テーブル */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          時間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ユーザー
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          商品
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingOrders.map((order) => {
                        const isNew = isNewOrder(order);
                        return (
                        <tr 
                          key={order.orderId} 
                          className={`${
                            isNew 
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              {isNew && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                  🆕 NEW
                                </span>
                              )}
                              <span>
                                {new Date(order.timestamp).toLocaleString('ja-JP', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-lg mr-2">{order.animal.split(" ")[0]}</div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.nickname}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.animal.split(" ")[1]}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {order.item}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ¥{order.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleOrderStatus(order, false)}
                              disabled={updatingOrders.has(order.orderId)}
                              className={`px-3 py-1 rounded-md text-sm flex items-center space-x-1 ${
                                updatingOrders.has(order.orderId)
                                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {updatingOrders.has(order.orderId) && (
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                </svg>
                              )}
                              <span>完了</span>
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* モバイル版カードリスト */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingOrders.map((order) => {
                    const isNew = isNewOrder(order);
                    return (
                      <div 
                        key={order.orderId}
                        className={`p-4 ${
                          isNew 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400' 
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-lg">{order.animal.split(" ")[0]}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.nickname}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {order.animal.split(" ")[1]}
                              </div>
                            </div>
                          </div>
                          {isNew && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              🆕 NEW
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.item}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(order.timestamp).toLocaleString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ¥{order.price.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleOrderStatus(order, false)}
                          disabled={updatingOrders.has(order.orderId)}
                          className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center space-x-2 ${
                            updatingOrders.has(order.orderId)
                              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {updatingOrders.has(order.orderId) && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                            </svg>
                          )}
                          <span>完了</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 完了済み注文 */}
            {completedOrdersList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    ✅ 完了済み注文 ({completedOrdersList.length})
                  </h2>
                </div>
                
                {/* デスクトップ版テーブル */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          時間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ユーザー
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          商品
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {completedOrdersList.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700 opacity-60">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(order.timestamp).toLocaleString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-lg mr-2">{order.animal.split(" ")[0]}</div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.nickname}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.animal.split(" ")[1]}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {order.item}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ¥{order.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleOrderStatus(order, true)}
                              disabled={updatingOrders.has(order.orderId)}
                              className={`px-3 py-1 rounded-md text-sm flex items-center space-x-1 ${
                                updatingOrders.has(order.orderId)
                                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                                  : 'bg-gray-600 hover:bg-gray-700 text-white'
                              }`}
                            >
                              {updatingOrders.has(order.orderId) && (
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                </svg>
                              )}
                              <span>未完了に戻す</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* モバイル版カードリスト */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {completedOrdersList.map((order) => (
                    <div 
                      key={order.orderId}
                      className="p-4 opacity-60"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">{order.animal.split(" ")[0]}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.nickname}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {order.animal.split(" ")[1]}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          ✅ 完了
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.item}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(order.timestamp).toLocaleString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ¥{order.price.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleOrderStatus(order, true)}
                        disabled={updatingOrders.has(order.orderId)}
                        className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center space-x-2 ${
                          updatingOrders.has(order.orderId)
                            ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {updatingOrders.has(order.orderId) && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                          </svg>
                        )}
                        <span>未完了に戻す</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ユーザー別会計 */}
        {selectedUser === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(userOrders).map(([userId, userData]) => (
              <div key={userId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{userData.animal.split(" ")[0]}</div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {userData.nickname}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {userData.animal.split(" ")[1]}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-2">
                    {userData.orders.map((order) => (
                      <div key={order.orderId} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {order.item}
                          </span>
                          {completedOrders.has(getOrderId(order)) && (
                            <span className="ml-2 text-green-500">✓</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          ¥{order.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        合計
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ¥{userData.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}