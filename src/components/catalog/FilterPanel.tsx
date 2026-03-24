"use client";

import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

export interface FilterValues {
  priceMin: number;
  priceMax: number;
  materials: string[];
  colors: string[];
  inStockOnly: boolean;
  sortBy: string;
}

export const defaultFilters: FilterValues = {
  priceMin: 0,
  priceMax: 500000,
  materials: [],
  colors: [],
  inStockOnly: false,
  sortBy: "popular",
};

interface FilterPanelProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: Partial<FilterValues>;
  maxPrice?: number;
  className?: string;
}

export default function FilterPanel({
  onFilterChange,
  initialFilters,
  maxPrice = 500000,
  className = "",
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    materials: true,
    colors: true,
    stock: true,
  });

  const materials = [
    "Дерево",
    "Металл",
    "Пластик",
    "Ткань",
    "Кожа",
    "Экокожа",
    "Массив березы",
    "Бук",
    "Хром",
  ];
  const colors = [
    { name: "Белый", hex: "#ffffff" },
    { name: "Черный", hex: "#000000" },
    { name: "Серый", hex: "#9ca3af" },
    { name: "Коричневый", hex: "#5c4033" },
    { name: "Бежевый", hex: "#d4b896" },
    { name: "Венге", hex: "#3d2b1f" },
    { name: "Орех", hex: "#5c4033" },
    { name: "Дуб", hex: "#a0826d" },
  ];

  const activeFilterCount =
    filters.materials.length +
    filters.colors.length +
    (filters.priceMin > 0 ? 1 : 0) +
    (filters.priceMax < maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (update: Partial<FilterValues>) => {
    const newFilters = { ...filters, ...update };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleMaterial = (material: string) => {
    const materials = filters.materials.includes(material)
      ? filters.materials.filter((m) => m !== material)
      : [...filters.materials, material];
    updateFilter({ materials });
  };

  const toggleColor = (color: string) => {
    const colors = filters.colors.includes(color) ? [] : [color];
    updateFilter({ colors });
  };

  const clearFilters = () => {
    const cleared = { ...defaultFilters };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-bold text-lg">Фильтры</h3>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Сбросить
          </button>
        )}
      </div>

      {/* Цена */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between p-5"
        >
          <h4 className="font-semibold text-gray-900">Цена, ₽</h4>
          {expandedSections.price ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.price && (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={filters.priceMin || ""}
                onChange={(e) =>
                  updateFilter({ priceMin: Number(e.target.value) || 0 })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                placeholder="от 0"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                value={filters.priceMax < maxPrice ? filters.priceMax : ""}
                onChange={(e) =>
                  updateFilter({
                    priceMax: Number(e.target.value) || maxPrice,
                  })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                placeholder={`до ${maxPrice.toLocaleString("ru-RU")}`}
              />
            </div>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="1000"
              value={filters.priceMax}
              onChange={(e) =>
                updateFilter({ priceMax: Number(e.target.value) })
              }
              className="w-full mt-4 accent-orange-500"
            />
          </div>
        )}
      </div>

      {/* Материалы */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection("materials")}
          className="w-full flex items-center justify-between p-5"
        >
          <h4 className="font-semibold text-gray-900">Материал</h4>
          {expandedSections.materials ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.materials && (
          <div className="px-5 pb-5 space-y-2">
            {materials.map((material) => (
              <label
                key={material}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.materials.includes(material)}
                  onChange={() => toggleMaterial(material)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {material}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Цвета */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection("colors")}
          className="w-full flex items-center justify-between p-5"
        >
          <h4 className="font-semibold text-gray-900">Цвет</h4>
          {expandedSections.colors ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.colors && (
          <div className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => toggleColor(color.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    filters.colors.includes(color.name)
                      ? "ring-2 ring-orange-500 ring-offset-2 border-orange-400"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            {filters.colors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {filters.colors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                  >
                    {c}
                    <button
                      onClick={() => toggleColor(c)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Наличие */}
      <div className="p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => updateFilter({ inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
          />
          <span className="text-sm font-medium text-gray-700">
            Только в наличии
          </span>
        </label>
      </div>
    </div>
  );
}
