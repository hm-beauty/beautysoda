import { FormData, PlanType, AddonType } from '../types';
import { CONFIG, formatCurrency } from '../config';
import { calculatePrice } from '../utils/priceCalculator';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface StepTwoProps {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepTwo({ formData, updateFormData, onNext, onPrev }: StepTwoProps) {
  const pricing = calculatePrice(
    formData.selectedPlan,
    formData.addons,
    formData.multiStore,
    formData.additionalStores || 0
  );

  const handlePlanChange = (plan: PlanType) => {
    updateFormData({ selectedPlan: plan });
  };

  const handleAddonToggle = (addon: AddonType) => {
    const newAddons = formData.addons.includes(addon)
      ? formData.addons.filter(a => a !== addon)
      : [...formData.addons, addon];
    updateFormData({ addons: newAddons });
  };

  const handleMultiStoreToggle = () => {
    updateFormData({
      multiStore: !formData.multiStore,
      additionalStores: !formData.multiStore ? 1 : 0
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">選擇方案</h2>

      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-4">
          刊登方案 <span className="text-red-500">*</span>
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          {(Object.keys(CONFIG.PLANS) as PlanType[]).map((planKey) => {
            const plan = CONFIG.PLANS[planKey];
            return (
              <label key={planKey} className="cursor-pointer group">
                <input
                  type="radio"
                  name="selectedPlan"
                  value={planKey}
                  checked={formData.selectedPlan === planKey}
                  onChange={() => handlePlanChange(planKey)}
                  className="peer sr-only"
                />
                <div className="border-2 rounded-xl p-5 transition-all-smooth peer-checked:border-brand-pink peer-checked:bg-gradient-to-br peer-checked:from-brand-light-pink peer-checked:to-brand-light-blue peer-checked:shadow-lg peer-checked:scale-105 hover:border-brand-blue hover:shadow-md hover:scale-[1.02] relative">
                  {planKey === 'plan1' && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-brand-pink to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse-once shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      限時限量
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold bg-gradient-to-r from-brand-pink to-blue-400 bg-clip-text text-transparent mb-2">
                    {formatCurrency(plan.price)}
                  </div>
                  {planKey === 'plan1' && (
                    <p className="text-sm text-slate-600">超值優惠方案，數量有限</p>
                  )}
                  {planKey === 'plan2' && (
                    <p className="text-sm text-slate-600">標準方案，一年曝光</p>
                  )}
                  {planKey === 'plan3' && (
                    <p className="text-sm text-slate-600">超值方案，平均每年7,500元</p>
                  )}
                  {planKey === 'plan4' && (
                    <p className="text-sm text-slate-600">最划算方案，平均每年6,667元</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-4">
          加購項目（可複選）
        </label>
        <div className="grid md:grid-cols-3 gap-4">
          {(Object.keys(CONFIG.ADDONS) as AddonType[]).map((addonKey) => {
            const addon = CONFIG.ADDONS[addonKey];
            const isChecked = formData.addons.includes(addonKey);
            return (
              <label key={addonKey} className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAddonToggle(addonKey)}
                  className="peer sr-only"
                />
                <div className={`border-2 rounded-lg p-4 transition-all-smooth hover:shadow-md hover:scale-[1.02] ${
                  isChecked ? 'border-brand-pink bg-gradient-to-br from-brand-light-pink to-brand-light-blue shadow-md scale-105' : 'border-slate-200 hover:border-brand-blue'
                }`}>
                  <h4 className="font-semibold text-slate-800 mb-2">{addon.name}</h4>
                  <div className={`text-xl font-bold mb-2 ${
                    isChecked ? 'bg-gradient-to-r from-brand-pink to-blue-400 bg-clip-text text-transparent' : 'text-slate-700'
                  }`}>
                    {formatCurrency(addon.price)}
                  </div>
                  {addonKey === 'addon1' && (
                    <p className="text-sm text-slate-600">專業編輯撰寫推薦文章</p>
                  )}
                  {addonKey === 'addon2' && (
                    <p className="text-sm text-slate-600">精美資訊卡設計</p>
                  )}
                  {addonKey === 'addon3' && (
                    <p className="text-sm text-slate-600">組合優惠方案</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mb-8 border-t pt-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.multiStore}
            onChange={handleMultiStoreToggle}
            className="w-5 h-5 text-blue-500 border-slate-300 rounded focus:ring-2 focus:ring-brand-blue"
          />
          <span className="font-medium text-slate-700">需要多店家刊登</span>
        </label>

        {formData.multiStore && (
          <div className="mt-4 ml-8 bg-slate-50 rounded-lg p-4 animate-slide-up">
            <label htmlFor="additionalStores" className="block text-sm font-medium text-slate-700 mb-2">
              額外店家數量
            </label>
            <input
              type="number"
              id="additionalStores"
              min="1"
              value={formData.additionalStores || 1}
              onChange={(e) => updateFormData({ additionalStores: parseInt(e.target.value) || 1 })}
              className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-pink focus:border-transparent"
            />
            {formData.selectedPlan === 'plan1' ? (
              <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-brand-light-pink to-brand-light-blue border-2 border-pink-200 rounded-lg px-3 py-2">
                <div className="bg-gradient-to-r from-brand-pink to-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  限時限量
                </div>
                <span className="text-sm text-slate-700">
                  <span className="font-bold text-pink-600">僅限活動價刊登</span>-第二家起每家 {formatCurrency(CONFIG.PLANS[formData.selectedPlan].multiStorePrice)}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                第二家起每家 {formatCurrency(CONFIG.PLANS[formData.selectedPlan].multiStorePrice)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-brand-light-pink via-brand-light-blue to-brand-light-pink rounded-xl p-6 mb-6 border-2 border-pink-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4">價格總計</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-slate-700">
            <span>方案金額：</span>
            <span className="font-semibold">{formatCurrency(pricing.planPrice)}</span>
          </div>
          {pricing.addonPrice > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>加購項目：</span>
              <span className="font-semibold">{formatCurrency(pricing.addonPrice)}</span>
            </div>
          )}
          {pricing.multiStorePrice > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>多店家刊登：</span>
              <span className="font-semibold">{formatCurrency(pricing.multiStorePrice)}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-300 pt-2 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-800">總計：</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-brand-pink to-blue-400 bg-clip-text text-transparent">
                {formatCurrency(pricing.totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 sm:px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:scale-105 transition-all-smooth flex items-center justify-center gap-2 order-2 sm:order-1"
        >
          <ArrowLeft className="w-5 h-5" />
          上一步
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 sm:px-8 py-3 bg-gradient-to-r from-brand-pink to-brand-pink text-white rounded-lg font-medium hover:from-brand-pink hover:to-pink-600 hover:shadow-lg hover:scale-105 transition-all-smooth shadow-md flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          下一步
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
