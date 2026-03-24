"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  AlertCircle,
  Download,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ImportError {
  row: number;
  field: string;
  error: string;
}

interface PreviewProduct {
  name: string;
  price: number;
  category: string;
  sku?: string;
  inStock?: boolean;
  _rawData: any;
}

export default function ImportProducts() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // ← ДОБАВЬТЕ ЭТУ СТРОЧКУ
  const [previewData, setPreviewData] = useState<PreviewProduct[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    imported: number;
    failed: number;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setPreviewData([]);
      setErrors([]);
      setImportResult(null);
      parseFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
  });

  const parseFile = async (file: File) => {
    setIsProcessing(true);

    try {
      if (file.name.endsWith(".csv")) {
        await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        await parseExcel(file);
      }
    } catch (error) {
      console.error("Parse error:", error);
      setErrors([{ row: 0, field: "file", error: "Ошибка чтения файла" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (file: File) => {
    return new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
          resolve();
        },
        error: (error) => {
          console.error("CSV parse error:", error);
          resolve();
        },
      });
    });
  };

  const parseExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    processData(data);
  };

  const processData = (data: any[]) => {
    const newErrors: ImportError[] = [];
    const preview: PreviewProduct[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2;

      // Валидация обязательных полей
      if (!row.name && !row["Название"]) {
        newErrors.push({
          row: rowNumber,
          field: "name",
          error: "Отсутствует название товара",
        });
      }

      if (!row.price && !row["Цена"]) {
        newErrors.push({
          row: rowNumber,
          field: "price",
          error: "Отсутствует цена",
        });
      } else if (row.price && isNaN(parseFloat(row.price))) {
        newErrors.push({
          row: rowNumber,
          field: "price",
          error: "Некорректная цена",
        });
      }

      if (!row.category && !row["Категория"]) {
        newErrors.push({
          row: rowNumber,
          field: "category",
          error: "Отсутствует категория",
        });
      }

      // Если есть ошибки в обязательных полях, пропускаем товар
      const hasCriticalErrors = newErrors.some((e) => e.row === rowNumber);
      if (hasCriticalErrors) return;

      // Форматируем данные
      const product: PreviewProduct = {
        name: row.name || row["Название"] || "",
        price: parseFloat(row.price || row["Цена"] || "0"),
        category: row.category || row["Категория"] || "",
        sku: row.sku || row["Артикул"] || `IMPORT-${Date.now()}-${index}`,
        inStock:
          (row.inStock || row["В наличии"])?.toString().toLowerCase() === "да",
        _rawData: row,
      };

      preview.push(product);
    });

    setPreviewData(preview);
    setErrors(newErrors);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsProcessing(true);

    try {
      const productsToImport = previewData.map((p) => ({
        name: p.name,
        price: p.price,
        category: p.category,
        sku: p.sku,
        inStock: p.inStock ?? true,
        description: p._rawData.description || p._rawData["Описание"],
        originalPrice: p._rawData.originalPrice || p._rawData["Старая цена"],
        material: p._rawData.material || p._rawData["Материал"],
        color: p._rawData.color || p._rawData["Цвет"],
        images: p._rawData.images || p._rawData["Изображения"],
        tags: p._rawData.tags || p._rawData["Теги"],
        stockCount: p._rawData.stockCount || p._rawData["Количество"] || 1,
      }));

      const response = await fetch("/api/import/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: productsToImport,
          fileName: file?.name,
          fileType: file?.name.split(".").pop(),
          source: "supplier",
          user: "admin",
        }),
      });

      const result = await response.json();

      setImportResult({
        success: result.success,
        message: result.message,
        imported: result.imported || 0,
        failed: result.failed || 0,
      });

      if (result.success) {
        setFile(null);
        setPreviewData([]);
        setErrors([]);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Ошибка импорта",
        imported: 0,
        failed: previewData.length,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const testImport = async () => {
    setIsProcessing(true);

    const testProducts = [
      {
        name: "Тестовый стул офисный",
        price: "4990",
        category: "Стулья",
        sku: "TEST-001",
        inStock: "Да",
        description: "Тестовое описание стула",
        material: "Дерево, Ткань",
        color: "Черный",
        images: "https://example.com/test1.jpg,https://example.com/test2.jpg",
        tags: "тест,новинка,офис",
      },
      {
        name: "Тестовый журнальный столик",
        price: "12990",
        category: "Столы",
        sku: "TEST-002",
        inStock: "Нет",
        description: "Тестовый стеклянный столик",
        originalPrice: "14990",
        material: "Стекло, Металл",
        color: "Прозрачный, Черный",
      },
    ];

    try {
      const response = await fetch("/api/import/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: testProducts,
          fileName: "test-import.csv",
          fileType: "csv",
          source: "test",
        }),
      });

      const result = await response.json();
      console.log("Тестовый импорт:", result);

      setImportResult({
        success: result.success,
        message: result.message,
        imported: result.imported || 0,
        failed: result.failed || 0,
      });
    } catch (error) {
      console.error("Test import error:", error);
      setImportResult({
        success: false,
        message: "Ошибка тестового импорта",
        imported: 0,
        failed: testProducts.length,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Название",
      "Цена",
      "Категория",
      "Артикул",
      "В наличии",
      "Описание",
      "Старая цена",
      "Материал",
      "Цвет",
      "Изображения",
      "Теги",
    ];

    const exampleData = [
      {
        Название: "Стул офисный эргономичный",
        Цена: "4990",
        Категория: "Стулья",
        Артикул: "STUL-001",
        "В наличии": "Да",
        Описание: "Удобный офисный стул с регулировкой высоты",
        "Старая цена": "5990",
        Материал: "Ткань, металл",
        Цвет: "Черный",
        Изображения:
          "https://example.com/chair1.jpg,https://example.com/chair2.jpg",
        Теги: "офис,эргономичный,новинка",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Шаблон");
    XLSX.writeFile(wb, "шаблон_импорта_товаров.xlsx");
  };

  const clearAll = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setImportResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Импорт товаров из CSV/XLS</h2>
          <p className="text-gray-600">Загрузите файл от поставщика</p>
        </div>
      </div>

      {/* Тестовые кнопки */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={testImport}
          disabled={isProcessing}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Идет импорт..." : "Тестовый импорт"}
        </button>

        <button
          onClick={() =>
            fetch("/api/test")
              .then((r) => r.json())
              .then(console.log)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Тест API
        </button>

        <button
          onClick={() =>
            fetch("/api/products")
              .then((r) => r.json())
              .then(console.log)
          }
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Тест товаров
        </button>
      </div>

      {/* Зона загрузки */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-12 h-12 text-blue-500" />
              <div className="text-left">
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB • {previewData.length}{" "}
                  товаров
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="ml-auto p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? "Отпустите файл" : "Перетащите файл сюда"}
              </p>
              <p className="text-gray-500 mb-4">или нажмите для выбора</p>
              <p className="text-sm text-gray-400">
                Поддерживаются CSV, XLS, XLSX (макс. 10MB)
              </p>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4" />
            Скачать шаблон Excel
          </button>
        </div>
      </div>

      {/* Предпросмотр данных */}
      {previewData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Предпросмотр ({previewData.length} товаров)
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Название
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Цена
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Категория
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Артикул
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Наличие
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.slice(0, 5).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{product.name}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {product.price.toLocaleString()} ₽
                    </td>
                    <td className="px-4 py-3 text-sm">{product.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.inStock
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.inStock ? "В наличии" : "Нет"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {previewData.length > 5 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                ... и еще {previewData.length - 5} товаров
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ошибки */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Найдены ошибки ({errors.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                <span className="font-medium">Строка {error.row}:</span>{" "}
                {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Результат импорта */}
      {importResult && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            importResult.success
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {importResult.success ? (
              <Check className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <div>
              <p className="font-semibold">{importResult.message}</p>
              <p className="text-sm mt-1">
                Успешно: {importResult.imported} | Ошибки: {importResult.failed}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-4">
        <button
          onClick={clearAll}
          className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          disabled={isProcessing}
        >
          Очистить
        </button>

        <button
          onClick={handleImport}
          disabled={
            isProcessing || previewData.length === 0 || errors.length > 0
          }
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Импорт...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Импортировать ({previewData.length})
            </>
          )}
        </button>
      </div>

      {/* Инструкция */}
      <div className="mt-8 pt-6 border-t">
        <h4 className="font-semibold mb-3">Формат файла:</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">•</span>
            <span>
              <strong>Обязательные поля:</strong> Название, Цена, Категория
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">•</span>
            <span>
              <strong>Поддерживаемые форматы:</strong> CSV, Excel (XLS/XLSX)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">•</span>
            <span>
              <strong>Кодировка:</strong> UTF-8 для CSV файлов
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">•</span>
            <span>
              <strong>Разделитель:</strong> Запятая для CSV
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
