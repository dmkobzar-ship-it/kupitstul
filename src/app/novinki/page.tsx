import type { Metadata } from "next";
import { getImportedProducts } from "@/data/importedProducts";
import ProductCard from "@/components/catalog/ProductCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Новинки | КупитьСтул",
  description:
    "Новые поступления мебели. Свежие коллекции стульев, столов и кресел с доставкой по России.",
};

export const dynamic = "force-dynamic";

function getDailyProducts(count: number) {
  // Rotate daily: different slice each day
  const products = getImportedProducts();
  const dayIndex = Math.floor(Date.now() / 86400000);
  const total = products.length;
  const stride = Math.max(1, Math.floor(total / count));
  const offset = dayIndex % stride;
  const result: ReturnType<typeof getImportedProducts> = [];
  for (let i = offset; i < total && result.length < count; i += stride) {
    result.push(products[i]);
  }
  return result;
}

export default function NovinkiPage() {
  const products = getDailyProducts(48);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Главная
            </Link>
            <span>/</span>
            <span>Новинки</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Новинки</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Свежие поступления — обновляется ежедневно. Первыми узнавайте о
            новых коллекциях!
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              🆕 {products.length} новых товаров
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              📦 Быстрая доставка
            </span>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="container py-10 mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
          >
            Весь каталог →
          </Link>
        </div>
      </div>
    </div>
  );
}
