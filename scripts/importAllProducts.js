// Импорт всех товаров из нового Avito Excel файла
// с автоматическим распределением по категориям

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Путь к Excel файлу
const excelPath = path.join(
  __dirname,
  "..",
  "data",
  "142483789_2026-01-19T08_08_01Z.xlsx"
);
const outputPath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "importedProducts.ts"
);

// Маппинг листов на категории
const sheetToCategory = {
  "Столы и стулья-Табуретки": "taburetki",
  "Шкафы, комоды и-Комоды и тумбы": "komody",
  "Шкафы, комоды и-Стеллажи и этаж": "stellazhi",
  "Тумбы-Тумбы под телевизор": "tumby-tv",
  "Кресла и стулья-Стулья для рабо": "ofisnye-stulya",
  "Предметы интерьера, иск-Зеркала": "zerkala",
  "Садовая мебель-Садовые стулья и": "sadovaya-mebel",
  "Столы и стулья-Стулья": "stulya",
  "Кресла и стулья-Компьютерные кр": "kompyuternye-kresla",
  "Столы и стулья-Столы": "stoly",
  "Тумбы-Тумбы": "tumby",
  "Шкафы, комоды и-Шкафы и буфеты": "shkafy",
  "Кровати, диваны и кресла-Кресла": "kresla",
  "Кровати, диваны-Пуфы и банкетки": "pufy",
};

// Названия категорий на русском
const categoryNames = {
  stulya: "Стулья",
  "barnye-stulya": "Барные стулья",
  stoly: "Столы",
  kresla: "Кресла",
  "kompyuternye-kresla": "Компьютерные кресла",
  "ofisnye-stulya": "Офисные стулья",
  taburetki: "Табуретки",
  komody: "Комоды и тумбы",
  stellazhi: "Стеллажи",
  tumby: "Тумбы",
  "tumby-tv": "Тумбы под ТВ",
  shkafy: "Шкафы и буфеты",
  pufy: "Пуфы и банкетки",
  zerkala: "Зеркала",
  "sadovaya-mebel": "Садовая мебель",
};

// Функция определения подкатегории по названию товара
function detectSubCategory(name, description, baseCategory) {
  const nameLower = name.toLowerCase();
  const descLower = (description || "").toLowerCase();
  const text = nameLower + " " + descLower;

  // Барные стулья
  if (text.includes("барн") || text.includes("bar")) {
    return "barnye-stulya";
  }

  return baseCategory;
}

// Генерация slug из названия
function generateSlug(name, id) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  // Транслитерация
  const translitMap = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
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

  slug = slug
    .split("")
    .map((char) => translitMap[char] || char)
    .join("");
  slug = slug.replace(/[^a-z0-9-]/g, "").substring(0, 50);

  return slug + "-" + id.toString().substring(0, 8);
}

// Парсинг цвета
function parseColor(colorName) {
  const colorMap = {
    белый: "#ffffff",
    черный: "#1a1a1a",
    чёрный: "#1a1a1a",
    серый: "#808080",
    бежевый: "#d4a574",
    коричневый: "#8b4513",
    венге: "#3d2b1f",
    орех: "#5c4033",
    дуб: "#a0826d",
    красный: "#dc2626",
    синий: "#2563eb",
    зеленый: "#16a34a",
    зелёный: "#16a34a",
    желтый: "#eab308",
    жёлтый: "#eab308",
    оранжевый: "#ea580c",
    розовый: "#ec4899",
    фиолетовый: "#9333ea",
    голубой: "#0ea5e9",
    бордовый: "#881337",
    бордо: "#881337",
    махагон: "#6b2c23",
    "слоновая кость": "#fffff0",
    золотой: "#d4af37",
    золото: "#d4af37",
    серебро: "#c0c0c0",
    серебряный: "#c0c0c0",
    натуральный: "#deb887",
    молочный: "#fdfff5",
    кремовый: "#fffdd0",
  };

  const lower = (colorName || "").toLowerCase();
  for (const [name, hex] of Object.entries(colorMap)) {
    if (lower.includes(name)) {
      return { name: colorName, hex };
    }
  }
  return { name: colorName || "Стандартный", hex: "#808080" };
}

// Очистка HTML тегов
function cleanHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

// Главная функция импорта
function importProducts() {
  console.log("📖 Reading Excel file...");
  const wb = XLSX.readFile(excelPath);

  // Листы с товарами (без справочников и инструкции)
  const productSheets = wb.SheetNames.filter(
    (n) => !n.startsWith("Спр-") && n !== "Инструкция" && !n.includes("Фото-") // Исключаем услуги фотосъёмки
  );

  console.log(`📋 Found ${productSheets.length} product sheets`);

  const allProducts = [];
  const categoryStats = {};
  const seenIds = new Set();

  for (const sheetName of productSheets) {
    const baseCategory = sheetToCategory[sheetName] || "other";
    console.log(`\n📂 Processing: ${sheetName} → ${baseCategory}`);

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // Данные начинаются с 5-й строки (индекс 4)
    let productsInSheet = 0;

    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0] || !row[5]) continue; // Пропускаем пустые строки

      // Структура колонок (из анализа):
      // 0: Id
      // 1: ?
      // 2: AvitoId
      // 3: ContactPhone
      // 4: Address
      // 5: Title (название)
      // 6: Description
      // 7: Price
      // 8: ImageUrls (через |)
      // 9: ?
      // 10: ContactMethod
      // 11: Category1
      // 12: ?
      // 13: Weight
      // 14: Depth
      // 15: Height
      // 16: Width
      // 17-25: Различные атрибуты
      // 26: ChairType (Барный, Кухонный и т.д.)

      const id = String(row[0] || i);

      // Пропускаем дубликаты
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const name = String(row[5] || "").trim();
      const description = cleanHtml(String(row[6] || ""));
      const price = parseFloat(row[7]) || 0;
      const imagesRaw = String(row[8] || "");
      const weight = parseFloat(row[13]) || undefined;
      const depth = parseFloat(row[14]) || undefined;
      const height = parseFloat(row[15]) || undefined;
      const width = parseFloat(row[16]) || undefined;
      const colorName = String(row[20] || row[21] || "");
      const chairType = String(row[26] || "");
      const frameMaterial = String(row[28] || "");
      const seatMaterial = String(row[27] || "");

      if (!name || price <= 0) continue;

      // Определяем категорию
      let category = baseCategory;

      // Проверяем на барный стул
      if (
        chairType.toLowerCase().includes("барн") ||
        name.toLowerCase().includes("барн") ||
        description.toLowerCase().includes("барн")
      ) {
        category = "barnye-stulya";
      }

      // Парсим изображения и конвертируем URL
      const images = imagesRaw
        .split("|")
        .map((url) => {
          url = url.trim();
          // Конвертируем внутренние URL Авито в публичные
          if (url.includes("avito.ru/autoload") && url.includes("imageSlug=")) {
            // Извлекаем imageSlug и конвертируем в CDN URL
            const match = url.match(/imageSlug=([^&]+)/);
            if (match) {
              const slug = decodeURIComponent(match[1]);
              // Формат: /image/1/1.HASH → https://XX.img.avito.st/image/1/1.HASH
              return "https://00.img.avito.st" + slug;
            }
          }
          return url;
        })
        .filter((url) => url.startsWith("http"));

      // Парсим цвет
      const color = parseColor(colorName);

      const product = {
        id: id,
        name: name,
        slug: generateSlug(name, id),
        description: description || undefined,
        price: price,
        category: category,
        images: images.length > 0 ? images : [],
        inStock: true,
        specifications: {
          width: width,
          height: height,
          depth: depth,
          weight: weight,
          material: frameMaterial || undefined,
          seatMaterial: seatMaterial || undefined,
        },
        colors: colorName ? [color] : undefined,
        materials: [seatMaterial, frameMaterial].filter(Boolean),
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        reviewsCount: Math.floor(Math.random() * 50) + 5,
        badges: [],
      };

      // Очищаем пустые спецификации
      Object.keys(product.specifications).forEach((key) => {
        if (!product.specifications[key]) delete product.specifications[key];
      });
      if (Object.keys(product.specifications).length === 0) {
        delete product.specifications;
      }

      allProducts.push(product);
      productsInSheet++;

      // Статистика по категориям
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    }

    console.log(`   ✅ Imported ${productsInSheet} products`);
  }

  console.log("\n📊 Category Statistics:");
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${categoryNames[cat] || cat}: ${count}`);
    });

  console.log(`\n✨ Total products: ${allProducts.length}`);

  // Генерируем TypeScript файл
  const categories = Object.entries(categoryStats).map(([slug, count]) => ({
    slug,
    name: categoryNames[slug] || slug,
    count,
  }));

  const tsContent = `// Автоматически импортировано из Avito Excel
// Дата импорта: ${new Date().toISOString()}
// Товаров: ${allProducts.length}

// Интерфейс для импортированных товаров
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  category: string;
  images: string[];
  inStock: boolean;
  specifications?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    material?: string;
    seatMaterial?: string;
  };
  colors?: { name: string; hex: string }[];
  materials?: string[];
  rating?: string | number;
  reviewsCount?: number;
  badges?: string[];
}

export const importedProducts: Product[] = ${JSON.stringify(allProducts, null, 2)};

export const importedCategories = ${JSON.stringify(categories, null, 2)};

// Хелперы для работы с данными
export function getProductsByCategory(category: string): Product[] {
  return importedProducts.filter(p => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return importedProducts.find(p => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return importedCategories.find(c => c.slug === slug);
}

export function getAllCategories() {
  return importedCategories;
}
`;

  fs.writeFileSync(outputPath, tsContent, "utf-8");
  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log("🎉 Import completed successfully!");
}

// Запуск
importProducts();
