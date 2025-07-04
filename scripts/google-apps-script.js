/**
 * Google Apps Script for Cafe Order App
 * 
 * 1. script.google.com にアクセス
 * 2. 新しいプロジェクトを作成
 * 3. このコードをコピーして貼り付け
 * 4. デプロイ → 新しいデプロイ → ウェブアプリ
 * 5. 実行者: 自分, アクセス許可: 全員
 * 6. デプロイしてURLを取得
 * 7. そのURLを GOOGLE_SCRIPT_URL に設定
 */

function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheetId = e.parameter.sheetId;
    
    if (action === 'getOrders') {
      return getOrders(sheetId);
    } else if (action === 'getMenu') {
      return getMenu(sheetId);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addOrder') {
      return addOrder(data.sheetId, data.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addOrder(sheetId, orderData) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    // ヘッダーが存在しない場合は作成
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 4).setValues([['timestamp', 'user', 'item', 'price']]);
    }
    
    // 新しい行を追加
    const newRow = [
      orderData.timestamp,
      orderData.user,
      orderData.item,
      orderData.price
    ];
    
    sheet.appendRow(newRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Order added successfully',
        data: newRow
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrders(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行をスキップ
    const orders = data.length > 1 ? data.slice(1) : [];
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        data: orders 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getMenu(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行をスキップ
    const menu = data.length > 1 ? data.slice(1) : [];
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        data: menu 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}