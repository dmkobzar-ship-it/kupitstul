// Shared product types - can be imported by both server and client components

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  category: string;
  images: string[];
  inStock: boolean;
  specifications?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    material?: string;
    seatMaterial?: string;
  };
  colors?: { name: string; hex: string }[];
  materials?: string[];
  rating?: string | number;
  reviewsCount?: number;
  badges?: string[];
}

export interface ImportedCategory {
  slug: string;
  name: string;
  count: number;
}
