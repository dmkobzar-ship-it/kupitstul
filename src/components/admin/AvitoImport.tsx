"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Download,
  RefreshCw,
  Settings,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  Database,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  AVITO_FIELD_MAPPING,
  validateAvitoFile,
  convertAvitoRowToProduct,
  groupMultiAds,
} from "@/types/avito-mapping";

interface ImportError {
  row: number;
  field: string;
  error: string;
}

interface FieldMapping {
  avitoField: string;
  systemField: string;
  detected: boolean;
}

interface PreviewProduct {
  name: string;
  price: number;
  category: string;
  sku?: string;
  images?: string[];
  avitoId?: string;
  parameters: Array<{ id: string; value: any }>;
  errors: string[];
  _rawData: any;
}

export default function AvitoImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "result">(
    "upload"
  );

  // Mapping state
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [showMappingDetails, setShowMappingDetails] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState<PreviewProduct[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  // Result state
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    imported: number;
    failed: number;
    skipped: number;
  } | null>(null);

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setStep("upload");
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

  // Parse file
  const parseFile = async (file: File) => {
    setIsProcessing(true);

    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (file.name.endsWith(".csv")) {
        const result = await new Promise<{ data: any[]; headers: string[] }>(
          (resolve) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                const headers = results.meta.fields || [];
                resolve({ data: results.data, headers });
              },
            });
          }
        );
        data = result.data;
        headers = result.headers;
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
        headers = data.length > 0 ? Object.keys(data[0]) : [];
      }

      setRawData(data);
      setDetectedHeaders(headers);

      // Validate and map fields
      const validation = validateAvitoFile(headers);

      const mappings: FieldMapping[] = AVITO_FIELD_MAPPING.map((m) => ({
        avitoField: m.avitoField,
        systemField: m.systemField,
        detected: headers.includes(m.avitoField),
      }));

      setFieldMappings(mappings);
      setStep("mapping");

      if (!validation.isValid) {
        setErrors(
          validation.missingRequired.map((field, index) => ({
            row: 0,
            field,
            error: `Отсутствует обязательное поле: ${field}`,
          }))
        );
      }
    } catch (error) {
      console.error("Parse error:", error);
      setErrors([{ row: 0, field: "file", error: "Ошибка чтения файла" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process data with mapping
  const processDataWithMapping = () => {
    setIsProcessing(true);
    const newErrors: ImportError[] = [];
    const preview: PreviewProduct[] = [];

    rawData.forEach((row, index) => {
      const rowNumber = index + 2;
      const {
        product,
        parameters,
        errors: rowErrors,
      } = convertAvitoRowToProduct(row);

      if (rowErrors.length > 0) {
        rowErrors.forEach((err) => {
          newErrors.push({
            row: rowNumber,
            field: "validation",
            error: err,
          });
        });
      }

      // Преобразуем images из строки в массив, если нужно
      let images: string[] = [];
      if (product.images) {
        if (Array.isArray(product.images)) {
          images = product.images;
        } else if (typeof product.images === "string") {
          images = product.images
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
      }

      const previewProduct: PreviewProduct = {
        name: product.name || "",
        price: product.price || 0,
        category: product.categoryName || "Без категории",
        sku: product.sku,
        images,
        avitoId: product.avitoId,
        parameters: parameters.map((p) => ({
          id: p.parameterId,
          value: p.value,
        })),
        errors: rowErrors,
        _rawData: row,
      };

      preview.push(previewProduct);
    });

    setPreviewData(preview);
    setErrors(newErrors);
    setStep("preview");
    setIsProcessing(false);
  };

  // Handle import
  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsProcessing(true);

    try {
      // Фильтруем товары без критических ошибок
      const validProducts = previewData.filter(
        (p) => p.errors.length === 0 && p.name && p.price > 0
      );

      const productsToImport = validProducts.map((p) => ({
        name: p.name,
        price: p.price,
        category: p.category,
        sku: p.sku,
        avitoId: p.avitoId,
        images: p.images,
        parameters: p.parameters,
        inStock: true,
        status: "active",
      }));

      const response = await fetch("/api/import/avito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: productsToImport,
          fileName: file?.name,
          source: "avito",
        }),
      });

      const result = await response.json();

      setImportResult({
        success: result.success,
        message:
          result.message ||
          (result.success ? "Импорт завершён успешно" : "Ошибка импорта"),
        imported: result.imported || validProducts.length,
        failed: result.failed || 0,
        skipped: previewData.length - validProducts.length,
      });

      setStep("result");
    } catch (error) {
      setImportResult({
        success: false,
        message: "Ошибка соединения с сервером",
        imported: 0,
        failed: previewData.length,
        skipped: 0,
      });
      setStep("result");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Avito template
  const downloadAvitoTemplate = () => {
    const headers = AVITO_FIELD_MAPPING.map((m) => m.avitoField);

    const exampleData = [
      {
        "Способ размещения": "Пакет",
        "Номер объявления на Авито": "",
        "Номер телефона": "+79991234567",
        Адрес: "Москва",
        "Название объявления": "Стул обеденный велюр серый",
        "Описание объявления":
          "Стильный обеденный стул в мягкой велюровой обивке",
        Цена: "4990",
        "Ссылки на фото":
          "https://example.com/photo1.jpg,https://example.com/photo2.jpg",
        "Названия фото": "",
        "Способ связи": "По телефону и в сообщениях",
        Категория: "Мебель и интерьер",
        "Поместится ли товар в одну коробку?": "Да",
        "Вес (Для Доставки)": "8",
        "Длина (Для Доставки)": "60",
        "Высота (Для Доставки)": "90",
        "Ширина (Для Доставки)": "50",
        "Вид товара": "Стул",
        "Вид продажи": "Товар приобретен на продажу",
        Состояние: "Новое",
        Доступность: "В наличии",
        "Основной цвет": "Серый",
        "Цвет от производителя": "Светло-серый велюр",
        "Соединять это объявление с другими объявлениями": "Да",
        "Название мультиобъявления": "Стул обеденный велюр",
        "Тип товара": "Мебель для кухни",
        "Тип стула": "Обеденный",
        "Материал сиденья": "Велюр",
        "Материал основания": "Металл",
        "Количество стульев": "1",
        Складной: "Нет",
        Конструкция: "Цельная",
        "Что есть у стула": "Мягкое сиденье, Спинка",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Авито");
    XLSX.writeFile(wb, "шаблон_авито_импорта.xlsx");
  };

  // Clear all
  const clearAll = () => {
    setFile(null);
    setStep("upload");
    setPreviewData([]);
    setErrors([]);
    setImportResult(null);
    setDetectedHeaders([]);
    setFieldMappings([]);
    setRawData([]);
  };

  // Stats
  const validCount = previewData.filter(
    (p) => p.errors.length === 0 && p.name && p.price > 0
  ).length;
  const errorCount = previewData.filter((p) => p.errors.length > 0).length;
  const warningCount = previewData.filter(
    (p) => p.errors.length === 0 && (!p.images || p.images.length === 0)
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Импорт из Авито</h2>
              <p className="text-white/80 text-sm">
                Загрузите выгрузку товаров с Авито
              </p>
            </div>
          </div>

          <button
            onClick={downloadAvitoTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Скачать шаблон
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { key: "upload", label: "Загрузка", icon: Upload },
            { key: "mapping", label: "Маппинг", icon: Settings },
            { key: "preview", label: "Предпросмотр", icon: Eye },
            { key: "result", label: "Результат", icon: Check },
          ].map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  step === s.key
                    ? "text-orange-600"
                    : ["upload", "mapping", "preview", "result"].indexOf(step) >
                        index
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === s.key
                      ? "bg-orange-100"
                      : ["upload", "mapping", "preview", "result"].indexOf(
                            step
                          ) > index
                        ? "bg-green-100"
                        : "bg-gray-100"
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {s.label}
                </span>
              </div>
              {index < 3 && (
                <ArrowRight className="w-4 h-4 mx-2 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDragActive ? "text-orange-500" : "text-gray-400"
                }`}
              />
              {isDragActive ? (
                <p className="text-orange-600 font-medium text-lg">
                  Отпустите файл здесь...
                </p>
              ) : (
                <>
                  <p className="text-gray-600 font-medium text-lg mb-2">
                    Перетащите файл выгрузки с Авито
                  </p>
                  <p className="text-gray-500 text-sm">
                    или нажмите для выбора файла (CSV, XLS, XLSX)
                  </p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Чтение файла...</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === "mapping" && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Проверка полей</h3>
                  <p className="text-gray-600 text-sm">
                    Обнаружено {detectedHeaders.length} колонок, распознано{" "}
                    {fieldMappings.filter((m) => m.detected).length} полей Авито
                  </p>
                </div>
                <button
                  onClick={() => setShowMappingDetails(!showMappingDetails)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {showMappingDetails ? "Скрыть детали" : "Показать детали"}
                  {showMappingDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Mapping summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">
                      {fieldMappings.filter((m) => m.detected).length}
                    </span>
                  </div>
                  <p className="text-green-600 text-sm">Распознано</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700 mb-1">
                    <Info className="w-5 h-5" />
                    <span className="font-semibold">
                      {fieldMappings.filter((m) => !m.detected).length}
                    </span>
                  </div>
                  <p className="text-yellow-600 text-sm">Не найдено</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Database className="w-5 h-5" />
                    <span className="font-semibold">{rawData.length}</span>
                  </div>
                  <p className="text-blue-600 text-sm">Товаров в файле</p>
                </div>
              </div>

              {/* Mapping details */}
              {showMappingDetails && (
                <div className="border rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Поле Авито</th>
                        <th className="px-4 py-2 text-left">Системное поле</th>
                        <th className="px-4 py-2 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldMappings.slice(0, 15).map((mapping, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{mapping.avitoField}</td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {mapping.systemField}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {mapping.detected ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Обнаружены проблемы</span>
                  </div>
                  <ul className="text-red-600 text-sm space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>• {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={clearAll}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={processDataWithMapping}
                disabled={
                  isProcessing ||
                  errors.some(
                    (e) =>
                      e.field === "Название объявления" || e.field === "Цена"
                  )
                }
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Обработать данные
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{previewData.length}</p>
                <p className="text-gray-600 text-sm">Всего</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {validCount}
                </p>
                <p className="text-green-600 text-sm">Готово к импорту</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {warningCount}
                </p>
                <p className="text-yellow-600 text-sm">Без фото</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                <p className="text-red-600 text-sm">С ошибками</p>
              </div>
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Название</th>
                      <th className="px-4 py-3 text-left">Категория</th>
                      <th className="px-4 py-3 text-right">Цена</th>
                      <th className="px-4 py-3 text-center">Фото</th>
                      <th className="px-4 py-3 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 100).map((product, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div
                            className="max-w-xs truncate"
                            title={product.name}
                          >
                            {product.name || (
                              <span className="text-red-500">Без названия</span>
                            )}
                          </div>
                          {product.avitoId && (
                            <div className="text-xs text-gray-400">
                              ID: {product.avitoId}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {product.price > 0 ? (
                            `${product.price.toLocaleString()} ₽`
                          ) : (
                            <span className="text-red-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.images && product.images.length > 0 ? (
                            <span className="text-green-600">
                              {product.images.length}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.errors.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                              <XCircle className="w-3 h-3" />
                              Ошибка
                            </span>
                          ) : !product.name || product.price <= 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                              <AlertCircle className="w-3 h-3" />
                              Пропуск
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 100 && (
                <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center border-t">
                  Показано 100 из {previewData.length} товаров
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("mapping")}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                onClick={handleImport}
                disabled={isProcessing || validCount === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Импортировать {validCount} товаров
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && importResult && (
          <div className="text-center py-8">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                importResult.success ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {importResult.success ? (
                <Check className="w-10 h-10 text-green-600" />
              ) : (
                <X className="w-10 h-10 text-red-600" />
              )}
            </div>

            <h3 className="text-2xl font-bold mb-2">
              {importResult.success ? "Импорт завершён!" : "Ошибка импорта"}
            </h3>
            <p className="text-gray-600 mb-6">{importResult.message}</p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">
                  {importResult.imported}
                </p>
                <p className="text-green-600 text-sm">Импортировано</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-yellow-700">
                  {importResult.skipped}
                </p>
                <p className="text-yellow-600 text-sm">Пропущено</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-700">
                  {importResult.failed}
                </p>
                <p className="text-red-600 text-sm">Ошибок</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={clearAll}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Новый импорт
              </button>
              <a
                href="/admin/products"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Перейти к товарам
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
