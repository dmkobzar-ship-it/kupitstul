"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badges?: string[];
  productId?: string;
  category?: string;
}

export default function ProductGallery({
  images,
  productName,
  badges,
  productId = "1",
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isZoomed, setIsZoomed] = useState(false);

  // Генерируем плейсхолдер (только при ошибке загрузки)
  const getPlaceholderUrl = (index: number, size: number = 600): string => {
    const seed =
      Math.abs(parseInt(productId.replace(/\D/g, "").slice(0, 6) || "1")) +
      index;
    return `https://picsum.photos/seed/${seed}/${size}/${size}`;
  };

  // Получаем URL изображения - оригинал или плейсхолдер при ошибке
  const getImageUrl = (index: number, size: number = 600): string => {
    const originalUrl = images[index];
    // Если есть оригинальный URL и он не вызвал ошибку - используем его
    if (originalUrl && !imageErrors.has(index)) {
      return originalUrl;
    }
    // Плейсхолдер только при ошибке загрузки
    return getPlaceholderUrl(index, size);
  };

  // Массив изображений (минимум 1, максимум 10)
  const imageCount = Math.max(1, Math.min(images.length || 1, 10));
  const displayImages = Array.from({ length: imageCount }, (_, i) =>
    getImageUrl(i)
  );
  const hasMultipleImages = displayImages.length > 1;

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  }, [displayImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  }, [displayImages.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") setIsZoomed(false);
    },
    [goToPrev, goToNext]
  );

  return (
    <>
      <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
        {/* Main Image Container */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden relative group shadow-lg">
          {/* Main Image with Slider */}
          <div className="relative w-full h-full">
            <div
              className="flex transition-transform duration-500 ease-out h-full"
              style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
            >
              {displayImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className="w-full h-full flex-shrink-0 relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`${productName} - фото ${index + 1}`}
                    className="w-full h-full object-contain p-4 cursor-zoom-in"
                    onError={() => handleImageError(index)}
                    onClick={() => setIsZoomed(true)}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {(badges.includes("new") || badges.includes("Новинка")) && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                  ✨ Новинка
                </span>
              )}
              {(badges.includes("hit") ||
                badges.includes("Хит") ||
                badges.includes("Хит продаж")) && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold rounded-full shadow-lg">
                  🔥 Хит продаж
                </span>
              )}
              {badges.includes("sale") && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg">
                  💰 Скидка
                </span>
              )}
            </div>
          )}

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
            aria-label="Увеличить"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>

          {/* Image Counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full">
              <span className="text-white text-sm font-medium">
                {selectedIndex + 1} / {displayImages.length}
              </span>
            </div>
          )}

          {/* Progress Dots */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === selectedIndex
                      ? "w-8 h-2 bg-white shadow-lg"
                      : "w-2 h-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Перейти к фото ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {hasMultipleImages && (
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {displayImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                    index === selectedIndex
                      ? "ring-2 ring-gray-900 ring-offset-2 scale-105 shadow-lg"
                      : "ring-1 ring-gray-200 hover:ring-gray-400 hover:scale-102"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`${productName} - миниатюра ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-60 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Zoomed Image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImages[selectedIndex]}
              alt={productName}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Navigation in Zoom Mode */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-60 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-60 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          {/* Counter in Zoom Mode */}
          {hasMultipleImages && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-60 flex gap-3 items-center">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    index === selectedIndex
                      ? "w-10 h-2.5 bg-white"
                      : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Фото ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
