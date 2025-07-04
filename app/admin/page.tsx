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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

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
    
    fetchOrders();
    setLastOrderCount(orders.length);
    
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

  // 注文の完了状態を切り替え（ローカルストレージベース）
  const toggleOrderStatus = (orderId: string, completed: boolean) => {
    const newCompletedOrders = new Set(completedOrders);
    
    if (completed) {
      // 完了済みから未完了に変更
      newCompletedOrders.delete(orderId);
      toast.success("注文を未完了に変更しました");
    } else {
      // 未完了から完了に変更
      newCompletedOrders.add(orderId);
      toast.success("注文を完了に変更しました");
    }
    
    setCompletedOrders(newCompletedOrders);
    localStorage.setItem('admin-completed-orders', JSON.stringify(Array.from(newCompletedOrders)));
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

  // ローカルストレージの状態を使用して完了状態を判定
  const getOrderId = (order: Order) => `${order.timestamp}-${order.item}-${order.userId}`;
  const pendingOrders = orders.filter(order => !completedOrders.has(getOrderId(order)));
  const completedOrdersList = orders.filter(order => completedOrders.has(getOrderId(order)));

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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🛠️ 管理者画面
            </h1>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  🔊 効果音
                </span>
              </label>
              <div className="text-sm text-gray-500 dark:text-gray-400">
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {pendingOrders.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              未完了注文
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedOrdersList.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              完了済み注文
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Object.keys(userOrders).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              利用者数
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
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    🔄 未完了注文 ({pendingOrders.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
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
                      {pendingOrders.map((order) => (
                        <tr key={`${order.timestamp}-${order.item}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                              onClick={() => toggleOrderStatus(getOrderId(order), false)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                            >
                              完了
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 完了済み注文 */}
            {completedOrdersList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    ✅ 完了済み注文 ({completedOrdersList.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
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
                        <tr key={getOrderId(order)} className="hover:bg-gray-50 dark:hover:bg-gray-700 opacity-60">
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
                              onClick={() => toggleOrderStatus(getOrderId(order), true)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
                            >
                              未完了に戻す
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ユーザー別会計 */}
        {selectedUser === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div key={`${order.timestamp}-${order.item}`} className="flex justify-between items-center">
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