"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getMenuItems, addOrder } from "@/lib/sheets";
import MenuItemCard from "@/components/MenuItemCard";
import Cart from "@/components/Cart";
import UserIdentity from "@/components/UserIdentity";
import BottomNav from "@/components/BottomNav";
import UserOrderHistory from "@/components/UserOrderHistory";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [animal, setAnimal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");
  const router = useRouter();

  // ユーザー情報の初期化
  useEffect(() => {
    const savedUserId = localStorage.getItem('cafe-user-id');
    const savedNickname = localStorage.getItem('cafe-nickname');
    const savedAnimal = localStorage.getItem('cafe-animal');
    
    if (savedUserId && savedNickname && savedAnimal) {
      setUserId(savedUserId);
      setNickname(savedNickname);
      setAnimal(savedAnimal);
    }
  }, []);

  // メニューデータの取得と30秒間隔での更新
  useEffect(() => {
    if (!userId) return;
    
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
  }, [userId]);

  // カートに商品を追加
  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast.error(`${item.name} は在庫切れです`);
      return;
    }
    
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

  // ユーザー設定
  const handleUserSet = (newUserId: string, newNickname: string, newAnimal: string) => {
    setUserId(newUserId);
    setNickname(newNickname);
    setAnimal(newAnimal);
    localStorage.setItem('cafe-user-id', newUserId);
    localStorage.setItem('cafe-nickname', newNickname);
    localStorage.setItem('cafe-animal', newAnimal);
  };

  // 注文を送信
  const submitOrder = async () => {
    if (!userId) {
      toast.error("ユーザー情報が設定されていません");
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
            userId,
            nickname,
            animal,
            item: item.name,
            price: item.price,
          });
        }
      }
      
      toast.success("注文を送信しました！");
      setCart([]);
      
      // カート画面に切り替え
      setActiveTab("cart");
    } catch (error) {
      console.error("注文の送信に失敗しました:", error);
      toast.error("注文の送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ユーザーが未設定の場合は設定画面を表示
  if (!userId) {
    return <UserIdentity onUserSet={handleUserSet} />;
  }

  return (
    <div className="pb-20">
      {/* ユーザー情報ヘッダー */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{animal.split(" ")[0]}</div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{nickname}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{animal.split(" ")[1]}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('cafe-user-id');
              localStorage.removeItem('cafe-nickname');
              localStorage.removeItem('cafe-animal');
              setUserId(null);
              setNickname("");
              setAnimal("");
              setCart([]);
            }}
            className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
          >
            ユーザー変更
          </button>
        </div>
      </div>

      {/* メニュータブ */}
      {activeTab === "menu" && (
        <div className="px-4 py-6">
          {loading && (
            <div className="flex justify-center items-center min-h-[200px]">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {error && (
            <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
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
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    再読み込み
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item, index) => (
                <MenuItemCard
                  key={index}
                  item={item}
                  onAddToCart={() => addToCart(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* カートタブ */}
      {activeTab === "cart" && (
        <div className="px-4 py-6 space-y-6">
          {/* 注文履歴 */}
          <UserOrderHistory userId={userId!} />
          
          {/* 現在のカート */}
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">カートが空です</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="btn-primary"
              >
                メニューを見る
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <Cart
                items={cart}
                onRemoveItem={removeFromCart}
                onUpdateQuantity={updateQuantity}
              />
              
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  注文情報
                </h3>
                <div className="space-y-4">
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
            </div>
          )}
        </div>
      )}

      {/* フッターナビゲーション */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartItemCount={cartItemCount}
      />
    </div>
  );
}