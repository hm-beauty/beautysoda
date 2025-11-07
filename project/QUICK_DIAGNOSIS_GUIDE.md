# 🚨 表單提交問題 - 3 分鐘快速診斷

## 問題：顯示成功但 Google Sheets 沒有資料

---

## ⚡ 立即檢查（按順序執行）

### ✅ 步驟 1: 測試 Google Apps Script 連線（30 秒）

**開啟瀏覽器，貼上這個網址**:
```
https://script.google.com/macros/s/AKfycbxnjbb1ZlF0z3k3UV4N5mbtGd-6UC2oSOJ3nZ_q9OZCG_GGXCOLUah6DFZ0JYThB-79Ug/exec
```

**預期結果**:
```json
{
  "status": "ok",
  "message": "Google Apps Script is working!",
  "timestamp": "2025-11-07..."
}
```

**如果看到錯誤**:
- ❌ **404 Not Found** → Apps Script 未正確部署，請重新部署
- ❌ **403 Forbidden** → 權限設定錯誤，改為「任何人」可存取
- ❌ **其他錯誤** → 複製錯誤訊息，查看 `FORM_SUBMISSION_DIAGNOSIS.md`

---

### ✅ 步驟 2: 檢查瀏覽器 Console（1 分鐘）

1. 按 **F12** 開啟開發者工具
2. 切換到 **Console** 分頁
3. 清空記錄（垃圾桶圖示）
4. 提交表單
5. 查看輸出

**正常輸出應該是**:
```
🚀 開始送出表單到 Google Sheets
📊 送出資料: {...}
📍 目標 URL: https://script.google.com/...
📦 資料大小: 1234 bytes
✅ 請求已送出
🎉 表單送出成功！
```

**如果看到錯誤**:
- ❌ **Failed to fetch** → 網路問題或 CORS 錯誤
- ❌ **404** → URL 配置錯誤
- ❌ **403** → 權限問題
- ❌ **500** → Server 錯誤，檢查 Apps Script 執行記錄

---

### ✅ 步驟 3: 檢查 Apps Script 執行記錄（1 分鐘）

1. 開啟 Google Sheets
2. 點選「擴充功能」→「Apps Script」
3. 左側點擊「執行作業」圖示（時鐘圖示）
4. 查看最近的執行記錄

**如果沒有任何記錄**:
> 💡 **這是問題的根源！** 請求根本沒有到達 Google Apps Script

**可能原因**:
1. URL 配置錯誤（檢查 `src/config.ts`）
2. Apps Script 未部署或部署錯誤
3. 使用了錯誤的部署 URL（應該是 `/exec` 不是 `/dev`）

**如果有執行記錄但顯示錯誤**:
> 查看錯誤訊息，根據錯誤類型修正

---

## 🔥 最可能的 3 個原因

### 原因 1: no-cors 模式導致假成功（機率 70%）

**問題**:
```typescript
// 當前代碼使用 no-cors 模式
mode: 'no-cors',  // ← 這會讓前端無法得知真實結果
```

**現象**:
- 前端總是顯示成功
- 實際上請求可能失敗了
- 但前端完全無法得知

**解決方法**:
> 參考 `google-apps-script-improved.js` 更新 Apps Script
> 加入 CORS 支援後，前端改用 `mode: 'cors'`

---

### 原因 2: Apps Script 部署設定錯誤（機率 20%）

**問題**:
- 權限未設為「任何人」
- 使用開發模式 URL (`/dev`)
- 修改後未建立新版本

**解決方法**:
```
1. Apps Script → 部署 → 管理部署作業
2. 點擊「編輯」
3. 具有存取權的使用者 → 改為「任何人」
4. 建立「新版本」
5. 儲存並複製新的 URL
```

---

### 原因 3: URL 配置錯誤（機率 10%）

**檢查**:
```typescript
// src/config.ts
GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_ID/exec'

✅ 確認要點:
1. 包含 script.google.com
2. 以 /exec 結尾（不是 /dev）
3. 沒有多餘空格
4. 完整 URL
```

---

## 💊 快速修復方案

### 方案 A: 啟用詳細日誌（立即執行）

**修改 `src/config.ts`**:
```typescript
FEATURES: {
  enableDebug: true,  // ← 改為 true
  autoSave: false,
  useGoogleDrive: true,
  useGoogleScript: true
}
```

**重新測試**:
- 會看到更多 Console 訊息
- 幫助找出問題所在

---

### 方案 B: 更新 Google Apps Script（推薦）

1. **複製** `google-apps-script-improved.js` 的完整程式碼
2. **貼上** 到 Google Apps Script 編輯器（覆蓋舊的）
3. **執行** `testManually()` 函數測試（選擇函數後點「執行」）
4. **檢查** Google Sheets 是否新增測試資料
5. **部署** 建立新版本
6. **複製** 新的部署 URL
7. **更新** 前端的 `src/config.ts`

**新版本的優勢**:
- ✅ 完整的 CORS 支援
- ✅ 詳細的執行日誌
- ✅ 更好的錯誤處理
- ✅ 自動發送郵件通知
- ✅ 格式化的 Sheet 顯示

---

### 方案 C: 暫時改用 CORS 模式測試（診斷用）

**修改 `src/services/googleSheets.ts`**:
```typescript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  mode: 'cors',  // ← 暫時改為 cors
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

// 加入錯誤檢查
if (!response.ok) {
  console.error('❌ HTTP 錯誤:', response.status);
  const text = await response.text();
  console.error('📄 回應內容:', text);
  throw new Error(`HTTP ${response.status}: ${text}`);
}

const result = await response.json();
console.log('✅ 回應:', result);
```

**重新測試**:
- 會看到真實的錯誤訊息
- 根據錯誤訊息修正問題
- 修正後可改回 `no-cors`（如果需要）

---

## 📊 診斷決策樹

```
提交表單
   │
   ├─ Console 有錯誤?
   │  ├─ 是 → 根據錯誤訊息修正
   │  └─ 否 → 繼續
   │
   ├─ 能開啟 Script URL 看到 {"status":"ok"}?
   │  ├─ 否 → 重新部署 Apps Script
   │  └─ 是 → 繼續
   │
   ├─ Apps Script 有執行記錄?
   │  ├─ 否 → URL 配置錯誤或請求未發出
   │  └─ 是 → 繼續
   │
   ├─ 執行記錄有錯誤?
   │  ├─ 是 → 根據錯誤修正 Apps Script
   │  └─ 否 → 檢查 Google Sheets
   │
   └─ Google Sheets 有資料?
      ├─ 否 → 檢查是否寫入錯誤的分頁
      └─ 是 → 問題解決！ 🎉
```

---

## 🎯 我建議您這樣做

### 立即行動（5 分鐘）:

1. **測試 Script URL** → 確認基本連線
2. **檢查 Console** → 看是否有錯誤
3. **查看執行記錄** → 確認請求是否到達

### 如果都正常但還是沒資料:

1. **使用改進版 Apps Script** → `google-apps-script-improved.js`
2. **執行手動測試** → `testManually()` 函數
3. **查看詳細日誌** → 找出問題所在

### 如果問題仍未解決:

1. **啟用 Debug 模式** → `enableDebug: true`
2. **改用 CORS 模式** → 看真實錯誤
3. **提供診斷資訊** → 查看 `FORM_SUBMISSION_DIAGNOSIS.md`

---

## 📞 需要更多協助？

請提供：
1. 步驟 1-3 的結果截圖
2. Console 完整輸出
3. Apps Script 執行記錄

**相關文檔**:
- 📖 完整診斷指南: `FORM_SUBMISSION_DIAGNOSIS.md`
- 📖 疑難排解: `GOOGLE_SHEETS_TROUBLESHOOTING.md`
- 💻 改進版 Script: `google-apps-script-improved.js`
- 🔧 自動診斷工具: `src/utils/diagnostics.ts`

---

**祝您順利解決問題！** 🚀
