import { Metadata } from "next";
import Link from "next/link";
import FilteredCatalog from "@/components/catalog/FilteredCatalog";
import {
  getImportedProducts,
  getImportedCategories,
} from "@/data/importedProducts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Каталог мебели - КупитьСтул | Более 5000 товаров",
  description:
    "Каталог премиальной мебели: стулья, столы, кресла, диваны, освещение. Бесплатная доставка по Москве. Гарантия 1 год.",
  keywords: [
    "каталог мебели",
    "купить мебель",
    "мебель для дома",
    "мебель для офиса",
  ],
};

// Room to categories mapping
const roomCategories: Record<string, { title: string; categories: string[] }> =
  {
    kitchen: {
      title: "Мебель для кухни",
      categories: ["stulya", "stoly", "barnye-stulya"],
    },
    living: {
      title: "Мебель для гостиной",
      categories: [
        "divany",
        "kresla",
        "stoly",
        "stellazhi",
        "tumby-tv",
        "pufy",
      ],
    },
    bedroom: {
      title: "Мебель для спальни",
      categories: ["krovati", "komody", "tumby", "shkafy", "zerkala"],
    },
    office: {
      title: "Мебель для офиса",
      categories: ["kompyuternye-kresla", "stoly", "stellazhi", "shkafy"],
    },
    hallway: {
      title: "Мебель для прихожей",
      categories: ["pufy", "shkafy", "zerkala", "komody", "stellazhi"],
    },
  };

// Style keywords for filtering
const styleKeywords: Record<string, { title: string; keywords: string[] }> = {
  loft: {
    title: "Мебель в стиле Лофт",
    keywords: ["лофт", "loft", "индустриальн", "металл"],
  },
  scandi: {
    title: "Скандинавский стиль",
    keywords: ["сканди", "scandi", "скандинав"],
  },
  classic: {
    title: "Классический стиль",
    keywords: ["классик", "classic", "классическ"],
  },
  modern: {
    title: "Стиль Модерн",
    keywords: ["модерн", "modern", "современн"],
  },
  minimal: {
    title: "Минимализм",
    keywords: ["минимал", "minimal"],
  },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; style?: string; q?: string }>;
}) {
  const params = await searchParams;
  const room = params.room;
  const style = params.style;
  const q = params.q;

  const importedProducts = getImportedProducts();
  const categories = getImportedCategories();
  let filteredProducts = importedProducts;
  let pageTitle = "Каталог мебели";
  let pageSubtitle = "";

  // Filter by room
  if (room && roomCategories[room]) {
    const roomConfig = roomCategories[room];
    pageTitle = roomConfig.title;
    const roomCats = roomConfig.categories;
    // Interleave products from different categories for diverse display
    const byCategory = roomCats.map((cat) =>
      importedProducts.filter((p) => p.category === cat),
    );
    const interleaved: (typeof importedProducts)[number][] = [];
    let maxLen = Math.max(...byCategory.map((arr) => arr.length));
    for (let i = 0; i < maxLen; i++) {
      for (const catProducts of byCategory) {
        if (i < catProducts.length) {
          interleaved.push(catProducts[i]);
        }
      }
    }
    filteredProducts = interleaved;
    pageSubtitle = `${filteredProducts.length} товаров`;
  }

  // Filter by style
  if (style && styleKeywords[style]) {
    const styleConfig = styleKeywords[style];
    pageTitle = styleConfig.title;
    const keywords = styleConfig.keywords;
    filteredProducts = importedProducts.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return keywords.some((kw) => name.includes(kw) || desc.includes(kw));
    });
    pageSubtitle = `${filteredProducts.length} товаров`;
  }

  // Filter by search query
  if (q) {
    const ql = q.toLowerCase();
    pageTitle = `Результаты поиска: "${q}"`;
    filteredProducts = importedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(ql) ||
        (p.description || "").toLowerCase().includes(ql) ||
        p.category.toLowerCase().includes(ql),
    );
    pageSubtitle = `Найдено ${filteredProducts.length} товаров`;
  }
  return (
    <>
      {/* Hero */}
      <section className="bg-gray-50 border-b border-gray-200 py-8 lg:py-10">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Главная
            </Link>
            <span>/</span>
            <span className="text-gray-900">Каталог</span>
          </nav>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {pageTitle}
          </h1>
          <p className="text-gray-600">
            {pageSubtitle ||
              `${filteredProducts.length} товаров в ${categories.length} категориях`}
          </p>
        </div>
      </section>

      {/* Категории */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container py-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Категории
          </h2>
          <div className="category-scroll-wrapper">
            <div className="flex gap-3 overflow-x-auto pb-3 category-scrollbar">
              <Link
                href="/catalog"
                className="flex-shrink-0 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                Все товары
                <span className="ml-1 opacity-70">
                  ({importedProducts.length})
                </span>
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog/${cat.slug}`}
                  className="flex-shrink-0 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors border border-gray-200"
                >
                  {cat.name}
                  <span className="ml-1 text-gray-400">({cat.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Основной контент с фильтрами */}
      <section className="py-8 lg:py-12">
        <div className="container">
          <FilteredCatalog products={filteredProducts} initialCount={24} />
        </div>
      </section>

      {/* SEO текст */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Каталог мебели КупитьСтул
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>
                Интернет-магазин КупитьСтул предлагает широкий ассортимент
                премиальной мебели для дома, офиса и HoReCa. В нашем каталоге{" "}
                {importedProducts.length} наименований: стулья, столы, кресла,
                диваны, освещение и аксессуары.
              </p>
              <p>
                Мы работаем напрямую с производителями, поэтому предлагаем
                выгодные цены и гарантию качества 1 год. Доставка по Москве
                бесплатная при заказе от 100 000 рублей.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
