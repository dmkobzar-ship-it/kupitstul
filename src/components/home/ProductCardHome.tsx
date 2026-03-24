"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductCardHomeProps {
  id: string;
  name: string;
  price: number;
}

export default function ProductCardHome({
  id,
  name,
  price,
}: ProductCardHomeProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);

    // Симуляция добавления в корзину
    setTimeout(() => {
      setIsAdding(false);
      console.log("Товар добавлен в корзину:", id);
    }, 500);
  };

  return (
    <Link
      href={`/product/${id}`}
      className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-shadow"
    >
      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
      <h3 className="font-semibold mb-2 hover:text-blue-600 transition-colors">
        {name}
      </h3>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold">{price.toLocaleString()} ₽</span>
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Добавление...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />В корзину
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
