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

    // サーバーサイドからGoogle Apps Scriptを呼び出し
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getOrders&sheetId=${ORDER_SHEET_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: '注文データの取得に失敗しました' },
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('注文の追加に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: '注文の追加に失敗しました' },
      { status: 500 }
    );
  }
}