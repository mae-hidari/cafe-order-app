"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getMenuItems, addOrder } from "@/lib/sheets";
import MenuItemCard from "@/components/MenuItemCard";
import Cart from "@/components/Cart";

export interface MenuItem {
  name: string;
  price: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // メニューデータの取得と30秒間隔での更新
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setError(null);
        const items = await getMenuItems();
        setMenuItems(items);
        setLoading(false);
      } catch (error) {
        console.error("メニューの取得に失敗しました:", error);
        const errorMessage = error instanceof Error ? error.message : "メニューの取得に失敗しました";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchMenu();
    const interval = setInterval(fetchMenu, 30000); // 30秒間隔
    return () => clearInterval(interval);
  }, []);

  // カートに商品を追加
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.name === item.name);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} をカートに追加しました`);
  };

  // カートから商品を削除
  const removeFromCart = (itemName: string) => {
    setCart(prev => prev.filter(item => item.name !== itemName));
  };

  // 商品数量を更新
  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemName);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.name === itemName ? { ...item, quantity } : item
      )
    );
  };

  // 注文を送信
  const submitOrder = async () => {
    if (!userName.trim()) {
      toast.error("お名前を入力してください");
      return;
    }
    
    if (cart.length === 0) {
      toast.error("カートに商品を追加してください");
      return;
    }

    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          await addOrder({
            timestamp,
            user: userName.trim(),
            item: item.name,
            price: item.price,
          });
        }
      }
      
      toast.success("注文を送信しました！");
      setCart([]);
      setUserName("");
      
      // 会計画面に遷移
      setTimeout(() => {
        router.push("/checkout");
      }, 1000);
    } catch (error) {
      console.error("注文の送信に失敗しました:", error);
      toast.error("注文の送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
              <div className="text-sm text-red-600 dark:text-red-400">
                <p className="mb-2">解決方法:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Google Apps Scriptをデプロイして、URLを取得</li>
                  <li>.env.local ファイルに GOOGLE_SCRIPT_URL を設定</li>
                  <li>Google Sheetsにメニューデータを追加</li>
                  <li>開発サーバーを再起動</li>
                </ol>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn-primary"
              >
                再読み込み
              </button>
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
          メニュー
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item, index) => (
            <MenuItemCard
              key={index}
              item={item}
              onAddToCart={() => addToCart(item)}
            />
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="mb-6">
          <Cart
            items={cart}
            onRemoveItem={removeFromCart}
            onUpdateQuantity={updateQuantity}
          />
        </div>
      )}

      {cart.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            注文情報
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                お名前
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="input-field"
                placeholder="お名前を入力してください"
              />
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
              <span>合計金額:</span>
              <span>¥{totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "注文中..." : "注文する"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push("/checkout")}
          className="btn-secondary"
        >
          会計画面へ
        </button>
      </div>
    </div>
  );
}