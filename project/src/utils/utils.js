// ==========================================
// BS-美日搜達報價單系統 - 工具函數
// ==========================================

/**
 * 圖片壓縮
 */
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 計算縮放比例
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 轉換為 Base64
        const compressedBase64 = canvas.toDataURL('image/png', quality);
        
        debugLog('圖片壓縮完成', {
          原始大小: `${(file.size / 1024).toFixed(2)} KB`,
          壓縮後大小: `${(compressedBase64.length / 1024).toFixed(2)} KB`,
          尺寸: `${width}x${height}`
        });
        
        resolve(compressedBase64);
      };
      
      img.onerror = function() {
        reject(new Error('圖片載入失敗'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      reject(new Error('檔案讀取失敗'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 驗證檔案
 */
function validateFile(file) {
  const errors = [];
  
  // 檢查檔案類型
  if (!CONFIG.UPLOAD.allowedTypes.includes(file.type)) {
    errors.push('檔案格式不支援，請上傳 JPG 或 PNG 格式');
  }
  
  // 檢查檔案大小
  if (file.size > CONFIG.UPLOAD.maxSize) {
    errors.push(`檔案大小超過限制（最大 ${(CONFIG.UPLOAD.maxSize / 1024 / 1024).toFixed(0)}MB）`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證統一編號
 */
function validateTaxId(taxId) {
  if (!taxId) return false;
  
  // 移除空白
  taxId = taxId.trim();
  
  // 檢查長度
  if (taxId.length !== 8) return false;
  
  // 檢查是否為數字
  if (!/^\d{8}$/.test(taxId)) return false;
  
  // 統一編號邏輯驗證
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    let product = parseInt(taxId[i]) * weights[i];
    sum += Math.floor(product / 10) + (product % 10);
  }
  
  return sum % 10 === 0 || (sum + 1) % 10 === 0;
}

/**
 * 驗證 Email
 */
function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * 驗證電話
 */
function validatePhone(phone) {
  const pattern = /^[0-9-+() ]+$/;
  return pattern.test(phone) && phone.replace(/[^0-9]/g, '').length >= 8;
}

/**
 * 顯示錯誤訊息
 */
function showError(message, duration = 3000) {
  // 移除現有的錯誤訊息
  const existingError = document.querySelector('.error-toast');
  if (existingError) {
    existingError.remove();
  }
  
  // 建立新的錯誤訊息
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">⚠️</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  // 加入樣式
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f56565;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
  `;
  
  document.body.appendChild(toast);
  
  // 自動移除
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 顯示成功訊息
 */
function showSuccess(message, duration = 3000) {
  const existingSuccess = document.querySelector('.success-toast');
  if (existingSuccess) {
    existingSuccess.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">✅</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #48bb78;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 顯示載入中
 */
function showLoading(message = '處理中...') {
  const existingLoading = document.querySelector('.loading-overlay');
  if (existingLoading) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const spinnerStyle = `
    background: white;
    padding: 40px;
    border-radius: 12px;
    text-align: center;
  `;
  
  overlay.querySelector('.loading-spinner').style.cssText = spinnerStyle;
  
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

/**
 * 隱藏載入中
 */
function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.remove();
    document.body.style.overflow = '';
  }
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 滾動到頂部
 */
function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

/**
 * 滾動到元素
 */
function scrollToElement(element, offset = -20) {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset + offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * 深拷貝物件
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 防抖函數
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 節流函數
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 取得瀏覽器資訊
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  return {
    browser: browser,
    userAgent: ua,
    platform: navigator.platform,
    language: navigator.language
  };
}

/**
 * 複製到剪貼簿
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('已複製到剪貼簿');
    return true;
  } catch (err) {
    console.error('複製失敗:', err);
    showError('複製失敗');
    return false;
  }
}

/**
 * 下載檔案
 */
function downloadFile(data, filename, type = 'text/plain') {
  const blob = new Blob([data], { type: type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 檢查是否為行動裝置
 */
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 取得查詢參數
 */
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * 設定查詢參數
 */
function setQueryParam(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.pushState({}, '', url);
}

// 加入動畫樣式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 20px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);