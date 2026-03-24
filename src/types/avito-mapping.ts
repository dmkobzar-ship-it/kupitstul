// ============================================
// МАППИНГ ПОЛЕЙ АВИТО → СИСТЕМА
// ============================================

import { AvitoImportMapping, ProductParameterValue } from "./index";

// Полный маппинг полей из Авито Excel
export const AVITO_FIELD_MAPPING: AvitoImportMapping[] = [
  // ===== ОСНОВНЫЕ ПОЛЯ =====
  {
    avitoField: "Название объявления",
    systemField: "name",
    transform: "direct",
  },
  {
    avitoField: "Описание объявления",
    systemField: "description",
    transform: "direct",
  },
  {
    avitoField: "Цена",
    systemField: "price",
    transform: "price",
  },
  {
    avitoField: "Ссылки на фото",
    systemField: "images",
    transform: "split",
    delimiter: ",",
  },
  {
    avitoField: "Категория",
    systemField: "categoryName",
    transform: "direct",
  },
  {
    avitoField: "Номер объявления на Авито",
    systemField: "avitoId",
    transform: "direct",
  },

  // ===== ДОСТАВКА =====
  {
    avitoField: "Вес (Для Доставки)",
    systemField: "weight",
    transform: "number",
  },
  {
    avitoField: "Длина (Для Доставки)",
    systemField: "length",
    transform: "number",
  },
  {
    avitoField: "Высота (Для Доставки)",
    systemField: "height",
    transform: "number",
  },
  {
    avitoField: "Ширина (Для Доставки)",
    systemField: "width",
    transform: "number",
  },
  {
    avitoField: "Поместится ли товар в одну коробку?",
    systemField: "singleBox",
    transform: "boolean",
  },

  // ===== ХАРАКТЕРИСТИКИ =====
  {
    avitoField: "Вид товара",
    systemField: "productType",
    transform: "direct",
  },
  {
    avitoField: "Тип товара",
    systemField: "itemType",
    transform: "direct",
  },
  {
    avitoField: "Тип стула",
    systemField: "chairType",
    transform: "direct",
  },
  {
    avitoField: "Основной цвет",
    systemField: "color",
    transform: "direct",
  },
  {
    avitoField: "Цвет от производителя",
    systemField: "manufacturerColor",
    transform: "direct",
  },
  {
    avitoField: "Материал сиденья",
    systemField: "seatMaterial",
    transform: "direct",
  },
  {
    avitoField: "Материал основания",
    systemField: "baseMaterial",
    transform: "direct",
  },
  {
    avitoField: "Количество стульев",
    systemField: "quantity",
    transform: "number",
  },
  {
    avitoField: "Складной",
    systemField: "isFoldable",
    transform: "boolean",
  },
  {
    avitoField: "Конструкция",
    systemField: "construction",
    transform: "direct",
  },
  {
    avitoField: "Что есть у стула",
    systemField: "features",
    transform: "split",
    delimiter: ",",
  },

  // ===== СТАТУС =====
  {
    avitoField: "Доступность",
    systemField: "availability",
    transform: "direct",
  },
  {
    avitoField: "Состояние",
    systemField: "condition",
    transform: "direct",
  },
  {
    avitoField: "Вид продажи",
    systemField: "saleType",
    transform: "direct",
  },

  // ===== МУЛЬТИОБЪЯВЛЕНИЯ =====
  {
    avitoField: "Соединять это объявление с другими объявлениями",
    systemField: "multiAdGroup",
    transform: "boolean",
  },
  {
    avitoField: "Название мультиобъявления",
    systemField: "multiAdName",
    transform: "direct",
  },
];

// Функция парсинга значений
export function transformValue(
  value: string | undefined,
  transform: AvitoImportMapping["transform"],
  delimiter?: string
): any {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const stringValue = String(value).trim();

  switch (transform) {
    case "direct":
      return stringValue;

    case "number":
      const num = parseFloat(
        stringValue.replace(/[^\d.,]/g, "").replace(",", ".")
      );
      return isNaN(num) ? undefined : num;

    case "price":
      // Убираем всё кроме цифр и точки/запятой
      const price = parseFloat(
        stringValue.replace(/[^\d.,]/g, "").replace(",", ".")
      );
      return isNaN(price) ? 0 : Math.round(price);

    case "boolean":
      const lowerValue = stringValue.toLowerCase();
      return (
        lowerValue === "да" ||
        lowerValue === "yes" ||
        lowerValue === "true" ||
        lowerValue === "1"
      );

    case "split":
      return stringValue
        .split(delimiter || ",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    default:
      return stringValue;
  }
}

// Конвертация строки Авито в продукт системы
export function convertAvitoRowToProduct(row: Record<string, any>): {
  product: Partial<any>;
  parameters: ProductParameterValue[];
  errors: string[];
} {
  const product: Record<string, any> = {};
  const parameters: ProductParameterValue[] = [];
  const errors: string[] = [];

  // Поля которые идут в основной объект товара
  const mainFields = [
    "name",
    "description",
    "price",
    "images",
    "categoryName",
    "avitoId",
  ];

  // Поля которые идут в dimensions
  const dimensionFields = ["weight", "length", "height", "width"];

  for (const mapping of AVITO_FIELD_MAPPING) {
    const avitoValue = row[mapping.avitoField];
    const transformedValue = transformValue(
      avitoValue,
      mapping.transform,
      mapping.delimiter
    );

    if (transformedValue === undefined) continue;

    if (mainFields.includes(mapping.systemField)) {
      product[mapping.systemField] = transformedValue;
    } else if (dimensionFields.includes(mapping.systemField)) {
      // Собираем размеры в отдельный объект
      if (!product.dimensions) product.dimensions = {};
      product.dimensions[mapping.systemField] = transformedValue;
    } else {
      // Остальное идёт в параметры
      parameters.push({
        parameterId: mapping.systemField, // Временно используем systemField как ID
        value: transformedValue,
      });
    }
  }

  // Валидация обязательных полей
  if (!product.name) {
    errors.push("Отсутствует название товара");
  }
  if (!product.price || product.price <= 0) {
    errors.push("Некорректная цена товара");
  }

  // Генерируем SKU если нет
  if (!product.sku) {
    product.sku = generateSKU(product.name, product.avitoId);
  }

  // Генерируем slug
  product.slug = generateSlug(product.name);

  return { product, parameters, errors };
}

// Генерация артикула
function generateSKU(name?: string, avitoId?: string): string {
  if (avitoId) {
    return `AV-${avitoId}`;
  }
  const prefix = "KS";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Генерация slug из названия
function generateSlug(name?: string): string {
  if (!name) return "";

  const translitMap: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return name
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] || char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

// Валидация всего файла
export function validateAvitoFile(headers: string[]): {
  isValid: boolean;
  missingRequired: string[];
  unknownFields: string[];
  matchedFields: string[];
} {
  const requiredFields = ["Название объявления", "Цена"];
  const knownFields = AVITO_FIELD_MAPPING.map((m) => m.avitoField);

  const missingRequired = requiredFields.filter((f) => !headers.includes(f));
  const matchedFields = headers.filter((h) => knownFields.includes(h));
  const unknownFields = headers.filter((h) => !knownFields.includes(h));

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    unknownFields,
    matchedFields,
  };
}

// Группировка мультиобъявлений (варианты товара)
export function groupMultiAds(
  products: Array<{ product: any; parameters: any[] }>
): Map<string, Array<{ product: any; parameters: any[] }>> {
  const groups = new Map<string, Array<{ product: any; parameters: any[] }>>();

  for (const item of products) {
    const multiAdName = item.parameters.find(
      (p) => p.parameterId === "multiAdName"
    )?.value;

    if (multiAdName && typeof multiAdName === "string") {
      if (!groups.has(multiAdName)) {
        groups.set(multiAdName, []);
      }
      groups.get(multiAdName)!.push(item);
    } else {
      // Товар без группы - уникальный ключ
      const uniqueKey = `_single_${item.product.avitoId || Date.now()}`;
      groups.set(uniqueKey, [item]);
    }
  }

  return groups;
}
