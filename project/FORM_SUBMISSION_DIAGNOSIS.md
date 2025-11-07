# 🔍 表單提交問題診斷與解決方案

## 當前狀況分析

### 您的系統配置
- ✅ 前端: React + TypeScript + Vite
- ✅ 後端: Google Apps Script
- ✅ 提交方式: Fetch API (no-cors 模式)
- ✅ Script URL: `https://script.google.com/macros/s/AKfycbx.../exec`

### 問題症狀
- ✅ 前端顯示「送出成功」
- ❌ Google Sheets 沒有新增資料
- ❌ 沒有收到郵件通知
- ❓ Google Apps Script 代碼本身正常

---

## 🎯 核心問題：no-cors 模式的盲點

### 問題根源

您目前使用 **no-cors 模式**，這導致：

```typescript
// src/services/googleSheets.ts (第 88-97 行)
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  mode: 'no-cors', // 🔥 這裡是關鍵！
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
  redirect: 'follow',
});

console.log('✅ 請求已送出');
console.log('🎉 表單送出成功！');
return true; // ⚠️ 無論實際結果如何，都回傳 true
```

**no-cors 模式的限制**:
1. ❌ 無法讀取 response 狀態
2. ❌ 無法得知請求是否真的成功
3. ❌ 無法取得回應內容
4. ✅ 只要請求發出不報錯，就「假設」成功

**真相**:
> 您的請求可能根本沒有真正到達 Google Apps Script，或者到達了但失敗了，但前端完全無法得知！

---

## 🔧 解決方案

### 方案 1: 修正 Google Apps Script CORS 設定（推薦）

#### Step 1: 更新 Google Apps Script 代碼

在您的 Google Apps Script 中加入 CORS headers：

```javascript
function doPost(e) {
  try {
    // 解析資料
    const data = JSON.parse(e.postData.contents);

    // 處理資料...
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([...]);

    // ✨ 回應時加入 CORS headers
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        quoteNumber: data.quoteNumber,
        message: '報價單已成功儲存'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ✨ 新增: 處理 OPTIONS 預檢請求
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

**重要**: 修改後必須：
1. 點擊「部署」→「管理部署作業」
2. 點擊「編輯」
3. 選擇「新版本」
4. 儲存

#### Step 2: 更新前端代碼為 CORS 模式

修改 `src/services/googleSheets.ts`:

```typescript
export async function submitToGoogleSheets(data: SubmissionData): Promise<boolean> {
  console.log('🚀 開始送出表單到 Google Sheets');

  const payload = {
    // ... 保持原有的 payload 結構
  };

  console.log('📊 送出資料:', payload);
  console.log('📍 目標 URL:', SCRIPT_URL);

  try {
    // 🔥 改用 CORS 模式
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'cors', // ✨ 改為 cors
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    console.log('✅ 收到回應，狀態碼:', response.status);

    // 🔥 現在可以讀取 response 了！
    if (!response.ok) {
      throw new Error(`HTTP 錯誤: ${response.status}`);
    }

    const result = await response.json();
    console.log('📄 回應內容:', result);

    if (result.status === 'success') {
      console.log('🎉 表單送出成功！');
      return true;
    } else {
      throw new Error(result.message || '送出失敗');
    }

  } catch (error: any) {
    console.error('❌ 送出失敗:', error);
    throw new Error('表單送出失敗: ' + error.message);
  }
}
```

---

### 方案 2: 使用 Supabase 作為主要儲存（更推薦）

既然您已經有 Supabase 可用，建議直接使用它作為資料庫：

#### Step 1: 建立資料表

使用 Supabase MCP 工具建立表：

```sql
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),

  -- 客戶資訊
  customer_type text NOT NULL CHECK (customer_type IN ('company', 'individual')),
  company_name text NOT NULL,
  tax_id text,
  company_address text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  invoice_email text NOT NULL,
  website text,

  -- 方案資訊
  plan_name text NOT NULL,
  plan_price integer NOT NULL,
  addons jsonb DEFAULT '[]',
  addon_price integer DEFAULT 0,
  additional_stores integer DEFAULT 0,
  multi_store_price integer DEFAULT 0,
  total_price integer NOT NULL,

  -- 簽名資訊
  stamp_method text CHECK (stamp_method IN ('upload', 'contact', 'handwritten')),
  signature_url text,
  stamp_url text,

  -- 狀態
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),

  -- 元資料
  metadata jsonb DEFAULT '{}'
);

-- 啟用 RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 允許任何人新增報價單（可根據需求調整）
CREATE POLICY "Anyone can insert quotes"
  ON quotes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 只允許查看自己的報價單
CREATE POLICY "Users can view own quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- 建立索引
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_email ON quotes(email);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
```

#### Step 2: 更新前端代碼使用 Supabase

```typescript
// src/services/database.ts (新建檔案)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveQuoteToDatabase(data: SubmissionData) {
  const { formData, pricing, quoteNumber, timestamp } = data;

  const { data: result, error } = await supabase
    .from('quotes')
    .insert({
      quote_number: quoteNumber,
      customer_type: formData.customerType,
      company_name: formData.companyName || formData.individualName,
      tax_id: formData.taxId,
      company_address: formData.companyAddress,
      contact_name: formData.contactName,
      phone: formData.phone,
      email: formData.email,
      invoice_email: formData.invoiceEmail,
      website: formData.website,
      plan_name: CONFIG.PLANS[formData.selectedPlan].name,
      plan_price: pricing.planPrice,
      addons: formData.addons.map(a => ({
        id: a,
        name: CONFIG.ADDONS[a].name,
        price: CONFIG.ADDONS[a].price
      })),
      addon_price: pricing.addonPrice,
      additional_stores: formData.additionalStores,
      multi_store_price: pricing.multiStorePrice,
      total_price: pricing.totalPrice,
      stamp_method: formData.stampMethod,
      signature_url: formData.signature,
      stamp_url: formData.stampFile,
      metadata: {
        submitted_at: timestamp,
        user_agent: navigator.userAgent
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase 儲存失敗:', error);
    throw error;
  }

  console.log('✅ 資料已儲存到 Supabase:', result);
  return result;
}
```

#### Step 3: 使用 Edge Function 同步到 Google Sheets

建立一個 Supabase Edge Function 來自動同步：

```typescript
// supabase/functions/sync-to-sheets/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { record } = await req.json();

    // 同步到 Google Sheets
    const response = await fetch('YOUR_GOOGLE_SCRIPT_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

---

## 🧪 診斷步驟

### 立即執行這些測試

#### 1. 測試 Google Apps Script 是否真的收到請求

在 Google Apps Script 中加入詳細日誌：

```javascript
function doPost(e) {
  // 🔥 在最開始就記錄
  Logger.log('='.repeat(50));
  Logger.log('🚀 收到 POST 請求！');
  Logger.log('時間: ' + new Date().toISOString());
  Logger.log('='.repeat(50));

  try {
    Logger.log('📦 e.postData 內容:', JSON.stringify(e.postData));
    Logger.log('📦 e.postData.contents 長度:', e.postData?.contents?.length || 0);

    if (!e.postData || !e.postData.contents) {
      Logger.log('❌ 錯誤: postData 或 contents 不存在！');
      throw new Error('No postData received');
    }

    const data = JSON.parse(e.postData.contents);
    Logger.log('✅ 成功解析 JSON');
    Logger.log('📊 報價單號:', data.quoteNumber);
    Logger.log('👤 公司名稱:', data.companyName);

    // 繼續處理...

  } catch (error) {
    Logger.log('❌ 發生錯誤:', error.toString());
    Logger.log('❌ Stack:', error.stack);
    throw error;
  }
}
```

**檢查執行記錄**:
1. Apps Script 編輯器 → 左側「執行作業」圖示
2. 查看最近的執行記錄
3. 如果沒有記錄 → 請求根本沒到達
4. 如果有錯誤 → 根據錯誤訊息修正

#### 2. 測試前端發送的資料

在瀏覽器 Console 中：

```javascript
// 複製這段到 Console
const testData = {
  quoteNumber: 'TEST' + Date.now(),
  timestamp: new Date().toISOString(),
  customerType: 'company',
  companyName: '測試公司',
  // ... 其他必要欄位
};

// 直接測試發送
fetch('YOUR_SCRIPT_URL', {
  method: 'POST',
  mode: 'cors', // 改為 cors 看錯誤
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => {
  console.log('Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('JSON:', json);
  } catch (e) {
    console.log('Not JSON');
  }
})
.catch(err => console.error('Error:', err));
```

#### 3. 檢查 Network 請求

1. 按 F12 → Network 分頁
2. 清空記錄
3. 提交表單
4. 找到對 Google Apps Script 的請求
5. 檢查：
   - Status Code（應該是 200）
   - Request Headers
   - Request Payload
   - Response

---

## ✅ 快速修復清單

### 立即嘗試這些步驟：

1. **開啟 Debug 模式**
   ```typescript
   // src/config.ts
   FEATURES: {
     enableDebug: true, // ✨ 改為 true
   }
   ```

2. **在 Apps Script 加入更多日誌**
   - 確認請求是否真的到達
   - 記錄每個處理步驟

3. **測試 Script URL**
   - 在瀏覽器直接開啟
   - 應該看到 `{"status":"ok",...}`
   - 如果 404 → URL 錯誤

4. **檢查部署設定**
   - Apps Script → 部署 → 管理部署作業
   - 確認「具有存取權的使用者」= 任何人
   - 確認使用最新版本

5. **暫時改用 CORS 模式測試**
   - 看到實際的錯誤訊息
   - 根據錯誤修正

---

## 📞 需要提供的診斷資訊

如果問題仍未解決，請提供：

### 1. Apps Script 執行記錄
```
Apps Script 編輯器 → 執行作業 → 截圖最近 3 次執行
```

### 2. 瀏覽器 Console 完整輸出
```
F12 → Console → 複製所有訊息
包含:
- 🚀 開始送出...
- 📊 送出資料: {...}
- 任何錯誤訊息
```

### 3. Network 請求詳情
```
F12 → Network → 找到 Google Script 請求
截圖:
- Headers 分頁
- Payload 分頁
- Response 分頁
```

### 4. 測試資訊
```
- 提交時間: ____
- 報價單號: ____
- 公司名稱: ____
- 總金額: ____
```

---

## 🎯 我的建議

根據您的情況，我建議：

### 短期方案（今天就能用）
1. 修正 Apps Script 加入 CORS headers
2. 前端改用 CORS 模式
3. 看到真實的錯誤訊息後修正

### 長期方案（更穩定可靠）
1. 使用 Supabase 作為主要資料庫
2. Google Sheets 作為輔助（通過 Edge Function 同步）
3. 完整的錯誤處理和重試機制
4. 資料備份和恢復機制

**您想從哪個方案開始？我可以協助您實作！** 🚀
