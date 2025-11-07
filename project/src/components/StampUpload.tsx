import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { CONFIG } from '../config';

interface StampUploadProps {
  stampFile?: string;
  onFileChange: (file: string) => void;
}

export default function StampUpload({ stampFile, onFileChange }: StampUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (file: File) => {
    setError('');

    if (!CONFIG.UPLOAD.allowedTypes.includes(file.type)) {
      setError('僅支援 JPG、PNG 格式');
      return;
    }

    if (file.size > CONFIG.UPLOAD.maxSize) {
      setError('檔案大小不可超過 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onFileChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onFileChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-slate-700 mb-3">
        上傳印章圖片 <span className="text-red-500">*</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileInput}
        className="hidden"
      />

      {!stampFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-700 font-medium mb-2">點擊上傳或拖曳檔案至此</p>
          <p className="text-sm text-slate-500">支援 JPG、PNG 格式，檔案大小不超過 2MB</p>
        </div>
      ) : (
        <div className="border-2 border-slate-300 rounded-lg p-4 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <img
                src={stampFile}
                alt="印章預覽"
                className="w-32 h-32 object-contain border border-slate-200 rounded bg-white"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <ImageIcon className="w-5 h-5" />
                <span className="font-medium">印章圖片已上傳</span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                移除檔案
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
