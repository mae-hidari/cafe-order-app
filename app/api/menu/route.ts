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

    // サーバーサイドからGoogle Apps Scriptを呼び出し（キャッシュバスター付き）
    const cacheBuster = Date.now();
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getMenu&sheetId=${MENU_SHEET_ID}&t=${cacheBuster}`, {
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
    console.log('Google Apps Script レスポンス (Menu):', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON パースエラー:', parseError);
      throw new Error(`JSONパースに失敗しました: ${responseText}`);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('メニューデータの取得に失敗しました:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'メニューデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}