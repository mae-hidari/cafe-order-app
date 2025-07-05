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
  const [seenOrders, setSeenOrders] = useState<Set<string>>(new Set());
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'time' | 'item'>('time');
  const [checkedOutOrders, setCheckedOutOrders] = useState<Set<string>>(new Set());
  const [checkedOutUsers, setCheckedOutUsers] = useState<Set<string>>(new Set());

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
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("注文データの取得に失敗しました:", error);
      const errorMessage = error instanceof Error ? error.message : "注文データの取得に失敗しました";
      setError(errorMessage);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初期化
  useEffect(() => {
    // AudioContextを初期化
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    setAudioContext(ctx);
    
    // 会計済み状態をローカルストレージから読み込み
    const savedCheckedOut = localStorage.getItem('cafe-admin-checkout');
    if (savedCheckedOut) {
      try {
        const checkedOutArray = JSON.parse(savedCheckedOut);
        setCheckedOutOrders(new Set(checkedOutArray));
      } catch (error) {
        console.error('会計済み状態の読み込みに失敗しました:', error);
      }
    }
    
    // ユーザー別会計済み状態をローカルストレージから読み込み
    const savedCheckedOutUsers = localStorage.getItem('cafe-admin-checkout-users');
    if (savedCheckedOutUsers) {
      try {
        const checkedOutUsersArray = JSON.parse(savedCheckedOutUsers);
        setCheckedOutUsers(new Set(checkedOutUsersArray));
      } catch (error) {
        console.error('ユーザー別会計済み状態の読み込みに失敗しました:', error);
      }
    }
    
    fetchOrders();
  }, []);

  // 音声コンテキストの初期化
  useEffect(() => {
    if (soundEnabled && !audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
    }
  }, [soundEnabled]);

  // 経過時間の定期更新
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateTimeAgo = () => {
      setTimeAgo(getTimeAgo(lastUpdated));
    };
    
    updateTimeAgo(); // 初回実行
    const interval = setInterval(updateTimeAgo, 1000); // 1秒ごとに更新
    
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // 手動更新
  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // 経過時間の表示
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分前`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}時間前`;
    }
  };

  // 会計済み状態の切り替え
  const toggleCheckout = (orderId: string) => {
    setCheckedOutOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      
      // ローカルストレージに保存
      localStorage.setItem('cafe-admin-checkout', JSON.stringify(Array.from(newSet)));
      
      return newSet;
    });
  };

  // ユーザー別会計済み状態の切り替え
  const toggleUserCheckout = (userId: string) => {
    setCheckedOutUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      
      // ローカルストレージに保存
      localStorage.setItem('cafe-admin-checkout-users', JSON.stringify(Array.from(newSet)));
      
      return newSet;
    });
  };

  // 注文をソートする関数
  const sortOrders = (orders: Order[]) => {
    return [...orders].sort((a, b) => {
      if (sortBy === 'item') {
        return a.item.localeCompare(b.item, 'ja');
      } else {
        // 時間順（新しい順）
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });
  };

  // 注文の完了状態を切り替え（楽観的更新 + スプレッドシート更新）
  const toggleOrderStatus = async (order: Order, completed: boolean) => {
    const orderId = getOrderId(order);
    const newCompletedStatus = !completed;
    
    // ローディング状態を開始
    setUpdatingOrders(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
    
    // 楽観的更新：UIを即座に更新
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.orderId === orderId 
          ? { ...o, completed: newCompletedStatus }
          : o
      )
    );
    
    try {
      // スプレッドシートを更新
      await updateOrderStatus(orderId, newCompletedStatus);
      
      // 成功時のメッセージ
      if (completed) {
        toast.success("注文を未完了に変更しました");
      } else {
        toast.success("注文を完了に変更しました");
        // 完了時に新規注文を"見た"として記録
        markOrderAsSeen(order);
      }
      
    } catch (error) {
      console.error('スプレッドシートの更新に失敗しました:', error);
      
      // エラー時：楽観的更新を元に戻す
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.orderId === orderId 
            ? { ...o, completed: completed }
            : o
        )
      );
      
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
  
  // 注文をソート
  const sortedOrders = sortOrders(orders);
  
  const pendingOrders = sortOrders(orders.filter(order => !order.completed));
  const completedOrdersList = sortOrders(orders.filter(order => order.completed));
  
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
              <button
                onClick={handleManualRefresh}
                disabled={refreshing || loading}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <svg
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{refreshing ? '更新中...' : '更新'}</span>
              </button>
              {lastUpdated && timeAgo && (
                <div className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px] text-right">
                  {timeAgo}
                </div>
              )}
              <button
                onClick={() => setSortBy(sortBy === 'time' ? 'item' : 'time')}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <span>{sortBy === 'time' ? '⏰ 時間順' : '🍽️ 商品順'}</span>
              </button>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 mb-6 md:mb-8">
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
            <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
              {checkedOutUsers.size}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              会計済み
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6 shadow-sm">
            <div className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-400">
              {Object.keys(userOrders).length - checkedOutUsers.size}
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              未会計
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
                          {order.completed && (
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
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        合計
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ¥{userData.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedOutUsers.has(userId)}
                          onChange={() => toggleUserCheckout(userId)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`text-sm font-medium ${
                          checkedOutUsers.has(userId) 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          会計済み
                        </span>
                      </label>
                      {checkedOutUsers.has(userId) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          ✅ 支払い完了
                        </span>
                      )}
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