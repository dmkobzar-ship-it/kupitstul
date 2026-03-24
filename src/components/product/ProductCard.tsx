"use client";

import { ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";
import Link from "next/link"; // Добавьте этот импорт

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    inStock: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const discount =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : null;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* ... существующий код скидок и избранного ... */}
      {discount && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
          -{discount}%
        </div>
      )}

      <button
        onClick={(e) => {
          e.preventDefault(); // Предотвращаем переход по ссылке
          e.stopPropagation();
          setIsFavorite(!isFavorite);
        }}
        aria-label={
          isFavorite
            ? `Убрать ${product.name} из избранного`
            : `Добавить ${product.name} в избранное`
        }
        className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-50"
      >
        <Heart
          className={`w-5 h-5 ${
            isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
          }`}
        />
      </button>

      {/* ОБНОВЛЕНИЕ: Оберните основное содержимое в Link */}
      <Link href={`/product/${product.id}`}>
        {/* Изображение товара */}
        <div className="relative h-64 w-full bg-gray-200 overflow-hidden cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400">Изображение товара</span>
          </div>
        </div>

        {/* Контент карточки */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-bold">
              {product.price.toLocaleString()} ₽
            </span>
            {product.originalPrice && (
              <span className="text-gray-400 line-through">
                {product.originalPrice.toLocaleString()} ₽
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                product.inStock ? "text-green-600" : "text-red-600"
              }`}
            >
              {product.inStock ? "В наличии" : "Нет в наличии"}
            </span>

            <button
              onClick={(e) => {
                e.preventDefault(); // Предотвращаем переход по ссылке
                e.stopPropagation();
                // Здесь будет логика добавления в корзину
              }}
              disabled={!product.inStock}
              aria-label={`Добавить ${product.name} в корзину`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>В корзину</span>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
