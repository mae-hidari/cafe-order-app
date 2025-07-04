import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const ORDER_SHEET_ID = process.env.ORDER_SHEET_ID;

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_SCRIPT_URL || !ORDER_SHEET_ID) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL または Order Sheet ID が設定されていません' },
        { status: 500 }
      );
    }

    const { orderId, completed } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId が必要です' },
        { status: 400 }
      );
    }

    // サーバーサイドからGoogle Apps Scriptを呼び出し
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateOrderStatus',
        sheetId: ORDER_SHEET_ID,
        orderId,
        completed: Boolean(completed)
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Google Apps Script レスポンス (Update):', responseText);
    
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
          message: '注文の状態が正常に更新されました'
        });
      }
      
      throw new Error(`JSONパースに失敗しました: ${responseText}`);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('注文の状態更新に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '注文の状態更新に失敗しました' },
      { status: 500 }
    );
  }
}