import { MenuItem } from "@/lib/sheets";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <div className="card">
      <div className="flex flex-col h-full">
        <div className="flex-1 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {item.name}
          </h3>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ¥{item.price.toLocaleString()}
          </p>
        </div>
        <button
          onClick={onAddToCart}
          className="btn-primary w-full"
        >
          カートに追加
        </button>
      </div>
    </div>
  );
}