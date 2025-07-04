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
    const callback = e.parameter.callback;
    
    let result;
    if (action === 'getOrders') {
      result = getOrdersData(sheetId);
    } else if (action === 'getMenu') {
      result = getMenuData(sheetId);
    } else {
      result = { success: false, error: 'Invalid action' };
    }
    
    return createResponse(result, callback);
      
  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, e.parameter.callback);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addOrder') {
      return addOrder(data.sheetId, data.data);
    } else if (action === 'updateOrderStatus') {
      return updateOrderStatus(data.sheetId, data.orderId, data.completed);
    }
    
    return createCorsResponse({ success: false, error: 'Invalid action' });
      
  } catch (error) {
    return createCorsResponse({ success: false, error: error.toString() });
  }
}

// JSONP対応のレスポンス作成関数
function createResponse(data, callback) {
  const jsonString = JSON.stringify(data);
  
  if (callback) {
    // JSONP形式
    return ContentService
      .createTextOutput(`${callback}(${jsonString})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 通常のJSON形式
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addOrder(sheetId, orderData) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    // ヘッダーが存在しない場合は作成
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 7).setValues([['timestamp', 'userId', 'nickname', 'animal', 'item', 'price', 'completed']]);
    }
    
    // 新しい行を追加
    const newRow = [
      orderData.timestamp,
      orderData.userId,
      orderData.nickname,
      orderData.animal,
      orderData.item,
      orderData.price,
      orderData.completed || false
    ];
    
    sheet.appendRow(newRow);
    
    return createCorsResponse({ 
      success: true, 
      message: 'Order added successfully',
      data: newRow
    });
      
  } catch (error) {
    return createCorsResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

function getOrdersData(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行をスキップ
    const orders = data.length > 1 ? data.slice(1) : [];
    
    return { 
      success: true, 
      data: orders 
    };
      
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

function getMenuData(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行をスキップ
    const menu = data.length > 1 ? data.slice(1) : [];
    
    return { 
      success: true, 
      data: menu 
    };
      
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

// 注文状態の更新
function updateOrderStatus(sheetId, orderId, completed) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行をスキップして、対象の注文を検索
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const timestamp = row[0];
      
      if (timestamp.toString() === orderId.toString()) {
        // completed列（7列目）を更新
        sheet.getRange(i + 1, 7).setValue(completed);
        
        return createCorsResponse({ 
          success: true, 
          message: 'Order status updated successfully' 
        });
      }
    }
    
    return createCorsResponse({ 
      success: false, 
      error: 'Order not found' 
    });
      
  } catch (error) {
    return createCorsResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

// CORS対応のレスポンス作成関数
function createCorsResponse(data) {
  const jsonString = JSON.stringify(data);
  
  return ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}