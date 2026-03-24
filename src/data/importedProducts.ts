// Автоматически импортировано из Avito Excel
// Данные читаются из products.json (не бандлятся в клиентский JS)
// Для обновления данных: node scripts/importAvito1002.js

import "server-only";
import * as fs from "fs";
import * as path from "path";

// Re-export types for server components that need them
export type { Product, ImportedCategory } from "@/types/product";
import type { Product, ImportedCategory } from "@/types/product";

// Read from JSON file at server runtime — NOT cached at module level
// Each call reads fresh from disk so admin edits appear immediately
function loadData(): { products: Product[]; categories: ImportedCategory[] } {
  try {
    const jsonPath = path.join(process.cwd(), "src", "data", "products.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("[importedProducts] Failed to load products.json:", e);
    return { products: [], categories: [] };
  }
}

// Getter functions — always read fresh from disk on each call
export function getImportedProducts(): Product[] {
  return loadData().products;
}

export function getImportedCategories(): ImportedCategory[] {
  const cats = loadData().categories;
  // Порядок: Стулья первые, Барные стулья вторые, остальные как есть
  const order: Record<string, number> = { stulya: 0, "barnye-stulya": 1 };
  return [...cats].sort((a, b) => {
    const oa = order[a.slug] ?? 100;
    const ob = order[b.slug] ?? 100;
    if (oa !== ob) return oa - ob;
    return 0; // сохраняем исходный порядок для остальных
  });
}

// Хелперы для работы с данными
export function getProductsByCategory(category: string): Product[] {
  let products = getImportedProducts().filter((p) => p.category === category);
  // В категории «Барные стулья» показываем только товары со словом «барн» в названии
  if (category === "barnye-stulya") {
    products = products.filter((p) => /барн/i.test(p.name));
  }
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getImportedProducts().find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return getImportedCategories().find((c) => c.slug === slug);
}

export function getAllCategories() {
  return getImportedCategories();
}
