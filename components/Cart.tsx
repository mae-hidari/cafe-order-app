import { CartItem } from "@/app/page";

interface CartProps {
  items: CartItem[];
  onRemoveItem: (itemName: string) => void;
  onUpdateQuantity: (itemName: string, quantity: number) => void;
}

export default function Cart({ items, onRemoveItem, onUpdateQuantity }: CartProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        カート
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {item.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¥{item.price.toLocaleString()} × {item.quantity}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.name, item.quantity - 1)}
                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center font-semibold text-gray-900 dark:text-white">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.name, item.quantity + 1)}
                className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                +
              </button>
              <button
                onClick={() => onRemoveItem(item.name)}
                className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
          <span>小計:</span>
          <span>¥{totalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}