export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory?: string;
  roomType?: string[];
  material?: string[];
  color?: string[];
  images: string[];
  inStock: boolean;
  stockCount: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  tags: string[];
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  level: number;
  productCount: number;
  children?: Category[];
}
