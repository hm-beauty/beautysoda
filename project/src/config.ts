export const CONFIG = {
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxnjbb1ZlF0z3k3UV4N5mbtGd-6UC2oSOJ3nZ_q9OZCG_GGXCOLUah6DFZ0JYThB-79Ug/exec',

  COMPANY: {
    name: '和吉家行銷有限公司',
    email: 'service@harmoney.com',
    phone: '02-2558-5880',
    address: '103台北市大同區南京西路288號2樓之2',
    website: 'https://beautysoda.com'
  },

  FEATURES: {
    enableDebug: false,
    autoSave: false,
    useGoogleDrive: true,
    useGoogleScript: true
  },

  UPLOAD: {
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    compressQuality: 0.8,
    maxWidth: 800,
    maxHeight: 800
  },

  PLANS: {
    plan1: { name: '活動價-1年 (限時限量)', price: 999, multiStorePrice: 999 },
    plan2: { name: '店家刊登-1年', price: 9000, multiStorePrice: 2000 },
    plan3: { name: '店家刊登-2年', price: 15000, multiStorePrice: 2000 },
    plan4: { name: '店家刊登-3年', price: 20000, multiStorePrice: 2000 }
  },

  ADDONS: {
    addon1: { name: '店家推薦文', price: 3500 },
    addon2: { name: '主題文店家資訊卡', price: 1500 },
    addon3: { name: '店家刊登+店家推薦文', price: 10000 }
  },

  VALIDATION: {
    taxId: { pattern: /^[0-9]{8}$/, message: '統一編號必須是8位數字' },
    phone: { pattern: /^[0-9-+() ]+$/, message: '請輸入有效的電話號碼' },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '請輸入有效的電子郵件' }
  },

  PAYMENT: {
    bankName: '台新銀行(812) 永和分行',
    accountName: '和吉家行銷有限公司',
    accountNumber: '2049-01-0000747-0'
  }
};

export function debugLog(message: string, data?: any) {
  if (CONFIG.FEATURES.enableDebug) {
    console.log(`[BS報價系統] ${message}`, data || '');
  }
}

export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`;
}

export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `BS${year}${month}${day}${random}`;
}
