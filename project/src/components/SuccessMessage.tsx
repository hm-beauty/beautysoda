import { CheckCircle, RotateCcw } from 'lucide-react';

interface SuccessMessageProps {
  quoteNumber: string;
}

export default function SuccessMessage({ quoteNumber }: SuccessMessageProps) {
  const handleNewQuote = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 mx-auto text-brand-pink" />
        </div>

        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          報價單已成功送出！
        </h2>

        <div className="bg-gradient-to-r from-brand-light-pink to-brand-light-blue border-2 border-pink-200 rounded-lg p-6 mb-6">
          <p className="text-slate-700 mb-2">報價單編號</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-brand-pink to-blue-400 bg-clip-text text-transparent">{quoteNumber}</p>
        </div>

        <div className="space-y-3 text-slate-600 mb-8">
          <p className="text-lg">我們已將報價單副本寄送至您的信箱</p>
          <p className="text-lg">將在 <span className="font-semibold text-slate-800">3-5 個工作天內</span> 與您聯繫</p>
        </div>

        <button
          type="button"
          onClick={handleNewQuote}
          className="px-8 py-3 bg-gradient-to-r from-brand-pink to-brand-pink text-white rounded-lg font-medium hover:from-brand-pink hover:to-pink-600 transition-all shadow-md flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-5 h-5" />
          填寫新的報價單
        </button>
      </div>
    </div>
  );
}
