"use client";

import { useEffect, useRef } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";

interface InfiniteProductGridProps {
  products: Product[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export default function InfiniteProductGrid({
  products,
  total,
  hasMore,
  isLoading,
  onLoadMore,
}: InfiniteProductGridProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading]);

  return (
    <>
      {/* Сетка товаров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Loader / Trigger для подгрузки */}
      {hasMore && (
        <div
          ref={loaderRef}
          className="flex justify-center items-center py-8 mt-6"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              <span className="text-gray-500">Загрузка товаров...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Показать ещё ({total - products.length} товаров)
            </button>
          )}
        </div>
      )}

      {/* Показано товаров */}
      <div className="text-center text-gray-500 text-sm mt-4">
        Показано {products.length} из {total} товаров
      </div>
    </>
  );
}
