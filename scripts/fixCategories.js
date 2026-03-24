// Скрипт для исправления категорий товаров
// Барные стулья - только товары со словом "барный" в названии или описании
// Остальные стулья - в категорию "stulya"

const fs = require("fs");
const path = require("path");

const inputPath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "importedProducts.ts"
);

console.log("📖 Читаю файл с товарами...");
let content = fs.readFileSync(inputPath, "utf-8");

// Парсим массив товаров
const match = content.match(
  /export const importedProducts: Product\[\] = (\[[\s\S]*?\]);/
);
if (!match) {
  console.error("❌ Не удалось найти массив товаров");
  process.exit(1);
}

// Используем eval для парсинга (безопасно, т.к. это наш собственный файл)
const productsStr = match[1];
let products;
try {
  products = eval(productsStr);
} catch (e) {
  console.error("❌ Ошибка парсинга:", e.message);
  process.exit(1);
}

console.log(`📦 Найдено товаров: ${products.length}`);

// Функция проверки - является ли товар барным стулом
function isBarStool(product) {
  const name = (product.name || "").toLowerCase();
  const description = (product.description || "").toLowerCase();

  // Ищем слово "барный" в названии или описании
  // НЕ просто упоминание "барной зоны" или "для баров"

  // Проверяем название - ищем слово "барн" как отдельное слово или часть слова "барный/барная"
  const barNamePatterns = [
    /\bбарн\w*/i, // барный, барная, барное, барные
    /\bbar\b/i, // bar
    /\bbar[-\s]?stool/i, // bar-stool, bar stool
  ];

  for (const pattern of barNamePatterns) {
    if (pattern.test(name)) {
      return true;
    }
  }

  // В описании ищем только если явно говорится что это барный стул/табурет
  const barDescPatterns = [
    /барн\w*\s+(стул|табурет|кресл)/i, // барный стул, барный табурет
    /стул\w*\s+барн/i, // стул барный
    /табурет\w*\s+барн/i, // табурет барный
  ];

  for (const pattern of barDescPatterns) {
    if (pattern.test(description)) {
      return true;
    }
  }

  return false;
}

let barCount = 0;
let chairCount = 0;
let otherMoved = 0;

// Исправляем категории
products.forEach((product) => {
  const currentCategory = product.category;

  // Если товар сейчас в barnye-stulya
  if (currentCategory === "barnye-stulya") {
    if (isBarStool(product)) {
      barCount++;
    } else {
      // Перемещаем в обычные стулья
      product.category = "stulya";
      chairCount++;
      console.log(`  🪑 → stulya: ${product.name.substring(0, 50)}...`);
    }
  }

  // Если товар в stulya, taburetki или другой категории стульев - проверяем, может это барный
  if (["stulya", "taburetki", "ofisnye-stulya"].includes(currentCategory)) {
    if (isBarStool(product)) {
      product.category = "barnye-stulya";
      barCount++;
      otherMoved++;
      console.log(`  🍺 → barnye-stulya: ${product.name.substring(0, 50)}...`);
    }
  }
});

console.log(`\n📊 Результат:`);
console.log(`  🍺 Барные стулья: ${barCount}`);
console.log(`  🪑 Перемещено в обычные стулья: ${chairCount}`);
console.log(`  ↗️  Перемещено в барные из других категорий: ${otherMoved}`);

// Сериализуем обратно
function serializeProduct(p) {
  const lines = [];
  lines.push(`  {`);
  lines.push(`    id: ${JSON.stringify(p.id)},`);
  lines.push(`    name: ${JSON.stringify(p.name)},`);
  lines.push(`    slug: ${JSON.stringify(p.slug)},`);
  if (p.description) {
    lines.push(`    description:`);
    lines.push(`      ${JSON.stringify(p.description)},`);
  }
  lines.push(`    price: ${p.price},`);
  if (p.oldPrice) {
    lines.push(`    oldPrice: ${p.oldPrice},`);
  }
  lines.push(`    category: ${JSON.stringify(p.category)},`);
  lines.push(`    images: ${JSON.stringify(p.images)},`);
  lines.push(`    inStock: ${p.inStock},`);
  if (p.specifications) {
    lines.push(`    specifications: ${JSON.stringify(p.specifications)},`);
  }
  if (p.colors && p.colors.length > 0) {
    lines.push(`    colors: ${JSON.stringify(p.colors)},`);
  }
  if (p.materials && p.materials.length > 0) {
    lines.push(`    materials: ${JSON.stringify(p.materials)},`);
  }
  if (p.rating) {
    lines.push(`    rating: ${JSON.stringify(p.rating)},`);
  }
  if (p.reviewsCount) {
    lines.push(`    reviewsCount: ${p.reviewsCount},`);
  }
  if (p.badges && p.badges.length > 0) {
    lines.push(`    badges: ${JSON.stringify(p.badges)},`);
  }
  lines.push(`  },`);
  return lines.join("\n");
}

// Генерируем новый файл
const header = `// Автоматически импортировано из Avito Excel
// Дата импорта: ${new Date().toISOString()}
// Товаров: ${products.length}
// Категории исправлены: барные стулья (${barCount}), обычные стулья (${chairCount})

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

export const importedProducts: Product[] = [
${products.map(serializeProduct).join("\n")}
];

// Категории
export const categories = [
  { slug: "stulya", name: "Стулья", count: ${products.filter((p) => p.category === "stulya").length} },
  { slug: "barnye-stulya", name: "Барные стулья", count: ${products.filter((p) => p.category === "barnye-stulya").length} },
  { slug: "stoly", name: "Столы", count: ${products.filter((p) => p.category === "stoly").length} },
  { slug: "kresla", name: "Кресла", count: ${products.filter((p) => p.category === "kresla").length} },
  { slug: "kompyuternye-kresla", name: "Компьютерные кресла", count: ${products.filter((p) => p.category === "kompyuternye-kresla").length} },
  { slug: "ofisnye-stulya", name: "Офисные стулья", count: ${products.filter((p) => p.category === "ofisnye-stulya").length} },
  { slug: "taburetki", name: "Табуретки", count: ${products.filter((p) => p.category === "taburetki").length} },
  { slug: "komody", name: "Комоды и тумбы", count: ${products.filter((p) => p.category === "komody").length} },
  { slug: "stellazhi", name: "Стеллажи", count: ${products.filter((p) => p.category === "stellazhi").length} },
  { slug: "tumby", name: "Тумбы", count: ${products.filter((p) => p.category === "tumby").length} },
  { slug: "tumby-tv", name: "Тумбы под ТВ", count: ${products.filter((p) => p.category === "tumby-tv").length} },
  { slug: "shkafy", name: "Шкафы и буфеты", count: ${products.filter((p) => p.category === "shkafy").length} },
  { slug: "pufy", name: "Пуфы и банкетки", count: ${products.filter((p) => p.category === "pufy").length} },
  { slug: "zerkala", name: "Зеркала", count: ${products.filter((p) => p.category === "zerkala").length} },
  { slug: "sadovaya-mebel", name: "Садовая мебель", count: ${products.filter((p) => p.category === "sadovaya-mebel").length} },
];

// Вспомогательные функции
export function getProductsByCategory(categorySlug: string): Product[] {
  return importedProducts.filter((p) => p.category === categorySlug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return importedProducts.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return importedProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  );
}
`;

fs.writeFileSync(inputPath, header);
console.log(`\n✅ Файл обновлён: ${inputPath}`);
