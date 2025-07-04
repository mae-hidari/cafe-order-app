"use client";

import { useState, useEffect } from "react";
import { getOrders, Order } from "@/lib/sheets";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

interface UserOrderHistoryProps {
  userId: string;
}

export default function UserOrderHistory({ userId }: UserOrderHistoryProps) {
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    // ローカルストレージから完了済み注文を読み込み
    const savedCompleted = localStorage.getItem('admin-completed-orders');
    if (savedCompleted) {
      setCompletedOrders(new Set(JSON.parse(savedCompleted)));
    }
    
    const fetchUserOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const allOrders = await getOrders();
        const filteredOrders = allOrders.filter(order => order.userId === userId);
        setUserOrders(filteredOrders);
      } catch (error) {
        console.error("注文履歴の取得に失敗しました:", error);
        const errorMessage = error instanceof Error ? error.message : "注文履歴の取得に失敗しました";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserOrders();
      // 30秒間隔で更新
      const interval = setInterval(fetchUserOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📋 注文履歴
      </h3>
      
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