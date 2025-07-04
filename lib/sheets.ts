// クライアントサイドでは内部APIを使用

export interface MenuItem {
  name: string;
  price: number;
}

export interface Order {
  timestamp: string;
  user: string;
  item: string;
  price: number;
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
      timestamp: row[0] || '',
      user: row[1] || '',
      item: row[2] || '',
      price: parseInt(row[3]) || 0,
    })).filter((order: Order) => order.timestamp && order.user && order.item && order.price > 0);
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    throw error;
  }
}