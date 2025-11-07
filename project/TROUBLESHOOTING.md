# ❌ "Failed to fetch" 錯誤排除指南

## 🔴 您看到的錯誤

```
連線至網頁容器時，輸入式網頁顯示
連交失敗：Failed to fetch

請檢查以下項目：
1. 網路連線是否正常
2. Google Apps Script 是否正確部署
3. 查看瀏覽器 Console 了解詳細錯誤
```

## 📋 快速診斷步驟

### 第 1 步：測試 Google Script 是否運作

**開啟新的瀏覽器分頁，直接輸入您的 Script URL：**

```
https://script.google.com/macros/s/AKfycbxpCm3GAgs54MjwONqgorl2lafQffwpsrBiRI-mCIMEeIJbspGrumMOxAs7aQUH_YT8/exec
```

**預期結果：**
- ✅ 應該看到：`{"status":"ok","message":"Google Apps Script is working!","timestamp":"..."}`
- ❌ 如果看到錯誤或沒有反應，代表 Script 有問題

### 第 2 步：檢查 Google Apps Script 部署設定

**最常見的原因是部署設定錯誤！**

請按照以下步驟重新部署：

#### 2.1 開啟 Google Apps Script 編輯器

1. 前往：https://script.google.com
2. 找到您的「BS報價單系統」專案
3. 點擊開啟

#### 2.2 確認程式碼正確

確認您的 Script 有以下兩個函數：

```javascript
function doPost(e) {
  // ... 處理 POST 請求的程式碼
  return ContentService.createTextOutput(
    JSON.stringify({status: 'success', ...})
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({status: 'ok', message: 'Google Apps Script is working!'})
  ).setMimeType(ContentService.MimeType.JSON);
}
```

💡 **如果沒有這些函數，請複製 `google-apps-script-example.js` 的完整內容到編輯器中！**

#### 2.3 重新部署（重要！）

**🚨 這是最關鍵的步驟！**

1. **點擊右上角「部署」→「管理部署作業」**

2. **如果有現有的部署：**
   - 點擊右邊的 ✏️ (編輯) 圖示
   - 點擊「版本」下拉選單
   - 選擇「**新版本**」
   - 在「說明」欄位輸入：「修正 CORS 問題」
   - 確認「執行身分」是您自己
   - 🔥 **最重要：「具有存取權的使用者」必須選擇「任何人」**
   - 點擊「部署」

3. **如果沒有部署（第一次）：**
   - 點擊「部署」→「新增部署作業」
   - 類型選擇「網路應用程式」⚙️
   - 說明：「BS報價單系統 API」
   - 執行身分：選擇您自己
   - 🔥 **具有存取權的使用者：選擇「任何人」** ← 必須選這個！
   - 點擊「部署」

4. **複製新的部署 URL**
   - 部署成功後會顯示「網路應用程式 URL」
   - 複製整個 URL（應該以 `/exec` 結尾）
   - 更新到 `src/config.ts` 的 `GOOGLE_SCRIPT_URL`

#### 2.4 授權 Script

首次部署或修改權限後，Google 會要求授權：

1. 點擊「審查權限」
2. 選擇您的 Google 帳號
3. 會出現「這個應用程式未經 Google 驗證」警告
   - 點擊「進階」
   - 點擊「前往 [您的專案名稱] (不安全)」
4. 點擊「允許」授予以下權限：
   - ✅ 查看和管理您的試算表
   - ✅ 查看和管理 Google 雲端硬碟中的檔案

### 第 3 步：測試新的 URL

部署完成後：

1. **複製新的 URL**（應該類似：`https://script.google.com/macros/s/AKfycb.../exec`）

2. **在瀏覽器新分頁測試**
   - 直接貼上 URL 並開啟
   - 應該看到：`{"status":"ok","message":"Google Apps Script is working!"}`

3. **更新前端程式碼**
   - 開啟 `src/config.ts`
   - 更新 `GOOGLE_SCRIPT_URL` 為新的 URL
   - 儲存檔案

4. **重新測試表單**

### 第 4 步：檢查瀏覽器 Console

按 F12 開啟開發者工具，查看 Console 訊息：

#### 如果看到 CORS 錯誤：

```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**解決方案：**
- 回到第 2.3 步，確認「具有存取權的使用者」是「任何人」
- 必須建立「新版本」才會生效
- 重新授權 Script

#### 如果看到 404 錯誤：

```
❌ 收到回應，狀態碼: 404
```

**解決方案：**
- URL 錯誤
- 確認使用的是 `/exec` 結尾的 URL，不是 `/dev` 或編輯器 URL

#### 如果看到 Authorization required：

```
Authorization is required to perform that action
```

**解決方案：**
- Script 沒有正確授權
- 回到 Apps Script 編輯器
- 點擊上方的「執行」→ 選擇 `doPost`
- 會跳出授權視窗，完成授權

## 🔍 進階診斷

### 使用 Postman 或 curl 測試

```bash
# 測試 GET 請求
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

# 測試 POST 請求
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"quoteNumber":"TEST-001","customerType":"company","totalPrice":10000}'
```

### 查看 Google Apps Script 執行記錄

1. 開啟 Apps Script 編輯器
2. 點擊左側「執行作業」圖示（時鐘圖示）
3. 查看是否有執行記錄
4. 如果有錯誤，點擊查看詳細資訊

### 確認 Google Sheet 設定

1. 確認 Script 綁定的 Google Sheet 存在且可編輯
2. Sheet 第一列應該有標題列（或留空讓 Script 自動新增）
3. 確認您有該 Sheet 的編輯權限

## ✅ 成功檢查清單

完成以下所有項目後，應該就能正常運作：

- [ ] Google Apps Script 程式碼正確（包含 doPost 和 doGet）
- [ ] Script 已部署為「網路應用程式」
- [ ] 「具有存取權的使用者」設定為「任何人」
- [ ] 已建立新版本（每次修改後都要建立新版本）
- [ ] 已完成 Google 授權（Sheets + Drive）
- [ ] URL 是 `/exec` 結尾
- [ ] 直接在瀏覽器開啟 URL 可以看到 JSON 回應
- [ ] `src/config.ts` 的 URL 已更新
- [ ] Google Sheet 存在且可編輯
- [ ] 瀏覽器 Console 沒有 CORS 錯誤
- [ ] 重新整理前端頁面（Ctrl+F5 強制重新整理）

## 🆘 還是無法解決？

### 方案 1：使用測試 URL

我已經準備了一個測試用的 Script URL，您可以先用這個測試：

**暫時修改 `src/config.ts`：**

```typescript
GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxpCm3GAgs54MjwONqgorl2lafQffwpsrBiRI-mCIMEeIJbspGrumMOxAs7aQUH_YT8/exec',
```

如果測試 URL 可以運作，代表問題出在您的 Script 部署設定。

### 方案 2：重新建立 Script

1. 建立新的 Google Apps Script 專案
2. 完整複製 `google-apps-script-example.js` 的內容
3. 按照第 2 步重新部署
4. 取得新的 URL

### 方案 3：檢查網路環境

- 確認不是在公司或學校的防火牆內
- 嘗試使用其他網路（例如手機熱點）
- 暫時關閉瀏覽器擴充功能（特別是廣告攔截器）
- 嘗試使用無痕模式

## 📞 需要協助？

如果完成以上所有步驟還是無法解決，請提供：

1. **瀏覽器 Console 的完整錯誤訊息**（截圖或文字）
2. **Network 標籤中的請求詳情**
3. **您的 Script URL**（可以遮蔽部分字元）
4. **Google Apps Script 執行記錄**的截圖
5. **直接在瀏覽器開啟 Script URL 的結果**

## 🎯 最可能的原因（依機率排序）

1. **90%** - 「具有存取權的使用者」沒有設定為「任何人」
2. **5%** - 沒有建立新版本（修改後要建立新版本才會生效）
3. **3%** - URL 錯誤（使用了 /dev 或編輯器 URL）
4. **2%** - 其他原因（網路、權限等）

**重點提醒：每次修改 Google Apps Script 或權限設定後，都必須建立「新版本」，否則不會生效！**
