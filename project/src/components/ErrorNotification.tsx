import { AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ErrorNotificationProps {
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function ErrorNotification({
  message,
  onClose,
  autoClose = true,
  autoCloseDuration = 5000
}: ErrorNotificationProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="bg-red-50 border-2 border-red-300 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="關閉通知"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
