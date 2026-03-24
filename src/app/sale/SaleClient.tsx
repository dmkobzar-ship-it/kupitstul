"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Check } from "lucide-react";
import type { Product } from "@/types/product";
import { useCart } from "@/components/cart/CartProvider";
import { useFavorites } from "@/components/cart/FavoritesProvider";

const DISCOUNT = 5;

interface SaleCardProps {
  product: Product;
}

function SaleCard({ product }: SaleCardProps) {
  const { addToCart, isInCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const originalPrice = product.price;
  const salePrice = Math.round(originalPrice * (1 - DISCOUNT / 100));
  const inCart = isInCart(product.id);
  const fav = isFavorite(product.id);

  const imageUrl =
    !imageError && product.images?.[0]
      ? product.images[0]
      : `https://picsum.photos/seed/${product.id}/400/400`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      productId: product.id,
      name: product.name,
      price: salePrice,
      oldPrice: originalPrice,
      image: product.images?.[0],
      slug: product.slug,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Link href={`/catalog/product/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Sale badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              -{DISCOUNT}%
            </span>
          </div>
          {/* Favorite */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(product);
            }}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 shadow-sm ${
              fav
                ? "bg-red-50 text-red-500"
                : "bg-white/90 text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-1 capitalize">
            {product.category}
          </p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-3 group-hover:text-[var(--color-accent)] transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {salePrice.toLocaleString("ru-RU")} ₽
            </span>
            <span className="text-sm text-gray-400 line-through">
              {originalPrice.toLocaleString("ru-RU")} ₽
            </span>
            <span className="text-xs text-red-500 font-medium">
              -{DISCOUNT}%
            </span>
          </div>

          {/* Cart button */}
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              inCart || justAdded
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" /> Добавлено!
              </>
            ) : inCart ? (
              <>
                <Check className="w-4 h-4" /> В корзине
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> В корзину
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

interface SaleClientProps {
  products: Product[];
}

export default function SaleClient({ products }: SaleClientProps) {
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc">(
    "popular",
  );

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    return 0;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">{products.length} товаров со скидкой</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="premium-input text-sm px-4 py-2 w-auto rounded-xl border border-gray-200"
        >
          <option value="popular">По популярности</option>
          <option value="price-asc">Сначала дешевле</option>
          <option value="price-desc">Сначала дороже</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {sorted.map((product) => (
          <SaleCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
