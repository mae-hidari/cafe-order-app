import { MenuItem } from "@/lib/sheets";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const isOutOfStock = !item.stock;
  
  return (
    <div className={`card ${isOutOfStock ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {item.name}
            </h3>
            {isOutOfStock && (
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                品切れ
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ¥{item.price.toLocaleString()}
            </p>
            {item.creator && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                by {item.creator}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className={`ml-3 px-4 py-2 text-sm rounded-lg font-medium ${
            isOutOfStock 
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isOutOfStock ? '品切れ' : '追加'}
        </button>
      </div>
    </div>
  );
}