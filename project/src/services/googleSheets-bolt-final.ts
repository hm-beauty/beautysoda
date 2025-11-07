/**
 * Google Sheets Integration Module - Final Production Version
 *
 * VERSION: 2.0.0
 * UPDATED: 2025-11-07
 *
 * IMPROVEMENTS FROM v1.0:
 * 1. Hybrid approach: Uses GET with URL params for small data, POST for large data
 * 2. Automatic fallback mechanism when URL exceeds length limits
 * 3. Enhanced error handling with retry logic
 * 4. Better TypeScript type safety
 * 5. Comprehensive data validation
 * 6. Image compression before transmission
 * 7. Connection health monitoring
 * 8. Detailed logging for debugging
 *
 * CRITICAL ISSUES FIXED:
 * - no-cors mode blindness (can't detect actual failures)
 * - URL length limitations (2048 chars for GET)
 * - Base64 image data can be huge (causes submission failures)
 * - No retry mechanism for transient failures
 * - Poor error feedback to users
 */

import { CONFIG } from '../config';
import { FormData } from '../types';
import { calculatePrice } from '../utils/priceCalculator';

// Constants
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnjbb1ZlF0z3k3UV4N5mbtGd-6UC2oSOJ3nZ_q9OZCG_GGXCOLUah6DFZ0JYThB-79Ug/exec';
const MAX_URL_LENGTH = 2000; // Safe limit (browsers support up to ~2048)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB per image (compressed)

// Types
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
  stampMethod: 'upload' | 'contact' | 'handwritten' | 'signature';
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

interface SubmissionResult {
  success: boolean;
  message: string;
  quoteNumber?: string;
  method?: 'GET' | 'POST';
  attempts?: number;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Main submission function with intelligent method selection
 * Automatically chooses between GET (fast, limited) and POST (slower, unlimited)
 */
export async function submitToGoogleSheets(data: SubmissionData): Promise<SubmissionResult> {
  console.log('🚀 開始送出表單到 Google Sheets');
  console.log('📊 報價單號:', data.quoteNumber);

  // Step 1: Validate data before submission
  const validation = validateSubmissionData(data);
  if (!validation.valid) {
    console.error('❌ 資料驗證失敗:', validation.errors);
    return {
      success: false,
      message: '資料驗證失敗: ' + validation.errors.join(', '),
      error: validation.errors.join(', ')
    };
  }

  // Display warnings if any
  if (validation.warnings && validation.warnings.length > 0) {
    console.warn('⚠️ 警告:', validation.warnings);
  }

  // Step 2: Prepare payload
  const payload = await preparePayload(data);
  console.log('📦 原始資料大小:', JSON.stringify(payload).length, 'bytes');

  // Step 3: Compress images if present
  const compressedPayload = await compressPayloadImages(payload);
  console.log('📦 壓縮後資料大小:', JSON.stringify(compressedPayload).length, 'bytes');

  // Step 4: Decide submission method
  const method = decideSubmissionMethod(compressedPayload);
  console.log('📍 選擇的提交方式:', method);

  // Step 5: Submit with retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 嘗試 ${attempt}/${MAX_RETRIES}...`);

      if (method === 'GET') {
        const result = await submitViaGET(compressedPayload);
        console.log('✅ GET 提交成功！');
        return {
          success: true,
          message: '報價單已成功送出',
          quoteNumber: data.quoteNumber,
          method: 'GET',
          attempts: attempt
        };
      } else {
        const result = await submitViaPOST(compressedPayload);
        console.log('✅ POST 提交成功！');
        return {
          success: true,
          message: '報價單已成功送出',
          quoteNumber: data.quoteNumber,
          method: 'POST',
          attempts: attempt
        };
      }

    } catch (error: any) {
      console.error(`❌ 嘗試 ${attempt} 失敗:`, error.message);

      // If this was the last attempt, return error
      if (attempt === MAX_RETRIES) {
        const errorMessage = generateUserFriendlyError(error);
        return {
          success: false,
          message: errorMessage,
          error: error.message,
          attempts: attempt
        };
      }

      // Wait before retry
      await sleep(RETRY_DELAY * attempt); // Exponential backoff
      console.log('⏳ 等待後重試...');
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    success: false,
    message: '送出失敗，請稍後再試',
    error: 'Max retries exceeded'
  };
}

/**
 * Prepare payload from submission data
 */
async function preparePayload(data: SubmissionData): Promise<Record<string, any>> {
  return {
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
}

/**
 * Compress images in payload to reduce size
 * CRITICAL FIX: Large base64 images can cause URL length issues or POST failures
 */
async function compressPayloadImages(payload: Record<string, any>): Promise<Record<string, any>> {
  const compressed = { ...payload };

  // Compress signature if present
  if (payload.signature && payload.signature.length > MAX_IMAGE_SIZE) {
    console.log('🗜️ 壓縮簽名圖片...');
    try {
      compressed.signature = await compressBase64Image(payload.signature, 0.7);
      console.log('✅ 簽名壓縮完成:', compressed.signature.length, 'bytes');
    } catch (error) {
      console.warn('⚠️ 簽名壓縮失敗，使用原圖');
    }
  }

  // Compress stamp if present
  if (payload.stampFile && payload.stampFile.length > MAX_IMAGE_SIZE) {
    console.log('🗜️ 壓縮印章圖片...');
    try {
      compressed.stampFile = await compressBase64Image(payload.stampFile, 0.7);
      console.log('✅ 印章壓縮完成:', compressed.stampFile.length, 'bytes');
    } catch (error) {
      console.warn('⚠️ 印章壓縮失敗，使用原圖');
    }
  }

  return compressed;
}

/**
 * Compress a base64 image
 */
async function compressBase64Image(base64: string, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Maintain aspect ratio, max 800px
      let width = img.width;
      let height = img.height;
      const maxSize = 800;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

/**
 * Decide which submission method to use based on payload size
 * CRITICAL FIX: GET has URL length limit (~2048 chars)
 */
function decideSubmissionMethod(payload: Record<string, any>): 'GET' | 'POST' {
  // Build URL to check length
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  const testUrl = `${SCRIPT_URL}?${params.toString()}`;
  const urlLength = testUrl.length;

  console.log('📏 預估 URL 長度:', urlLength);

  if (urlLength > MAX_URL_LENGTH) {
    console.log('⚠️ URL 過長，使用 POST 方式');
    return 'POST';
  }

  // GET is preferred because it's simpler and more reliable
  console.log('✅ URL 長度可接受，使用 GET 方式');
  return 'GET';
}

/**
 * Submit via GET method with URL parameters
 * ADVANTAGE: Simpler, works with CORS, can verify response
 */
async function submitViaGET(payload: Record<string, any>): Promise<void> {
  const params = new URLSearchParams();

  // Add all payload data as URL parameters
  Object.entries(payload).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  const url = `${SCRIPT_URL}?${params.toString()}`;

  console.log('📍 GET URL 長度:', url.length);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📄 伺服器回應:', result);

    if (result.status !== 'success' && result.status !== 'ok') {
      throw new Error(result.message || '伺服器回應異常');
    }

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('請求逾時，請檢查網路連線');
    }

    throw error;
  }
}

/**
 * Submit via POST method with JSON body
 * ADVANTAGE: No URL length limit, can handle large data
 * DISADVANTAGE: Requires proper CORS setup in Apps Script
 */
async function submitViaPOST(payload: Record<string, any>): Promise<void> {
  console.log('📦 POST 資料大小:', JSON.stringify(payload).length, 'bytes');

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'cors', // CRITICAL: Changed from no-cors to cors for proper error handling
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📄 伺服器回應:', result);

    if (result.status !== 'success') {
      throw new Error(result.message || '伺服器回應異常');
    }

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('請求逾時，請檢查網路連線');
    }

    throw error;
  }
}

/**
 * Test connection to Google Apps Script
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🧪 測試 Google Apps Script 連線...');
    console.log('📍 測試 URL:', SCRIPT_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ HTTP 錯誤:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('✅ 連線測試成功:', data);

    return data.status === 'ok' || data.status === 'success';

  } catch (error) {
    console.error('❌ 連線測試失敗:', error);
    return false;
  }
}

/**
 * Validate submission data
 * CRITICAL: Prevents bad data from being sent
 */
function validateSubmissionData(data: SubmissionData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.quoteNumber) errors.push('缺少報價單號');
  if (!data.timestamp) errors.push('缺少時間戳記');
  if (!data.formData) errors.push('缺少表單資料');
  if (!data.pricing) errors.push('缺少價格資料');

  if (data.formData) {
    // Customer info
    if (!data.formData.contactName) errors.push('缺少聯絡人姓名');
    if (!data.formData.phone) errors.push('缺少電話');
    if (!data.formData.email) errors.push('缺少 Email');
    if (!data.formData.companyAddress) errors.push('缺少地址');

    // Email validation
    if (data.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.formData.email)) {
      errors.push('Email 格式不正確');
    }

    // Phone validation (Taiwan format)
    const phoneClean = data.formData.phone?.replace(/[\s-()]/g, '') || '';
    if (phoneClean && !/^(09\d{8}|0[2-8]\d{7,8})$/.test(phoneClean)) {
      warnings.push('電話格式可能不正確');
    }

    // Tax ID validation (if company)
    if (data.formData.customerType === 'company') {
      if (!data.formData.companyName) errors.push('公司名稱為必填');
      if (data.formData.taxId && !/^\d{8}$/.test(data.formData.taxId)) {
        errors.push('統一編號必須是 8 位數字');
      }
    }

    // Plan validation
    if (!data.formData.selectedPlan) {
      errors.push('未選擇方案');
    }

    // Image size warnings
    if (data.formData.signature && data.formData.signature.length > 1024 * 1024) {
      warnings.push('簽名圖片較大，可能影響傳輸速度');
    }
    if (data.formData.stampFile && data.formData.stampFile.length > 1024 * 1024) {
      warnings.push('印章圖片較大，可能影響傳輸速度');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate user-friendly error message
 */
function generateUserFriendlyError(error: any): string {
  const message = error.message || String(error);

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '網路連線失敗，請檢查您的網路狀態後重試';
  }

  if (message.includes('timeout') || message.includes('逾時')) {
    return '請求逾時，請檢查網路連線或稍後再試';
  }

  if (message.includes('403') || message.includes('Forbidden')) {
    return 'Google Apps Script 權限設定問題，請聯繫技術支援';
  }

  if (message.includes('404') || message.includes('Not Found')) {
    return 'Google Apps Script 端點錯誤，請聯繫技術支援';
  }

  if (message.includes('500') || message.includes('Internal Server')) {
    return 'Google Apps Script 執行錯誤，請稍後再試';
  }

  if (message.includes('CORS')) {
    return 'Google Apps Script CORS 設定問題，請聯繫技術支援';
  }

  // Generic error
  return `送出失敗: ${message}。請稍後再試或聯繫我們 (${CONFIG.COMPANY.email})`;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate quote number
 * Format: BS + YYYYMMDD + 3-digit random
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
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`;
}

/**
 * Validate form data (used by form components)
 */
export function validateFormData(data: Partial<QuoteFormData>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.companyName) errors.push('請填寫公司/姓名');
  if (!data.companyAddress) errors.push('請填寫地址');
  if (!data.contactName) errors.push('請填寫承辦人姓名');
  if (!data.phone) errors.push('請填寫電話');
  if (!data.email) errors.push('請填寫 Email');
  if (!data.planName) errors.push('請選擇方案');

  // Email format
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email 格式不正確');
  }

  // Phone format (Taiwan mobile or landline)
  if (data.phone) {
    const cleanPhone = data.phone.replace(/[\s-()]/g, '');
    if (!/^(09\d{8}|0[2-8]\d{7,8})$/.test(cleanPhone)) {
      errors.push('電話格式不正確');
    }
  }

  // Tax ID (if company)
  if (data.customerType === 'company' && data.taxId && !/^\d{8}$/.test(data.taxId)) {
    errors.push('統一編號必須是 8 位數字');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Convert image file to Base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Export for testing
export const __test__ = {
  preparePayload,
  compressPayloadImages,
  decideSubmissionMethod,
  validateSubmissionData,
  generateUserFriendlyError,
  MAX_URL_LENGTH,
  MAX_RETRIES
};
