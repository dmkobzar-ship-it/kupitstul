import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

// Типы данных
export interface Product {
  id: string;
  externalId?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory?: string;
  roomType: string[];
  material: string[];
  color: string[];
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
  source?: string;
  avitoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  level: number;
  productCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportLog {
  id: string;
  fileName: string;
  fileType: string;
  source?: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors?: Array<{ row: number; error: string; data?: any }>;
  startedAt: string;
  completedAt?: string;
  user?: string;
}

interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  importLogs: ImportLog[];
  orders: any[];
}

// Путь к файлу базы данных
const dbPath = path.join(process.cwd(), "data", "db.json");

// Создаем директорию, если не существует
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Инициализация базы данных
const adapter = new JSONFile<DatabaseSchema>(dbPath);
const defaultData: DatabaseSchema = {
  products: [],
  categories: [],
  importLogs: [],
  orders: [],
};
const db = new Low<DatabaseSchema>(adapter, defaultData);

// Инициализируем базу с дефолтными значениями
export async function initDatabase() {
  await db.read();

  db.data ||= {
    products: [],
    categories: [],
    importLogs: [],
    orders: [],
  };

  // Создаем стандартные категории при первом запуске
  if (db.data.categories.length === 0) {
    const defaultCategories: Category[] = [
      {
        id: nanoid(),
        name: "Стулья",
        slug: "chairs",
        level: 0,
        productCount: 0,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Обеденные",
        slug: "dining-chairs",
        parentId: "chairs",
        level: 1,
        productCount: 0,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Барные",
        slug: "bar-chairs",
        parentId: "chairs",
        level: 1,
        productCount: 0,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Офисные",
        slug: "office-chairs",
        parentId: "chairs",
        level: 1,
        productCount: 0,
        sortOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Столы",
        slug: "tables",
        level: 0,
        productCount: 0,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Обеденные",
        slug: "dining-tables",
        parentId: "tables",
        level: 1,
        productCount: 0,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Журнальные",
        slug: "coffee-tables",
        parentId: "tables",
        level: 1,
        productCount: 0,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Диваны",
        slug: "sofas",
        level: 0,
        productCount: 0,
        sortOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Кресла",
        slug: "armchairs",
        level: 0,
        productCount: 0,
        sortOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Кровати",
        slug: "beds",
        level: 0,
        productCount: 0,
        sortOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        name: "Светильники",
        slug: "lighting",
        level: 0,
        productCount: 0,
        sortOrder: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Находим ID родительских категорий
    const chairsCat = defaultCategories.find((c) => c.slug === "chairs");
    const tablesCat = defaultCategories.find((c) => c.slug === "tables");

    if (chairsCat) {
      defaultCategories
        .filter((c) => c.parentId === "chairs")
        .forEach((c) => (c.parentId = chairsCat.id));
    }

    if (tablesCat) {
      defaultCategories
        .filter((c) => c.parentId === "tables")
        .forEach((c) => (c.parentId = tablesCat.id));
    }

    db.data.categories = defaultCategories;
  }

  await db.write();
  return db;
}

// Получаем экземпляр базы
export async function getDatabase() {
  if (!db.data) {
    await initDatabase();
  }
  return db;
}

// CRUD операции для товаров
export const productRepository = {
  async create(
    productData: Omit<
      Product,
      "id" | "createdAt" | "updatedAt" | "slug" | "isActive"
    >,
  ): Promise<Product> {
    const db = await getDatabase();

    const product: Product = {
      id: nanoid(),
      slug: generateSlug(productData.name),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...productData,
    };

    db.data!.products.push(product);
    await db.write();

    // Обновляем счетчик категории
    await this.updateCategoryCount(productData.category);

    return product;
  },

  async update(
    id: string,
    productData: Partial<Product>,
  ): Promise<Product | null> {
    const db = await getDatabase();

    const index = db.data!.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    db.data!.products[index] = {
      ...db.data!.products[index],
      ...productData,
      updatedAt: new Date().toISOString(),
    };

    await db.write();
    return db.data!.products[index];
  },

  async findById(id: string): Promise<Product | null> {
    const db = await getDatabase();
    return db.data!.products.find((p) => p.id === id && p.isActive) || null;
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const db = await getDatabase();
    return db.data!.products.find((p) => p.slug === slug && p.isActive) || null;
  },

  async findBySku(sku: string): Promise<Product | null> {
    const db = await getDatabase();
    return db.data!.products.find((p) => p.sku === sku && p.isActive) || null;
  },

  async findAll(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const db = await getDatabase();

    let products = db.data!.products.filter((p) => p.isActive);

    // Применяем фильтры
    if (filters?.category) {
      products = products.filter((p) => p.category === filters.category);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower),
      );
    }

    if (filters?.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters?.inStock !== undefined) {
      products = products.filter((p) => p.inStock === filters.inStock);
    }

    const total = products.length;

    // Пагинация
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      products = products.slice(start, end);
    }

    return { products, total };
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();

    const index = db.data!.products.findIndex((p) => p.id === id);
    if (index === -1) return false;

    db.data!.products[index].isActive = false;
    db.data!.products[index].updatedAt = new Date().toISOString();

    await db.write();
    return true;
  },

  async updateCategoryCount(categoryName: string): Promise<void> {
    const db = await getDatabase();

    const category = db.data!.categories.find((c) => c.name === categoryName);
    if (category) {
      const count = db.data!.products.filter(
        (p) => p.category === categoryName && p.isActive,
      ).length;

      category.productCount = count;
      category.updatedAt = new Date().toISOString();
      await db.write();
    }
  },
};

// CRUD операции для импорт логов
export const importLogRepository = {
  async create(
    logData: Omit<ImportLog, "id" | "startedAt">,
  ): Promise<ImportLog> {
    const db = await getDatabase();

    const log: ImportLog = {
      id: nanoid(),
      startedAt: new Date().toISOString(),
      ...logData,
    };

    db.data!.importLogs.unshift(log); // Добавляем в начало
    await db.write();

    return log;
  },

  async update(
    id: string,
    logData: Partial<ImportLog>,
  ): Promise<ImportLog | null> {
    const db = await getDatabase();

    const index = db.data!.importLogs.findIndex((l) => l.id === id);
    if (index === -1) return null;

    db.data!.importLogs[index] = {
      ...db.data!.importLogs[index],
      ...logData,
    };

    await db.write();
    return db.data!.importLogs[index];
  },

  async findById(id: string): Promise<ImportLog | null> {
    const db = await getDatabase();
    return db.data!.importLogs.find((l) => l.id === id) || null;
  },

  async findAll(limit?: number): Promise<ImportLog[]> {
    const db = await getDatabase();
    const logs = db.data!.importLogs;

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  },
};

// Вспомогательные функции
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50) + `-${Date.now().toString(36)}`
  );
}
