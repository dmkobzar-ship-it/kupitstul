// ============================================
// ПРЕДУСТАНОВЛЕННЫЕ КАТЕГОРИИ
// Структура каталога kupitstul.ru
// ============================================

import { Category, CategoryTree, NavigationType } from "./index";

// ===== КАТЕГОРИИ ПО ТИПУ ТОВАРА =====
export const CATEGORIES_BY_TYPE: Category[] = [
  // СТУЛЬЯ
  {
    id: "cat-chairs",
    name: "Стулья",
    slug: "stulya",
    description: "Широкий ассортимент стульев для дома, офиса и HoReCa",
    icon: "armchair",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-chairs-dining",
    name: "Обеденные стулья",
    slug: "stulya-obedennye",
    parentId: "cat-chairs",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    seoTitle:
      "Обеденные стулья купить в Москве — цены в интернет-магазине КупитьСтул",
    seoDescription:
      "Обеденные стулья по выгодным ценам. Большой каталог, быстрая доставка по всей России.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-chairs-bar",
    name: "Барные стулья",
    slug: "barnye-stulya",
    parentId: "cat-chairs",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-chairs-kitchen",
    name: "Стулья для кухни",
    slug: "stulya-dlya-kuhni",
    parentId: "cat-chairs",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-chairs-folding",
    name: "Складные стулья",
    slug: "stulya-skladnye",
    parentId: "cat-chairs",
    order: 4,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-chairs-kids",
    name: "Детские стулья",
    slug: "detskie-stulya",
    parentId: "cat-chairs",
    order: 5,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // СТОЛЫ
  {
    id: "cat-tables",
    name: "Столы",
    slug: "stoly",
    description: "Обеденные, журнальные, компьютерные столы",
    icon: "square",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-tables-dining",
    name: "Обеденные столы",
    slug: "stoly-obedennye",
    parentId: "cat-tables",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-tables-coffee",
    name: "Журнальные столики",
    slug: "zhurnalnye-stoliki",
    parentId: "cat-tables",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-tables-computer",
    name: "Компьютерные столы",
    slug: "kompyuternye-stoly",
    parentId: "cat-tables",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-tables-bar",
    name: "Барные столы",
    slug: "barnye-stoly",
    parentId: "cat-tables",
    order: 4,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-tables-console",
    name: "Консоли",
    slug: "konsoli",
    parentId: "cat-tables",
    order: 5,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // КРЕСЛА
  {
    id: "cat-armchairs",
    name: "Кресла",
    slug: "kresla",
    description: "Офисные, игровые и мягкие кресла",
    icon: "armchair",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-armchairs-office",
    name: "Офисные кресла",
    slug: "ofisnye-kresla",
    parentId: "cat-armchairs",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-armchairs-gaming",
    name: "Игровые кресла",
    slug: "igrovye-kresla",
    parentId: "cat-armchairs",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-armchairs-lounge",
    name: "Кресла для отдыха",
    slug: "kresla-dlya-otdyha",
    parentId: "cat-armchairs",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-armchairs-executive",
    name: "Кресла руководителя",
    slug: "kresla-rukovoditelya",
    parentId: "cat-armchairs",
    order: 4,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // МЯГКАЯ МЕБЕЛЬ
  {
    id: "cat-soft",
    name: "Мягкая мебель",
    slug: "myagkaya-mebel",
    description: "Диваны, банкетки, пуфы",
    icon: "sofa",
    order: 4,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-soft-sofas",
    name: "Диваны",
    slug: "divany",
    parentId: "cat-soft",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-soft-benches",
    name: "Банкетки",
    slug: "banketki",
    parentId: "cat-soft",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-soft-poufs",
    name: "Пуфы",
    slug: "pufy",
    parentId: "cat-soft",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ОСВЕЩЕНИЕ
  {
    id: "cat-lighting",
    name: "Освещение",
    slug: "osveschenie",
    description: "Светильники, люстры, торшеры",
    icon: "lamp",
    order: 5,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ХРАНЕНИЕ
  {
    id: "cat-storage",
    name: "Хранение",
    slug: "hranenie",
    description: "Шкафы, стеллажи, тумбы",
    icon: "archive",
    order: 6,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ДЕКОР
  {
    id: "cat-decor",
    name: "Декор",
    slug: "dekor",
    description: "Зеркала, вазы, аксессуары",
    icon: "flower",
    order: 7,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-type"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ===== КАТЕГОРИИ ПО КОМНАТЕ =====
export const CATEGORIES_BY_ROOM: Category[] = [
  {
    id: "room-kitchen",
    name: "Для кухни",
    slug: "dlya-kuhni",
    icon: "utensils",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-living",
    name: "Для гостиной",
    slug: "dlya-gostinoy",
    icon: "sofa",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-bedroom",
    name: "Для спальни",
    slug: "dlya-spalni",
    icon: "bed",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-kids",
    name: "Для детской",
    slug: "dlya-detskoy",
    icon: "baby",
    order: 4,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-office",
    name: "Для кабинета",
    slug: "dlya-kabineta",
    icon: "briefcase",
    order: 5,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-hallway",
    name: "Для прихожей",
    slug: "dlya-prihozhey",
    icon: "door-open",
    order: 6,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-outdoor",
    name: "Для улицы",
    slug: "dlya-ulitsy",
    icon: "tree",
    order: 7,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-room"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ===== КАТЕГОРИИ ПО СТИЛЮ =====
export const CATEGORIES_BY_STYLE: Category[] = [
  {
    id: "style-modern",
    name: "Современный",
    slug: "sovremennyy-stil",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-style"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "style-loft",
    name: "Лофт",
    slug: "loft",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-style"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "style-scandinavian",
    name: "Скандинавский",
    slug: "skandinavskiy",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-style"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "style-classic",
    name: "Классика",
    slug: "klassika",
    order: 4,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-style"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "style-minimalism",
    name: "Минимализм",
    slug: "minimalizm",
    order: 5,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-style"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ===== КАТЕГОРИИ ПО НАЗНАЧЕНИЮ =====
export const CATEGORIES_BY_PURPOSE: Category[] = [
  {
    id: "purpose-home",
    name: "Для дома",
    slug: "dlya-doma",
    order: 1,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-purpose"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "purpose-office",
    name: "Для офиса",
    slug: "dlya-ofisa",
    order: 2,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-purpose"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "purpose-horeca",
    name: "HoReCa",
    slug: "horeca",
    description: "Мебель для ресторанов, кафе и гостиниц",
    order: 3,
    isActive: true,
    parameterIds: [],
    navigationType: ["by-purpose"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ===== ВСЕ КАТЕГОРИИ =====
export const ALL_CATEGORIES: Category[] = [
  ...CATEGORIES_BY_TYPE,
  ...CATEGORIES_BY_ROOM,
  ...CATEGORIES_BY_STYLE,
  ...CATEGORIES_BY_PURPOSE,
];

// ===== ФУНКЦИИ =====

// Построение дерева категорий
export function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const categoryMap = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];

  // Создаём карту
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      level: 0,
      path: [cat.name],
    });
  }

  // Строим дерево
  for (const cat of categories) {
    const node = categoryMap.get(cat.id)!;

    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        node.level = parent.level + 1;
        node.path = [...parent.path, cat.name];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Сортируем
  const sortByOrder = (a: CategoryTree, b: CategoryTree) => a.order - b.order;
  roots.sort(sortByOrder);

  const sortChildren = (nodes: CategoryTree[]) => {
    nodes.sort(sortByOrder);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  sortChildren(roots);

  return roots;
}

// Получение категорий по типу навигации
export function getCategoriesByNavigation(
  type: NavigationType
): CategoryTree[] {
  const filtered = ALL_CATEGORIES.filter((c) =>
    c.navigationType.includes(type)
  );
  return buildCategoryTree(filtered);
}

// Получение хлебных крошек
export function getCategoryBreadcrumbs(
  categoryId: string,
  categories: Category[]
): { name: string; slug: string }[] {
  const breadcrumbs: { name: string; slug: string }[] = [];
  let current = categories.find((c) => c.id === categoryId);

  while (current) {
    breadcrumbs.unshift({ name: current.name, slug: current.slug });
    current = current.parentId
      ? categories.find((c) => c.id === current!.parentId)
      : undefined;
  }

  return breadcrumbs;
}

// Поиск категории по slug
export function findCategoryBySlug(slug: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.slug === slug);
}

// Получение всех дочерних ID
export function getAllChildCategoryIds(categoryId: string): string[] {
  const ids: string[] = [categoryId];

  const addChildren = (parentId: string) => {
    const children = ALL_CATEGORIES.filter((c) => c.parentId === parentId);
    for (const child of children) {
      ids.push(child.id);
      addChildren(child.id);
    }
  };

  addChildren(categoryId);
  return ids;
}
