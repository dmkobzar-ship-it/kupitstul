import { Metadata } from "next";
import { Calendar, Clock, ArrowRight, Tag, User, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getTodayArticle } from "@/lib/blogGenerator";
import BlogSubscribeForm from "@/components/blog/BlogSubscribeForm";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог о мебели — КупитьСтул | Советы по выбору и уходу за мебелью",
  description:
    "Полезные статьи о выборе мебели для дома и офиса. Тренды интерьера, советы дизайнеров, уход за мебелью. Экспертные материалы от КупитьСтул.",
  keywords: [
    "блог о мебели",
    "статьи о мебели",
    "тренды интерьера",
    "советы по выбору мебели",
    "уход за мебелью",
  ],
};

const categories = [
  { slug: "trendy", name: "Тренды", count: 24 },
  { slug: "sovety", name: "Советы", count: 45 },
  { slug: "interier", name: "Интерьер", count: 32 },
  { slug: "uhod", name: "Уход за мебелью", count: 18 },
  { slug: "obzory", name: "Обзоры", count: 27 },
];

const articles = [
  {
    id: 1,
    slug: "kak-vybrat-stul-dlya-kukhni",
    title: "Как выбрать идеальный стул для кухни: полное руководство 2024",
    excerpt:
      "Разбираем все критерии выбора кухонного стула: высота, материалы, стиль. Сравнение популярных моделей и рекомендации дизайнеров.",
    image:
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
    category: "Советы",
    author: "Мария Иванова",
    date: "15 декабря 2024",
    readTime: "8 мин",
    featured: true,
  },
  {
    id: 2,
    slug: "trendy-mebeli-2025",
    title: "Тренды мебели 2025: что будет модно в новом году",
    excerpt:
      "Обзор главных трендов в дизайне мебели на 2025 год. Материалы, цвета, формы и стили, которые будут актуальны.",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
    category: "Тренды",
    author: "Дмитрий Козлов",
    date: "12 декабря 2024",
    readTime: "6 мин",
    featured: true,
  },
  {
    id: 3,
    slug: "ergonomika-rabochego-mesta",
    title: "Эргономика рабочего места: как сохранить здоровье спины",
    excerpt:
      "Научный подход к организации рабочего пространства. Правильная посадка, высота стола и выбор офисного кресла.",
    image:
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80",
    category: "Советы",
    author: "Алексей Петров",
    date: "10 декабря 2024",
    readTime: "10 мин",
    featured: false,
  },
  {
    id: 4,
    slug: "uhod-za-kozhanoj-mebelyu",
    title: "Уход за кожаной мебелью: 7 правил долговечности",
    excerpt:
      "Как правильно ухаживать за кожаной обивкой. Чистка, увлажнение, защита от солнца и частые ошибки владельцев.",
    image:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    category: "Уход за мебелью",
    author: "Елена Смирнова",
    date: "8 декабря 2024",
    readTime: "5 мин",
    featured: false,
  },
  {
    id: 5,
    slug: "skandinavskij-stil-v-interiere",
    title: "Скандинавский стиль в интерьере: мебель и детали",
    excerpt:
      "Принципы скандинавского дизайна в выборе мебели. Как создать уютный и функциональный интерьер в духе hygge.",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    category: "Интерьер",
    author: "Мария Иванова",
    date: "5 декабря 2024",
    readTime: "7 мин",
    featured: false,
  },
  {
    id: 6,
    slug: "obzor-barnyh-stuliev",
    title: "Обзор барных стульев 2024: ТОП-10 моделей",
    excerpt:
      "Детальный обзор лучших барных стульев. Сравнение по цене, качеству и удобству. Рейтинг от экспертов КупитьСтул.",
    image:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
    category: "Обзоры",
    author: "Дмитрий Козлов",
    date: "3 декабря 2024",
    readTime: "12 мин",
    featured: false,
  },
  {
    id: 7,
    slug: "trendy-mebeli-2026-ekomaterialy-biofiliya-kastomizaciya",
    title: "Тренды мебели 2026: экоматериалы, биофилия и кастомизация",
    excerpt:
      "Что происходит в мире мебельного дизайна в 2026 году? Разбираем три главных тренда: экологичные материалы, биофильный дизайн и персонализация. Как они меняют рынок и что выбрать для современного интерьера.",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    category: "Тренды",
    author: "Анна Соколова",
    date: "20 февраля 2026",
    readTime: "6 мин",
    featured: false,
  },
  {
    id: 8,
    slug: "umnaya-mebel-iot-tekhnologii-v-intere-2026",
    title: "Умная мебель: IoT-технологии в интерьере 2026",
    excerpt:
      "Диваны с встроенной зарядкой, столы с подсветкой и умные стеллажи с датчиками — рассказываем, как технологии Интернета вещей проникают в мебель и зачем это нужно современному покупателю.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    category: "Технологии",
    author: "Игорь Петров",
    date: "25 февраля 2026",
    readTime: "8 мин",
    featured: false,
  },
];

// Load admin-managed articles from JSON file
function getAdminArticles() {
  try {
    const filePath = path.join(process.cwd(), "data", "blog-articles.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as typeof articles;
    }
  } catch {
    // ignore
  }
  return [];
}

const featuredArticles = articles.filter((a) => a.featured);
const regularArticles = articles.filter((a) => !a.featured);

export default function BlogPage() {
  const dailyArticle = getTodayArticle();
  const adminArticles = getAdminArticles();
  // Merge: admin articles first, then hardcoded ones
  const allRegularArticles = [...adminArticles.filter((a: { featured?: boolean }) => !a.featured), ...regularArticles];
  const allFeaturedArticles = [...adminArticles.filter((a: { featured?: boolean }) => a.featured), ...featuredArticles];
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--bg-tertiary)] py-16 lg:py-20">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Главная
            </Link>
            <span>/</span>
            <span>Блог</span>
          </nav>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Блог о <span className="text-[var(--color-accent)]">мебели</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
            Полезные статьи, советы по выбору и уходу за мебелью, тренды
            интерьера и экспертные обзоры от команды КупитьСтул.
          </p>
        </div>
      </section>

      {/* Статья дня — авто-генерация */}
      <section className="container py-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">Статья дня</h2>
          <span className="text-xs text-gray-400 ml-1">
            обновляется ежедневно
          </span>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="relative md:w-72 h-48 md:h-auto flex-shrink-0">
            <Image
              src={dailyArticle.image}
              alt={dailyArticle.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 288px"
            />
          </div>
          <div className="p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">
                {dailyArticle.category}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dailyArticle.readTime}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {dailyArticle.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {dailyArticle.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                {dailyArticle.author}
              </span>
              <Link
                href={`/blog/${dailyArticle.slug}`}
                className="text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                Читать <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="border-b border-[var(--border-light)]">
        <div className="container">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            <Link
              href="/blog"
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-full text-sm font-medium whitespace-nowrap"
            >
              Все статьи
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/blog/category/${cat.slug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              >
                {cat.name}{" "}
                <span className="text-[var(--text-muted)]">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured статьи */}
      <section className="section">
        <div className="container">
          <h2 className="section-title mb-8">Популярные статьи</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {allFeaturedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-[var(--bg-secondary)] rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="badge badge-accent">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-[var(--color-accent)] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {article.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {article.readTime}
                      </span>
                    </div>
                    <span className="text-[var(--color-accent)] flex items-center gap-1 group-hover:gap-2 transition-all">
                      Читать <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Все статьи */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="section-title mb-8">Все статьи</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRegularArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold mb-2 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {article.author}
                    </span>
                    <span>{article.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Пагинация */}
          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-lg bg-[var(--color-primary)] text-white font-medium">
                1
              </button>
              <button className="w-10 h-10 rounded-lg bg-white hover:bg-[var(--bg-tertiary)] transition-colors text-gray-900 font-medium">
                2
              </button>
              <button className="w-10 h-10 rounded-lg bg-white hover:bg-[var(--bg-tertiary)] transition-colors text-gray-900 font-medium">
                3
              </button>
              <span className="w-10 h-10 flex items-center justify-center text-gray-900">
                ...
              </span>
              <button className="w-10 h-10 rounded-lg bg-white hover:bg-[var(--bg-tertiary)] transition-colors text-gray-900 font-medium">
                12
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Подписка на блог */}
      <section className="section">
        <div className="container">
          <div className="bg-[var(--bg-dark)] text-white rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Подпишитесь на блог</h2>
                <p className="text-gray-400">
                  Получайте свежие статьи, советы по выбору мебели и
                  эксклюзивные предложения. Оставьте email и/или телефон для
                  рассылки в MAX или добавления в канал.
                </p>
              </div>
              <BlogSubscribeForm />
            </div>
          </div>
        </div>
      </section>

      {/* SEO текст */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-lg space-y-6 reveal">
            <h2 className="mb-4">Блог интернет-магазина мебели КупитьСтул</h2>
            <p className="mt-4">
              Добро пожаловать в наш блог о мебели! Здесь мы делимся экспертными
              знаниями о выборе мебели для дома и офиса, рассказываем о трендах
              интерьерного дизайна и даём практические советы по уходу за
              мебелью.
            </p>
            <p className="mt-4">
              Наша команда — профессиональные дизайнеры и эксперты с многолетним
              опытом в мебельной индустрии. Мы публикуем статьи о стульях,
              столах, креслах, офисной мебели и предметах интерьера.
            </p>
            <p className="mt-4">
              В блоге вы найдёте: руководства по выбору мебели для разных
              помещений, обзоры популярных моделей, сравнения материалов обивки,
              советы по созданию эргономичного рабочего места и многое другое.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
