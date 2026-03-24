"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useFavorites } from "@/components/cart/FavoritesProvider";

interface ProductActionsProps {
  productId: string;
  productName: string;
  price: number;
  oldPrice?: number;
  image?: string;
  slug: string;
  category?: string;
}

export default function ProductActions({
  productId,
  productName,
  price,
  oldPrice,
  image,
  slug,
  category,
}: ProductActionsProps) {
  const { addToCart, isInCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const alreadyInCart = isInCart(productId);
  const isProductFavorite = isFavorite(productId);

  const handleAddToCart = () => {
    setIsAdding(true);
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId,
        name: productName,
        price,
        oldPrice,
        image: image || "",
        slug,
      });
    }
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      id: productId,
      name: productName,
      slug,
      price,
      oldPrice,
      category: category || "",
      images: image ? [image] : [],
      inStock: true,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center border border-gray-200 rounded-xl">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="flex-1 py-3 px-6 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {justAdded || alreadyInCart ? (
          <Check className="w-5 h-5" />
        ) : (
          <ShoppingCart className="w-5 h-5" />
        )}
        {isAdding
          ? "Добавляем..."
          : justAdded
            ? "Добавлено!"
            : alreadyInCart
              ? "Уже в корзине — добавить ещё"
              : "Добавить в корзину"}
      </button>
      <button
        onClick={handleToggleFavorite}
        className={`w-12 h-12 flex items-center justify-center border rounded-xl transition-colors ${
          isProductFavorite
            ? "border-red-500 text-red-500 bg-red-50"
            : "border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-500"
        }`}
      >
        <Heart
          className={`w-5 h-5 ${isProductFavorite ? "fill-current" : ""}`}
        />
      </button>
    </div>
  );
}
