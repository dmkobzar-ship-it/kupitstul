"use client";

import { useState, useEffect } from "react";

interface HeroSlide {
  url: string;
  alt: string;
  animation: string;
}

// Default slides as fallback
const defaultSlides: HeroSlide[] = [
  {
    url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&h=1000&fit=crop",
    alt: "Элегантный диван в современном интерьере",
    animation: "zoom-in-left",
  },
  {
    url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1400&h=1000&fit=crop",
    alt: "Стильные стулья у обеденного стола",
    animation: "zoom-in-right",
  },
  {
    url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1400&h=1000&fit=crop",
    alt: "Уютная гостиная с креслами",
    animation: "pan-left",
  },
  {
    url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=1400&h=1000&fit=crop",
    alt: "Минималистичный интерьер с дизайнерской мебелью",
    animation: "zoom-in-center",
  },
  {
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&h=1000&fit=crop",
    alt: "Светлая комната с элегантной мебелью",
    animation: "pan-right",
  },
  {
    url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400&h=1000&fit=crop",
    alt: "Роскошный диван в гостиной",
    animation: "zoom-out",
  },
];

interface HeroGalleryProps {
  slides?: HeroSlide[];
}

export default function HeroGallery({ slides }: HeroGalleryProps) {
  const heroSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
        setIsVisible(true);
      }, 800);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentSlide = heroSlides[currentIndex];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gray-900">
      {/* Текущее изображение с анимацией */}
      <div
        key={currentIndex}
        className={`absolute inset-0 transition-opacity duration-800 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`absolute inset-0 bg-cover bg-center ${isVisible ? currentSlide.animation : ""}`}
          style={{
            backgroundImage: `url(${currentSlide.url})`,
          }}
        />
      </div>

      {/* Виньетка и градиент */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.3)] pointer-events-none" />

      {/* Индикаторы прогресса */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsVisible(true);
              }, 300);
            }}
            className="relative h-1 w-8 bg-white/30 rounded-full overflow-hidden"
            aria-label={`Слайд ${index + 1}`}
          >
            <div
              className={`absolute inset-0 bg-white rounded-full transition-transform duration-300 origin-left ${
                index === currentIndex ? "scale-x-100" : "scale-x-0"
              }`}
              style={{
                animation:
                  index === currentIndex && isVisible
                    ? "progress 5s linear"
                    : "none",
              }}
            />
          </button>
        ))}
      </div>

      {/* CSS анимации для эффекта движения камеры */}
      <style jsx>{`
        @keyframes progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        .zoom-in-left {
          animation: zoomInLeft 5s ease-out forwards;
        }

        .zoom-in-right {
          animation: zoomInRight 5s ease-out forwards;
        }

        .zoom-in-center {
          animation: zoomInCenter 5s ease-out forwards;
        }

        .pan-left {
          animation: panLeft 5s ease-out forwards;
        }

        .pan-right {
          animation: panRight 5s ease-out forwards;
        }

        .zoom-out {
          animation: zoomOut 5s ease-out forwards;
        }

        @keyframes zoomInLeft {
          0% {
            transform: scale(1.3) translateX(10%);
          }
          100% {
            transform: scale(1.1) translateX(-5%);
          }
        }

        @keyframes zoomInRight {
          0% {
            transform: scale(1.3) translateX(-10%);
          }
          100% {
            transform: scale(1.1) translateX(5%);
          }
        }

        @keyframes zoomInCenter {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.25);
          }
        }

        @keyframes panLeft {
          0% {
            transform: scale(1.2) translateX(8%);
          }
          100% {
            transform: scale(1.2) translateX(-8%);
          }
        }

        @keyframes panRight {
          0% {
            transform: scale(1.2) translateX(-8%);
          }
          100% {
            transform: scale(1.2) translateX(8%);
          }
        }

        @keyframes zoomOut {
          0% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
