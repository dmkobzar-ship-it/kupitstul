// Автоматически импортировано из Avito Excel
// Данные читаются из products.json (не бандлятся в клиентский JS)
// Для обновления данных: node scripts/importAvito1002.js

import "server-only";
import * as fs from "fs";
import * as path from "path";

// Re-export types for server components that need them
export type { Product, ImportedCategory } from "@/types/product";
import type { Product, ImportedCategory } from "@/types/product";

// Read from JSON file at server runtime — cached for 60 seconds
// Admin edits appear within a minute (no full rebuild needed)
let _cache: { products: Product[]; categories: ImportedCategory[] } | null =
  null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

function loadData(): { products: Product[]; categories: ImportedCategory[] } {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) {
    return _cache;
  }
  try {
    const jsonPath = path.join(process.cwd(), "src", "data", "products.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    _cache = JSON.parse(raw);
    _cacheTime = now;
    return _cache!;
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
  // Объединяем barnye-stulya в stulya — показываем одну категорию «Стулья»
  const stulyaCat = cats.find((c) => c.slug === "stulya");
  const barnyeCat = cats.find((c) => c.slug === "barnye-stulya");
  const merged = cats
    .filter((c) => c.slug !== "barnye-stulya")
    .map((c) => {
      if (c.slug === "stulya" && barnyeCat) {
        return { ...c, count: c.count + barnyeCat.count };
      }
      return c;
    });
  // Стулья первые, остальные как есть
  return [...merged].sort((a, b) => {
    if (a.slug === "stulya") return -1;
    if (b.slug === "stulya") return 1;
    return 0;
  });
}

// Хелперы для работы с данными
export function getProductsByCategory(category: string): Product[] {
  const all = getImportedProducts();
  // В категории «Стулья» показываем все стулья включая барные
  if (category === "stulya") {
    return all.filter(
      (p) => p.category === "stulya" || p.category === "barnye-stulya",
    );
  }
  return all.filter((p) => p.category === category);
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
