import { useState } from 'react';
import { FormData } from '../types';
import { CONFIG, generateQuoteNumber } from '../config';
import { XCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import SuccessMessage from './SuccessMessage';
import { calculatePrice } from '../utils/priceCalculator';
import { submitToGoogleSheets } from '../services/googleSheets';

export default function QuoteForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    customerType: 'company',
    companyAddress: '',
    contactName: '',
    phone: '',
    email: '',
    invoiceEmail: '',
    selectedPlan: 'plan1',
    addons: [],
    multiStore: false,
    stampMethod: 'upload',
    agreeTerms: false,
    driveFolder: ''
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    console.log('📝 開始送出表單');

    if (!formData.agreeTerms) {
      setSubmitError('請勾選同意服務聲明及帳款規則');
      return;
    }

    if (formData.customerType === 'individual' && !formData.signature) {
      setSubmitError('個人客戶必須完成簽名');
      return;
    }

    if (formData.customerType === 'company' && formData.stampMethod === 'upload' && !formData.stampFile) {
      setSubmitError('請上傳印章圖片，或選擇「專人聯繫」');
      return;
    }

    setIsSubmitting(true);

    try {
      const quoteNum = generateQuoteNumber();
      console.log('🎫 產生報價單號:', quoteNum);

      const pricing = calculatePrice(
        formData.selectedPlan,
        formData.addons,
        formData.multiStore,
        formData.additionalStores || 0
      );

      console.log('💰 計算價格:', pricing);

      const submissionData = {
        quoteNumber: quoteNum,
        timestamp: new Date().toISOString(),
        formData,
        pricing
      };

      await submitToGoogleSheets(submissionData);

      setQuoteNumber(quoteNum);
      setShowSuccess(true);
      console.log('✅ 表單處理完成，顯示成功頁面');
    } catch (error) {
      console.error('❌ 提交失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setSubmitError(`送出失敗：${errorMessage}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return <SuccessMessage quoteNumber={quoteNumber} />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          BS-美日搜達刊登 委刊單
        </h1>
        <p className="text-sm sm:text-base text-slate-600">請填寫以下資訊，我們將盡快與您聯繫</p>
      </header>

      <ProgressBar currentStep={currentStep} />

      {submitError && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-5 shadow-lg animate-shake">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">送出失敗</h3>
              <p className="text-red-700 mb-3">{submitError}</p>
              <div className="text-sm text-red-600 space-y-1">
                <p className="font-semibold">請檢查：</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>網路連線是否正常</li>
                  <li>Google Apps Script 是否已正確部署並包含 <code className="bg-red-100 px-1 rounded">doGet</code> 函式</li>
                  <li>部署權限是否設為「任何人」</li>
                  <li>打開瀏覽器 Console (F12) 查看詳細錯誤</li>
                </ul>
              </div>
              <button
                onClick={() => setSubmitError('')}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                關閉此訊息
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 animate-scale-in">
        {currentStep === 1 && (
          <StepOne
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <StepTwo
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}

        {currentStep === 3 && (
          <StepThree
            formData={formData}
            updateFormData={updateFormData}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
            onValidationError={setSubmitError}
          />
        )}
      </form>
    </div>
  );
}
