import { FormData } from '../types';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface StepOneProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
}

export default function StepOne({ formData, updateFormData, onNext }: StepOneProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCustomerTypeChange = (type: 'company' | 'individual') => {
    updateFormData({ customerType: type });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.customerType === 'company') {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = '請輸入公司名稱';
      }
      if (!formData.taxId?.trim()) {
        newErrors.taxId = '請輸入統一編號';
      } else if (!/^\d{8}$/.test(formData.taxId)) {
        newErrors.taxId = '統一編號必須是8位數字';
      }
    } else {
      if (!formData.individualName?.trim()) {
        newErrors.individualName = '請輸入姓名';
      }
    }

    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = '請輸入地址';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = '請輸入承辦人姓名';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '請輸入電話';
    }

    if (!formData.email.trim()) {
      newErrors.email = '請輸入 Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email 格式不正確';
    }

    if (!formData.invoiceEmail.trim()) {
      newErrors.invoiceEmail = '請輸入發票信箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.invoiceEmail)) {
      newErrors.invoiceEmail = 'Email 格式不正確';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">基本資料</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          客戶類型 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="customerType"
              value="company"
              checked={formData.customerType === 'company'}
              onChange={() => handleCustomerTypeChange('company')}
              className="peer sr-only"
            />
            <div className="border-2 rounded-lg p-4 text-center transition-all-smooth peer-checked:border-brand-pink peer-checked:bg-gradient-to-br peer-checked:from-brand-light-pink peer-checked:to-brand-light-blue hover:border-brand-blue hover:shadow-md hover:scale-105">
              <span className="font-medium">公司行號</span>
            </div>
          </label>

          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="customerType"
              value="individual"
              checked={formData.customerType === 'individual'}
              onChange={() => handleCustomerTypeChange('individual')}
              className="peer sr-only"
            />
            <div className="border-2 rounded-lg p-4 text-center transition-all-smooth peer-checked:border-brand-pink peer-checked:bg-gradient-to-br peer-checked:from-brand-light-pink peer-checked:to-brand-light-blue hover:border-brand-blue hover:shadow-md hover:scale-105">
              <span className="font-medium">個人</span>
            </div>
          </label>
        </div>
      </div>

      {formData.customerType === 'company' ? (
        <>
          <div className="mb-4">
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
              公司名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName || ''}
              onChange={(e) => updateFormData({ companyName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent transition ${
                errors.companyName ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.companyName && (
              <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.companyName}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="taxId" className="block text-sm font-medium text-slate-700 mb-2">
              統一編號 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="taxId"
              value={formData.taxId || ''}
              onChange={(e) => updateFormData({ taxId: e.target.value })}
              placeholder="請輸入8位數字"
              pattern="[0-9]{8}"
              maxLength={8}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent transition ${
                errors.taxId ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.taxId ? (
              <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.taxId}</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">請輸入8位數統一編號</p>
            )}
          </div>
        </>
      ) : (
        <div className="mb-4">
          <label htmlFor="individualName" className="block text-sm font-medium text-slate-700 mb-2">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="individualName"
            value={formData.individualName || ''}
            onChange={(e) => updateFormData({ individualName: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition ${
              errors.individualName ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.individualName && (
            <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.individualName}</span>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="companyAddress" className="block text-sm font-medium text-slate-700 mb-2">
          地址 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="companyAddress"
          value={formData.companyAddress}
          onChange={(e) => updateFormData({ companyAddress: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition ${
            errors.companyAddress ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.companyAddress && (
          <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.companyAddress}</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
          網址
        </label>
        <input
          type="url"
          id="website"
          value={formData.website || ''}
          onChange={(e) => updateFormData({ website: e.target.value })}
          placeholder="https://"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
        />
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-8">聯絡資訊</h3>

      <div className="mb-4">
        <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-2">
          承辦人 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="contactName"
          value={formData.contactName}
          onChange={(e) => updateFormData({ contactName: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition ${
            errors.contactName ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.contactName && (
          <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.contactName}</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
            電話 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition ${
              errors.phone ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.phone && (
            <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.phone}</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition ${
              errors.email ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.email && (
            <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="invoiceEmail" className="block text-sm font-medium text-slate-700 mb-2">
          發票信箱 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="invoiceEmail"
          value={formData.invoiceEmail}
          onChange={(e) => updateFormData({ invoiceEmail: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition ${
            errors.invoiceEmail ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.invoiceEmail ? (
          <div className="mt-1 flex items-center gap-1 text-red-500 text-sm animate-slide-up">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.invoiceEmail}</span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-500">請提供接收電子發票的信箱</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-brand-pink to-brand-pink text-white rounded-lg font-medium hover:from-brand-pink hover:to-pink-600 hover:shadow-lg hover:scale-105 transition-all-smooth shadow-md flex items-center justify-center gap-2"
        >
          下一步
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
