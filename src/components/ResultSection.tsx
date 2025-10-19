interface ResultSectionProps {
  resultImageSrc: string;
  onReset: () => void;
}

export default function ResultSection({
  resultImageSrc,
  onReset,
}: ResultSectionProps) {
  return (
    <section className="text-center">
      <h2 className="text-2xl font-bold mb-4">✨ 完成です! ✨</h2>
      <img
        src={resultImageSrc}
        alt="Generated coordinate"
        className="rounded-lg shadow-lg w-full max-w-2xl mx-auto"
      />
      <button
        type="button"
        onClick={onReset}
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition"
      >
        もう一度試す
      </button>
    </section>
  );
}
