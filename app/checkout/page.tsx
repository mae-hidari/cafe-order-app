"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getOrders, Order } from "@/lib/sheets";

export interface UserTotal {
  userId: string;
  nickname: string;
  animal: string;
  total: number;
  orders: Order[];
}

export default function CheckoutPage() {
  const [userTotals, setUserTotals] = useState<UserTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 注文データの取得と30秒間隔での更新
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError(null);
        const orders = await getOrders();
        
        // ユーザー別に集計
        const userMap = new Map<string, { nickname: string; animal: string; total: number; orders: Order[] }>();
        
        orders.forEach(order => {
          const existing = userMap.get(order.userId);
          if (existing) {
            existing.total += order.price;
            existing.orders.push(order);
          } else {
            userMap.set(order.userId, {
              nickname: order.nickname,
              animal: order.animal,
              total: order.price,
              orders: [order],
            });
          }
        });

        const totals = Array.from(userMap.entries()).map(([userId, data]) => ({
          userId,
          nickname: data.nickname,
          animal: data.animal,
          total: data.total,
          orders: data.orders,
        }));

        setUserTotals(totals);
        setLoading(false);
      } catch (error) {
        console.error("注文データの取得に失敗しました:", error);
        const errorMessage = error instanceof Error ? error.message : "注文データの取得に失敗しました";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // 30秒間隔
    return () => clearInterval(interval);
  }, []);

  const grandTotal = userTotals.reduce((sum, user) => sum + user.total, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pb-6">
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833-.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                設定エラー
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  再読み込み
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="btn-secondary"
                >
                  メニューに戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          会計
        </h2>
        
        <div className="card mb-6">
          <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white">
            <span>総合計:</span>
            <span className="text-2xl text-blue-600 dark:text-blue-400">
              ¥{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {userTotals.map((userTotal) => (
            <div key={userTotal.userId} className="card">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{userTotal.animal.split(" ")[0]}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {userTotal.nickname}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userTotal.animal.split(" ")[1]}
                    </div>
                  </div>
                </div>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ¥{userTotal.total.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2">
                {userTotal.orders.map((order, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div>
                      <span className="font-medium">{order.item}</span>
                      <span className="ml-2 text-xs">
                        {new Date(order.timestamp).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <span className="font-medium">
                      ¥{order.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {userTotals.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            まだ注文がありません
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={() => router.push("/")}
          className="btn-secondary"
        >
          メニューに戻る
        </button>
      </div>
    </div>
  );
}