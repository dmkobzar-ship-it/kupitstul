"use client";

import {
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import type { Product } from "@/types/product";
import { useCart } from "@/components/cart/CartProvider";
import { useFavorites } from "@/components/cart/FavoritesProvider";

// Маппинг категорий на русские названия
const categoryNames: Record<string, string> = {
  stulya: "Стулья",
  stoly: "Столы",
  kresla: "Кресла",
  divany: "Диваны",
  osveshchenie: "Освещение",
  aksessuary: "Аксессуары",
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const { isFavorite: isFav, toggleFavorite } = useFavorites();
  const isFavorite = isFav(product.id);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [justAdded, setJustAdded] = useState(false);

  const inCart = isInCart(product.id);

  // Проверяем наличие бейджей
  const isNew = product.badges?.includes("Новинка");
  const isHit =
    product.badges?.includes("Хит") || product.badges?.includes("Хит продаж");
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;

  const discount = hasDiscount
    ? Math.round(
        ((product.oldPrice! - product.price) / product.oldPrice!) * 100,
      )
    : null;

  // Рейтинг может быть строкой или числом
  const rating =
    typeof product.rating === "string"
      ? parseFloat(product.rating)
      : product.rating || 0;
  const reviewCount = product.reviewsCount || 0;

  // Получаем все изображения товара
  const allImages = product.images || [];

  // Категория
  const categorySlug = product.category || "stulya";
  const categoryName = categoryNames[categorySlug] || "Товары";

  // Плейсхолдеры по категориям с Unsplash
  const categorySearchTerms: Record<string, string> = {
    "barnye-stulya": "bar-stool",
    stulya: "chair",
    stoly: "dining-table",
    kresla: "armchair",
    "kompyuternye-kresla": "office-chair",
    komody: "dresser",
    stellazhi: "shelf",
    shkafy: "wardrobe",
    tumby: "nightstand",
    "tumby-tv": "tv-stand",
    pufy: "ottoman",
    default: "furniture",
  };

  // Генерируем плейсхолдер изображение (только при ошибке загрузки)
  const getPlaceholderUrl = (index: number): string => {
    const searchTerm =
      categorySearchTerms[categorySlug] || categorySearchTerms["default"];
    const seed =
      Math.abs(parseInt(product.id.replace(/\D/g, "").slice(0, 6) || "1")) +
      index;
    return `https://picsum.photos/seed/${searchTerm}${seed}/400/400`;
  };

  // Получаем URL изображения - оригинал или плейсхолдер при ошибке
  const getImageUrl = (index: number): string => {
    const originalUrl = allImages[index];
    // Если есть оригинальный URL и он не вызвал ошибку - используем его
    if (originalUrl && !imageErrors.has(index)) {
      return originalUrl;
    }
    // Плейсхолдер только при ошибке загрузки
    return getPlaceholderUrl(index);
  };

  // Для отображения используем минимум 1 изображение, максимум 5
  const imageCount = Math.max(1, Math.min(allImages.length, 5));
  const images = Array.from({ length: imageCount }, (_, i) => getImageUrl(i));
  const hasMultipleImages = images.length > 1;

  // Навигация по изображениям
  const goToPrevImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1,
      );
    },
    [images.length],
  );

  const goToNextImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1,
      );
    },
    [images.length],
  );

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Бейджи */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
          <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full shadow-sm">
            Новинка
          </span>
        )}
        {isHit && (
          <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-sm">
            Хит продаж
          </span>
        )}
        {discount && (
          <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-sm">
            -{discount}%
          </span>
        )}
      </div>

      {/* Избранное */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(product);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 shadow-sm ${
          isFavorite
            ? "bg-red-50 text-red-500"
            : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500"
        }`}
      >
        <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
      </button>

      {/* Изображение со слайдером */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Link href={`/catalog/product/${product.slug}`}>
          <div className="relative w-full h-full">
            {/* Слайдер изображений */}
            <div
              className="flex transition-transform duration-300 ease-out h-full"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((imgUrl, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`${product.name} - фото ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>

            {/* Оверлей при наведении */}
            <div
              className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
                isHovered && !hasMultipleImages ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="px-4 py-2 bg-white rounded-lg font-medium text-sm shadow-lg text-[#374151]">
                Подробнее
              </span>
            </div>
          </div>
        </Link>

        {/* Стрелки навигации (показываются при наведении если несколько фото) */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={goToPrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all hover:scale-110"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={goToNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all hover:scale-110"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Индикаторы (точки) */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-white w-4 shadow-md"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Перейти к фото ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Счетчик фото */}
        {hasMultipleImages && isHovered && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <span className="text-white text-xs font-medium">
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">
        {/* Категория */}
        <Link
          href={`/catalog/${categorySlug}`}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wide"
        >
          {categoryName}
        </Link>

        {/* Название */}
        <Link href={`/catalog/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-[var(--color-accent)] transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Рейтинг */}
        {rating > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        )}

        {/* Характеристики */}
        {product.specifications && (
          <div className="text-xs text-gray-500 mb-3 space-y-0.5">
            {product.specifications.width && product.specifications.height && (
              <div>
                {product.specifications.width}×{product.specifications.height}
                {product.specifications.depth
                  ? `×${product.specifications.depth}`
                  : ""}{" "}
                см
              </div>
            )}
            {product.specifications.material && (
              <div>{product.specifications.material}</div>
            )}
          </div>
        )}

        {/* Цвета */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {product.colors.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-gray-400 ml-1">
                +{product.colors.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Цена */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {product.price.toLocaleString("ru-RU")} ₽
          </span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through">
              {product.oldPrice.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>

        {/* Кнопка */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!product.inStock) return;
            addToCart({
              productId: product.id,
              name: product.name,
              price: product.price,
              oldPrice: product.oldPrice,
              image: product.images?.[0] || "",
              slug: product.slug,
            });
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1500);
          }}
          disabled={!product.inStock}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
            !product.inStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : justAdded
                ? "bg-green-600 text-white"
                : inCart
                  ? "bg-gray-700 text-white hover:bg-gray-600 active:scale-[0.98]"
                  : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
          }`}
        >
          {justAdded ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          <span className="text-sm">
            {!product.inStock
              ? "Нет в наличии"
              : justAdded
                ? "Добавлено!"
                : inCart
                  ? "В корзине ✓"
                  : "В корзину"}
          </span>
        </button>

        {/* Наличие */}
        {product.inStock && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>В
            наличии
          </div>
        )}
      </div>
    </div>
  );
}
