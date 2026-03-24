"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Корзина пуста</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Добавьте товары из каталога, чтобы оформить заказ
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const formatPrice = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

  return (
    <div className="container py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Главная
        </Link>
        <span>/</span>
        <span className="text-gray-900">Корзина</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          Корзина{" "}
          <span className="text-white text-xl font-normal">
            ({getTotalItems()} шт.)
          </span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Очистить корзину
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items list */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4"
            >
              {/* Image */}
              <Link
                href={`/catalog/product/${item.slug}`}
                className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/catalog/product/${item.slug}`}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                >
                  {item.name}
                </Link>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(item.price)} ₽
                  </span>
                  {item.oldPrice && item.oldPrice > item.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(item.oldPrice)} ₽
                    </span>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg text-[#374151]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-1 text-sm font-medium min-w-[40px] text-center text-[#374151]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg text-[#374151]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="ml-auto font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)} ₽
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-96">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ваш заказ</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Товары ({getTotalItems()} шт.)</span>
                <span>{formatPrice(getTotalPrice())} ₽</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span className="text-[#374151]">Рассчитать</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-black">Итого</span>
                <span className="text-lg font-bold text-black">
                  {formatPrice(getTotalPrice())} ₽
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-gray-900 text-white text-center py-3.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Оформить заказ
            </Link>

            <Link
              href="/catalog"
              className="block w-full text-center mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
