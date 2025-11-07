/**
 * Google Sheets 整合診斷工具
 * 用於測試和診斷表單提交問題
 */

import { CONFIG } from '../config';

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * 執行完整診斷
 */
export async function runFullDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('🔍 開始執行 Google Sheets 整合診斷...\n');

  // 測試 1: 檢查配置
  results.push(await testConfiguration());

  // 測試 2: 測試網路連線
  results.push(await testNetworkConnection());

  // 測試 3: 測試 Google Apps Script GET 請求
  results.push(await testGoogleScriptGet());

  // 測試 4: 測試資料格式
  results.push(testDataFormat());

  // 測試 5: 測試瀏覽器支援
  results.push(testBrowserSupport());

  // 輸出診斷結果
  console.log('\n' + '='.repeat(50));
  console.log('📊 診斷結果摘要');
  console.log('='.repeat(50) + '\n');

  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} 測試 ${index + 1}: ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log('   詳細資訊:', result.details);
    }
    console.log('');
  });

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warning').length;

  console.log('='.repeat(50));
  console.log(`總計: ${passCount} 通過, ${failCount} 失敗, ${warnCount} 警告`);
  console.log('='.repeat(50) + '\n');

  if (failCount > 0) {
    console.log('❌ 發現問題！請參考 GOOGLE_SHEETS_TROUBLESHOOTING.md 進行修正');
  } else if (warnCount > 0) {
    console.log('⚠️ 發現警告，建議檢查相關設定');
  } else {
    console.log('✅ 所有測試通過！系統運作正常');
  }

  return results;
}

/**
 * 測試 1: 檢查配置
 */
async function testConfiguration(): Promise<DiagnosticResult> {
  const url = CONFIG.GOOGLE_SCRIPT_URL;

  if (!url) {
    return {
      test: '配置檢查',
      status: 'fail',
      message: 'GOOGLE_SCRIPT_URL 未設定',
      details: '請在 src/config.ts 中設定正確的 Google Apps Script URL'
    };
  }

  if (!url.includes('script.google.com')) {
    return {
      test: '配置檢查',
      status: 'fail',
      message: 'GOOGLE_SCRIPT_URL 格式不正確',
      details: `當前 URL: ${url}\n應該包含 script.google.com`
    };
  }

  if (!url.endsWith('/exec')) {
    return {
      test: '配置檢查',
      status: 'warning',
      message: 'URL 不是以 /exec 結尾',
      details: `當前 URL: ${url}\n建議使用部署後的 /exec 網址而非 /dev`
    };
  }

  return {
    test: '配置檢查',
    status: 'pass',
    message: 'Google Apps Script URL 配置正確',
    details: url
  };
}

/**
 * 測試 2: 測試網路連線
 */
async function testNetworkConnection(): Promise<DiagnosticResult> {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors'
    });

    return {
      test: '網路連線',
      status: 'pass',
      message: '網路連線正常'
    };
  } catch (error) {
    return {
      test: '網路連線',
      status: 'fail',
      message: '網路連線失敗',
      details: (error as Error).message
    };
  }
}

/**
 * 測試 3: 測試 Google Apps Script GET 請求
 */
async function testGoogleScriptGet(): Promise<DiagnosticResult> {
  const url = CONFIG.GOOGLE_SCRIPT_URL;

  try {
    console.log(`📡 測試 GET 請求: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) {
      return {
        test: 'Google Apps Script 連線測試',
        status: 'fail',
        message: `HTTP 錯誤: ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: url
        }
      };
    }

    const data = await response.json();

    if (data.status === 'ok') {
      return {
        test: 'Google Apps Script 連線測試',
        status: 'pass',
        message: 'Google Apps Script 回應正常',
        details: data
      };
    } else {
      return {
        test: 'Google Apps Script 連線測試',
        status: 'warning',
        message: '收到回應但狀態異常',
        details: data
      };
    }
  } catch (error) {
    return {
      test: 'Google Apps Script 連線測試',
      status: 'fail',
      message: 'Google Apps Script 連線失敗',
      details: {
        error: (error as Error).message,
        url: url,
        suggestion: '請確認：\n1. Apps Script 已正確部署\n2. 權限設定為「任何人」\n3. URL 正確（以 /exec 結尾）'
      }
    };
  }
}

/**
 * 測試 4: 測試資料格式
 */
function testDataFormat(): DiagnosticResult {
  const testData = {
    quoteNumber: 'TEST001',
    timestamp: new Date().toISOString(),
    customerType: 'company',
    companyName: '測試公司',
    taxId: '12345678',
    address: '測試地址',
    contactName: '測試聯絡人',
    phone: '0912345678',
    email: 'test@example.com',
    invoiceEmail: 'invoice@example.com',
    selectedPlan: 'plan2',
    planName: '店家刊登-1年',
    addons: ['addon1'],
    addonNames: '店家推薦文',
    multiStore: 'No',
    additionalStores: 0,
    stampMethod: 'contact',
    planPrice: 9000,
    addonPrice: 3500,
    multiStorePrice: 0,
    totalPrice: 12500
  };

  try {
    const jsonString = JSON.stringify(testData);
    const jsonSize = new Blob([jsonString]).size;

    if (jsonSize > 50000) {
      return {
        test: '資料格式測試',
        status: 'warning',
        message: '資料大小較大，可能影響傳輸',
        details: `資料大小: ${jsonSize} bytes`
      };
    }

    JSON.parse(jsonString);

    return {
      test: '資料格式測試',
      status: 'pass',
      message: '資料格式正確',
      details: `資料大小: ${jsonSize} bytes`
    };
  } catch (error) {
    return {
      test: '資料格式測試',
      status: 'fail',
      message: 'JSON 序列化失敗',
      details: (error as Error).message
    };
  }
}

/**
 * 測試 5: 測試瀏覽器支援
 */
function testBrowserSupport(): DiagnosticResult {
  const features = {
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    json: typeof JSON !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    fileReader: typeof FileReader !== 'undefined',
    blob: typeof Blob !== 'undefined'
  };

  const unsupported = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);

  if (unsupported.length > 0) {
    return {
      test: '瀏覽器支援檢查',
      status: 'fail',
      message: '瀏覽器不支援某些必要功能',
      details: {
        unsupported,
        recommendation: '請使用較新版本的瀏覽器'
      }
    };
  }

  return {
    test: '瀏覽器支援檢查',
    status: 'pass',
    message: '瀏覽器支援所有必要功能',
    details: features
  };
}

/**
 * 測試提交功能（模擬提交）
 */
export async function testSubmit(): Promise<DiagnosticResult> {
  console.log('🧪 執行模擬提交測試...\n');

  const testData = {
    quoteNumber: `TEST${Date.now()}`,
    timestamp: new Date().toISOString(),
    customerType: 'company',
    companyName: '【測試】測試公司',
    taxId: '12345678',
    individualName: '',
    address: '【測試】測試地址',
    website: '',
    contactName: '【測試】測試聯絡人',
    phone: '0912345678',
    email: 'test@example.com',
    invoiceEmail: 'test@example.com',
    selectedPlan: 'plan2',
    planName: '店家刊登-1年',
    addons: 'addon1',
    addonNames: '店家推薦文',
    multiStore: 'No',
    additionalStores: 0,
    stampMethod: 'contact',
    planPrice: 9000,
    addonPrice: 3500,
    multiStorePrice: 0,
    totalPrice: 12500
  };

  try {
    console.log('📦 測試資料:', testData);
    console.log('📍 目標 URL:', CONFIG.GOOGLE_SCRIPT_URL);

    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      redirect: 'follow',
    });

    console.log('✅ 請求已送出（no-cors 模式）');

    return {
      test: '模擬提交測試',
      status: 'pass',
      message: '測試資料已送出（請檢查 Google Sheets）',
      details: {
        quoteNumber: testData.quoteNumber,
        note: '使用 no-cors 模式，無法讀取回應。請手動檢查 Google Sheets 是否有新增資料。'
      }
    };
  } catch (error) {
    return {
      test: '模擬提交測試',
      status: 'fail',
      message: '提交失敗',
      details: (error as Error).message
    };
  }
}

/**
 * 匯出診斷報告
 */
export function exportDiagnosticReport(results: DiagnosticResult[]): string {
  const timestamp = new Date().toISOString();
  const report = [
    '# Google Sheets 整合診斷報告',
    `\n生成時間: ${timestamp}`,
    '\n## 測試結果\n'
  ];

  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    report.push(`### ${icon} 測試 ${index + 1}: ${result.test}\n`);
    report.push(`**狀態**: ${result.status.toUpperCase()}\n`);
    report.push(`**訊息**: ${result.message}\n`);

    if (result.details) {
      report.push(`**詳細資訊**:\n\`\`\`\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n`);
    }
  });

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warning').length;

  report.push('\n## 摘要\n');
  report.push(`- ✅ 通過: ${passCount}`);
  report.push(`- ❌ 失敗: ${failCount}`);
  report.push(`- ⚠️ 警告: ${warnCount}`);

  return report.join('\n');
}
