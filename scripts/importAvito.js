// Скрипт для импорта товаров из Avito Excel
const XLSX = require("xlsx");
const fs = require("fs");

// Читаем Excel
const wb = XLSX.readFile(
  "./data/avito_chairs_red-black_ready_v4 (1) на выгрузку.xlsx"
);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log("Всего строк в файле:", data.length);

// Маппинг колонок
const COL = {
  id: 0,
  name: 5,
  desc: 6,
  price: 7,
  images: 8,
  category: 11,
  productType: 25,
  chairType: 26,
  seatMat: 27,
  baseMat: 28,
  color: 21,
  colorName: 22,
  availability: 20,
  multiName: 24,
  features: 32,
  boxL: 34,
  boxW: 35,
  boxH: 36,
  weight: 37,
};

// Транслитерация
function translit(text) {
  const map = {
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
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] || c)
    .join("")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Цвета HEX
const colorHex = {
  белый: "#ffffff",
  чёрный: "#1a1a1a",
  черный: "#1a1a1a",
  серый: "#9ca3af",
  бежевый: "#d4a574",
  коричневый: "#78350f",
  махагон: "#6b2c23",
  венге: "#3d2b1f",
  орех: "#5c4033",
  дуб: "#a0826d",
  бордо: "#881337",
  слоновая: "#fffff0",
};

function getHex(c) {
  const lower = (c || "").toLowerCase();
  for (let k in colorHex) {
    if (lower.includes(k)) return colorHex[k];
  }
  return "#9ca3af";
}

// Категории
function mapCat(type, subType) {
  const t = (type || "").toLowerCase();
  const s = (subType || "").toLowerCase();
  if (t.includes("стул")) {
    if (s.includes("барн")) return "barnye-stulya";
    return "stulya";
  }
  if (t.includes("стол")) return "stoly";
  if (t.includes("кресл")) return "kresla";
  return "stulya";
}

const products = [];

// Пропускаем 3 служебные строки, берём все товары
for (let i = 3; i < data.length; i++) {
  const row = data[i];
  if (!row || !row[COL.name]) continue;

  const name = row[COL.name] || "";
  const desc = (row[COL.desc] || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/[✨💯❤️‍🔥🌿✔📌🔥📐🚚⏳🤝✅🛒🔎#]/g, "")
    .substring(0, 800);
  const price = parseFloat(row[COL.price]) || 0;
  const imgs = (row[COL.images] || "")
    .split("|")
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http") && !u.includes("#"))
    .slice(0, 5);
  const color = row[COL.colorName] || row[COL.color] || "";
  const category = mapCat(row[COL.productType], row[COL.chairType]);

  products.push({
    id: row[COL.id] || `avito-${i}`,
    name: name,
    slug: translit(name.substring(0, 60)) + "-" + i,
    description: desc,
    price: price,
    category: category,
    images: imgs.length ? imgs : ["/placeholder.jpg"],
    inStock: (row[COL.availability] || "").toLowerCase().includes("наличии"),
    specifications: {
      width: parseFloat(row[COL.boxW]) || null,
      height: parseFloat(row[COL.boxH]) || null,
      depth: parseFloat(row[COL.boxL]) || null,
      weight: parseFloat(row[COL.weight]) || null,
      material: row[COL.baseMat] || "",
      seatMaterial: row[COL.seatMat] || "",
    },
    colors: color ? [{ name: color, hex: getHex(color) }] : [],
    materials: [row[COL.seatMat], row[COL.baseMat]].filter(Boolean),
    rating: (4.5 + Math.random() * 0.5).toFixed(1),
    reviewsCount: Math.floor(Math.random() * 50) + 5,
    badges: i < 13 ? ["Хит"] : i < 20 ? ["New"] : [],
  });
}

console.log("Импортировано товаров:", products.length);
console.log("Первые 3 товара:");
products.slice(0, 3).forEach((p, i) => {
  console.log(
    `  ${i + 1}. ${p.name} - ${p.price} руб - ${p.images.length} фото`
  );
});

// Формируем TypeScript файл
const tsContent = `// Автоматически импортировано из Avito Excel
// Дата импорта: ${new Date().toISOString()}
// Товаров: ${products.length}

import { Product } from "@/types";

export const importedProducts: Product[] = ${JSON.stringify(products, null, 2)};

// Категории на основе импортированных товаров
export const importedCategories = [
  { slug: "stulya", name: "Стулья", count: ${products.filter((p) => p.category === "stulya").length} },
  { slug: "barnye-stulya", name: "Барные стулья", count: ${products.filter((p) => p.category === "barnye-stulya").length} },
  { slug: "stoly", name: "Столы", count: ${products.filter((p) => p.category === "stoly").length} },
  { slug: "kresla", name: "Кресла", count: ${products.filter((p) => p.category === "kresla").length} },
];

// Вспомогательные функции
export function getProductsByCategory(category: string): Product[] {
  return importedProducts.filter(p => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return importedProducts.find(p => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return importedProducts.find(p => p.id === id);
}
`;

fs.writeFileSync("./src/data/importedProducts.ts", tsContent);
console.log("\n✅ Файл сохранён: src/data/importedProducts.ts");

// Статистика по категориям
console.log("\nСтатистика по категориям:");
const cats = {};
products.forEach((p) => {
  cats[p.category] = (cats[p.category] || 0) + 1;
});
Object.entries(cats).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});
