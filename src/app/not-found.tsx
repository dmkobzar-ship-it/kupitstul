import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Страница не найдена
      </h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Запрошенная страница не существует или была перемещена.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          На главную
        </Link>
        <Link
          href="/catalog"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          В каталог
        </Link>
      </div>
    </div>
  );
}
