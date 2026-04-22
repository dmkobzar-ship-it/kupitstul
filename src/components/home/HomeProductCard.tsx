"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useFavorites } from "@/components/cart/FavoritesProvider";
import { useCart } from "@/components/cart/CartProvider";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  images: string[];
  badges?: string[];
  inStock?: boolean;
}

interface HomeProductCardProps {
  product: Product;
}

export default function HomeProductCard({ product }: HomeProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isFav = isFavorite(product.id);

  const imageSrc =
    imageError || !product.images?.[0]
      ? `https://picsum.photos/seed/${product.id}/400/400`
      : product.images[0];

  return (
    <Link
      href={`/catalog/product/${product.slug}`}
      className="product-card group"
    >
      <div className={`product-image${imageSrc.includes("avito") ? " avito-badge" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        {/* Favorites button */}}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              images: product.images,
              category: "",
              categoryName: "",
              sku: "",
              inStock: product.inStock ?? true,
            });
          }}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
            isFav
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"
          }`}
          aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
        </button>
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`badge ${product.badges[0] === "Sale" ? "badge-sale" : product.badges[0] === "New" ? "badge-new" : "badge-hit"}`}
            >
              {product.badges[0]}
            </span>
          </div>
        )}
        {product.oldPrice && product.oldPrice > product.price && (
          <div className="absolute top-13 right-3 z-10">
            <span className="badge badge-sale">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="price">
            {product.price.toLocaleString("ru-RU")} ₽
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="price-old">
              {product.oldPrice.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-green-600">
            {product.inStock ? "В наличии" : "Под заказ"}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart({
                productId: product.id,
                name: product.name,
                price: product.price,
                oldPrice: product.oldPrice,
                image: product.images?.[0],
                slug: product.slug,
              });
              setAddedToCart(true);
              setTimeout(() => setAddedToCart(false), 1500);
            }}
            className={`opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1 ${
              addedToCart
                ? "bg-green-500 text-white opacity-100"
                : "bg-[var(--color-primary)] text-white"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {addedToCart ? "Добавлено" : "В корзину"}
          </button>
        </div>
      </div>
    </Link>
  );
}
