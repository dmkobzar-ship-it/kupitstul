"use client";

import { useState, useMemo, useCallback } from "react";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import FilterPanel, { FilterValues, defaultFilters } from "./FilterPanel";
import InfiniteProductGrid from "./InfiniteProductGrid";
import type { Product } from "@/types/product";

interface FilteredCatalogProps {
  products: Product[];
  initialCount?: number;
}

export default function FilteredCatalog({
  products,
  initialCount = 24,
}: FilteredCatalogProps) {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Find max price in products for slider
  const maxPrice = useMemo(() => {
    const max = Math.max(...products.map((p) => p.price), 0);
    return Math.ceil(max / 10000) * 10000; // round up to nearest 10k
  }, [products]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Price filter
    if (filters.priceMin > 0) {
      result = result.filter((p) => p.price >= filters.priceMin);
    }
    if (filters.priceMax < maxPrice) {
      result = result.filter((p) => p.price <= filters.priceMax);
    }

    // Material filter — check materials array, specifications, and description
    if (filters.materials.length > 0) {
      result = result.filter((p) => {
        const specMat = p.specifications?.material?.toLowerCase() || "";
        const seatMat = p.specifications?.seatMaterial?.toLowerCase() || "";
        const materialsArr = (p.materials || []).map((m) => m.toLowerCase());
        const descLower = (p.description || "").toLowerCase();
        const nameLower = p.name.toLowerCase();
        return filters.materials.some((fm) => {
          const fml = fm.toLowerCase();
          return (
            specMat.includes(fml) ||
            seatMat.includes(fml) ||
            materialsArr.some((m) => m.includes(fml)) ||
            descLower.includes(fml) ||
            nameLower.includes(fml)
          );
        });
      });
    }

    // Color filter — check colors array, product name, and description
    if (filters.colors.length > 0) {
      result = result.filter((p) => {
        const nameLower = p.name.toLowerCase();
        const descLower = (p.description || "").toLowerCase();
        const productColors = (p.colors || []).map((c) => c.name.toLowerCase());
        return filters.colors.some((fc) => {
          const fcl = fc.toLowerCase();
          return (
            nameLower.includes(fcl) ||
            descLower.includes(fcl) ||
            productColors.some((pc) => pc.includes(fcl))
          );
        });
      });
    }

    // Stock filter
    if (filters.inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // Sorting
    switch (filters.sortBy) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = [...result].sort((a, b) => {
          const rA =
            typeof a.rating === "string" ? parseFloat(a.rating) : a.rating || 0;
          const rB =
            typeof b.rating === "string" ? parseFloat(b.rating) : b.rating || 0;
          return rB - rA;
        });
        break;
      case "new":
        result = [...result].sort((a, b) => {
          const aNew = a.badges?.includes("Новинка") ? 1 : 0;
          const bNew = b.badges?.includes("Новинка") ? 1 : 0;
          return bNew - aNew;
        });
        break;
      case "popular":
      default:
        // Already sorted by popularity by default (order from source)
        break;
    }

    return result;
  }, [products, filters, maxPrice]);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback(
    (sortBy: string) => {
      const newFilters = { ...filters, sortBy };
      setFilters(newFilters);
    },
    [filters],
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
              Найдено:{" "}
              <strong className="text-gray-900">
                {filteredProducts.length}
              </strong>{" "}
              {filteredProducts.length !== products.length && (
                <span className="text-gray-400">из {products.length}</span>
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

        {/* Product grid or empty state */}
        {filteredProducts.length > 0 ? (
          <InfiniteProductGrid
            products={filteredProducts}
            initialCount={initialCount}
            loadMoreCount={12}
          />
        ) : (
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
        )}
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
