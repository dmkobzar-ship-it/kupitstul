"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";

interface InfiniteProductGridProps {
  products: Product[];
  initialCount?: number;
  loadMoreCount?: number;
}

export default function InfiniteProductGrid({
  products,
  initialCount = 24,
  loadMoreCount = 12,
}: InfiniteProductGridProps) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const displayedProducts = products.slice(0, displayCount);
  const hasMore = displayCount < products.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    // Небольшая задержка для плавности
    setTimeout(() => {
      setDisplayCount((prev) =>
        Math.min(prev + loadMoreCount, products.length),
      );
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore, loadMoreCount, products.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  return (
    <>
      {/* Сетка товаров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayedProducts.map((product) => (
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
              onClick={loadMore}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Показать ещё ({products.length - displayCount} товаров)
            </button>
          )}
        </div>
      )}

      {/* Показано товаров */}
      <div className="text-center text-gray-500 text-sm mt-4">
        Показано {displayedProducts.length} из {products.length} товаров
      </div>
    </>
  );
}
