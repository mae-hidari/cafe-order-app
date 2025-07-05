"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getMenuItems, addOrder, getOrders, Order } from "@/lib/sheets";
import MenuItemCard from "@/components/MenuItemCard";
import Cart from "@/components/Cart";
import UserIdentity from "@/components/UserIdentity";
import BottomNav from "@/components/BottomNav";
import UserOrderHistory from "@/components/UserOrderHistory";
import LoadingSpinner from "@/components/LoadingSpinner";

export interface MenuItem {
  name: string;
  price: number;
  stock: boolean;
  category?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showStaffConfirmation, setShowStaffConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<CartItem[]>([]);

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

    // AudioContextの初期化
    const initAudioContext = () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      } catch (error) {
        console.warn('AudioContext initialization failed:', error);
      }
    };

    initAudioContext();
  }, []);

  // 効果音を再生
  const playSound = (frequency: number, duration: number = 0.3) => {
    if (!audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  };

  // カート追加音（軽やかな音）
  const playAddToCartSound = () => {
    playSound(600, 0.2);
  };

  // 注文完了音（成功の音）
  const playOrderSuccessSound = () => {
    playSound(800, 0.4);
  };

  // メニューデータの取得
  const fetchMenu = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error("メニューの取得に失敗しました:", error);
      const errorMessage = error instanceof Error ? error.message : "メニューの取得に失敗しました";
      setError(errorMessage);
      if (!showRefreshing) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 注文履歴の取得
  const fetchUserOrders = async (showRefreshing = false) => {
    if (!userId) return;
    
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setOrderHistoryLoading(true);
      }
      setOrderHistoryError(null);
      
      const allOrders = await getOrders();
      const filteredOrders = allOrders.filter(order => order.userId === userId);
      setUserOrders(filteredOrders);
    } catch (error) {
      console.error("注文履歴の取得に失敗しました:", error);
      const errorMessage = error instanceof Error ? error.message : "注文履歴の取得に失敗しました";
      setOrderHistoryError(errorMessage);
      if (!showRefreshing) {
        toast.error(errorMessage);
      }
    } finally {
      setOrderHistoryLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    
    // 初回のみデータを取得
    fetchMenu();
    // 注文履歴がない場合のみ取得
    if (userOrders.length === 0) {
      fetchUserOrders();
    }
  }, [userId]);

  // 手動更新機能
  const handleRefreshMenu = () => {
    fetchMenu(true);
  };

  // 注文履歴の手動更新
  const handleRefreshOrderHistory = () => {
    fetchUserOrders(true);
  };

  // カートに商品を追加
  const addToCart = (item: MenuItem) => {
    if (!item.stock) {
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
    playAddToCartSound();
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

  // 管理者かどうかを判定
  const isAdmin = nickname === '管理者';

  // 注文確認画面を表示
  const initiateOrder = () => {
    if (!userId) {
      toast.error("ユーザー情報が設定されていません");
      return;
    }
    
    if (cart.length === 0) {
      toast.error("カートに商品を追加してください");
      return;
    }

    setPendingOrder([...cart]);
    setShowStaffConfirmation(true);
  };

  // 注文を送信
  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      
      for (const item of pendingOrder) {
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
      playOrderSuccessSound();
      setCart([]);
      setPendingOrder([]);
      setShowStaffConfirmation(false);
      
      // 注文履歴を更新
      fetchUserOrders();
      
      // カート画面に切り替え
      setActiveTab("cart");
    } catch (error) {
      console.error("注文の送信に失敗しました:", error);
      toast.error("注文の送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 注文をキャンセル
  const cancelOrder = () => {
    setPendingOrder([]);
    setShowStaffConfirmation(false);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // カテゴリ別メニューの整理
  const categoryConfig = {
    'フード': { emoji: '🍽️', name: 'フード' },
    'デザート': { emoji: '🍰', name: 'デザート' },
    'ソフトドリンク': { emoji: '🥤', name: 'ソフトドリンク' },
    'お酒': { emoji: '🍺', name: 'お酒' },
    'その他': { emoji: '📦', name: 'その他' }
  };

  const categorizedMenu = menuItems.reduce((acc, item) => {
    let category = item.category || 'その他';
    // 未定義のカテゴリは「その他」に統合
    if (!categoryConfig[category as keyof typeof categoryConfig]) {
      category = 'その他';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // カテゴリの順序を定義
  const categoryOrder = ['フード', 'デザート', 'ソフトドリンク', 'お酒', 'その他'];

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
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <a
                href="/admin"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
              >
                🛠️ 管理画面
              </a>
            )}
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
      </div>

      {/* メニュータブ */}
      {activeTab === "menu" && (
        <div className="px-4 py-6">
          {/* メニュー更新ボタン */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🍽️ メニュー
            </h2>
            <button
              onClick={handleRefreshMenu}
              disabled={refreshing || loading}
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
                    onClick={handleRefreshMenu}
                    className="btn-primary"
                  >
                    再試行
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="space-y-8">
              {categoryOrder.map(categoryKey => {
                const items = categorizedMenu[categoryKey];
                if (!items || items.length === 0) return null;
                
                const config = categoryConfig[categoryKey as keyof typeof categoryConfig];
                
                return (
                  <div key={categoryKey} className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <span>{config.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({items.length}品)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item, index) => (
                        <MenuItemCard
                          key={`${categoryKey}-${index}`}
                          item={item}
                          onAddToCart={() => addToCart(item)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* カートタブ */}
      {activeTab === "cart" && (
        <div className="px-4 py-6 space-y-6">
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
                    onClick={initiateOrder}
                    disabled={submitting}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    注文する
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 注文履歴 */}
          <UserOrderHistory 
            userId={userId!} 
            userOrders={userOrders}
            loading={orderHistoryLoading}
            error={orderHistoryError}
            onRefresh={handleRefreshOrderHistory}
          />
        </div>
      )}

      {/* スタッフ確認モーダル */}
      {showStaffConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                👥 スタッフ確認
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                以下の注文内容をスタッフに確認してもらい、確定ボタンを押してもらってください。
              </p>
              
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">注文内容:</h3>
                {pendingOrder.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ¥{item.price.toLocaleString()} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                    <span>合計:</span>
                    <span>¥{pendingOrder.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={cancelOrder}
                  className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? "注文中..." : "確定"}
                </button>
              </div>
            </div>
          </div>
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