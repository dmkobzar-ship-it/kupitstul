// ============================================
// ТЕСТОВЫЕ ДАННЫЕ - ТОВАРЫ
// По 1 товару на каждую категорию
// ============================================

export interface TestProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  oldPrice?: number;
  images: string[];
  description: string;
  shortDescription: string;
  inStock: boolean;
  isNew?: boolean;
  isHit?: boolean;
  isSale?: boolean;
  rating: number;
  reviewCount: number;
  specifications: {
    label: string;
    value: string;
  }[];
  colors?: { name: string; hex: string }[];
  materials?: string[];
}

export const testProducts: TestProduct[] = [
  // ========== СТУЛЬЯ ==========
  {
    id: "stul-venice-beige",
    name: "Стул Venice бежевый велюр",
    slug: "stul-venice-beige",
    sku: "VNC-001-BG",
    categorySlug: "stulya",
    categoryName: "Стулья",
    price: 12900,
    oldPrice: 15900,
    images: ["/products/stul-venice-1.jpg", "/products/stul-venice-2.jpg"],
    description:
      "Элегантный стул Venice с обивкой из премиального велюра. Идеально подходит для гостиной или столовой. Каркас из массива бука обеспечивает надёжность и долговечность.",
    shortDescription: "Велюровый стул с деревянными ножками",
    inStock: true,
    isHit: true,
    isSale: true,
    rating: 4.8,
    reviewCount: 124,
    specifications: [
      { label: "Ширина", value: "48 см" },
      { label: "Глубина", value: "55 см" },
      { label: "Высота", value: "82 см" },
      { label: "Высота сиденья", value: "46 см" },
      { label: "Материал каркаса", value: "Массив бука" },
      { label: "Материал обивки", value: "Велюр" },
      { label: "Нагрузка", value: "до 120 кг" },
    ],
    colors: [
      { name: "Бежевый", hex: "#d4a574" },
      { name: "Серый", hex: "#9ca3af" },
      { name: "Зелёный", hex: "#4ade80" },
    ],
    materials: ["Велюр", "Массив бука"],
  },

  // ========== СТОЛЫ ==========
  {
    id: "stol-oslo-dub",
    name: "Стол обеденный Oslo дуб",
    slug: "stol-oslo-dub",
    sku: "OSL-001-DK",
    categorySlug: "stoly",
    categoryName: "Столы",
    price: 45900,
    images: ["/products/stol-oslo-1.jpg", "/products/stol-oslo-2.jpg"],
    description:
      "Обеденный стол Oslo в скандинавском стиле. Столешница из натурального дуба с защитным покрытием. Вместимость до 6 человек.",
    shortDescription: "Обеденный стол из массива дуба",
    inStock: true,
    isNew: true,
    rating: 4.9,
    reviewCount: 67,
    specifications: [
      { label: "Длина", value: "160 см" },
      { label: "Ширина", value: "90 см" },
      { label: "Высота", value: "75 см" },
      { label: "Материал столешницы", value: "Массив дуба" },
      { label: "Материал ножек", value: "Массив дуба" },
      { label: "Покрытие", value: "Масло-воск" },
      { label: "Вместимость", value: "до 6 человек" },
    ],
    colors: [
      { name: "Натуральный дуб", hex: "#d4a574" },
      { name: "Тёмный орех", hex: "#5c4033" },
    ],
    materials: ["Массив дуба"],
  },

  // ========== КРЕСЛА ==========
  {
    id: "kreslo-berg-grey",
    name: "Кресло Berg серый букле",
    slug: "kreslo-berg-grey",
    sku: "BRG-001-GR",
    categorySlug: "kresla",
    categoryName: "Кресла",
    price: 34900,
    oldPrice: 42900,
    images: ["/products/kreslo-berg-1.jpg", "/products/kreslo-berg-2.jpg"],
    description:
      "Уютное кресло Berg с обивкой из модной ткани букле. Широкое сиденье и мягкие подлокотники обеспечивают максимальный комфорт.",
    shortDescription: "Кресло с обивкой из букле",
    inStock: true,
    isSale: true,
    rating: 4.7,
    reviewCount: 89,
    specifications: [
      { label: "Ширина", value: "78 см" },
      { label: "Глубина", value: "85 см" },
      { label: "Высота", value: "95 см" },
      { label: "Высота сиденья", value: "42 см" },
      { label: "Материал обивки", value: "Букле" },
      { label: "Наполнитель", value: "ППУ высокой плотности" },
      { label: "Ножки", value: "Металл, золото" },
    ],
    colors: [
      { name: "Серый", hex: "#9ca3af" },
      { name: "Белый", hex: "#f5f5f5" },
      { name: "Терракот", hex: "#c2410c" },
    ],
    materials: ["Букле", "Металл"],
  },

  // ========== БАРНЫЕ СТУЛЬЯ ==========
  {
    id: "barnyj-stul-loft-black",
    name: "Барный стул Loft чёрный",
    slug: "barnyj-stul-loft-black",
    sku: "LFT-001-BK",
    categorySlug: "barnye-stulya",
    categoryName: "Барные стулья",
    price: 8900,
    images: ["/products/barnyj-stul-loft-1.jpg"],
    description:
      "Барный стул в индустриальном стиле лофт. Металлический каркас с порошковым покрытием, сиденье из экокожи. Регулировка высоты.",
    shortDescription: "Барный стул в стиле лофт",
    inStock: true,
    rating: 4.6,
    reviewCount: 156,
    specifications: [
      { label: "Диаметр сиденья", value: "38 см" },
      { label: "Высота", value: "65-85 см" },
      { label: "Материал каркаса", value: "Металл" },
      { label: "Материал сиденья", value: "Экокожа" },
      { label: "Регулировка высоты", value: "Да" },
      { label: "Подставка для ног", value: "Да" },
    ],
    colors: [
      { name: "Чёрный", hex: "#1a1a1a" },
      { name: "Коричневый", hex: "#78350f" },
    ],
    materials: ["Металл", "Экокожа"],
  },

  // ========== ДИВАНЫ ==========
  {
    id: "divan-cloud-beige",
    name: "Диван Cloud трёхместный",
    slug: "divan-cloud-beige",
    sku: "CLD-003-BG",
    categorySlug: "divany",
    categoryName: "Диваны",
    price: 89900,
    oldPrice: 109900,
    images: ["/products/divan-cloud-1.jpg", "/products/divan-cloud-2.jpg"],
    description:
      "Роскошный модульный диван Cloud. Глубокая посадка, мягкие подушки из пуха и пера. Чехлы съёмные, можно стирать.",
    shortDescription: "Модульный диван с глубокой посадкой",
    inStock: true,
    isHit: true,
    isSale: true,
    rating: 4.9,
    reviewCount: 203,
    specifications: [
      { label: "Длина", value: "240 см" },
      { label: "Глубина", value: "95 см" },
      { label: "Высота", value: "85 см" },
      { label: "Глубина сиденья", value: "60 см" },
      { label: "Наполнитель", value: "Пух/перо + ППУ" },
      { label: "Материал обивки", value: "Велюр" },
      { label: "Съёмные чехлы", value: "Да" },
    ],
    colors: [
      { name: "Бежевый", hex: "#d4a574" },
      { name: "Графит", hex: "#374151" },
      { name: "Пудровый", hex: "#fecdd3" },
    ],
    materials: ["Велюр", "Массив сосны"],
  },

  // ========== ОФИСНЫЕ КРЕСЛА ==========
  {
    id: "ofisnoe-kreslo-ergopro",
    name: "Кресло офисное ErgoPro",
    slug: "ofisnoe-kreslo-ergopro",
    sku: "ERP-001-BK",
    categorySlug: "ofisnye-kresla",
    categoryName: "Офисные кресла",
    price: 28900,
    images: ["/products/ofisnoe-kreslo-1.jpg"],
    description:
      "Эргономичное офисное кресло с поддержкой поясницы. Регулируемые подлокотники, подголовник и высота. Сетчатая спинка для вентиляции.",
    shortDescription: "Эргономичное кресло для офиса",
    inStock: true,
    isNew: true,
    rating: 4.8,
    reviewCount: 312,
    specifications: [
      { label: "Ширина", value: "68 см" },
      { label: "Глубина", value: "65 см" },
      { label: "Высота", value: "115-125 см" },
      { label: "Материал спинки", value: "Сетка" },
      { label: "Материал сиденья", value: "Ткань" },
      { label: "Подлокотники", value: "4D регулировка" },
      { label: "Нагрузка", value: "до 150 кг" },
    ],
    colors: [
      { name: "Чёрный", hex: "#1a1a1a" },
      { name: "Серый", hex: "#6b7280" },
    ],
    materials: ["Сетка", "Ткань", "Пластик"],
  },

  // ========== ЖУРНАЛЬНЫЕ СТОЛИКИ ==========
  {
    id: "zhurnalnyj-stolik-round",
    name: "Столик журнальный Round",
    slug: "zhurnalnyj-stolik-round",
    sku: "RND-001-WH",
    categorySlug: "zhurnalnye-stoliki",
    categoryName: "Журнальные столики",
    price: 15900,
    images: ["/products/zhurnalnyj-stolik-1.jpg"],
    description:
      "Элегантный журнальный столик Round с мраморной столешницей и латунным основанием. Станет акцентом любого интерьера.",
    shortDescription: "Журнальный столик с мраморной столешницей",
    inStock: true,
    rating: 4.7,
    reviewCount: 45,
    specifications: [
      { label: "Диаметр", value: "60 см" },
      { label: "Высота", value: "45 см" },
      { label: "Материал столешницы", value: "Мрамор" },
      { label: "Материал основания", value: "Металл, латунь" },
      { label: "Вес", value: "18 кг" },
    ],
    colors: [
      { name: "Белый мрамор", hex: "#f5f5f5" },
      { name: "Зелёный мрамор", hex: "#065f46" },
    ],
    materials: ["Мрамор", "Металл"],
  },

  // ========== КОМОДЫ ==========
  {
    id: "komod-scandi-white",
    name: "Комод Scandi белый",
    slug: "komod-scandi-white",
    sku: "SCN-001-WH",
    categorySlug: "komody",
    categoryName: "Комоды",
    price: 32900,
    images: ["/products/komod-scandi-1.jpg"],
    description:
      "Комод Scandi в скандинавском стиле. 6 вместительных ящиков с доводчиками. Ножки из массива дуба.",
    shortDescription: "Комод в скандинавском стиле",
    inStock: true,
    rating: 4.6,
    reviewCount: 78,
    specifications: [
      { label: "Ширина", value: "120 см" },
      { label: "Глубина", value: "45 см" },
      { label: "Высота", value: "85 см" },
      { label: "Количество ящиков", value: "6" },
      { label: "Материал корпуса", value: "МДФ" },
      { label: "Материал ножек", value: "Массив дуба" },
      { label: "Доводчики", value: "Да" },
    ],
    colors: [
      { name: "Белый", hex: "#ffffff" },
      { name: "Серый", hex: "#9ca3af" },
    ],
    materials: ["МДФ", "Массив дуба"],
  },

  // ========== ПОЛКИ ==========
  {
    id: "polka-loft-wood",
    name: "Полка настенная Loft",
    slug: "polka-loft-wood",
    sku: "PLK-001-WD",
    categorySlug: "polki",
    categoryName: "Полки",
    price: 4900,
    images: ["/products/polka-loft-1.jpg"],
    description:
      "Настенная полка в стиле лофт. Деревянная доска с металлическими кронштейнами. Простой монтаж.",
    shortDescription: "Настенная полка в стиле лофт",
    inStock: true,
    rating: 4.5,
    reviewCount: 234,
    specifications: [
      { label: "Длина", value: "80 см" },
      { label: "Глубина", value: "20 см" },
      { label: "Толщина доски", value: "3 см" },
      { label: "Материал полки", value: "Сосна" },
      { label: "Материал кронштейнов", value: "Металл" },
      { label: "Нагрузка", value: "до 15 кг" },
    ],
    colors: [
      { name: "Натуральное дерево", hex: "#d4a574" },
      { name: "Венге", hex: "#3d2817" },
    ],
    materials: ["Сосна", "Металл"],
  },

  // ========== ОСВЕЩЕНИЕ ==========
  {
    id: "lyustra-modern-gold",
    name: "Люстра Modern Gold",
    slug: "lyustra-modern-gold",
    sku: "LGM-001-GD",
    categorySlug: "osveschenie",
    categoryName: "Освещение",
    price: 24900,
    oldPrice: 29900,
    images: ["/products/lyustra-modern-1.jpg"],
    description:
      "Дизайнерская люстра Modern Gold с латунным каркасом. 8 плафонов из матового стекла. Подходит для комнат до 20 м².",
    shortDescription: "Дизайнерская люстра с латунным каркасом",
    inStock: true,
    isSale: true,
    rating: 4.8,
    reviewCount: 56,
    specifications: [
      { label: "Диаметр", value: "65 см" },
      { label: "Высота", value: "40 см" },
      { label: "Количество ламп", value: "8" },
      { label: "Цоколь", value: "E27" },
      { label: "Материал", value: "Металл, стекло" },
      { label: "Площадь освещения", value: "до 20 м²" },
    ],
    colors: [
      { name: "Золото", hex: "#d4a574" },
      { name: "Чёрный", hex: "#1a1a1a" },
    ],
    materials: ["Металл", "Стекло"],
  },

  // ========== СТЕЛЛАЖИ ==========
  {
    id: "stellazh-industrial",
    name: "Стеллаж Industrial",
    slug: "stellazh-industrial",
    sku: "STL-001-BK",
    categorySlug: "stellazhi",
    categoryName: "Стеллажи",
    price: 18900,
    images: ["/products/stellazh-1.jpg"],
    description:
      "Стеллаж в индустриальном стиле. Металлический каркас и деревянные полки. 5 уровней для хранения.",
    shortDescription: "Стеллаж в индустриальном стиле",
    inStock: true,
    rating: 4.6,
    reviewCount: 89,
    specifications: [
      { label: "Ширина", value: "100 см" },
      { label: "Глубина", value: "35 см" },
      { label: "Высота", value: "180 см" },
      { label: "Количество полок", value: "5" },
      { label: "Материал каркаса", value: "Металл" },
      { label: "Материал полок", value: "Сосна" },
      { label: "Нагрузка на полку", value: "до 25 кг" },
    ],
    colors: [{ name: "Чёрный/дерево", hex: "#1a1a1a" }],
    materials: ["Металл", "Сосна"],
  },

  // ========== ТУМБЫ ТВ ==========
  {
    id: "tumba-tv-nordic",
    name: "Тумба под ТВ Nordic",
    slug: "tumba-tv-nordic",
    sku: "TVN-001-WH",
    categorySlug: "tumby-tv",
    categoryName: "Тумбы ТВ",
    price: 21900,
    images: ["/products/tumba-tv-1.jpg"],
    description:
      "Тумба под телевизор Nordic в скандинавском стиле. Два отсека с дверцами и открытая ниша для техники. Встроенный кабель-канал.",
    shortDescription: "Тумба под ТВ в скандинавском стиле",
    inStock: true,
    rating: 4.7,
    reviewCount: 67,
    specifications: [
      { label: "Ширина", value: "150 см" },
      { label: "Глубина", value: "40 см" },
      { label: "Высота", value: "50 см" },
      { label: "Материал", value: "МДФ" },
      { label: "Ножки", value: "Массив дуба" },
      { label: "Максимальный ТВ", value: "до 65 дюймов" },
      { label: "Нагрузка", value: "до 50 кг" },
    ],
    colors: [
      { name: "Белый", hex: "#ffffff" },
      { name: "Серый", hex: "#9ca3af" },
    ],
    materials: ["МДФ", "Массив дуба"],
  },
];

// Категории для фильтрации
export const categories = [
  { slug: "stulya", name: "Стулья", count: 156, icon: "chair" },
  { slug: "stoly", name: "Столы", count: 89, icon: "table" },
  { slug: "kresla", name: "Кресла", count: 67, icon: "armchair" },
  {
    slug: "barnye-stulya",
    name: "Барные стулья",
    count: 45,
    icon: "bar-chair",
  },
  { slug: "divany", name: "Диваны", count: 34, icon: "sofa" },
  { slug: "ofisnye-kresla", name: "Офисные кресла", count: 78, icon: "office" },
  {
    slug: "zhurnalnye-stoliki",
    name: "Журнальные столики",
    count: 56,
    icon: "coffee-table",
  },
  { slug: "komody", name: "Комоды", count: 23, icon: "drawer" },
  { slug: "polki", name: "Полки", count: 112, icon: "shelf" },
  { slug: "osveschenie", name: "Освещение", count: 89, icon: "lamp" },
  { slug: "stellazhi", name: "Стеллажи", count: 34, icon: "bookshelf" },
  { slug: "tumby-tv", name: "Тумбы ТВ", count: 28, icon: "tv-stand" },
];

// Получить товары по категории
export function getProductsByCategory(categorySlug: string): TestProduct[] {
  return testProducts.filter((p) => p.categorySlug === categorySlug);
}

// Получить товар по slug
export function getProductBySlug(slug: string): TestProduct | undefined {
  return testProducts.find((p) => p.slug === slug);
}

// Получить категорию по slug
export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// Получить похожие товары
export function getSimilarProducts(
  product: TestProduct,
  limit: number = 4
): TestProduct[] {
  return testProducts
    .filter(
      (p) => p.categorySlug === product.categorySlug && p.id !== product.id
    )
    .slice(0, limit);
}
