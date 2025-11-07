// ==========================================
// BS-美日搜達 報價單系統 - Google Apps Script
// ==========================================
// 請將此程式碼複製到您的 Google Apps Script 編輯器

function doPost(e) {
  try {
    // 📝 記錄收到的請求
    Logger.log('🚀 收到新的表單提交');
    Logger.log('📦 請求內容長度: ' + e.postData.contents.length + ' bytes');

    // 解析 JSON 資料
    const data = JSON.parse(e.postData.contents);
    Logger.log('✅ 成功解析資料');
    Logger.log('📊 報價單號: ' + data.quoteNumber);
    Logger.log('👤 客戶類型: ' + data.customerType);
    Logger.log('💰 總金額: NT$' + data.totalPrice);

    // 開啟 Google Sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    Logger.log('📄 使用的 Sheet: ' + sheet.getName());

    // 🗂️ 處理 Google Drive 資料夾
    let driveFolder = null;
    if (data.driveFolder) {
      try {
        driveFolder = DriveApp.getFolderById(data.driveFolder);
        Logger.log('📁 使用指定的 Drive 資料夾: ' + driveFolder.getName());
      } catch (error) {
        Logger.log('⚠️ 無法存取指定的資料夾 ID: ' + data.driveFolder);
        Logger.log('⚠️ 錯誤: ' + error.toString());
        // 繼續執行，只是不儲存檔案到特定資料夾
      }
    }

    // 如果沒有指定資料夾，使用根目錄或建立新資料夾
    if (!driveFolder) {
      try {
        // 在根目錄找或建立 "BS報價單" 資料夾
        const folders = DriveApp.getFoldersByName('BS報價單');
        if (folders.hasNext()) {
          driveFolder = folders.next();
          Logger.log('📁 使用現有的預設資料夾: BS報價單');
        } else {
          driveFolder = DriveApp.createFolder('BS報價單');
          Logger.log('📁 建立新的預設資料夾: BS報價單');
        }
      } catch (error) {
        Logger.log('⚠️ 無法建立預設資料夾: ' + error.toString());
      }
    }

    // 準備要寫入的資料列
    const row = [
      data.quoteNumber,
      data.timestamp,
      data.customerType,
      data.companyName,
      data.taxId,
      data.individualName,
      data.address,
      data.website,
      data.contactName,
      data.phone,
      data.email,
      data.invoiceEmail,
      data.planName,
      data.addonNames,
      data.multiStore,
      data.additionalStores,
      data.stampMethod,
      data.planPrice,
      data.addonPrice,
      data.multiStorePrice,
      data.totalPrice
    ];

    // 寫入資料到 Sheet
    sheet.appendRow(row);
    Logger.log('✅ 資料已寫入 Sheet');

    // 📸 處理簽名圖片（如果有）
    if (data.signature && driveFolder) {
      try {
        const signatureBlob = Utilities.newBlob(
          Utilities.base64Decode(data.signature.split(',')[1]),
          'image/png',
          data.quoteNumber + '_signature.png'
        );
        const signatureFile = driveFolder.createFile(signatureBlob);
        Logger.log('✅ 簽名圖片已儲存: ' + signatureFile.getUrl());
      } catch (error) {
        Logger.log('⚠️ 簽名圖片儲存失敗: ' + error.toString());
      }
    }

    // 🏢 處理印章圖片（如果有）
    if (data.stampFile && driveFolder) {
      try {
        const stampBlob = Utilities.newBlob(
          Utilities.base64Decode(data.stampFile.split(',')[1]),
          'image/png',
          data.quoteNumber + '_stamp.png'
        );
        const stampFile = driveFolder.createFile(stampBlob);
        Logger.log('✅ 印章圖片已儲存: ' + stampFile.getUrl());
      } catch (error) {
        Logger.log('⚠️ 印章圖片儲存失敗: ' + error.toString());
      }
    }

    Logger.log('🎉 所有處理完成！');

    // 回傳成功訊息
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'success',
        quoteNumber: data.quoteNumber,
        message: '報價單已成功儲存',
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ 發生錯誤: ' + error.toString());
    Logger.log('❌ 錯誤堆疊: ' + error.stack);

    // 回傳錯誤訊息
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'error',
        message: error.toString(),
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 測試用函數 - 用來驗證 Script 是否正常運作
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'ok',
      message: 'Google Apps Script is working!',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 部署說明
// ==========================================
// 1. 點擊上方「部署」→「新增部署作業」
// 2. 類型選擇「網路應用程式」
// 3. 執行身分：選擇您自己
// 4. 具有存取權的使用者：選擇「任何人」
// 5. 點擊「部署」
// 6. 複製「網路應用程式 URL」
// 7. 將 URL 貼到前端專案的 config.ts 中的 GOOGLE_SCRIPT_URL
//
// 注意：每次修改程式碼後，需要建立「新版本」才會生效！
