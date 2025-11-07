import { FormData, StampMethod } from '../types';
import { CONFIG } from '../config';
import { ArrowLeft, Loader2, Upload, Phone, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import SignaturePad from './SignaturePad';
import StampUpload from './StampUpload';

interface StepThreeProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onPrev: () => void;
  isSubmitting: boolean;
  onValidationError: (message: string) => void;
}

export default function StepThree({ formData, updateFormData, onPrev, isSubmitting, onValidationError }: StepThreeProps) {
  const [validationError, setValidationError] = useState<string>('');

  const handleStampMethodChange = (method: StampMethod) => {
    updateFormData({ stampMethod: method });
    setValidationError('');
  };

  const validateBeforeSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    let error = '';

    if (!formData.agreeTerms) {
      error = '請勾選同意服務聲明及帳款規則';
    } else if (formData.customerType === 'individual' && !formData.signature) {
      error = '個人客戶必須完成簽名';
    } else if (formData.customerType === 'company' && formData.stampMethod === 'upload' && !formData.stampFile) {
      error = '請上傳印章圖片，或選擇「專人聯繫」';
    }

    if (error) {
      setValidationError(error);
      onValidationError(error);
      e.preventDefault();
      return false;
    }

    return true;
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">確認並簽名</h2>

      {formData.customerType === 'company' && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            用印方式 <span className="text-red-500">*</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="stampMethod"
                value="upload"
                checked={formData.stampMethod === 'upload'}
                onChange={() => handleStampMethodChange('upload')}
                className="peer sr-only"
              />
              <div className="border-2 rounded-xl p-5 text-center transition-all-smooth peer-checked:border-brand-pink peer-checked:bg-gradient-to-br peer-checked:from-brand-light-pink peer-checked:to-brand-light-blue peer-checked:shadow-lg peer-checked:scale-105 hover:border-brand-blue hover:shadow-md hover:scale-[1.02]">
                <Upload className="w-8 h-8 mx-auto mb-3 text-brand-pink" />
                <h4 className="font-semibold text-slate-800 mb-1">上傳印章檔</h4>
                <p className="text-sm text-slate-600">上傳公司大小章圖片</p>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="stampMethod"
                value="contact"
                checked={formData.stampMethod === 'contact'}
                onChange={() => handleStampMethodChange('contact')}
                className="peer sr-only"
              />
              <div className="border-2 rounded-xl p-5 text-center transition-all-smooth peer-checked:border-brand-pink peer-checked:bg-gradient-to-br peer-checked:from-brand-light-pink peer-checked:to-brand-light-blue peer-checked:shadow-lg peer-checked:scale-105 hover:border-brand-blue hover:shadow-md hover:scale-[1.02]">
                <Phone className="w-8 h-8 mx-auto mb-3 text-brand-pink" />
                <h4 className="font-semibold text-slate-800 mb-1">專人聯繫</h4>
                <p className="text-sm text-slate-600">由業務協助用印</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {formData.customerType === 'individual' && (
        <SignaturePad
          signature={formData.signature}
          onSignatureChange={(sig) => updateFormData({ signature: sig })}
        />
      )}

      {formData.stampMethod === 'upload' && formData.customerType === 'company' && (
        <StampUpload
          stampFile={formData.stampFile}
          onFileChange={(file) => updateFormData({ stampFile: file })}
        />
      )}

      {formData.stampMethod === 'contact' && formData.customerType === 'company' && (
        <div className="mb-8 bg-gradient-to-r from-brand-light-pink to-brand-light-blue border-2 border-pink-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Phone className="w-6 h-6 text-brand-pink flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">專人聯繫用印</h4>
              <p className="text-slate-700 mb-2">
                我們將在 <strong>1個工作天內</strong> 與您聯繫，協助完成用印程序。
              </p>
              <p className="text-slate-700">
                聯絡電話：<strong>{formData.phone}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-brand-light-pink via-brand-light-blue to-brand-light-pink border-2 border-pink-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">服務聲明</h3>
        <div className="space-y-3 text-sm text-slate-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>店家所提供之圖片、影片、文字等素材，須具合法授權並不得侵犯他人著作權利（包含但不限於著作權、商標權、肖像權等）。</li>
            <li>若店家使用 AI 生成圖片或內容，應自行確認不涉及侵權，遵反著作法，或具有使用權；如因素材侵權或造成違規之事實，檢單或爭議，本平台（美日搜達）不予擔任何法律責任。</li>
            <li>若文案內容涉及誇大不實，誤導，醫療廣告或違反政府相關法規，平台有權要求修正，經平台修正後，若店家執意不配合，或拒絕修改，其法律責任全由店家自行承擔。</li>
            <li>刊登期間，店家授權本平台（美日搜達）於內外與合作關聯提供使用素材，不得另行通知或收額外費用。</li>
            <li>平台遵照服務購買的合約內容進行刊登，若店家規定之不合理要求或私人獨立訂定不符合內容，平台有權拒絕。</li>
            <li>商品提出贈買退換年一年，若持續延長求下架不予退還。</li>
            <li>內容無效以2次為限，第3次起，每次加收 NT$500。</li>
            <li>刊登內容及條數透明化且遵照各縣市優先定，費用合約定，非平台考慮，刊登後合理時間不得無故後悔要求。</li>
          </ol>
        </div>
      </div>

      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">帳款與規則</h3>
        <div className="space-y-3 text-sm text-slate-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>本報價有效期限為 14 天，逾期價格與條件需重新議定。</li>
            <li>費方高於委刊印確該後，視為正式合約成立。</li>
            <li>合約起算日期一年份開屋可刊登是親戚熟人。</li>
            <li>付款方式：一次付清。</li>
            <li>若委刊方自行醞釀高止刊登，已付費用不予退還。</li>
            <li>若因不可抗力因素（如天災、戰爭、疾疫等），雙方得協商暫時停滯或中斷。</li>
            <li>甲方（委刊人）應確保所有供給之內容，素材與照片合法提供與查覆刊，如有違法或涉嫌主宰廣告之案，乙方（美日搜達）不承任何法律責任。</li>
            <li>本平台對刊登內容效不作保證，僅做合理商業模仿提供優化與調整。</li>
            <li>本平台之「活動優惠」及「公司方案」價格屬限時優惠，僅於合約當下生效時刻有效。若後續會員內容要等帳況，平台有權依次場設況（不另行通知，並以優惠或全額）下修取消或修改配合部內容為準。</li>
            <li>前項體驗產品適用於所有客戶之新客戶，已締約過刊登之客戶之不含會員，不適影響。</li>
            <li>本平台保留修改或終止服務之權利，隨時修正，並優惠或降上揭定動規者，並保留條款忍受攻擊之權利。</li>
          </ol>
        </div>
      </div>

      <div className="mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => updateFormData({ agreeTerms: e.target.checked })}
            className="w-5 h-5 text-blue-500 border-slate-300 rounded focus:ring-2 focus:ring-brand-blue mt-1"
            required
          />
          <span className="text-slate-700">
            我已詳細閱讀並同意以上內容，確認送出後視同正式委刊
            <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-slate-800 mb-4">匯款資訊</h3>
        <div className="space-y-2 text-slate-700">
          <div className="flex">
            <span className="w-20 font-medium">戶名：</span>
            <span>{CONFIG.PAYMENT.accountName}</span>
          </div>
          <div className="flex">
            <span className="w-20 font-medium">銀行：</span>
            <span>{CONFIG.PAYMENT.bankName}</span>
          </div>
          <div className="flex">
            <span className="w-20 font-medium">帳號：</span>
            <span className="font-mono">{CONFIG.PAYMENT.accountNumber}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-red-600">* 匯款時請勿扣除匯費</p>
      </div>

      {validationError && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 mb-1">無法送出</h4>
            <p className="text-red-700 text-sm">{validationError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 sm:px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:scale-105 transition-all-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
        >
          <ArrowLeft className="w-5 h-5" />
          上一步
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={validateBeforeSubmit}
          className="px-6 sm:px-8 py-3 bg-gradient-to-r from-brand-pink to-brand-pink text-white rounded-lg font-medium hover:from-brand-pink hover:to-pink-600 hover:shadow-lg hover:scale-105 transition-all-smooth shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              處理中...
            </>
          ) : (
            '確認送出'
          )}
        </button>
      </div>
    </div>
  );
}
