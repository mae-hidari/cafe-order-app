"use client";

interface BottomNavProps {
  activeTab: "menu" | "cart";
  onTabChange: (tab: "menu" | "cart") => void;
  cartItemCount: number;
}

export default function BottomNav({ activeTab, onTabChange, cartItemCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-pb">
      <div className="flex">
        <button
          onClick={() => onTabChange("menu")}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === "menu"
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          <div className="text-xl mb-1">🍽️</div>
          <div className="text-xs font-medium">メニュー</div>
        </button>
        
        <button
          onClick={() => onTabChange("cart")}
          className={`flex-1 py-3 px-4 text-center transition-colors relative ${
            activeTab === "cart"
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
        >
          <div className="text-xl mb-1">🛒</div>
          <div className="text-xs font-medium">カート</div>
          {cartItemCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
}