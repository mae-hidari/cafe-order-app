import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const MENU_SHEET_ID = process.env.MENU_SHEET_ID;

export async function GET() {
  try {
    if (!GOOGLE_SCRIPT_URL || !MENU_SHEET_ID) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL または Menu Sheet ID が設定されていません' },
        { status: 500 }
      );
    }

    // サーバーサイドからGoogle Apps Scriptを呼び出し
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getMenu&sheetId=${MENU_SHEET_ID}`, {
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
    console.error('メニューデータの取得に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: 'メニューデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}