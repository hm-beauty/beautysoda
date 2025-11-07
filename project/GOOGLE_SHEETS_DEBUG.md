# Google Sheets 整合除錯指南

## ✅ 已完成的改進

1. **移除 `no-cors` 模式** - 現在可以看到真實的錯誤訊息
2. **詳細的 Console 日誌** - 每個步驟都有清楚的圖示和說明
3. **改良的錯誤處理** - 提供更有用的錯誤訊息
4. **Google Drive 資料夾支援** - 可指定存檔位置

## 🔍 如何除錯

### 步驟 1：開啟瀏覽器開發者工具

1. 按 **F12** 或右鍵 → 檢查
2. 切換到 **Console** 標籤
3. 提交表單
4. 觀察 Console 輸出

### 步驟 2：查看 Console 日誌

您會看到以下訊息（正常流程）：

```
📝 開始送出表單
🎫 產生報價單號: BS-20231106-XXXX
💰 計算價格: {planPrice: 8000, addonPrice: 3500, ...}
🚀 開始送出表單到 Google Sheets
📊 送出資料: {...完整資料...}
📍 目標 URL: https://script.google.com/...
📦 資料大小: 1234 bytes
✅ 收到回應，狀態碼: 200
📄 回應內容: {"status":"success",...}
✨ 解析的 JSON 結果: {...}
🎉 表單送出成功！
✅ 表單處理完成，顯示成功頁面
```

### 步驟 3：查看 Network 請求

1. 切換到 **Network** 標籤
2. 提交表單
3. 找到對 `script.google.com` 的請求
4. 點擊查看詳情：
   - **Headers** - 確認 URL 和請求方法
   - **Payload** - 查看送出的資料
   - **Response** - 查看 Google 的回應

## ❌ 常見問題與解決方案

### 問題 1：CORS 錯誤

**錯誤訊息：**
```
Access to fetch at 'https://script.google.com/...' has been blocked by CORS policy
```

**原因：** Google Apps Script 沒有正確部署

**解決方案：**
1. 開啟 Google Apps Script 編輯器
2. 點擊「部署」→「管理部署作業」
3. 編輯現有部署
4. 確認「具有存取權的使用者」設定為 **任何人**
5. 點擊「部署」
6. **重要：** 複製新的部署 URL（每次修改設定都會產生新 URL）

### 問題 2：404 Not Found

**錯誤訊息：**
```
❌ 收到回應，狀態碼: 404
```

**原因：** URL 錯誤或使用了編輯器 URL

**解決方案：**
1. 確認 `src/config.ts` 中的 `GOOGLE_SCRIPT_URL`
2. URL 應該是：`https://script.google.com/macros/s/AKfyc.../exec`
3. **不是**：`https://script.google.com/d/xxxxx/edit`（編輯器 URL）
4. **不是**：`https://script.google.com/macros/s/AKfyc.../dev`（開發 URL）

### 問題 3：Google Script 沒有執行

**症狀：** 前端顯示成功，但 Google Sheet 沒有資料

**檢查步驟：**

1. **查看 Google Apps Script 執行記錄：**
   - 開啟 Apps Script 編輯器
   - 點擊左側「執行作業」圖示
   - 查看是否有執行記錄和錯誤

2. **測試 Script：**
   - 在瀏覽器開啟：`你的SCRIPT_URL`（直接貼上）
   - 應該看到：`{"status":"ok","message":"Google Apps Script is working!"}`

3. **檢查權限：**
   - 首次執行時，Google 會要求授權
   - 確認已授予所有必要權限（Sheet、Drive）

### 問題 4：Google Drive 資料夾 ID 無效

**錯誤訊息：**
```
⚠️ 無法存取指定的資料夾 ID: xxxxx
```

**解決方案：**

1. **取得正確的資料夾 ID：**
   - 開啟 Google Drive
   - 進入目標資料夾
   - 從網址列複製 ID：
     ```
     https://drive.google.com/drive/folders/1ABC...XYZ
                                            ↑這部分就是 ID
     ```

2. **確認權限：**
   - 資料夾必須是您（Script 擁有者）可存取的
   - 如果是別人的資料夾，需要有「編輯者」權限

3. **留空處理：**
   - 如果不指定資料夾 ID，Script 會自動在根目錄建立「BS報價單」資料夾

### 問題 5：圖片無法儲存

**症狀：** Sheet 有資料，但 Drive 沒有簽名/印章圖片

**可能原因：**

1. **沒有指定資料夾 ID**
   - 確認前端有填寫資料夾 ID，或
   - 確認 Script 有建立預設資料夾的權限

2. **Base64 格式錯誤**
   - 檢查 Console，確認 `signature` 或 `stampFile` 欄位有資料
   - 格式應為：`data:image/png;base64,iVBORw0KG...`

3. **Drive 權限不足**
   - 重新授權 Script 的 Drive 存取權限

## 🔧 進階除錯

### 查看完整的請求資料

在瀏覽器 Console 輸入：

```javascript
// 查看最後送出的資料
console.log(localStorage.getItem('lastSubmission'))
```

### 手動測試 Google Script

使用 Postman 或 curl：

```bash
curl -X POST "你的SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNumber": "TEST-001",
    "timestamp": "2023-11-06T12:00:00Z",
    "customerType": "company",
    "companyName": "測試公司",
    "totalPrice": 10000
  }'
```

### 啟用 Google Apps Script 偵錯

在 Script 中加入：

```javascript
function doPost(e) {
  // 在最開始加入
  console.log('收到的原始資料:', e.postData.contents);

  // 在每個關鍵步驟加入
  console.log('檢查點 1: 解析 JSON 完成');
  console.log('檢查點 2: Sheet 寫入完成');
  // ... 等等
}
```

## 📞 還是無法解決？

請提供以下資訊：

1. **Console 完整錯誤訊息**（截圖或複製文字）
2. **Network 標籤的 Response**
3. **Google Apps Script 的執行記錄**
4. **您的 Script URL**（可遮蔽部分字元）

## ✨ 成功指標

當一切正常運作時，您應該看到：

- ✅ Console 顯示 `🎉 表單送出成功！`
- ✅ Google Sheet 新增一筆資料
- ✅ Google Drive 有簽名/印章圖片（如果有填寫）
- ✅ 前端顯示成功頁面並顯示報價單號

## 🎯 快速檢查清單

- [ ] Google Script 已部署為「網路應用程式」
- [ ] 存取權限設定為「任何人」
- [ ] SCRIPT_URL 是 `/exec` 結尾，不是 `/dev` 或 `/edit`
- [ ] 已授予 Script 存取 Sheets 和 Drive 的權限
- [ ] Sheet 已開啟且可編輯
- [ ] 瀏覽器 Console 沒有 CORS 錯誤
- [ ] Network 請求狀態碼是 200
- [ ] (選填) Drive 資料夾 ID 正確且有權限
