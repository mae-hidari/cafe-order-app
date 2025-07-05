"use client";

import { useState, useEffect } from "react";
import { Order } from "@/lib/sheets";
import LoadingSpinner from "./LoadingSpinner";

interface UserOrderHistoryProps {
  userId: string;
  userOrders: Order[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function UserOrderHistory({ userId, userOrders, loading, error, onRefresh }: UserOrderHistoryProps) {
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // ローカルストレージから完了済み注文を読み込み
    const savedCompleted = localStorage.getItem('admin-completed-orders');
    if (savedCompleted) {
      setCompletedOrders(new Set(JSON.parse(savedCompleted)));
    }
  }, []);

  // 手動更新機能
  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    // 少し遅延させてスピナーを表示
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getOrderId = (order: Order) => `${order.timestamp}-${order.item}-${order.userId}`;
  const totalAmount = userOrders.reduce((sum, order) => sum + order.price, 0);

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📋 注文履歴
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
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
          <span className="text-sm">
            {refreshing ? '更新中...' : '更新'}
          </span>
        </button>
      </div>
      
      {userOrders.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          まだ注文がありません
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
            {userOrders.map((order, index) => (
              <div 
                key={`${order.timestamp}-${index}`}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
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
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    ¥{order.price.toLocaleString()}
                  </span>
                  {completedOrders.has(getOrderId(order)) && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                合計金額
              </span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {userOrders.length}件の注文
            </div>
          </div>
        </>
      )}
    </div>
  );
}