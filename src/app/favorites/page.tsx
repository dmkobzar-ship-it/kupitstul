"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Check, Trash2, BarChart2, X } from "lucide-react";
import { useFavorites } from "@/components/cart/FavoritesProvider";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/types/product";

export default function FavoritesPage() {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    );
  };

  const compareProducts = favorites.filter((p) => compareIds.includes(p.id));

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-24 px-4">
          <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Избранное пусто</h1>
          <p className="text-gray-500 mb-8">
            Добавляйте товары в избранное, нажав ❤ на карточке товара
          </p>
          <Link
            href="/catalog"
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Избранное</h1>
            <p className="text-gray-500">{favorites.length} товаров</p>
          </div>
          <div className="flex items-center gap-3">
            {compareIds.length >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <BarChart2 className="w-4 h-4" />
                Сравнить ({compareIds.length})
              </button>
            )}
            <button
              onClick={clearFavorites}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Очистить всё
            </button>
          </div>
        </div>

        {/* Compare hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <BarChart2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 text-sm">
            Отметьте 2–4 товара галочкой для сравнения параметров. Выбрано:{" "}
            <strong>{compareIds.length}</strong> / 4
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {favorites.map((product) => {
            const inCart = isInCart(product.id);
            const inCompare = compareIds.includes(product.id);

            return (
              <div
                key={product.id}
                className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Compare checkbox */}
                <button
                  onClick={() => toggleCompare(product.id)}
                  title="Добавить к сравнению"
                  className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                    inCompare
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white/90 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {inCompare && <Check className="w-4 h-4" />}
                </button>

                {/* Remove favorite */}
                <button
                  onClick={() => toggleFavorite(product)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                {/* Image */}
                <Link href={`/catalog/product/${product.slug}`}>
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={
                        product.images?.[0] ||
                        `https://picsum.photos/seed/${product.id}/400/400`
                      }
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://picsum.photos/seed/${product.id}/400/400`;
                      }}
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1 capitalize">
                    {product.category}
                  </p>
                  <Link href={`/catalog/product/${product.slug}`}>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-3 hover:text-[var(--color-accent)] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base font-bold">
                      {product.price.toLocaleString("ru-RU")} ₽
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.oldPrice.toLocaleString("ru-RU")} ₽
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      addToCart({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        oldPrice: product.oldPrice,
                        image: product.images?.[0],
                        slug: product.slug,
                      })
                    }
                    className={`w-full py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      inCart
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4" /> В корзине
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" /> В корзину
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compare Modal */}
      {showCompare && compareProducts.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold">Сравнение товаров</h2>
              <button
                onClick={() => setShowCompare(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 rounded-tl-lg w-36 font-medium text-gray-500 text-sm">
                      Параметр
                    </th>
                    {compareProducts.map((p) => (
                      <th
                        key={p.id}
                        className="p-3 bg-gray-50 text-center min-w-[180px]"
                      >
                        <div className="relative w-20 h-20 mx-auto mb-2 rounded-xl overflow-hidden">
                          <Image
                            src={
                              p.images?.[0] ||
                              `https://picsum.photos/seed/${p.id}/400/400`
                            }
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                `https://picsum.photos/seed/${p.id}/400/400`;
                            }}
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {p.name}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      {
                        key: "price",
                        label: "Цена",
                        render: (p: Product) =>
                          `${p.price.toLocaleString("ru-RU")} ₽`,
                      },
                      {
                        key: "category",
                        label: "Категория",
                        render: (p: Product) => p.category,
                      },
                      {
                        key: "material",
                        label: "Материал",
                        render: (p: Product) =>
                          p.specifications?.material || p.materials?.[0] || "—",
                      },
                      {
                        key: "width",
                        label: "Ширина",
                        render: (p: Product) =>
                          p.specifications?.width
                            ? `${p.specifications.width} см`
                            : "—",
                      },
                      {
                        key: "height",
                        label: "Высота",
                        render: (p: Product) =>
                          p.specifications?.height
                            ? `${p.specifications.height} см`
                            : "—",
                      },
                      {
                        key: "depth",
                        label: "Глубина",
                        render: (p: Product) =>
                          p.specifications?.depth
                            ? `${p.specifications.depth} см`
                            : "—",
                      },
                      {
                        key: "inStock",
                        label: "Наличие",
                        render: (p: Product) =>
                          p.inStock ? "✅ В наличии" : "❌ Нет в наличии",
                      },
                      {
                        key: "rating",
                        label: "Рейтинг",
                        render: (p: Product) =>
                          p.rating ? `⭐ ${p.rating}` : "—",
                      },
                    ] as {
                      key: string;
                      label: string;
                      render: (p: Product) => string;
                    }[]
                  ).map(({ key, label, render }) => (
                    <tr key={key} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-600 text-sm">
                        {label}
                      </td>
                      {compareProducts.map((p) => (
                        <td
                          key={p.id}
                          className="p-3 text-center text-sm text-gray-800"
                        >
                          {render(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add to cart row */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <div className="w-36" />
                {compareProducts.map((p) => (
                  <div key={p.id} className="flex-1 text-center min-w-[180px]">
                    <button
                      onClick={() =>
                        addToCart({
                          productId: p.id,
                          name: p.name,
                          price: p.price,
                          image: p.images?.[0],
                          slug: p.slug,
                        })
                      }
                      className="w-full bg-gray-900 text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />В корзину
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
