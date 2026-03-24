import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getImportedCategories,
  getProductsByCategory,
  getCategoryBySlug,
} from "@/data/importedProducts";
import FilteredCatalog from "@/components/catalog/FilteredCatalog";

const categoryMeta: Record<
  string,
  { title: string; description: string; h1: string }
> = {
  "barnye-stulya": {
    title: "Барные стулья купить в Москве - Каталог барных стульев",
    description: "Большой выбор барных стульев в интернет-магазине.",
    h1: "Барные стулья",
  },
  stulya: {
    title: "Стулья купить в Москве - Каталог стульев для дома",
    description: "Купить стулья для кухни, гостиной и столовой.",
    h1: "Стулья",
  },
  stoly: {
    title: "Столы купить в Москве - Обеденные и кухонные столы",
    description: "Обеденные столы, кухонные столы, журнальные столики.",
    h1: "Столы",
  },
  kresla: {
    title: "Кресла купить в Москве - Мягкие кресла для дома",
    description: "Мягкие кресла для гостиной и спальни.",
    h1: "Кресла",
  },
  "kompyuternye-kresla": {
    title: "Компьютерные кресла купить в Москве",
    description: "Эргономичные компьютерные кресла для работы и игр.",
    h1: "Компьютерные кресла",
  },
  "ofisnye-stulya": {
    title: "Офисные стулья купить в Москве",
    description: "Офисные стулья и кресла для работы.",
    h1: "Офисные стулья",
  },
  taburetki: {
    title: "Табуретки купить в Москве",
    description: "Табуретки для кухни и дома.",
    h1: "Табуретки",
  },
  komody: {
    title: "Комоды купить в Москве",
    description: "Комоды для спальни и гостиной.",
    h1: "Комоды",
  },
  stellazhi: {
    title: "Стеллажи купить в Москве",
    description: "Стеллажи для хранения книг и вещей.",
    h1: "Стеллажи",
  },
  tumby: {
    title: "Тумбы купить в Москве",
    description: "Прикроватные тумбы и тумбочки.",
    h1: "Тумбы",
  },
  "tumby-tv": {
    title: "Тумбы под ТВ купить в Москве",
    description: "Тумбы под телевизор.",
    h1: "Тумбы под ТВ",
  },
  shkafy: {
    title: "Шкафы купить в Москве",
    description: "Шкафы для одежды, книжные шкафы.",
    h1: "Шкафы",
  },
  pufy: {
    title: "Пуфы купить в Москве",
    description: "Мягкие пуфы и пуфики для дома.",
    h1: "Пуфы",
  },
  zerkala: {
    title: "Зеркала купить в Москве",
    description: "Зеркала для прихожей, спальни и ванной.",
    h1: "Зеркала",
  },
  "sadovaya-mebel": {
    title: "Садовая мебель купить в Москве",
    description: "Садовая мебель для дачи и загородного дома.",
    h1: "Садовая мебель",
  },
};

export const revalidate = 3600; // ISR: rebuild category pages every hour

export async function generateStaticParams() {
  return getImportedCategories().map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = categoryMeta[category];
  const categoryData = getImportedCategories().find((c) => c.slug === category);

  if (!meta || !categoryData) {
    return { title: "Категория не найдена" };
  }

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = getImportedCategories();
  const categoryData = getCategoryBySlug(category);

  if (!categoryData) {
    notFound();
  }

  const products = getProductsByCategory(category);
  const meta = categoryMeta[category];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: "https://kupitstul.ru",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: "https://kupitstul.ru/catalog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: meta?.h1 || categoryData.name,
        item: `https://kupitstul.ru/catalog/${category}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-orange-600">
                Главная
              </Link>
              <span className="text-gray-400">/</span>
              <Link
                href="/catalog"
                className="text-gray-500 hover:text-orange-600"
              >
                Каталог
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">
                {meta?.h1 || categoryData.name}
              </span>
            </nav>
          </div>
        </div>

        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {meta?.h1 || categoryData.name}
                </h1>
                <p className="mt-2 text-gray-600">
                  {products.length} товаров в категории
                </p>
              </div>
              <div className="w-full">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Категории
                </h2>
                <div className="category-scroll-wrapper">
                  <div className="flex gap-2 overflow-x-auto pb-3 category-scrollbar">
                    <Link
                      href="/catalog"
                      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    >
                      Все товары
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/catalog/${cat.slug}`}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          cat.slug === category
                            ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                        }`}
                      >
                        {cat.name}
                        <span className="ml-1 opacity-60">({cat.count})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {products.length > 0 ? (
            <FilteredCatalog products={products} initialCount={24} />
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Товары не найдены
              </h2>
              <p className="text-gray-500 mb-6">
                В этой категории пока нет товаров
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Вернуться в каталог
              </Link>
            </div>
          )}
        </div>

        {meta && (
          <div className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {meta.h1} в интернет-магазине КупитьСтул
              </h2>
              <p className="text-gray-600">{meta.description}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
