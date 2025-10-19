interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function ErrorModal({
  isOpen,
  message,
  onClose,
}: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl text-center max-w-md">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
          エラーが発生しました
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
