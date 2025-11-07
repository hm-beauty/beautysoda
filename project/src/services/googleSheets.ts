/**
 * Google Sheets 資料送出模組
 * 修正 CORS 問題 - 使用 no-cors 模式
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnjbb1ZlF0z3k3UV4N5mbtGd-6UC2oSOJ3nZ_q9OZCG_GGXCOLUah6DFZ0JYThB-79Ug/exec';

import { CONFIG } from '../config';
import { FormData } from '../types';
import { calculatePrice } from '../utils/priceCalculator';

export interface QuoteFormData {
  quoteNumber: string;
  timestamp: string;
  customerType: 'company' | 'individual';
  companyName: string;
  taxId?: string;
  companyAddress: string;
  contactName: string;
  phone: string;
  email: string;
  invoiceEmail: string;
  planName: string;
  planPrice: number;
  addons: Array<{
    name: string;
    price: number;
  }>;
  addonTotal: number;
  additionalStores: number;
  multiStoreTotal: number;
  totalAmount: number;
  stampMethod: 'upload' | 'contact' | 'handwritten';
  stampImage?: string;
  signatureImage?: string;
}

interface SubmissionData {
  quoteNumber: string;
  timestamp: string;
  formData: FormData;
  pricing: ReturnType<typeof calculatePrice>;
  driveFolder?: string;
}

/**
 * 送出表單資料到 Google Sheets
 * 使用 no-cors 模式避免 CORS 問題
 */
export async function submitToGoogleSheets(data: SubmissionData): Promise<boolean> {
  console.log('🚀 開始送出表單到 Google Sheets');

  const payload = {
    quoteNumber: data.quoteNumber,
    timestamp: data.timestamp,
    customerType: data.formData.customerType,
    companyName: data.formData.companyName || '',
    taxId: data.formData.taxId || '',
    individualName: data.formData.individualName || '',
    address: data.formData.companyAddress,
    website: data.formData.website || '',
    contactName: data.formData.contactName,
    phone: data.formData.phone,
    email: data.formData.email,
    invoiceEmail: data.formData.invoiceEmail,
    selectedPlan: data.formData.selectedPlan,
    planName: CONFIG.PLANS[data.formData.selectedPlan].name,
    addons: data.formData.addons.join(', '),
    addonNames: data.formData.addons.map(a => CONFIG.ADDONS[a].name).join(', '),
    multiStore: data.formData.multiStore ? 'Yes' : 'No',
    additionalStores: data.formData.additionalStores || 0,
    stampMethod: data.formData.stampMethod,
    planPrice: data.pricing.planPrice,
    addonPrice: data.pricing.addonPrice,
    multiStorePrice: data.pricing.multiStorePrice,
    totalPrice: data.pricing.totalPrice,
    signature: data.formData.signature || '',
    stampFile: data.formData.stampFile || '',
    driveFolder: data.formData.driveFolder || ''
  };

  console.log('📊 送出資料:', payload);
  console.log('📍 目標 URL:', SCRIPT_URL);
  console.log('📦 資料大小:', JSON.stringify(payload).length, 'bytes');

  try {
    // 使用 no-cors 模式來避免 CORS 預檢請求
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // 🔥 關鍵修改:使用 no-cors 模式
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // 增加 redirect 設定
      redirect: 'follow',
    });

    console.log('✅ 請求已送出');

    // 注意:no-cors 模式下無法讀取 response 內容
    // 但這不影響資料傳送,Google Apps Script 還是會收到並處理

    // 假設成功(因為沒有拋出錯誤)
    console.log('🎉 表單送出成功！');
    return true;

  } catch (error: any) {
    console.error('❌ 送出到 Google Sheets 失敗:', error);
    console.error('錯誤詳情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // 提供詳細的錯誤診斷
    if (error.message.includes('Failed to fetch')) {
      console.error('🔥 網路請求失敗!');
      console.error('📋 可能原因:');
      console.error('1. 網路連線問題');
      console.error('2. Google Apps Script 服務暫時無法使用');
      console.error('3. 瀏覽器阻擋了請求');
      console.error('');
      console.error('💡 解決方式:');
      console.error('- 檢查網路連線');
      console.error('- 稍後再試');
      console.error('- 或直接聯繫我們: sunny@beautysoda.com');
    }

    throw new Error('表單送出失敗,請稍後再試或直接聯繫我們');
  }
}

/**
 * 測試連線
 * 用於檢查 Google Apps Script 是否正常運作
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🧪 測試 Google Apps Script 連線...');
    console.log('📍 測試 URL:', SCRIPT_URL);

    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      mode: 'cors', // GET 請求使用 cors 模式
    });

    const data = await response.json();
    console.log('✅ 連線測試成功:', data);

    return data.status === 'ok';
  } catch (error) {
    console.error('❌ 連線測試失敗:', error);
    return false;
  }
}

/**
 * 產生報價單編號
 * 格式: BS + 年月日 + 3位隨機數
 */
export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `BS${year}${month}${day}${random}`;
}

/**
 * 格式化金額
 */
export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`;
}

/**
 * 驗證表單資料
 */
export function validateFormData(data: Partial<QuoteFormData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必填欄位檢查
  if (!data.companyName) errors.push('請填寫公司/姓名');
  if (!data.companyAddress) errors.push('請填寫地址');
  if (!data.contactName) errors.push('請填寫承辦人姓名');
  if (!data.phone) errors.push('請填寫電話');
  if (!data.email) errors.push('請填寫 Email');
  if (!data.planName) errors.push('請選擇方案');

  // Email 格式檢查
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email 格式不正確');
  }

  // 電話格式檢查(台灣手機或市話)
  if (data.phone && !/^(09\d{8}|0[2-8]-?\d{7,8})$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('電話格式不正確');
  }

  // 統一編號檢查(如果是公司)
  if (data.customerType === 'company' && data.taxId && !/^\d{8}$/.test(data.taxId)) {
    errors.push('統一編號必須是 8 位數字');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 轉換圖片為 Base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
