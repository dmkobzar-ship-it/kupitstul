"use client";

import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Моковые данные товара
const mockProduct = {
  id: "1",
  name: "Стул Флекс Original",
  price: 14990,
  originalPrice: 16990,
  description:
    "Стильный обеденный стул для вашего интерьера. Эргономичная спинка, удобное сиденье, прочная конструкция.",
  images: ["/placeholder.jpg", "/placeholder.jpg", "/placeholder.jpg"],
  category: "Стулья",
  material: "Дерево, Ткань",
  color: "Серый",
  dimensions: { width: 50, height: 85, depth: 55 },
  inStock: true,
  stockCount: 15,
  tags: ["новинка", "дизайнерский", "бестселлер"],
};

export default function ProductPage() {
  const params = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const discount = mockProduct.originalPrice
    ? Math.round(
        ((mockProduct.originalPrice - mockProduct.price) /
          mockProduct.originalPrice) *
          100,
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Хлебные крошки */}
        <div className="mb-6">
          <Link
            href="/catalog"
            className="text-gray-500 hover:text-blue-600 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад в каталог
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Галерея изображений */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="relative h-96 w-full bg-gray-200 rounded-lg overflow-hidden">
                {/* Основное изображение */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">
                    Изображение товара
                  </span>
                </div>

                {discount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    -{discount}%
                  </div>
                )}
              </div>

              {/* Миниатюры */}
              <div className="flex gap-2 mt-4">
                {mockProduct.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 bg-gray-200 rounded-lg border-2 ${
                      selectedImage === index
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      Изобр. {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Информация о товаре */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold mb-2">{mockProduct.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {mockProduct.price.toLocaleString()} ₽
                  </span>
                  {mockProduct.originalPrice && (
                    <span className="text-gray-400 line-through">
                      {mockProduct.originalPrice.toLocaleString()} ₽
                    </span>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    mockProduct.inStock
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {mockProduct.inStock ? "В наличии" : "Нет в наличии"}
                </span>
              </div>

              {/* Описание */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Описание</h3>
                <p className="text-gray-600">{mockProduct.description}</p>
              </div>

              {/* Характеристики */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Характеристики</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-sm">Категория</p>
                    <p className="font-medium">{mockProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Материал</p>
                    <p className="font-medium">{mockProduct.material}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Цвет</p>
                    <p className="font-medium">{mockProduct.color}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Размеры (Ш×В×Г)</p>
                    <p className="font-medium">
                      {mockProduct.dimensions.width}×
                      {mockProduct.dimensions.height}×
                      {mockProduct.dimensions.depth} см
                    </p>
                  </div>
                </div>
              </div>

              {/* Количество и кнопки */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 w-16 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isFavorite
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={!mockProduct.inStock}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Добавить в корзину
                  </button>

                  <button className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 font-semibold">
                    Купить в 1 клик
                  </button>
                </div>
              </div>

              {/* Преимущества */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Быстрая доставка</p>
                </div>
                <div className="text-center">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Гарантия 1 год</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Возврат 14 дней</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
