// クライアントサイドでは内部APIを使用

// UUID生成関数
export function generateOrderId(): string {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export interface MenuItem {
  name: string;
  price: number;
  stock: boolean;
  category?: string;
  creator?: string;
}

export interface Order {
  orderId: string;
  timestamp: string;
  userId: string;
  nickname: string;
  animal: string;
  item: string;
  price: number;
  completed?: boolean;
}

// 内部APIを経由してメニューデータを取得
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const response = await fetch('/api/menu');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API エラー: ${result.error || '不明なエラー'}`);
    }

    if (!Array.isArray(result.data) || result.data.length === 0) {
      throw new Error('メニューデータが見つかりません。Google Sheetsにメニューデータを追加してください。');
    }
    
    const menuItems = result.data.map((row: any[]) => ({
      name: row[0] || '',
      price: parseInt(row[1]) || 0,
      stock: row[2] === 'TRUE' || row[2] === 'true' || row[2] === true,
      category: row[3] || '',
      creator: row[4] || '',
    })).filter((item: MenuItem) => item.name && item.price > 0);
    
    if (menuItems.length === 0) {
      throw new Error('有効なメニューデータが見つかりません。name と price の列が正しく設定されているか確認してください。');
    }
    
    return menuItems;
  } catch (error) {
    console.error('メニューデータの取得に失敗しました:', error);
    throw error;
  }
}

// 内部APIを経由して注文データを追加
export async function addOrder(order: Order): Promise<void> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API エラー: ${result.error || '不明なエラー'}`);
    }
    
    console.log('注文が正常に追加されました:', result);
  } catch (error) {
    console.error('注文の追加に失敗しました:', error);
    throw error;
  }
}

// 内部APIを経由して注文データを取得
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await fetch('/api/orders');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API エラー: ${result.error || '不明なエラー'}`);
    }
    
    if (!Array.isArray(result.data)) {
      return []; // 注文データがない場合は空配列を返す（正常な状態）
    }
    
    return result.data.map((row: any[]) => ({
      orderId: row[0] || '',
      timestamp: row[1] || '',
      userId: row[2] || '',
      nickname: row[3] || '',
      animal: row[4] || '',
      item: row[5] || '',
      price: parseInt(row[6]) || 0,
      completed: row[7] === 'true' || false,
    })).filter((order: Order) => order.orderId && order.timestamp && order.userId && order.item && order.price > 0);
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    throw error;
  }
}

// 管理者用：注文の完了状態を更新
export async function updateOrderStatus(orderId: string, completed: boolean): Promise<void> {
  try {
    const response = await fetch('/api/orders/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, completed }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API エラー: ${result.error || '不明なエラー'}`);
    }
    
    console.log('注文の状態が更新されました:', result);
  } catch (error) {
    console.error('注文の状態更新に失敗しました:', error);
    throw error;
  }
}