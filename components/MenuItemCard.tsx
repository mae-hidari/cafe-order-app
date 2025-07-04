import { MenuItem } from "@/lib/sheets";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const isOutOfStock = item.stock <= 0;
  
  return (
    <div className={`card ${isOutOfStock ? 'opacity-60' : ''}`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {item.name}
            </h3>
            {isOutOfStock && (
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                品切れ
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            ¥{item.price.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            在庫: {isOutOfStock ? '0' : item.stock}個
          </p>
        </div>
        <button
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className={`w-full ${
            isOutOfStock 
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'btn-primary'
          }`}
        >
          {isOutOfStock ? '品切れ' : 'カートに追加'}
        </button>
      </div>
    </div>
  );
}