import { useRef } from 'react';

interface UploadSectionProps {
  onImageUpload: (imageBase64: string) => void;
}

export default function UploadSection({ onImageUpload }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="text-center">
      <button
        type="button"
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 md:p-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          テーブルの写真をアップロード
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          クリックしてファイルを選択
        </p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </section>
  );
}
