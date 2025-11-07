// ==========================================
// BS-美日搜達 報價單系統 - Google Apps Script
// 版本: 2.0 (改進版，包含 CORS 支援)
// ==========================================

/**
 * 處理 POST 請求 - 接收表單資料
 */
function doPost(e) {
  const startTime = new Date();

  // 🔥 詳細的請求日誌
  Logger.log('='.repeat(60));
  Logger.log('🚀 收到新的 POST 請求');
  Logger.log('⏰ 時間: ' + startTime.toISOString());
  Logger.log('='.repeat(60));

  try {
    // 驗證請求
    if (!e || !e.postData) {
      Logger.log('❌ 錯誤: e 或 e.postData 不存在');
      Logger.log('📦 e 的內容:', JSON.stringify(e));
      throw new Error('Invalid request: no postData');
    }

    if (!e.postData.contents) {
      Logger.log('❌ 錯誤: e.postData.contents 不存在');
      Logger.log('📦 e.postData:', JSON.stringify(e.postData));
      throw new Error('Invalid request: no contents');
    }

    Logger.log('📦 請求內容長度: ' + e.postData.contents.length + ' bytes');
    Logger.log('📦 Content-Type: ' + e.postData.type);

    // 解析 JSON 資料
    let data;
    try {
      data = JSON.parse(e.postData.contents);
      Logger.log('✅ JSON 解析成功');
    } catch (parseError) {
      Logger.log('❌ JSON 解析失敗:', parseError.toString());
      Logger.log('📄 原始內容 (前 500 字元):', e.postData.contents.substring(0, 500));
      throw new Error('Invalid JSON: ' + parseError.toString());
    }

    // 記錄關鍵資料
    Logger.log('📊 報價單號: ' + data.quoteNumber);
    Logger.log('👤 客戶類型: ' + data.customerType);
    Logger.log('🏢 公司名稱: ' + data.companyName);
    Logger.log('📧 Email: ' + data.email);
    Logger.log('💰 總金額: NT$' + data.totalPrice);

    // 開啟 Google Sheet
    let sheet;
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      sheet = spreadsheet.getActiveSheet();
      Logger.log('📄 使用的 Sheet: ' + sheet.getName());
      Logger.log('📄 Sheet ID: ' + spreadsheet.getId());
    } catch (sheetError) {
      Logger.log('❌ 無法開啟 Sheet:', sheetError.toString());
      throw new Error('Cannot access spreadsheet: ' + sheetError.toString());
    }

    // 檢查是否需要建立標題列
    if (sheet.getLastRow() === 0) {
      Logger.log('📝 建立標題列...');
      const headers = [
        '報價單號', '時間戳記', '客戶類型', '公司名稱', '統一編號',
        '個人姓名', '地址', '網站', '承辦人', '電話',
        'Email', '發票信箱', '方案名稱', '加購項目', '多店家',
        '額外店家數', '用印方式', '方案價格', '加購價格',
        '多店家價格', '總價'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#A8D8EA'); // 品牌藍色
      Logger.log('✅ 標題列建立完成');
    }

    // 🗂️ 處理 Google Drive 資料夾
    let driveFolder = null;
    if (data.driveFolder) {
      try {
        driveFolder = DriveApp.getFolderById(data.driveFolder);
        Logger.log('📁 使用指定的 Drive 資料夾: ' + driveFolder.getName());
      } catch (error) {
        Logger.log('⚠️ 無法存取指定的資料夾: ' + error.toString());
      }
    }

    // 如果沒有指定資料夾，使用或建立預設資料夾
    if (!driveFolder) {
      try {
        const folderName = 'BS報價單';
        const folders = DriveApp.getFoldersByName(folderName);
        if (folders.hasNext()) {
          driveFolder = folders.next();
          Logger.log('📁 使用現有資料夾: ' + folderName);
        } else {
          driveFolder = DriveApp.createFolder(folderName);
          Logger.log('📁 建立新資料夾: ' + folderName);
        }
      } catch (error) {
        Logger.log('⚠️ 資料夾處理失敗: ' + error.toString());
      }
    }

    // 準備要寫入的資料列
    const row = [
      data.quoteNumber,
      data.timestamp,
      data.customerType,
      data.companyName || '',
      data.taxId || '',
      data.individualName || '',
      data.address || data.companyAddress || '',
      data.website || '',
      data.contactName,
      data.phone,
      data.email,
      data.invoiceEmail,
      data.planName,
      data.addonNames || data.addons || '',
      data.multiStore || 'No',
      data.additionalStores || 0,
      data.stampMethod || 'contact',
      data.planPrice,
      data.addonPrice || data.addonTotal || 0,
      data.multiStorePrice || data.multiStoreTotal || 0,
      data.totalPrice || data.totalAmount
    ];

    // 寫入資料到 Sheet
    try {
      sheet.appendRow(row);
      const lastRow = sheet.getLastRow();
      Logger.log('✅ 資料已寫入 Sheet，列號: ' + lastRow);

      // 格式化新增的列
      const range = sheet.getRange(lastRow, 1, 1, row.length);
      range.setBorder(true, true, true, true, true, true);

      // 價格欄位格式化為貨幣
      sheet.getRange(lastRow, 18, 1, 4).setNumberFormat('#,##0');

    } catch (writeError) {
      Logger.log('❌ 寫入 Sheet 失敗:', writeError.toString());
      throw new Error('Failed to write to sheet: ' + writeError.toString());
    }

    // 📸 處理簽名圖片
    let signatureUrl = null;
    if (data.signature && driveFolder) {
      try {
        const signatureData = data.signature.split(',')[1]; // 移除 data:image/png;base64,
        if (signatureData) {
          const signatureBlob = Utilities.newBlob(
            Utilities.base64Decode(signatureData),
            'image/png',
            data.quoteNumber + '_signature.png'
          );
          const signatureFile = driveFolder.createFile(signatureBlob);
          signatureUrl = signatureFile.getUrl();
          Logger.log('✅ 簽名圖片已儲存: ' + signatureUrl);
        }
      } catch (error) {
        Logger.log('⚠️ 簽名圖片儲存失敗: ' + error.toString());
      }
    }

    // 🏢 處理印章圖片
    let stampUrl = null;
    if (data.stampFile && driveFolder) {
      try {
        const stampData = data.stampFile.split(',')[1];
        if (stampData) {
          const stampBlob = Utilities.newBlob(
            Utilities.base64Decode(stampData),
            'image/png',
            data.quoteNumber + '_stamp.png'
          );
          const stampFile = driveFolder.createFile(stampBlob);
          stampUrl = stampFile.getUrl();
          Logger.log('✅ 印章圖片已儲存: ' + stampUrl);
        }
      } catch (error) {
        Logger.log('⚠️ 印章圖片儲存失敗: ' + error.toString());
      }
    }

    // 📧 發送郵件通知（可選）
    try {
      const emailSubject = '新報價單：' + data.quoteNumber;
      const emailBody = `
收到新的報價單提交：

報價單號：${data.quoteNumber}
時間：${data.timestamp}
公司名稱：${data.companyName}
聯絡人：${data.contactName}
Email：${data.email}
電話：${data.phone}
總金額：NT$ ${data.totalPrice.toLocaleString()}

詳細資料請查看 Google Sheets。
      `.trim();

      // 🔥 請修改為您要接收通知的 Email
      const notificationEmail = 'service@harmoney.com';

      MailApp.sendEmail({
        to: notificationEmail,
        subject: emailSubject,
        body: emailBody
      });

      Logger.log('✅ 通知郵件已發送至: ' + notificationEmail);
    } catch (mailError) {
      Logger.log('⚠️ 郵件發送失敗: ' + mailError.toString());
      // 不影響主流程，繼續執行
    }

    const endTime = new Date();
    const duration = endTime - startTime;
    Logger.log('🎉 處理完成！耗時: ' + duration + 'ms');
    Logger.log('='.repeat(60));

    // 🔥 回傳成功訊息（包含 CORS headers）
    return createCorsResponse({
      status: 'success',
      quoteNumber: data.quoteNumber,
      message: '報價單已成功儲存',
      timestamp: new Date().toISOString(),
      signatureUrl: signatureUrl,
      stampUrl: stampUrl,
      rowNumber: sheet.getLastRow()
    });

  } catch (error) {
    Logger.log('='.repeat(60));
    Logger.log('❌ 發生錯誤: ' + error.toString());
    Logger.log('❌ 錯誤堆疊: ' + error.stack);
    Logger.log('='.repeat(60));

    // 🔥 回傳錯誤訊息（包含 CORS headers）
    return createCorsResponse({
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * 處理 GET 請求 - 測試連線
 */
function doGet(e) {
  Logger.log('📡 收到 GET 請求（測試連線）');

  return createCorsResponse({
    status: 'ok',
    message: 'Google Apps Script is working!',
    version: '2.0',
    timestamp: new Date().toISOString(),
    sheet: SpreadsheetApp.getActiveSpreadsheet().getName()
  });
}

/**
 * 處理 OPTIONS 請求 - CORS 預檢
 */
function doOptions(e) {
  Logger.log('🔄 收到 OPTIONS 請求（CORS 預檢）');

  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    .setHeader('Access-Control-Max-Age', '3600');
}

/**
 * 建立包含 CORS headers 的回應
 */
function createCorsResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 設定 HTTP 狀態碼（雖然 Apps Script 不完全支援，但仍然設定）
  if (statusCode && statusCode !== 200) {
    output.setStatusCode(statusCode);
  }

  return output;
}

/**
 * 手動測試函數 - 在編輯器中執行以測試功能
 */
function testManually() {
  const testData = {
    quoteNumber: 'TEST' + Date.now(),
    timestamp: new Date().toISOString(),
    customerType: 'company',
    companyName: '【測試】測試公司',
    taxId: '12345678',
    individualName: '',
    address: '【測試】台北市測試路123號',
    website: 'https://test.com',
    contactName: '【測試】測試聯絡人',
    phone: '0912345678',
    email: 'test@example.com',
    invoiceEmail: 'test@example.com',
    planName: '店家刊登-1年',
    addonNames: '店家推薦文',
    multiStore: 'No',
    additionalStores: 0,
    stampMethod: 'contact',
    planPrice: 9000,
    addonPrice: 3500,
    multiStorePrice: 0,
    totalPrice: 12500
  };

  // 模擬 doPost 請求
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData),
      type: 'application/json'
    }
  };

  Logger.log('🧪 開始手動測試...');
  const result = doPost(mockEvent);
  Logger.log('✅ 測試完成');
  Logger.log('📄 回應: ' + result.getContent());
}

/**
 * 設定標題列 - 只需執行一次
 */
function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = [
    '報價單號', '時間戳記', '客戶類型', '公司名稱', '統一編號',
    '個人姓名', '地址', '網站', '承辦人', '電話',
    'Email', '發票信箱', '方案名稱', '加購項目', '多店家',
    '額外店家數', '用印方式', '方案價格', '加購價格',
    '多店家價格', '總價'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#A8D8EA');
  sheet.setFrozenRows(1); // 凍結標題列

  Logger.log('✅ 標題列設定完成');
}

// ==========================================
// 部署說明
// ==========================================
//
// 1. 複製此程式碼到 Google Apps Script 編輯器
// 2. 點擊「部署」→「新增部署作業」
// 3. 設定：
//    - 類型：網路應用程式
//    - 執行身分：我（您的帳號）
//    - 具有存取權的使用者：任何人
// 4. 點擊「部署」
// 5. 複製「網路應用程式 URL」（以 /exec 結尾）
// 6. 將 URL 更新到前端 src/config.ts
//
// ⚠️ 重要提醒：
// - 每次修改程式碼後，必須建立「新版本」才會生效
// - 測試時可使用 testManually() 函數
// - 檢查執行記錄：左側「執行作業」圖示
// - 郵件通知功能需要授權 MailApp 權限
//
// ==========================================
