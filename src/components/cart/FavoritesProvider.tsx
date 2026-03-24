"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/types/product";

interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  getFavoritesCount: () => number;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

function loadFavorites(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("kupit-favorites");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const isFavorite = (productId: string) =>
    favorites.some((p) => p.id === productId);

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const next = prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product];
      try {
        localStorage.setItem("kupit-favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const getFavoritesCount = () => favorites.length;
  const clearFavorites = () => {
    setFavorites([]);
    try {
      localStorage.removeItem("kupit-favorites");
    } catch {}
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        getFavoritesCount,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
