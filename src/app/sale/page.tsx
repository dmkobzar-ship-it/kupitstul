import type { Metadata } from "next";
import { getImportedProducts } from "@/data/importedProducts";
import SaleClient from "./SaleClient";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Распродажа — скидки на мебель | КупитьСтул",
  description:
    "Скидки 5% на мебель. Стулья, столы, кресла по выгодным ценам. Ограниченное количество!",
};

export const dynamic = "force-dynamic";

function getSaleProducts(count: number) {
  // Select expensive products (15000+) from diverse categories, shuffled
  const allProducts = getImportedProducts();
  const expensive = allProducts.filter((p) => p.price >= 15000);

  // Group by category, then interleave for mix
  const byCategory: Record<string, typeof allProducts> = {};
  expensive.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  // Shuffle within each category using day seed
  const dayIndex = Math.floor(Date.now() / 86400000);
  const seededShuffle = (arr: typeof allProducts, seed: number) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = ((seed * (i + 1) * 2654435761) >>> 0) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const catKeys = Object.keys(byCategory);
  const shuffledCats = catKeys.map((k) =>
    seededShuffle(byCategory[k], dayIndex),
  );

  // Round-robin interleave
  const result: typeof allProducts = [];
  let idx = 0;
  while (result.length < count) {
    let added = false;
    for (const cat of shuffledCats) {
      if (idx < cat.length) {
        result.push(cat[idx]);
        added = true;
        if (result.length >= count) break;
      }
    }
    if (!added) break;
    idx++;
  }

  return result;
}

export default function SalePage() {
  const products = getSaleProducts(60);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white py-16">
        <div className="container">
          <div className="flex items-center gap-2 text-red-200 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Главная
            </Link>
            <span>/</span>
            <span>Распродажа</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Распродажа — скидка 5%
          </h1>
          <p className="text-red-100 text-lg max-w-2xl">
            Успейте купить мебель по выгодным ценам! Скидка 5% на избранные
            товары.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              🔥 Скидка 5%
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              📦 Быстрая доставка
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              🛍 {products.length} товаров
            </span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container py-10">
        <SaleClient products={products} />
      </div>
    </div>
  );
}
