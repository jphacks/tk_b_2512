export default function LoadingSection() {
  return (
    <section className="text-center py-12">
      <div className="loader mx-auto" />
      <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-400">
        AIが画像を生成中です...
      </p>
      <p className="text-sm text-gray-500">
        素晴らしいコーディネートを準備しています
      </p>
    </section>
  );
}
