import * as XLSX from "xlsx";
import { Product } from "@/types";

// Маппинг колонок Avito на наши поля
const AVITO_COLUMNS = {
  id: 0, // Уникальный идентификатор объявления
  name: 5, // Название объявления
  description: 6, // Описание объявления
  price: 7, // Цена
  images: 8, // Ссылки на фото
  category: 11, // Категория
  goodsType: 17, // Вид товара (Столы и стулья)
  condition: 19, // Состояние
  availability: 20, // Доступность (В наличии)
  mainColor: 21, // Основной цвет
  colorName: 22, // Цвет от производителя
  multiName: 24, // Название мультиобъявления (используем как модель)
  productType: 25, // Тип товара (Стулья, Столы)
  chairType: 26, // Тип стула (Кухонный, Барный)
  seatMaterial: 27, // Материал сиденья
  baseMaterial: 28, // Материал основания
  quantity: 29, // Количество стульев
  features: 32, // Что есть у стула
  audience: 33, // Целевая аудитория
  boxLength: 34, // Длина коробки (глубина)
  boxWidth: 35, // Ширина коробки
  boxHeight: 36, // Высота коробки
  weight: 37, // Вес
};

// Функция транслитерации для slug
function transliterate(text: string): string {
  const map: Record<string, string> = {
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
    " ": "-",
    "/": "-",
    "\\": "-",
    _: "-",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => map[char] || char)
    .join("")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Определяем категорию по типу товара
function mapCategory(productType: string, chairType: string): string {
  const type = productType?.toLowerCase() || "";
  const subType = chairType?.toLowerCase() || "";

  if (type.includes("стул")) {
    if (subType.includes("барн")) return "barnye-stulya";
    if (subType.includes("офис")) return "ofisnye-stulya";
    return "stulya";
  }
  if (type.includes("стол")) {
    if (subType.includes("журнал")) return "zhurnalnye-stoliki";
    if (subType.includes("обеден")) return "obedennye-stoly";
    return "stoly";
  }
  if (type.includes("кресл")) {
    if (subType.includes("офис")) return "ofisnye-kresla";
    return "kresla";
  }
  if (type.includes("диван")) return "divany";
  if (type.includes("банкетк") || type.includes("пуф")) return "banketki";

  return "stulya"; // default
}

// Парсим размеры из описания
function parseDimensions(description: string): {
  width?: number;
  height?: number;
  depth?: number;
} {
  const dims: { width?: number; height?: number; depth?: number } = {};

  // Ищем паттерны типа "Высота: 94.0 см" или "Высота 94 см"
  const heightMatch = description.match(/высота[:\s]*(\d+(?:\.\d+)?)\s*см/i);
  const widthMatch = description.match(/ширина[:\s]*(\d+(?:\.\d+)?)\s*см/i);
  const depthMatch = description.match(/глубина[:\s]*(\d+(?:\.\d+)?)\s*см/i);

  if (heightMatch) dims.height = parseFloat(heightMatch[1]);
  if (widthMatch) dims.width = parseFloat(widthMatch[1]);
  if (depthMatch) dims.depth = parseFloat(depthMatch[1]);

  return dims;
}

// Очищаем описание от HTML и эмодзи
function cleanDescription(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/[✨💯❤️‍🔥🌿✔📌🔥📐🚚⏳🤝✅🛒🔎#]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Парсим изображения
function parseImages(imagesStr: string): string[] {
  if (!imagesStr) return [];

  return imagesStr
    .split("|")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("http") && !url.includes("#"));
}

// Основная функция парсинга
export function parseAvitoExcel(filePath: string): Product[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const products: Product[] = [];

  // Пропускаем первые 3 служебные строки
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[AVITO_COLUMNS.name]) continue;

    const avitoId = row[AVITO_COLUMNS.id] || `avito-${i}`;
    const name = row[AVITO_COLUMNS.name] || "";
    const description = row[AVITO_COLUMNS.description] || "";
    const price = parseFloat(row[AVITO_COLUMNS.price]) || 0;
    const images = parseImages(row[AVITO_COLUMNS.images] || "");
    const productType = row[AVITO_COLUMNS.productType] || "";
    const chairType = row[AVITO_COLUMNS.chairType] || "";
    const mainColor = row[AVITO_COLUMNS.mainColor] || "";
    const colorName = row[AVITO_COLUMNS.colorName] || "";
    const seatMaterial = row[AVITO_COLUMNS.seatMaterial] || "";
    const baseMaterial = row[AVITO_COLUMNS.baseMaterial] || "";
    const features = row[AVITO_COLUMNS.features] || "";
    const availability = row[AVITO_COLUMNS.availability] || "";
    const multiName = row[AVITO_COLUMNS.multiName] || "";
    const weight = parseFloat(row[AVITO_COLUMNS.weight]) || undefined;

    // Парсим размеры из описания
    const dimensions = parseDimensions(description);
    // Также берём из колонок коробки (обычно совпадают)
    if (!dimensions.depth)
      dimensions.depth = parseFloat(row[AVITO_COLUMNS.boxLength]) || undefined;
    if (!dimensions.width)
      dimensions.width = parseFloat(row[AVITO_COLUMNS.boxWidth]) || undefined;
    if (!dimensions.height)
      dimensions.height = parseFloat(row[AVITO_COLUMNS.boxHeight]) || undefined;

    const slug = transliterate(name.substring(0, 80));
    const category = mapCategory(productType, chairType);

    const product: Product = {
      id: avitoId,
      name: name,
      slug: slug,
      description: cleanDescription(description),
      price: price,
      category: category,
      images: images.length > 0 ? images : ["/placeholder-product.jpg"],
      inStock: availability.toLowerCase().includes("наличии"),
      specifications: {
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth,
        weight: weight,
        material: baseMaterial || seatMaterial,
        seatMaterial: seatMaterial,
        frameMaterial: baseMaterial,
      },
      colors: colorName
        ? [{ name: colorName, hex: getColorHex(mainColor) }]
        : [],
      materials: [seatMaterial, baseMaterial].filter(Boolean),
      rating: 4.8, // Дефолтный рейтинг
      reviewsCount: Math.floor(Math.random() * 50) + 5,
      badges: [],
      features: features
        .split("|")
        .map((f) => f.trim())
        .filter(Boolean),
      avitoData: {
        originalId: avitoId,
        multiName: multiName,
        productType: productType,
        chairType: chairType,
        audience: row[AVITO_COLUMNS.audience] || "",
      },
    };

    products.push(product);
  }

  return products;
}

// Хелпер для определения HEX цвета
function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    белый: "#ffffff",
    чёрный: "#1a1a1a",
    черный: "#1a1a1a",
    серый: "#9ca3af",
    бежевый: "#d4a574",
    коричневый: "#78350f",
    красный: "#dc2626",
    синий: "#2563eb",
    зелёный: "#16a34a",
    зеленый: "#16a34a",
    жёлтый: "#eab308",
    желтый: "#eab308",
    розовый: "#ec4899",
    оранжевый: "#ea580c",
    фиолетовый: "#9333ea",
    голубой: "#0ea5e9",
    бордовый: "#881337",
    махагон: "#6b2c23",
    венге: "#3d2b1f",
    орех: "#5c4033",
    дуб: "#a0826d",
    "слоновая кость": "#fffff0",
  };

  const lower = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(colors)) {
    if (lower.includes(key)) return hex;
  }

  return "#9ca3af"; // default gray
}

// Экспортируем для использования в API
export async function importFromFile(filePath: string): Promise<{
  success: boolean;
  count: number;
  products: Product[];
  errors: string[];
}> {
  try {
    const products = parseAvitoExcel(filePath);
    return {
      success: true,
      count: products.length,
      products,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      products: [],
      errors: [(error as Error).message],
    };
  }
}
