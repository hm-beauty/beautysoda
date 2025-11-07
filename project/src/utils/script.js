// ==========================================
// BS-美日搜達報價單系統 - 主要邏輯
// ==========================================

// 全域變數
let currentStep = 1;
let signaturePad = null;
let stampImageData = null;
let formData = {};

// ==========================================
// 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  debugLog('系統初始化中...');
  
  // 初始化簽名板
  initSignaturePad();
  
  // 初始化事件監聽
  initEventListeners();
  
  // 計算初始價格
  calculateTotal();
  
  debugLog('系統初始化完成');
});

// ==========================================
// 簽名板初始化
// ==========================================
function initSignaturePad() {
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // 設定 canvas 尺寸
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  // 滑鼠事件
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // 觸控事件
  canvas.addEventListener('touchstart', handleTouch);
  canvas.addEventListener('touchmove', handleTouch);
  canvas.addEventListener('touchend', stopDrawing);
  
  function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  }
  
  function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    lastX = x;
    lastY = y;
  }
  
  function stopDrawing() {
    isDrawing = false;
  }
  
  function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                      e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }
  
  signaturePad = { canvas, ctx };
}

function clearSignature() {
  if (!signaturePad) return;
  const { canvas, ctx } = signaturePad;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  debugLog('簽名已清除');
}

function getSignatureData() {
  if (!signaturePad) return null;
  const { canvas } = signaturePad;
  return canvas.toDataURL('image/png');
}

function isSignatureEmpty() {
  if (!signaturePad) return true;
  const { canvas } = signaturePad;
  const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  return !imageData.data.some(channel => channel !== 0);
}

// ==========================================
// 事件監聽
// ==========================================
function initEventListeners() {
  // 客戶類型切換
  const customerTypeRadios = document.querySelectorAll('input[name="customerType"]');
  customerTypeRadios.forEach(radio => {
    radio.addEventListener('change', handleCustomerTypeChange);
  });
  
  // 方案選擇
  const planRadios = document.querySelectorAll('input[name="selectedPlan"]');
  planRadios.forEach(radio => {
    radio.addEventListener('change', calculateTotal);
  });
  
  // 加購項目
  const addonCheckboxes = document.querySelectorAll('input[name="addons"]');
  addonCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', calculateTotal);
  });
  
  // 多店家刊登
  const multiStoreCheckbox = document.getElementById('multiStore');
  if (multiStoreCheckbox) {
    multiStoreCheckbox.addEventListener('change', handleMultiStoreChange);
  }
  
  const additionalStoresInput = document.getElementById('additionalStores');
  if (additionalStoresInput) {
    additionalStoresInput.addEventListener('input', calculateTotal);
  }
  
  // 用印方式
  const stampMethodRadios = document.querySelectorAll('input[name="stampMethod"]');
  stampMethodRadios.forEach(radio => {
    radio.addEventListener('change', handleStampMethodChange);
  });
  
  // 上傳印章
  const uploadArea = document.getElementById('uploadArea');
  const stampFile = document.getElementById('stampFile');
  
  if (uploadArea && stampFile) {
    uploadArea.addEventListener('click', () => stampFile.click());
    stampFile.addEventListener('change', handleStampUpload);
    
    // 拖放上傳
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary-color)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--border-color)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--border-color)';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleStampFile(files[0]);
      }
    });
  }
  
  // 表單送出
  const form = document.getElementById('quoteForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
}

// ==========================================
// 客戶類型切換
// ==========================================
function handleCustomerTypeChange(e) {
  const type = e.target.value;
  const companyFields = document.getElementById('companyFields');
  const individualFields = document.getElementById('individualFields');
  const stampMethodSection = document.getElementById('stampMethodSection');
  
  if (type === 'company') {
    companyFields.style.display = 'block';
    individualFields.style.display = 'none';
    stampMethodSection.style.display = 'block';
    
    document.getElementById('companyName').required = true;
    document.getElementById('taxId').required = true;
    document.getElementById('individualName').required = false;
  } else {
    companyFields.style.display = 'none';
    individualFields.style.display = 'block';
    stampMethodSection.style.display = 'none';
    
    document.getElementById('companyName').required = false;
    document.getElementById('taxId').required = false;
    document.getElementById('individualName').required = true;
    
    // 個人預設使用手寫簽名
    document.querySelector('input[name="stampMethod"][value="signature"]').checked = true;
    handleStampMethodChange({ target: { value: 'signature' } });
  }
  
  debugLog('客戶類型切換', { type });
}

// ==========================================
// 多店家刊登
// ==========================================
function handleMultiStoreChange(e) {
  const multiStoreFields = document.getElementById('multiStoreFields');
  multiStoreFields.style.display = e.target.checked ? 'block' : 'none';
  calculateTotal();
}

// ==========================================
// 用印方式切換
// ==========================================
function handleStampMethodChange(e) {
  const method = e.target.value;
  const signatureSection = document.getElementById('signatureSection');
  const uploadSection = document.getElementById('uploadSection');
  const contactSection = document.getElementById('contactSection');
  
  signatureSection.style.display = 'none';
  uploadSection.style.display = 'none';
  contactSection.style.display = 'none';
  
  if (method === 'signature') {
    signatureSection.style.display = 'block';
  } else if (method === 'upload') {
    uploadSection.style.display = 'block';
  } else if (method === 'contact') {
    contactSection.style.display = 'block';
    const phone = document.getElementById('phone').value;
    document.getElementById('contactPhoneDisplay').textContent = phone || '(請先填寫電話)';
  }
  
  debugLog('用印方式切換', { method });
}

// ==========================================
// 上傳印章
// ==========================================
function handleStampUpload(e) {
  const file = e.target.files[0];
  if (file) {
    handleStampFile(file);
  }
}

async function handleStampFile(file) {
  debugLog('處理印章檔案', { name: file.name, size: file.size, type: file.type });
  
  // 驗證檔案
  const validation = validateFile(file);
  if (!validation.valid) {
    showError(validation.errors.join('\n'));
    return;
  }
  
  try {
    showLoading('處理圖片中...');
    
    // 壓縮圖片
    const compressedImage = await compressImage(
      file,
      CONFIG.UPLOAD.maxWidth,
      CONFIG.UPLOAD.maxHeight,
      CONFIG.UPLOAD.compressQuality
    );
    
    stampImageData = compressedImage;
    
    // 顯示預覽
    const uploadArea = document.getElementById('uploadArea');
    const placeholder = uploadArea.querySelector('.upload-placeholder');
    const preview = uploadArea.querySelector('.upload-preview');
    const previewImg = document.getElementById('stampPreview');
    
    placeholder.style.display = 'none';
    preview.style.display = 'block';
    previewImg.src = compressedImage;
    
    hideLoading();
    showSuccess('印章上傳成功');
    
  } catch (error) {
    hideLoading();
    showError('圖片處理失敗：' + error.message);
    debugLog('圖片處理錯誤', error);
  }
}

function removeStamp() {
  stampImageData = null;
  
  const uploadArea = document.getElementById('uploadArea');
  const placeholder = uploadArea.querySelector('.upload-placeholder');
  const preview = uploadArea.querySelector('.upload-preview');
  
  placeholder.style.display = 'block';
  preview.style.display = 'none';
  
  document.getElementById('stampFile').value = '';
  
  debugLog('印章已移除');
}

// ==========================================
// 價格計算
// ==========================================
function calculateTotal() {
  const selectedPlan = document.querySelector('input[name="selectedPlan"]:checked');
  if (!selectedPlan) return;
  
  const planId = selectedPlan.value;
  const plan = CONFIG.PLANS[planId];
  
  let planPrice = plan.price;
  let addonTotal = 0;
  let multiStoreTotal = 0;
  
  // 計算加購項目
  const selectedAddons = document.querySelectorAll('input[name="addons"]:checked');
  selectedAddons.forEach(addon => {
    const addonId = addon.value;
    addonTotal += CONFIG.ADDONS[addonId].price;
  });
  
  // 計算多店家
  const multiStore = document.getElementById('multiStore');
  if (multiStore && multiStore.checked) {
    const additionalStores = parseInt(document.getElementById('additionalStores').value) || 0;
    multiStoreTotal = additionalStores * plan.multiStorePrice;
  }
  
  const total = planPrice + addonTotal + multiStoreTotal;
  
  // 更新顯示
  document.getElementById('planPrice').textContent = formatCurrency(planPrice);
  
  const addonPriceRow = document.getElementById('addonPriceRow');
  if (addonTotal > 0) {
    addonPriceRow.style.display = 'flex';
    document.getElementById('addonPrice').textContent = formatCurrency(addonTotal);
  } else {
    addonPriceRow.style.display = 'none';
  }
  
  const multiStorePriceRow = document.getElementById('multiStorePriceRow');
  if (multiStoreTotal > 0) {
    multiStorePriceRow.style.display = 'flex';
    document.getElementById('multiStorePrice').textContent = formatCurrency(multiStoreTotal);
  } else {
    multiStorePriceRow.style.display = 'none';
  }
  
  document.getElementById('totalPrice').textContent = formatCurrency(total);
  
  debugLog('價格計算', { planPrice, addonTotal, multiStoreTotal, total });
}

// ==========================================
// 步驟切換
// ==========================================
function nextStep() {
  // 驗證當前步驟
  if (!validateStep(currentStep)) {
    return;
  }
  
  if (currentStep < 3) {
    currentStep++;
    updateSteps();
    scrollToTop();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateSteps();
    scrollToTop();
  }
}

function updateSteps() {
  // 更新進度條
  document.querySelectorAll('.step').forEach((step, index) => {
    const stepNumber = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNumber === currentStep) {
      step.classList.add('active');
    } else if (stepNumber < currentStep) {
      step.classList.add('completed');
    }
  });
  
  // 更新表單步驟
  document.querySelectorAll('.form-step').forEach((step, index) => {
    const stepNumber = index + 1;
    step.classList.remove('active');
    
    if (stepNumber === currentStep) {
      step.classList.add('active');
    }
  });
  
  debugLog('步驟切換', { currentStep });
}

// ==========================================
// 驗證步驟
// ==========================================
function validateStep(step) {
  if (step === 1) {
    return validateStep1();
  } else if (step === 2) {
    return validateStep2();
  } else if (step === 3) {
    return validateStep3();
  }
  return true;
}

function validateStep1() {
  const customerType = document.querySelector('input[name="customerType"]:checked').value;
  
  if (customerType === 'company') {
    const companyName = document.getElementById('companyName').value.trim();
    const taxId = document.getElementById('taxId').value.trim();
    
    if (!companyName) {
      showError('請輸入公司名稱');
      document.getElementById('companyName').focus();
      return false;
    }
    
    if (!taxId) {
      showError('請輸入統一編號');
      document.getElementById('taxId').focus();
      return false;
    }
    
    if (!validateTaxId(taxId)) {
      showError('統一編號格式不正確');
      document.getElementById('taxId').focus();
      return false;
    }
  } else {
    const individualName = document.getElementById('individualName').value.trim();
    if (!individualName) {
      showError('請輸入姓名');
      document.getElementById('individualName').focus();
      return false;
    }
  }
  
  const companyAddress = document.getElementById('companyAddress').value.trim();
  const contactName = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const invoiceEmail = document.getElementById('invoiceEmail').value.trim();
  
  if (!companyAddress) {
    showError('請輸入地址');
    document.getElementById('companyAddress').focus();
    return false;
  }
  
  if (!contactName) {
    showError('請輸入承辦人');
    document.getElementById('contactName').focus();
    return false;
  }
  
  if (!phone) {
    showError('請輸入電話');
    document.getElementById('phone').focus();
    return false;
  }
  
  if (!validatePhone(phone)) {
    showError('電話格式不正確');
    document.getElementById('phone').focus();
    return false;
  }
  
  if (!email) {
    showError('請輸入 Email');
    document.getElementById('email').focus();
    return false;
  }
  
  if (!validateEmail(email)) {
    showError('Email 格式不正確');
    document.getElementById('email').focus();
    return false;
  }
  
  if (!invoiceEmail) {
    showError('請輸入發票信箱');
    document.getElementById('invoiceEmail').focus();
    return false;
  }
  
  if (!validateEmail(invoiceEmail)) {
    showError('發票信箱格式不正確');
    document.getElementById('invoiceEmail').focus();
    return false;
  }
  
  return true;
}

function validateStep2() {
  const selectedPlan = document.querySelector('input[name="selectedPlan"]:checked');
  if (!selectedPlan) {
    showError('請選擇方案');
    return false;
  }
  return true;
}

function validateStep3() {
  const agreeTerms = document.getElementById('agreeTerms');
  if (!agreeTerms.checked) {
    showError('請閱讀並同意條款');
    agreeTerms.focus();
    return false;
  }
  
  const stampMethod = document.querySelector('input[name="stampMethod"]:checked').value;
  
  if (stampMethod === 'signature') {
    if (isSignatureEmpty()) {
      showError('請先簽名');
      return false;
    }
  } else if (stampMethod === 'upload') {
    if (!stampImageData) {
      showError('請上傳印章圖片');
      return false;
    }
  }
  
  return true;
}

// ==========================================
// 表單送出
// ==========================================
async function handleSubmit(e) {
  e.preventDefault();
  
  debugLog('開始送出表單');
  
  // 最後驗證
  if (!validateStep3()) {
    return;
  }
  
  // 收集表單資料
  const data = collectFormData();
  
  debugLog('表單資料', data);
  
  // 送出
  try {
    showLoading('送出中，請稍候...');
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';
    
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    // 因為 no-cors，我們假設成功
    hideLoading();
    showSuccessPage(data.quoteNumber);
    
  } catch (error) {
    hideLoading();
    showError('送出失敗：' + error.message);
    debugLog('送出錯誤', error);
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').style.display = 'inline';
    submitBtn.querySelector('.btn-loading').style.display = 'none';
  }
}

function collectFormData() {
  const customerType = document.querySelector('input[name="customerType"]:checked').value;
  const selectedPlan = document.querySelector('input[name="selectedPlan"]:checked').value;
  const plan = CONFIG.PLANS[selectedPlan];
  
  // 基本資料
  const data = {
    submitDate: new Date().toISOString(),
    quoteNumber: generateQuoteNumber(),
    customerType: customerType,
    companyName: customerType === 'company' ? 
      document.getElementById('companyName').value.trim() : 
      document.getElementById('individualName').value.trim(),
    taxId: customerType === 'company' ? document.getElementById('taxId').value.trim() : '',
    companyAddress: document.getElementById('companyAddress').value.trim(),
    website: document.getElementById('website').value.trim(),
    contactName: document.getElementById('contactName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    invoiceEmail: document.getElementById('invoiceEmail').value.trim(),
    selectedPlan: selectedPlan,
    planName: plan.name,
    planPrice: plan.price,
  };
  
  // 加購項目
  const addons = [];
  let addonTotal = 0;
  document.querySelectorAll('input[name="addons"]:checked').forEach(checkbox => {
    const addonId = checkbox.value;
    const addon = CONFIG.ADDONS[addonId];
    addons.push(addon);
    addonTotal += addon.price;
  });
  data.addons = addons;
  data.addonTotal = addonTotal;
  
  // 多店家
  const multiStore = document.getElementById('multiStore').checked;
  data.multiStore = multiStore;
  if (multiStore) {
    const additionalStores = parseInt(document.getElementById('additionalStores').value) || 0;
    data.additionalStores = additionalStores;
    data.multiStoreTotal = additionalStores * plan.multiStorePrice;
  } else {
    data.additionalStores = 0;
    data.multiStoreTotal = 0;
  }
  
  // 總金額
  data.totalAmount = data.planPrice + data.addonTotal + data.multiStoreTotal;
  
  // 用印方式
  const stampMethod = document.querySelector('input[name="stampMethod"]:checked').value;
  data.stampMethod = stampMethod;
  
  if (stampMethod === 'signature') {
    data.signatureImage = getSignatureData();
  } else if (stampMethod === 'upload') {
    data.stampImage = stampImageData;
  }
  
  return data;
}

function showSuccessPage(quoteNumber) {
  document.getElementById('quoteForm').style.display = 'none';
  document.querySelector('.progress-bar').style.display = 'none';
  
  const successMessage = document.getElementById('successMessage');
  successMessage.style.display = 'block';
  document.getElementById('quoteNumberDisplay').textContent = quoteNumber;
  
  scrollToTop(false);
  
  debugLog('成功頁面顯示', { quoteNumber });
}