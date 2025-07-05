import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const ORDER_SHEET_ID = process.env.ORDER_SHEET_ID;

export async function GET() {
  try {
    if (!GOOGLE_SCRIPT_URL || !ORDER_SHEET_ID) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL または Order Sheet ID が設定されていません' },
        { status: 500 }
      );
    }

    // サーバーサイドからGoogle Apps Scriptを呼び出し（キャッシュバスター付き）
    const cacheBuster = Date.now();
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getOrders&sheetId=${ORDER_SHEET_ID}&t=${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Google Apps Script レスポンス (GET):', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON パースエラー:', parseError);
      throw new Error(`JSONパースに失敗しました: ${responseText}`);
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '注文データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_SCRIPT_URL || !ORDER_SHEET_ID) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL または Order Sheet ID が設定されていません' },
        { status: 500 }
      );
    }

    const orderData = await request.json();

    // サーバーサイドからGoogle Apps Scriptを呼び出し
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addOrder',
        sheetId: ORDER_SHEET_ID,
        data: orderData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Google Apps Script レスポンス:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON パースエラー:', parseError);
      console.error('レスポンステキスト:', responseText);
      
      // Google Apps Scriptが成功時にリダイレクトHTMLを返すことがあるため、
      // 200ステータスの場合は成功として扱う
      if (response.status === 200) {
        return NextResponse.json({ 
          success: true, 
          message: '注文が正常に追加されました',
          data: orderData 
        });
      }
      
      throw new Error(`JSONパースに失敗しました: ${responseText}`);
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('注文の追加に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '注文の追加に失敗しました' },
      { status: 500 }
    );
  }
}