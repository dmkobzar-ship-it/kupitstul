// ============================================
// KUPITSTUL.RU - ПОЛНАЯ СИСТЕМА ТИПОВ
// Премиальный мебельный магазин
// ============================================

// ============================================
// БАЗОВЫЕ ТИПЫ
// ============================================

export type ID = string;
export type Timestamp = string; // ISO 8601
export type Slug = string;
export type URL = string;
export type Email = string;
export type Phone = string;

// ============================================
// МЕДИА
// ============================================

export interface MediaFile {
  id: ID;
  url: URL;
  thumbnail?: URL;
  alt?: string;
  width?: number;
  height?: number;
  type: "image" | "video" | "3d-model";
  order: number;
}

// ============================================
// ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ (КОНСТРУКТОР)
// ============================================

export type ParameterType =
  | "text" // Текстовое поле
  | "number" // Число
  | "boolean" // Да/Нет
  | "select" // Выбор из списка
  | "multiselect" // Множественный выбор
  | "color" // Цвет с превью
  | "dimensions" // Размеры (ШxВxГ)
  | "range" // Диапазон (от-до)
  | "rich-text"; // HTML редактор

export interface ParameterOption {
  value: string;
  label: string;
  color?: string; // Для цветов - HEX
  image?: URL; // Превью опции
}

export interface ProductParameter {
  id: ID;
  code: string; // Уникальный код (например: 'seat_material')
  name: string; // Название для отображения
  type: ParameterType;
  options?: ParameterOption[]; // Для select/multiselect
  unit?: string; // Единица измерения (кг, см, шт)
  required: boolean;
  filterable: boolean; // Показывать в фильтрах
  comparable: boolean; // Показывать в сравнении
  showInCard: boolean; // Показывать в карточке товара
  showInList: boolean; // Показывать в списке товаров
  order: number; // Порядок отображения
  group?: string; // Группа параметров (Размеры, Материалы, и т.д.)
  categoryIds?: ID[]; // Для каких категорий применим
  avitoField?: string; // Маппинг на поле Авито
}

export interface ParameterGroup {
  id: ID;
  name: string;
  code: string;
  order: number;
  isExpanded: boolean; // Развёрнута ли группа по умолчанию
}

export interface ProductParameterValue {
  parameterId: ID;
  value: string | number | boolean | string[];
}

// ============================================
// КАТЕГОРИИ
// ============================================

export interface Category {
  id: ID;
  name: string;
  slug: Slug;
  description?: string;
  image?: URL;
  icon?: string; // Иконка (lucide name)
  parentId?: ID; // Родительская категория
  order: number;
  isActive: boolean;

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  // Привязанные параметры
  parameterIds: ID[];

  // Для навигации
  navigationType: NavigationType[];

  // Счётчики
  productCount?: number;

  // Даты
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NavigationType =
  | "by-type" // По типу (Стулья, Столы)
  | "by-room" // По комнате (Кухня, Гостиная)
  | "by-style" // По стилю (Лофт, Классика)
  | "by-purpose"; // По назначению (Для дома, Для офиса)

export interface CategoryTree extends Category {
  children: CategoryTree[];
  level: number;
  path: string[]; // Путь категорий для хлебных крошек
}

// ============================================
// ТОВАР
// ============================================

export type ProductStatus =
  | "draft" // Черновик
  | "active" // Активен
  | "hidden" // Скрыт
  | "out-of-stock" // Нет в наличии
  | "archived"; // В архиве

export interface Product {
  id: ID;

  // Основное
  name: string;
  slug: Slug;
  sku: string; // Артикул
  description?: string;
  shortDescription?: string;

  // Цены
  price: number;
  originalPrice?: number; // Старая цена (для скидок)
  costPrice?: number; // Себестоимость

  // Наличие
  inStock: boolean;
  stockCount?: number;

  // Категории
  categoryId: ID;
  categoryIds: ID[]; // Может быть в нескольких категориях

  // Медиа
  images: MediaFile[];
  video?: MediaFile;
  model3d?: MediaFile; // Для AR

  // Динамические параметры
  parameters: ProductParameterValue[];

  // Теги и метки
  tags: string[];
  badges: ProductBadge[];

  // Связанные товары
  relatedProductIds: ID[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  // Статус
  status: ProductStatus;

  // Авито синхронизация
  avitoId?: string;
  avitoUrl?: URL;

  // Статистика
  viewCount: number;
  orderCount: number;
  rating?: number;
  reviewCount: number;

  // Даты
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface ProductBadge {
  type: "new" | "sale" | "hit" | "exclusive" | "limited" | "eco";
  text?: string;
  color?: string;
  expiresAt?: Timestamp;
}

// ============================================
// ВАРИАЦИИ ТОВАРА
// ============================================

export interface ProductVariant {
  id: ID;
  productId: ID;
  sku: string;
  name: string; // "Серый велюр"

  price?: number; // Своя цена если отличается
  originalPrice?: number;

  inStock: boolean;
  stockCount?: number;

  // Параметры варианта (цвет, размер и т.д.)
  parameters: ProductParameterValue[];

  // Своё фото
  image?: MediaFile;
}

// ============================================
// ФИЛЬТРЫ И СОРТИРОВКА
// ============================================

export interface FilterValue {
  parameterId: ID;
  values: (string | number | boolean)[];
  range?: {
    min?: number;
    max?: number;
  };
}

export interface ProductFilter {
  categoryIds?: ID[];
  search?: string;
  priceRange?: { min?: number; max?: number };
  inStock?: boolean;
  status?: ProductStatus[];
  tags?: string[];
  badges?: string[];
  parameters?: FilterValue[];
}

export type SortField =
  | "price"
  | "name"
  | "createdAt"
  | "popularity"
  | "rating"
  | "discount";

export type SortOrder = "asc" | "desc";

export interface ProductSort {
  field: SortField;
  order: SortOrder;
}

// ============================================
// КОРЗИНА
// ============================================

export interface CartItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  quantity: number;
  price: number; // Цена на момент добавления

  // Снимок товара
  product: {
    name: string;
    image?: URL;
    sku: string;
  };
}

export interface Cart {
  id: ID;
  userId?: ID;
  sessionId: string;
  items: CartItem[];

  // Расчёты
  subtotal: number;
  discount: number;
  deliveryPrice: number;
  total: number;

  // Промокод
  promoCode?: string;
  promoDiscount?: number;

  updatedAt: Timestamp;
}

// ============================================
// ЗАКАЗЫ (CRM)
// ============================================

export type OrderStatus =
  | "new" // Новый
  | "confirmed" // Подтверждён
  | "paid" // Оплачен
  | "processing" // В обработке
  | "shipped" // Отправлен
  | "delivered" // Доставлен
  | "completed" // Завершён
  | "cancelled" // Отменён
  | "refunded"; // Возврат

export type PaymentStatus =
  | "pending" // Ожидает оплаты
  | "paid" // Оплачен
  | "failed" // Ошибка оплаты
  | "refunded"; // Возвращён

export type PaymentMethod =
  | "card" // Картой онлайн
  | "cash" // Наличными
  | "installment" // Рассрочка
  | "credit"; // Кредит

export type DeliveryMethod =
  | "pickup" // Самовывоз
  | "courier" // Курьер
  | "pek" // ПЭК
  | "yandex-go" // Яндекс GO
  | "cdek" // СДЭК
  | "post"; // Почта России

export interface OrderItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  quantity: number;
  price: number;
  total: number;

  // Снимок товара на момент заказа
  productSnapshot: {
    name: string;
    sku: string;
    image?: URL;
    parameters?: ProductParameterValue[];
  };
}

export interface Order {
  id: ID;
  number: string; // Номер заказа (например: KS-2026-00001)

  // Покупатель
  customerId?: ID;
  customer: CustomerInfo;

  // Товары
  items: OrderItem[];

  // Суммы
  subtotal: number;
  discount: number;
  deliveryPrice: number;
  total: number;

  // Промокод
  promoCode?: string;
  promoDiscount?: number;

  // Статусы
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  // Доставка
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: Address;
  deliveryDate?: Timestamp;
  trackingNumber?: string;

  // Комментарии
  customerComment?: string;
  adminComment?: string;

  // История
  statusHistory: OrderStatusHistory[];

  // Даты
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  comment?: string;
  createdAt: Timestamp;
  createdBy?: ID; // ID админа
}

export interface CustomerInfo {
  name: string;
  email: Email;
  phone: Phone;
  company?: string;
}

export interface Address {
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode?: string;
  comment?: string;

  // Координаты для карты
  lat?: number;
  lng?: number;
}

// ============================================
// КЛИЕНТЫ (CRM)
// ============================================

export interface Customer {
  id: ID;

  // Основное
  email: Email;
  phone: Phone;
  name: string;

  // Дополнительно
  company?: string;
  birthDate?: string;

  // Адреса
  addresses: Address[];
  defaultAddressIndex?: number;

  // Статистика
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: Timestamp;

  // Сегментация
  segment: CustomerSegment;
  tags: string[];

  // Маркетинг
  emailSubscribed: boolean;
  smsSubscribed: boolean;

  // Даты
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CustomerSegment =
  | "new" // Новый (0 заказов)
  | "regular" // Обычный (1-2 заказа)
  | "loyal" // Лояльный (3-5 заказов)
  | "vip"; // VIP (5+ заказов или сумма > X)

// ============================================
// БЛОГ (SEO)
// ============================================

export type ArticleStatus = "draft" | "published" | "archived";

export interface Article {
  id: ID;
  title: string;
  slug: Slug;
  excerpt: string;
  content: string; // HTML

  // Медиа
  coverImage?: MediaFile;
  images: MediaFile[];

  // Категоризация
  categoryId?: ID;
  tags: string[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];

  // Связи
  relatedProductIds: ID[];
  relatedArticleIds: ID[];

  // Статус
  status: ArticleStatus;

  // Автор
  authorId?: ID;
  authorName?: string;

  // Статистика
  viewCount: number;

  // Даты
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface ArticleCategory {
  id: ID;
  name: string;
  slug: Slug;
  description?: string;
  order: number;
}

// ============================================
// ПРОМОКОДЫ
// ============================================

export type PromoType =
  | "percent" // Процент скидки
  | "fixed" // Фиксированная сумма
  | "free-delivery"; // Бесплатная доставка

export interface PromoCode {
  id: ID;
  code: string;
  type: PromoType;
  value: number; // Процент или сумма

  // Ограничения
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;

  // Применимость
  categoryIds?: ID[];
  productIds?: ID[];
  customerIds?: ID[]; // Персональные промокоды

  // Период действия
  startsAt?: Timestamp;
  expiresAt?: Timestamp;

  isActive: boolean;

  createdAt: Timestamp;
}

// ============================================
// ОТЗЫВЫ
// ============================================

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: ID;
  productId: ID;
  customerId?: ID;
  orderId?: ID;

  // Содержание
  rating: number; // 1-5
  title?: string;
  content: string;
  pros?: string;
  cons?: string;

  // Медиа
  images?: MediaFile[];

  // Автор
  authorName: string;
  isVerifiedPurchase: boolean;

  // Модерация
  status: ReviewStatus;
  moderatorComment?: string;

  // Реакции
  helpfulCount: number;

  // Ответ магазина
  reply?: {
    content: string;
    createdAt: Timestamp;
  };

  createdAt: Timestamp;
}

// ============================================
// УВЕДОМЛЕНИЯ (CRM)
// ============================================

export type NotificationType =
  | "order-new"
  | "order-status"
  | "order-paid"
  | "review-new"
  | "stock-low"
  | "price-drop";

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;

  // Для кого
  userId?: ID; // Для конкретного пользователя
  isGlobal: boolean; // Для всех админов

  isRead: boolean;

  createdAt: Timestamp;
}

// ============================================
// НАСТРОЙКИ САЙТА
// ============================================

export interface SiteSettings {
  // Основное
  siteName: string;
  siteDescription: string;
  logo: URL;
  favicon: URL;

  // Контакты
  phone: Phone;
  email: Email;
  address: string;
  workingHours: string;

  // Социальные сети
  socialLinks: {
    telegram?: URL;
    vk?: URL;
    youtube?: URL;
    instagram?: URL;
  };

  // SEO по умолчанию
  defaultSeoTitle: string;
  defaultSeoDescription: string;

  // Интеграции
  yandexMetrikaId?: string;
  googleAnalyticsId?: string;

  // Доставка
  freeDeliveryThreshold?: number;

  // Валюта
  currency: string;
  currencySymbol: string;
}

// ============================================
// ИМПОРТ/ЭКСПОРТ (АВИТО)
// ============================================

export interface AvitoImportMapping {
  avitoField: string;
  systemField: string;
  transform?: "direct" | "split" | "boolean" | "number" | "price";
  delimiter?: string; // Для split
  defaultValue?: any;
}

export interface ImportJob {
  id: ID;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";

  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;

  errors: ImportError[];

  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface ImportError {
  row: number;
  field: string;
  value?: string;
  error: string;
}

// ============================================
// АНАЛИТИКА (CRM)
// ============================================

export interface DashboardStats {
  // Заказы
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;

  // Выручка
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;

  // Средний чек
  averageOrderValue: number;

  // Товары
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;

  // Клиенты
  totalCustomers: number;
  newCustomersThisMonth: number;

  // Конверсия
  conversionRate: number;

  // Топ товары
  topProducts: {
    productId: ID;
    name: string;
    orderCount: number;
    revenue: number;
  }[];
}

// ============================================
// API RESPONSES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
