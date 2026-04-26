import Link from "next/link";
import {
  ArrowRight,
  Truck,
  Shield,
  CreditCard,
  Headphones,
  Star,
  ChevronRight,
} from "lucide-react";
import { getImportedProducts } from "@/data/importedProducts";
import HomeProductCard from "@/components/home/HomeProductCard";
import HeroGallery from "@/components/home/HeroGallery";
import * as fs from "fs";
import * as path from "path";

// Заставляем Next.js рендерить страницу при каждом запросе (для ротации товаров)
export const dynamic = "force-dynamic";

// Read homepage config from JSON file
function getHomepageConfig() {
  try {
    const configPath = path.join(
      process.cwd(),
      "src",
      "data",
      "homepage-config.json",
    );
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { heroSlides: [], categories: [], collections: [] };
  }
}

// Берём случайные товары из каталога (разные категории, обновляются при каждом рендере)
const getPopularProducts = () => {
  const allProducts = getImportedProducts();
  const selected: ReturnType<typeof getImportedProducts> = [];
  const cats = ["stulya", "barnye-stulya", "kresla", "stoly"];

  // Берём по 2 случайных товара из каждой категории
  // Исключаем товары со слагами содержащими кириллицу — они возвращают 404
  const ASCII_SLUG = /^[a-z0-9_-]+$/;
  cats.forEach((cat) => {
    const catProducts = allProducts.filter(
      (p) =>
        p.category === cat && p.images.length > 0 && ASCII_SLUG.test(p.slug),
    );
    // Перемешиваем Fisher-Yates
    for (let i = catProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [catProducts[i], catProducts[j]] = [catProducts[j], catProducts[i]];
    }
    selected.push(...catProducts.slice(0, 2));
  });

  return selected.slice(0, 8);
};

// Преимущества
const advantages = [
  {
    icon: Truck,
    title: "Бесплатная доставка",
    description: "При заказе от 100 000 ₽",
  },
  { icon: Shield, title: "Гарантия 1 год", description: "На всю продукцию" },
  {
    icon: CreditCard,
    title: "Рассрочка 0%",
    description: "От Сбера и Т-Банка",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    description: "Ответим на вопросы",
  },
];

export default function Home() {
  const popularProducts = getPopularProducts();
  const homepageConfig = getHomepageConfig();
  const categories = homepageConfig.categories || [];
  const collections = homepageConfig.collections || [];
  const heroSlides = homepageConfig.heroSlides || [];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-white overflow-hidden pb-8 lg:pb-12">
        <div className="container py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-[#374151]">
                  Более {getImportedProducts().length.toLocaleString("ru-RU")}{" "}
                  товаров в наличии
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-[#1f2937]">
                Премиальная мебель
                <span className="block text-[var(--color-accent)] mt-2">
                  с доставкой по России
                </span>
              </h1>

              <p className="text-lg text-[#6b7280] max-w-lg leading-relaxed">
                Стулья, столы, кресла и диваны от лучших производителей.
                Создайте интерьер мечты вместе с нами.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/catalog"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Перейти в каталог
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/o-nas" className="btn-secondary">
                  О компании
                </Link>
              </div>

              <div className="flex gap-8 pt-4 border-t border-gray-100 mt-6">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold text-[#1f2937]">
                    5000+
                  </div>
                  <div className="text-sm text-[#9ca3af] mt-1">товаров</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold text-[#1f2937]">
                    50 000+
                  </div>
                  <div className="text-sm text-[#9ca3af] mt-1">клиентов</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold text-[#1f2937]">
                    10 лет
                  </div>
                  <div className="text-sm text-[#9ca3af] mt-1">на рынке</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
                <HeroGallery slides={heroSlides} />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1f2937]">4.9 / 5</div>
                    <div className="text-sm text-[#9ca3af]">2000+ отзывов</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="bg-white border-y border-gray-200">
        <div className="container py-16 lg:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 stagger-children">
            {advantages.map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                  <item.icon className="w-6 h-6 text-[#374151]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1f2937] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6b7280]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="pt-16 pb-12 lg:pb-16 bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-8 reveal">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1f2937] mb-2">
                Каталог товаров
              </h2>
              <p className="text-[#6b7280]">Выберите категорию</p>
            </div>
            <Link
              href="/catalog"
              className="hidden sm:flex items-center gap-1 text-[var(--color-accent)] font-medium hover:underline"
            >
              Все категории
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 stagger-children">
            {categories.map((cat) => (
              <Link key={cat.id} href={cat.href} className="group">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <h3 className="font-medium text-[#1f2937] group-hover:text-[var(--color-accent)] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-[#9ca3af]">{cat.count} товаров</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Товары */}
      <section className="py-12 lg:py-16 bg-gray-50 border-y border-gray-200">
        <div className="container">
          <div className="flex items-end justify-between mb-8 reveal">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1f2937] mb-2">
                Популярные товары
              </h2>
              <p className="text-[#6b7280]">Бестселлеры месяца</p>
            </div>
            <Link
              href="/catalog?sort=popular"
              className="hidden sm:flex items-center gap-1 text-[var(--color-accent)] font-medium hover:underline"
            >
              Все товары
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="catalog-grid stagger-children">
            {popularProducts.map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Коллекции */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="container">
          <div className="text-center mb-8 reveal">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1f2937] mb-2">
              Коллекции
            </h2>
            <p className="text-[#6b7280]">Подберите мебель под ваши задачи</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={col.href}
                className="relative h-80 rounded-2xl overflow-hidden group"
              >
                {/* Фоновое изображение */}
                <img
                  src={col.image}
                  alt={col.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Затемнение */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/90 transition-all duration-300" />
                {/* Контент */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{col.name}</h3>
                  <p className="text-white/80 mb-4">{col.description}</p>
                  <span className="inline-flex items-center gap-2 font-medium group-hover:gap-3 transition-all">
                    Смотреть
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Доверие */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1f2937] mb-6">
                Почему выбирают нас?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    n: "1",
                    t: "Прямые поставки",
                    d: "Без посредников. Цены ниже до 40%",
                  },
                  {
                    n: "2",
                    t: "Профессиональный сервис",
                    d: "Бесплатная консультация дизайнера",
                  },
                  {
                    n: "3",
                    t: "Гарантия качества",
                    d: "более 10 лет проверенной работы!",
                  },
                ].map((i) => (
                  <div key={i.n} className="flex gap-4">
                    <div className="w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-white">{i.n}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1f2937] mb-1">
                        {i.t}
                      </h4>
                      <p className="text-[#6b7280]">{i.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200 reveal-right reveal-scale">
              <div className="text-5xl font-bold text-[var(--color-accent)] mb-2">
                98%
              </div>
              <div className="text-lg text-[#1f2937] mb-6">
                клиентов рекомендуют
              </div>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-8 h-8 text-[var(--color-accent)] fill-[var(--color-accent)]"
                  />
                ))}
              </div>
              <div className="text-[#6b7280] mt-2">Оценка 4.9 из 5</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="container text-center reveal">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1f2937] mb-4">
            Готовы обновить интерьер?
          </h2>
          <p className="text-[#6b7280] mb-8 max-w-2xl mx-auto">
            Получите бесплатную консультацию дизайнера.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/catalog"
              className="btn-primary inline-flex items-center gap-2"
            >
              В каталог
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+79269084158" className="btn-secondary">
              Позвонить
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
