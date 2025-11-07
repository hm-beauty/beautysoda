# BS-美日搜達刊登委刊單系統

一個專業的線上報價單填寫系統，提供直覺的使用者介面和完整的表單驗證功能。

## ✨ 功能特色

- 📝 **多步驟表單** - 清楚的三步驟流程引導
- 🎨 **現代化設計** - 粉色系漸層配色，專業美觀
- 📱 **完全響應式** - 完美支援手機、平板、桌機
- ✅ **即時驗證** - 友善的錯誤提示與驗證
- 💫 **流暢動畫** - 細緻的互動回饋動畫
- 🔒 **安全可靠** - 完整的資料驗證與保護
- 📊 **Google Sheets 整合** - 自動儲存報價資料
- 🖊️ **數位簽名** - 支援手寫簽名與印章上傳

## 🚀 快速開始

### 環境需求

- Node.js 16.x 或更高版本
- npm 或 yarn

### 安裝步驟

1. **Clone 專案**
```bash
git clone <repository-url>
cd <project-folder>
```

2. **安裝相依套件**
```bash
npm install
```

3. **設定環境變數**
```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案，填入您的設定
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **啟動開發伺服器**
```bash
npm run dev
```

5. **開啟瀏覽器**
```
http://localhost:5173
```

## 🛠️ 可用指令

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 預覽建置結果
npm run preview

# 程式碼檢查
npm run lint

# 型別檢查
npm run typecheck
```

## 📦 專案結構

```
src/
├── components/          # React 組件
│   ├── QuoteForm.tsx   # 主表單容器
│   ├── StepOne.tsx     # 步驟一：基本資料
│   ├── StepTwo.tsx     # 步驟二：方案選擇
│   ├── StepThree.tsx   # 步驟三：確認簽名
│   ├── ProgressBar.tsx # 進度條
│   ├── SuccessMessage.tsx  # 成功頁面
│   ├── SignaturePad.tsx    # 簽名板
│   ├── StampUpload.tsx     # 印章上傳
│   ├── ErrorNotification.tsx # 錯誤通知
│   └── LoadingSpinner.tsx    # 載入指示器
├── services/           # 服務層
│   └── googleSheets.ts # Google Sheets 整合
├── utils/             # 工具函式
│   └── priceCalculator.ts # 價格計算
├── config.ts          # 系統配置
├── types.ts           # TypeScript 型別定義
└── App.tsx            # 主要應用程式
```

## 🎨 技術棧

- **前端框架**: React 18 + TypeScript
- **建置工具**: Vite
- **樣式方案**: Tailwind CSS
- **圖示庫**: Lucide React
- **後端服務**: Google Apps Script
- **資料庫**: Supabase (可選)

## ⚙️ 配置說明

### Google Apps Script 設定

1. 建立新的 Google Apps Script 專案
2. 複製 `google-apps-script-example.js` 的程式碼
3. 部署為網頁應用程式
4. 設定權限為「任何人」
5. 複製部署 URL 到 `src/config.ts`

### 方案價格設定

編輯 `src/config.ts` 中的 `PLANS` 和 `ADDONS` 設定：

```typescript
PLANS: {
  plan1: { name: '活動價-1年 (限時限量)', price: 999, multiStorePrice: 999 },
  plan2: { name: '店家刊登-1年', price: 9000, multiStorePrice: 2000 },
  // ...
}
```

### 公司資訊設定

更新 `src/config.ts` 中的 `COMPANY` 和 `PAYMENT` 資訊。

## 🚀 部署

### Vercel (推薦)

1. 將專案推送到 GitHub
2. 到 [Vercel](https://vercel.com) 匯入專案
3. 設定環境變數
4. 自動部署完成

### Netlify

1. 將專案推送到 GitHub
2. 到 [Netlify](https://netlify.com) 匯入專案
3. 建置指令: `npm run build`
4. 發布目錄: `dist`
5. 設定環境變數

### 手動部署

```bash
# 建置專案
npm run build

# dist/ 資料夾包含所有靜態檔案
# 上傳到任何靜態網站主機即可
```

## 📱 瀏覽器支援

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)
- iOS Safari 12+
- Android Chrome

## 🔒 安全性

- ✅ 所有敏感資料使用環境變數
- ✅ 完整的表單驗證
- ✅ XSS 防護 (React 自動處理)
- ✅ HTTPS 強制加密 (部署時)

## 📄 授權

All Rights Reserved © 2025 和吉家行銷有限公司

## 🤝 貢獻

歡迎提出問題和建議！

## 📞 聯絡資訊

- 公司: 和吉家行銷有限公司
- Email: service@harmoney.com
- 電話: 02-2558-5880
- 網站: https://beautysoda.com

## 🙏 致謝

感謝所有使用和支援本系統的使用者！
