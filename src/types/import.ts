export interface ImportProduct {
  // Обязательные поля
  name: string;
  price: number;
  sku?: string;
  category: string;

  // Опциональные поля
  description?: string;
  originalPrice?: number;
  material?: string;
  color?: string;
  dimensions?: string;
  inStock?: boolean;
  stockCount?: number;
  weight?: number;
  images?: string; // URL через запятую
  tags?: string; // через запятую
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  products: ImportProduct[];
}
