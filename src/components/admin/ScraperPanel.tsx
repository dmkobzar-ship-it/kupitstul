"use client";

import { useState } from "react";
import { Globe, RefreshCw, Download, AlertCircle } from "lucide-react";

export default function ScraperPanel() {
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    count: number;
    message?: string;
  } | null>(null);

  const scrapeProducts = async (source: string) => {
    setIsScraping(true);
    setResults(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({ source, limit: 20 }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        count: 0,
        message: "Ошибка подключения",
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Globe className="w-6 h-6" />
        Импорт товаров с других сайтов
      </h3>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Автоматически собирайте товары с сайтов конкурентов. Данные
          обновляются в реальном времени.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Stool Group</h4>
            <p className="text-sm text-gray-600 mb-3">Прямой конкурент</p>
            <button
              onClick={() => scrapeProducts("stoolgroup")}
              disabled={isScraping}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isScraping ? "Сбор данных..." : "Импортировать"}
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">IKEA</h4>
            <p className="text-sm text-gray-600 mb-3">Мебель для дома</p>
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed"
            >
              Скоро
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Леруа Мерлен</h4>
            <p className="text-sm text-gray-600 mb-3">Строительные товары</p>
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed"
            >
              Скоро
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div
          className={`p-4 rounded-lg ${
            results.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {results.success ? (
              <>
                <Download className="w-5 h-5" />
                <span className="font-semibold">Успешно!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Ошибка</span>
              </>
            )}
          </div>
          <p className="mt-2">
            {results.message || `Импортировано товаров: ${results.count}`}
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Юридические ограничения
        </h4>
        <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-1">
          <li>Проверьте robots.txt сайта перед парсингом</li>
          <li>Не нарушайте условия использования сайтов</li>
          <li>Используйте разумные интервалы между запросами</li>
          <li>Не перегружайте серверы конкурентов</li>
          <li>Указывайте источник данных при отображении</li>
        </ul>
      </div>
    </div>
  );
}
