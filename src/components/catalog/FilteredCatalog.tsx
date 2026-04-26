"use client";

import { useState, useCallback } from "react";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import FilterPanel, { FilterValues, defaultFilters } from "./FilterPanel";
import InfiniteProductGrid from "./InfiniteProductGrid";
import type { Product } from "@/types/product";

interface ServerFilters {
  room?: string;
  style?: string;
  q?: string;
}

interface FilteredCatalogProps {
  initialProducts: Product[];
  totalCount: number;
  maxPrice: number;
  serverFilters?: ServerFilters;
}

async function fetchCatalogPage(
  filters: FilterValues,
  serverFilters: ServerFilters,
  page: number,
  maxPrice: number,
): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "24",
    sortBy: filters.sortBy,
  });
  if (serverFilters.room) params.set("room", serverFilters.room);
  if (serverFilters.style) params.set("style", serverFilters.style);
  if (serverFilters.q) params.set("q", serverFilters.q);
  if (filters.priceMin > 0) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax < maxPrice)
    params.set("priceMax", String(filters.priceMax));
  if (filters.materials.length > 0)
    params.set("materials", filters.materials.join(","));
  if (filters.colors.length > 0) params.set("colors", filters.colors.join(","));
  if (filters.inStockOnly) params.set("inStockOnly", "true");

  const res = await fetch(`/api/catalog/products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default function FilteredCatalog({
  initialProducts,
  totalCount,
  maxPrice,
  serverFilters = {},
}: FilteredCatalogProps) {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(totalCount);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const applyFilters = useCallback(
    async (newFilters: FilterValues) => {
      setFilters(newFilters);
      setIsLoading(true);
      try {
        const result = await fetchCatalogPage(
          newFilters,
          serverFilters,
          1,
          maxPrice,
        );
        setProducts(result.products);
        setTotal(result.total);
        setPage(1);
        setHasMore(result.hasMore);
      } catch (e) {
        console.error("Filter fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [serverFilters, maxPrice],
  );

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await fetchCatalogPage(
        filters,
        serverFilters,
        nextPage,
        maxPrice,
      );
      setProducts((prev) => [...prev, ...result.products]);
      setTotal(result.total);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error("Load more error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, filters, serverFilters, maxPrice]);

  const handleFilterChange = useCallback(
    (newFilters: FilterValues) => {
      applyFilters(newFilters);
    },
    [applyFilters],
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      applyFilters({ ...filters, sortBy });
    },
    [filters, applyFilters],
  );

  const activeFilterCount =
    filters.materials.length +
    filters.colors.length +
    (filters.priceMin > 0 ? 1 : 0) +
    (filters.priceMax < maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Сайдбар — Desktop */}
      <aside className="hidden lg:block lg:w-72 flex-shrink-0">
        <div className="sticky top-24">
          <FilterPanel
            onFilterChange={handleFilterChange}
            maxPrice={maxPrice}
          />
        </div>
      </aside>

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Фильтры</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel
              onFilterChange={(f) => {
                handleFilterChange(f);
                setIsMobileFilterOpen(false);
              }}
              maxPrice={maxPrice}
            />
          </div>
        </div>
      )}

      {/* Каталог товаров */}
      <div className="flex-1 min-w-0">
        {/* Toolbar: сортировка + мобильный фильтр */}
        <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 lg:hidden text-gray-700 hover:text-gray-900 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Фильтры</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span className="text-gray-500 text-sm">
              Найдено: <strong className="text-gray-900">{total}</strong>{" "}
              {total !== totalCount && (
                <span className="text-gray-400">из {totalCount}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="popular">По популярности</option>
              <option value="price-asc">Сначала дешёвые</option>
              <option value="price-desc">Сначала дорогие</option>
              <option value="rating">По рейтингу</option>
              <option value="new">Новинки</option>
            </select>
          </div>
        </div>

        {/* Active filter tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.priceMin > 0 && (
              <FilterTag
                label={`от ${filters.priceMin.toLocaleString("ru-RU")} ₽`}
                onRemove={() => handleFilterChange({ ...filters, priceMin: 0 })}
              />
            )}
            {filters.priceMax < maxPrice && (
              <FilterTag
                label={`до ${filters.priceMax.toLocaleString("ru-RU")} ₽`}
                onRemove={() =>
                  handleFilterChange({ ...filters, priceMax: maxPrice })
                }
              />
            )}
            {filters.materials.map((m) => (
              <FilterTag
                key={m}
                label={m}
                onRemove={() =>
                  handleFilterChange({
                    ...filters,
                    materials: filters.materials.filter((x) => x !== m),
                  })
                }
              />
            ))}
            {filters.colors.map((c) => (
              <FilterTag
                key={c}
                label={c}
                onRemove={() =>
                  handleFilterChange({
                    ...filters,
                    colors: filters.colors.filter((x) => x !== c),
                  })
                }
              />
            ))}
            {filters.inStockOnly && (
              <FilterTag
                label="В наличии"
                onRemove={() =>
                  handleFilterChange({ ...filters, inStockOnly: false })
                }
              />
            )}
            <button
              onClick={() => handleFilterChange(defaultFilters)}
              className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1"
            >
              Сбросить все
            </button>
          </div>
        )}

        {/* Loading overlay when re-filtering */}
        {isLoading && products.length === 0 && (
          <div className="flex justify-center items-center py-24">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              <span className="text-gray-500">Загрузка...</span>
            </div>
          </div>
        )}

        {/* Product grid or empty state */}
        {!isLoading && products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Ничего не найдено
            </h2>
            <p className="text-gray-500 mb-6">
              Попробуйте изменить параметры фильтрации
            </p>
            <button
              onClick={() => handleFilterChange(defaultFilters)}
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : products.length > 0 ? (
          <InfiniteProductGrid
            products={products}
            total={total}
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={loadMore}
          />
        ) : null}
      </div>
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-red-500 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
