import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: '基本資料' },
  { number: 2, label: '選擇方案' },
  { number: 3, label: '確認送出' }
];

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1 flex items-center">
            <div className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-gradient-to-r from-brand-pink to-brand-pink text-white'
                    : currentStep === step.number
                    ? 'bg-gradient-to-r from-brand-pink to-brand-pink text-white ring-4 ring-pink-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <div
                className={`mt-2 text-sm font-medium transition-colors ${
                  currentStep >= step.number ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 relative" style={{ top: '-20px' }}>
                <div className="absolute inset-0 bg-slate-200 rounded-full" />
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    currentStep > step.number ? 'bg-gradient-to-r from-brand-pink to-blue-400' : 'bg-slate-200'
                  }`}
                  style={{
                    width: currentStep > step.number ? '100%' : '0%'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
