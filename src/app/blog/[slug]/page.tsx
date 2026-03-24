import { Metadata } from "next";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  ThumbsUp,
  User,
  Tag,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Article images by slug
const ARTICLE_IMAGES: Record<string, string> = {
  "kak-vybrat-stul-dlya-kukhni":
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&q=80",
  "trendy-mebeli-2025":
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200&q=80",
  "ergonomika-rabochego-mesta":
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=1200&q=80",
  "uhod-za-kozhanoj-mebelyu":
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80",
  "skandinavskij-stil-v-interiere":
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
  "obzor-barnyh-stuliev":
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1200&q=80",
};
const DEFAULT_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80";

// В реальном приложении данные будут загружаться из БД
const getArticle = (slug: string) => {
  return {
    id: 1,
    slug: slug,
    title: "Как выбрать идеальный стул для кухни: полное руководство 2024",
    excerpt:
      "Разбираем все критерии выбора кухонного стула: высота, материалы, стиль.",
    content: `
      <p>Выбор кухонного стула — задача, которая на первый взгляд кажется простой, но на деле требует внимания к множеству деталей. В этом руководстве мы разберём все критерии, которые помогут вам найти идеальный стул для вашей кухни.</p>

      <h2>1. Определите высоту стула</h2>
      <p>Высота стула должна соответствовать высоте вашего стола. Стандартное правило: расстояние от сиденья до столешницы должно составлять 27-30 см. Это обеспечивает комфортную посадку во время приёма пищи.</p>
      <ul>
        <li>Для стола высотой 75 см подойдут стулья с высотой сиденья 45-48 см</li>
        <li>Для барной стойки 90-95 см — барные стулья 60-65 см</li>
        <li>Для высокой барной стойки 105-115 см — стулья 75-80 см</li>
      </ul>

      <h2>2. Выберите материал каркаса</h2>
      <p>Материал каркаса влияет на прочность, вес и стиль стула:</p>
      <ul>
        <li><strong>Дерево</strong> — классика, тепло, долговечность. Подходит для традиционных интерьеров.</li>
        <li><strong>Металл</strong> — прочность, современный вид, лёгкий уход. Идеален для лофта и минимализма.</li>
        <li><strong>Пластик</strong> — лёгкость, доступность, разнообразие цветов. Отлично для современных кухонь.</li>
        <li><strong>Комбинированные</strong> — сочетание материалов для уникального дизайна.</li>
      </ul>

      <h2>3. Обратите внимание на обивку</h2>
      <p>Для кухни важно выбрать практичный материал обивки, который легко чистится:</p>
      <ul>
        <li><strong>Экокожа</strong> — практичная, легко моется, не впитывает запахи</li>
        <li><strong>Велюр</strong> — мягкий и приятный, но требует более тщательного ухода</li>
        <li><strong>Жёсткое сиденье</strong> — без обивки, максимально практично</li>
      </ul>

      <h2>4. Учтите размер кухни</h2>
      <p>Для небольших кухонь выбирайте компактные модели или стулья, которые можно штабелировать. Для просторных помещений подойдут стулья с подлокотниками и более массивные модели.</p>

      <h2>5. Не забудьте про стиль</h2>
      <p>Стулья должны гармонировать с общим стилем кухни и обеденного стола. Не обязательно выбирать стулья из той же коллекции — можно создать интересный микс из разных моделей в одном стиле.</p>

      <h2>Заключение</h2>
      <p>Правильно подобранные стулья сделают вашу кухню не только красивой, но и функциональной. Учитывайте все критерии: высоту, материалы, обивку и стиль. И не забудьте протестировать стул лично, если есть возможность — посетите наш шоурум в Москве!</p>
    `,
    image: ARTICLE_IMAGES[slug] || DEFAULT_ARTICLE_IMAGE,
    category: "Советы",
    categorySlug: "sovety",
    author: {
      name: "Мария Иванова",
      role: "Дизайнер интерьера",
      avatar: "/avatars/maria.jpg",
    },
    date: "15 декабря 2024",
    readTime: "8 мин",
    tags: ["стулья", "кухня", "выбор мебели", "руководство"],
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  return {
    title: `${article.title} — Блог КупитьСтул`,
    description: article.excerpt,
    keywords: article.tags,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.date,
      authors: [article.author.name],
    },
  };
}

const relatedArticles = [
  {
    slug: "obzor-barnyh-stuliev",
    title: "Обзор барных стульев 2024: ТОП-10 моделей",
    image:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80",
    readTime: "12 мин",
  },
  {
    slug: "skandinavskij-stil-v-interiere",
    title: "Скандинавский стиль в интерьере: мебель и детали",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    readTime: "7 мин",
  },
  {
    slug: "uhod-za-kozhanoj-mebelyu",
    title: "Уход за кожаной мебелью: 7 правил долговечности",
    image:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=80",
    readTime: "5 мин",
  },
];

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--bg-tertiary)] py-12 lg:py-16">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Главная
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[var(--color-primary)]">
              Блог
            </Link>
            <span>/</span>
            <span className="truncate max-w-[200px]">{article.title}</span>
          </nav>

          <div className="max-w-4xl">
            <Link
              href={`/blog/category/${article.categorySlug}`}
              className="badge badge-accent mb-4 inline-block"
            >
              {article.category}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold mb-6">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-[var(--text-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-[var(--color-primary)]">
                    {article.author.name}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">
                    {article.author.role}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{article.readTime} чтения</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Контент */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12">
            {/* Статья */}
            <article>
              {/* Изображение */}
              <div className="aspect-[16/9] relative rounded-2xl mb-8 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>

              {/* Текст статьи */}
              <div
                className="prose prose-lg max-w-none
                  prose-headings:text-[var(--color-primary)] prose-headings:font-semibold
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed
                  prose-li:text-[var(--text-secondary)]
                  prose-strong:text-[var(--color-primary)]
                  prose-a:text-[var(--color-accent)] prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Теги */}
              <div className="mt-8 pt-8 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-[var(--text-muted)]" />
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag}`}
                      className="px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Действия */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    <ThumbsUp className="w-5 h-5" />
                    <span>Полезно</span>
                  </button>
                  <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    <Bookmark className="w-5 h-5" />
                    <span>Сохранить</span>
                  </button>
                </div>
                <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span>Поделиться</span>
                </button>
              </div>

              {/* Навигация */}
              <div className="mt-8">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:gap-3 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Вернуться к статьям
                </Link>
              </div>
            </article>

            {/* Сайдбар */}
            <aside className="space-y-8">
              {/* Об авторе */}
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Об авторе</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="font-medium">{article.author.name}</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {article.author.role}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Профессиональный дизайнер интерьера с 10-летним опытом.
                  Помогает создавать уютные и функциональные пространства.
                </p>
              </div>

              {/* Похожие статьи */}
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Похожие статьи</h3>
                <div className="space-y-4">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="flex gap-3 group"
                    >
                      <div className="w-20 h-14 relative rounded-lg flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <span className="text-xs text-[var(--text-muted)]">
                          {item.readTime}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-[var(--color-primary)] text-white rounded-2xl p-6 text-center">
                <h3 className="font-semibold mb-2">Нужна помощь с выбором?</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Наши эксперты помогут подобрать идеальную мебель
                </p>
                <Link href="/kontakty" className="btn-accent w-full">
                  Получить консультацию
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Ещё статьи */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">Ещё статьи</h2>
            <Link
              href="/blog"
              className="text-[var(--color-accent)] hover:underline"
            >
              Все статьи →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/${item.slug}`}
                className="bg-white rounded-2xl overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold group-hover:text-[var(--color-accent)] transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-sm text-[var(--text-muted)]">
                    {item.readTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
