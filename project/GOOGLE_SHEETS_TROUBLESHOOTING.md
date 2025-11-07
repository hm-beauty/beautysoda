# 🔧 Google Sheets 表單提交問題診斷指南

## 📋 快速診斷清單

### ✅ 第一步：確認基本設定

#### 1. 檢查 Google Apps Script 部署狀態

**開啟 Apps Script 編輯器**:
```
1. 到您的 Google Sheets
2. 點選「擴充功能」→「Apps Script」
3. 確認程式碼已貼上（參考 google-apps-script-example.js）
```

**檢查部署設定**:
```
✅ 點擊「部署」→「管理部署作業」
✅ 確認有至少一個部署
✅ 類型為「網路應用程式」
✅ 執行身分：選擇您的帳號
✅ 具有存取權的使用者：「任何人」
```

**關鍵提醒**:
> ⚠️ 每次修改 Apps Script 程式碼後，必須點擊「新增部署作業」或更新現有部署，否則變更不會生效！

#### 2. 檢查網址配置

**前端配置檔案** (`src/config.ts`):
```typescript
GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
```

**網址檢查**:
- ✅ 必須以 `/exec` 結尾
- ✅ 不能是 `/dev` (開發模式網址)
- ✅ 複製時要完整複製整個網址

**測試網址是否有效**:
```bash
# 在瀏覽器開啟這個網址
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# 應該看到:
{
  "status": "ok",
  "message": "Google Apps Script is working!",
  "timestamp": "2025-11-07T..."
}
```

---

## 🔍 第二步：診斷提交問題

### 檢查瀏覽器 Console

**開啟 Console**:
```
1. 按 F12 或右鍵選擇「檢查」
2. 切換到「Console」分頁
3. 清空 Console
4. 嘗試提交表單
5. 觀察訊息
```

**正常的 Console 訊息**:
```
🚀 開始送出表單到 Google Sheets
📊 送出資料: {quoteNumber: "BS20251107001", ...}
📍 目標 URL: https://script.google.com/...
📦 資料大小: 1234 bytes
✅ 請求已送出
🎉 表單送出成功！
```

**常見錯誤訊息及解決方法**:

#### ❌ 錯誤 1: "Failed to fetch"
```
原因: 網路問題或 CORS 錯誤
解決方法:
1. 檢查網路連線
2. 確認 Google Apps Script 設定為「任何人」可存取
3. 確認網址正確（以 /exec 結尾）
4. 清除瀏覽器快取重試
```

#### ❌ 錯誤 2: "404 Not Found"
```
原因: 網址錯誤或部署未完成
解決方法:
1. 重新複製完整的部署網址
2. 確認網址沒有多餘的空格
3. 在 Apps Script 建立新的部署
```

#### ❌ 錯誤 3: "403 Forbidden"
```
原因: 權限設定問題
解決方法:
1. 到 Apps Script「部署」設定
2. 「具有存取權的使用者」改為「任何人」
3. 儲存並建立新部署
```

---

## 📊 第三步：檢查 Google Sheets

### 確認資料表結構

**必要的欄位標題** (第一列):
```
| A          | B        | C          | D        | E      | F            | G      | H      |
| 報價單號   | 時間戳記 | 客戶類型   | 公司名稱 | 統編   | 個人姓名     | 地址   | 網站   |

| I        | J      | K     | L          | M        | N          | O      | P          |
| 承辦人   | 電話   | Email | 發票信箱   | 方案名稱 | 加購項目   | 多店家 | 額外店家數 |

| Q        | R        | S          | T            | U      |
| 用印方式 | 方案價格 | 加購價格   | 多店家價格   | 總價   |
```

**設定標題列**:
```javascript
// 在 Apps Script 中加入此函數，執行一次即可
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
  Logger.log('✅ 標題列設定完成');
}
```

### 檢查權限

**確認您有編輯權限**:
```
1. 開啟 Google Sheets
2. 右上角點擊「共用」
3. 確認您的帳號有「編輯者」權限
4. 如果是「檢視者」，無法寫入資料
```

---

## 🧪 第四步：測試提交流程

### 手動測試 Google Apps Script

**測試程式碼** (在 Apps Script 編輯器中執行):
```javascript
function testSubmit() {
  const testData = {
    quoteNumber: 'TEST001',
    timestamp: new Date().toISOString(),
    customerType: 'company',
    companyName: '測試公司',
    taxId: '12345678',
    individualName: '',
    address: '測試地址',
    website: '',
    contactName: '測試聯絡人',
    phone: '0912345678',
    email: 'test@example.com',
    invoiceEmail: 'invoice@example.com',
    planName: '店家刊登-1年',
    addonNames: '',
    multiStore: 'No',
    additionalStores: 0,
    stampMethod: 'contact',
    planPrice: 9000,
    addonPrice: 0,
    multiStorePrice: 0,
    totalPrice: 9000
  };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = [
    testData.quoteNumber,
    testData.timestamp,
    testData.customerType,
    testData.companyName,
    testData.taxId,
    testData.individualName,
    testData.address,
    testData.website,
    testData.contactName,
    testData.phone,
    testData.email,
    testData.invoiceEmail,
    testData.planName,
    testData.addonNames,
    testData.multiStore,
    testData.additionalStores,
    testData.stampMethod,
    testData.planPrice,
    testData.addonPrice,
    testData.multiStorePrice,
    testData.totalPrice
  ];

  sheet.appendRow(row);
  Logger.log('✅ 測試資料已寫入');
}
```

**執行測試**:
```
1. 在 Apps Script 編輯器中
2. 選擇函數 "testSubmit"
3. 點擊「執行」
4. 檢查 Google Sheets 是否有新增一列測試資料
```

---

## 🔎 第五步：查看 Apps Script 執行記錄

### 檢查執行記錄

**開啟記錄**:
```
1. Apps Script 編輯器左側
2. 點擊「執行作業」圖示（時鐘圖示）
3. 查看最近的執行記錄
```

**正常的記錄應包含**:
```
🚀 收到新的表單提交
📦 請求內容長度: 1234 bytes
✅ 成功解析資料
📊 報價單號: BS20251107001
👤 客戶類型: company
💰 總金額: NT$9000
📄 使用的 Sheet: 工作表1
✅ 資料已寫入 Sheet
🎉 所有處理完成！
```

**如果看到錯誤訊息**:
```
❌ 發生錯誤: Cannot read property 'contents' of undefined
→ 表示沒有收到 POST 資料
→ 檢查前端網址配置

❌ 發生錯誤: Exception: You do not have permission to call...
→ 權限問題
→ 重新授權 Apps Script

❌ 發生錯誤: SyntaxError: Unexpected token...
→ JSON 解析失敗
→ 檢查送出的資料格式
```

---

## 🎯 常見問題與解決方案

### 問題 1: 表單顯示成功但 Sheets 沒有資料

**可能原因**:
1. 使用了 `no-cors` 模式，前端無法得知實際結果
2. Apps Script 有錯誤但前端看不到
3. 寫入了錯誤的 Sheet 分頁

**解決方法**:
```
1. 檢查 Apps Script 執行記錄
2. 確認所有 Sheet 分頁，不只是第一個
3. 暫時改用 CORS 模式測試：

// 在 src/services/googleSheets.ts 中暫時修改
mode: 'cors',  // 改為 cors 測試

// 測試後看 Console 的錯誤訊息
```

### 問題 2: 多次提交但只有第一次成功

**可能原因**:
1. Apps Script 執行時間限制
2. 快取問題

**解決方法**:
```
1. 在 Apps Script 中加入隨機參數避免快取
2. 增加錯誤重試機制
3. 檢查是否有重複提交防護
```

### 問題 3: 圖片沒有儲存到 Drive

**可能原因**:
1. Base64 格式錯誤
2. Drive 資料夾權限問題
3. 圖片太大超過限制

**解決方法**:
```
1. 確認圖片已正確轉為 Base64
2. 手動建立 "BS報價單" 資料夾
3. 檢查圖片大小（建議 < 2MB）
```

---

## 📞 仍然無法解決？

### 提供以下資訊以便診斷

1. **瀏覽器 Console 完整錯誤訊息**
   ```
   複製 Console 中的所有錯誤訊息
   包含 stack trace
   ```

2. **Apps Script 執行記錄**
   ```
   截圖或複製最近 3 次執行記錄
   ```

3. **測試資訊**
   ```
   - 提交時間: ____
   - 填寫的公司名稱/姓名: ____
   - 選擇的方案: ____
   - 總金額: ____
   ```

4. **配置資訊**
   ```
   - Google Apps Script URL: ____
   - 是否能開啟網址看到 {"status":"ok"}
   - Google Sheets 網址: ____
   - 您的帳號權限: 擁有者/編輯者/檢視者
   ```

---

## ✅ 最佳實踐建議

### 開發階段
```
1. 先用手動測試確認 Apps Script 正常
2. 使用 CORS 模式開發，方便看錯誤
3. 完整記錄 Console 訊息
4. 定期檢查 Apps Script 執行記錄
```

### 生產階段
```
1. 改用 no-cors 模式避免 CORS 問題
2. 設定錯誤通知機制
3. 定期備份 Google Sheets 資料
4. 監控提交成功率
```

### 安全建議
```
1. 不要在前端程式碼中包含 Service Account 金鑰
2. 使用 Apps Script 統一處理權限
3. 定期檢查 Drive 資料夾權限
4. 考慮使用 Supabase 作為備用儲存
```

---

**祝您順利解決問題！如有其他疑問，歡迎隨時詢問。** 🎉
