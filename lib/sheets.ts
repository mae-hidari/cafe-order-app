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
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error('Google Apps Script URLが設定されていません。環境変数 NEXT_PUBLIC_GOOGLE_SCRIPT_URL を設定してください。');
  }

  try {
    // JSONPを使用してCORS制限を回避
    const callbackName = `jsonpCallback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const url = `${GOOGLE_SCRIPT_URL}?action=getMenu&sheetId=${MENU_SHEET_ID}&callback=${callbackName}`;
    
    const result = await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('リクエストがタイムアウトしました'));
      }, 10000);
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        document.head.removeChild(script);
        delete (window as any)[callbackName];
      };
      
      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data);
      };
      
      script.onerror = () => {
        cleanup();
        reject(new Error('スクリプトの読み込みに失敗しました'));
      };
      
      script.src = url;
      document.head.appendChild(script);
    });
    
    const apiResult = result as { success: boolean; data?: any[]; error?: string };
    
    if (!apiResult.success) {
      throw new Error(`Google Sheets API エラー: ${apiResult.error || '不明なエラー'}`);
    }

    if (!Array.isArray(apiResult.data) || apiResult.data.length === 0) {
      throw new Error('メニューデータが見つかりません。Google Sheetsにメニューデータを追加してください。');
    }
    
    const menuItems = apiResult.data.map((row: any[]) => ({
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
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error('Google Apps Script URLが設定されていません。環境変数 NEXT_PUBLIC_GOOGLE_SCRIPT_URL を設定してください。');
  }

  try {
    // JSONPを使用してCORS制限を回避
    const callbackName = `jsonpCallback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const url = `${GOOGLE_SCRIPT_URL}?action=getOrders&sheetId=${ORDER_SHEET_ID}&callback=${callbackName}`;
    
    const result = await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('リクエストがタイムアウトしました'));
      }, 10000);
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        document.head.removeChild(script);
        delete (window as any)[callbackName];
      };
      
      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data);
      };
      
      script.onerror = () => {
        cleanup();
        reject(new Error('スクリプトの読み込みに失敗しました'));
      };
      
      script.src = url;
      document.head.appendChild(script);
    });
    
    const apiResult = result as { success: boolean; data?: any[]; error?: string };
    
    if (!apiResult.success) {
      throw new Error(`Google Sheets API エラー: ${apiResult.error || '不明なエラー'}`);
    }
    
    if (!Array.isArray(apiResult.data)) {
      return []; // 注文データがない場合は空配列を返す（正常な状態）
    }
    
    return apiResult.data.map((row: any[]) => ({
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