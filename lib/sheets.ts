const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
const MENU_SHEET_ID = process.env.NEXT_PUBLIC_MENU_SHEET_ID || process.env.MENU_SHEET_ID;
const ORDER_SHEET_ID = process.env.NEXT_PUBLIC_ORDER_SHEET_ID || process.env.ORDER_SHEET_ID;
const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;

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

// Google Apps Script経由でメニューデータを取得
export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    // フォールバック用のデモデータ
    const fallbackMenuItems: MenuItem[] = [
      { name: 'コーヒー', price: 300 },
      { name: '紅茶', price: 250 },
      { name: 'ケーキ', price: 400 },
      { name: 'サンドイッチ', price: 350 },
      { name: 'クッキー', price: 200 },
    ];
    
    if (!GOOGLE_SCRIPT_URL) {
      console.warn('Google Apps Script URLが設定されていません。フォールバックデータを使用します。');
      return fallbackMenuItems;
    }

    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getMenu&sheetId=${MENU_SHEET_ID}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const menuItems = result.data.map((row: any[]) => ({
          name: row[0] || '',
          price: parseInt(row[1]) || 0,
        })).filter((item: MenuItem) => item.name && item.price > 0);
        
        if (menuItems.length > 0) {
          return menuItems;
        }
      }
    } catch (sheetError) {
      console.warn('Google Sheetsからのメニュー取得に失敗:', sheetError);
    }
    
    return fallbackMenuItems;
  } catch (error) {
    console.error('メニューデータの取得に失敗しました:', error);
    throw error;
  }
}

// Google Apps Script経由で注文データをGoogle Sheetsに追加
export async function addOrder(order: Order): Promise<void> {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      throw new Error('Google Apps Script URLが設定されていません');
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addOrder',
        sheetId: ORDER_SHEET_ID,
        data: order
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('注文がGoogle Sheetsに追加されました:', result);
  } catch (error) {
    console.error('注文の追加に失敗しました:', error);
    throw error;
  }
}

// Google Apps Script経由で注文データを取得
export async function getOrders(): Promise<Order[]> {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      console.warn('Google Apps Script URLが設定されていません。空の配列を返します。');
      return [];
    }

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getOrders&sheetId=${ORDER_SHEET_ID}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      return result.data.map((row: any[]) => ({
        timestamp: row[0] || '',
        user: row[1] || '',
        item: row[2] || '',
        price: parseInt(row[3]) || 0,
      })).filter((order: Order) => order.timestamp && order.user && order.item && order.price > 0);
    }
    
    return [];
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return [];
  }
}