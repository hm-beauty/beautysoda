# ⚡ "Failed to fetch" 快速修復

## 🎯 最可能的原因（90%）

**Google Apps Script 的「存取權限」沒有設定正確！**

## 🔧 5 分鐘快速修復

### 步驟 1：開啟 Google Apps Script

前往：https://script.google.com

找到您的「BS報價單系統」專案

### 步驟 2：確認程式碼

複製 `google-apps-script-example.js` 的完整內容到編輯器

### 步驟 3：重新部署（關鍵！）

1. 點擊右上角「**部署**」→「**管理部署作業**」

2. 點擊右邊的 ✏️ (編輯) 圖示

3. 在「版本」下拉選單選擇「**新版本**」

4. 🔥 **最關鍵的設定：**
   - 找到「**具有存取權的使用者**」
   - 必須選擇：**「任何人」** ⬅️ 這是關鍵！
   - 不要選「僅限我自己」

5. 點擊「**部署**」

6. 複製新的「網路應用程式 URL」

### 步驟 4：更新前端 URL

開啟 `src/config.ts`，更新：

```typescript
GOOGLE_SCRIPT_URL: '剛才複製的新 URL'
```

### 步驟 5：測試

1. **先在瀏覽器新分頁直接開啟 Script URL**
   - 應該看到：`{"status":"ok","message":"Google Apps Script is working!"}`
   - 如果看到這個，代表設定正確 ✅

2. **重新整理前端頁面**（按 Ctrl+F5 強制重新整理）

3. **再次提交表單**

## 🔍 仍然失敗？

### 檢查點 1：URL 是否正確

您的 URL 應該長這樣：
```
https://script.google.com/macros/s/AKfycb[一長串字元]/exec
                                                      ^^^^
                                                    必須是 /exec
```

❌ 不要用：
- `/dev` 結尾的 URL（開發 URL）
- `/edit` 的 URL（編輯器 URL）

### 檢查點 2：授權問題

如果第一次部署，Google 會要求授權：

1. 會出現「這個應用程式未經 Google 驗證」
2. 點擊「**進階**」
3. 點擊「**前往 [您的專案] (不安全)**」
4. 點擊「**允許**」

### 檢查點 3：瀏覽器開發者工具

按 F12，查看 Console：

如果看到：
```
Access to fetch at 'https://script.google.com/...' has been blocked by CORS policy
```

代表權限設定錯誤，回到步驟 3，確認選擇「**任何人**」

## 💡 重要提醒

**每次修改 Google Apps Script 或權限後，都必須：**
1. 建立「**新版本**」
2. 重新部署
3. 取得新的 URL

否則修改不會生效！

## 📞 完全無法解決？

1. 開啟 `TROUBLESHOOTING.md` 查看完整排除指南
2. 確認網路連線正常
3. 嘗試使用無痕模式
4. 暫時關閉廣告攔截器

## ✅ 成功標誌

當設定正確時：
- ✅ 直接在瀏覽器開啟 Script URL 會看到 JSON 回應
- ✅ Console 顯示：🎉 表單送出成功！
- ✅ Google Sheet 有新增資料
- ✅ 前端顯示成功頁面
