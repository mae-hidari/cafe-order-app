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
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // メニューデータの取得と30秒間隔での更新
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const items = await getMenuItems();
        setMenuItems(items);
        setLoading(false);
      } catch (error) {
        console.error("メニューの取得に失敗しました:", error);
        toast.error("メニューの取得に失敗しました");
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