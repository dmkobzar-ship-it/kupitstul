import { Metadata } from "next";
import {
  Shield,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "О компании КупитьСтул — премиальная мебель с 2014 года",
  description:
    "КупитьСтул — интернет-магазин премиальной мебели. 10 лет на рынке. Более 50 000 довольных клиентов. Прямые поставки от производителей. Гарантия качества.",
  keywords: [
    "о компании КупитьСтул",
    "магазин мебели",
    "история компании",
    "производитель мебели",
  ],
};

const stats = [
  { value: "10+", label: "лет на рынке" },
  { value: "50 000+", label: "довольных клиентов" },
  { value: "5 000+", label: "товаров в каталоге" },
  { value: "98%", label: "положительных отзывов" },
];

const values = [
  {
    icon: Shield,
    title: "Качество",
    description:
      "Мы тщательно отбираем поставщиков и контролируем качество каждого товара.",
  },
  {
    icon: Award,
    title: "Честность",
    description:
      "Прозрачные цены без скрытых наценок. То, что видите — то и платите.",
  },
  {
    icon: Users,
    title: "Клиентоориентированность",
    description:
      "Индивидуальный подход к каждому клиенту. Помогаем с выбором и консультируем.",
  },
  {
    icon: TrendingUp,
    title: "Развитие",
    description:
      "Постоянно расширяем ассортимент и улучшаем сервис для наших клиентов.",
  },
];

const timeline = [
  {
    year: "2014",
    title: "Основание компании",
    description: "Начали с небольшого шоурума в Москве",
  },
  {
    year: "2016",
    title: "Запуск интернет-магазина",
    description: "Открыли онлайн-продажи по всей России",
  },
  {
    year: "2018",
    title: "Расширение ассортимента",
    description: "Добавили столы, кресла и освещение",
  },
  {
    year: "2020",
    title: "Собственный склад",
    description: "Открыли логистический центр 5000 м²",
  },
  {
    year: "2022",
    title: "50 000 клиентов",
    description: "Достигли важного рубежа доверия",
  },
  {
    year: "2024",
    title: "Обновление платформы",
    description: "Запустили новый сайт с AR-просмотром",
  },
];

function getTeamPhoto(): string {
  try {
    const configPath = path.join(process.cwd(), "data", "about-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return config.teamPhoto || "";
    }
  } catch {
    // ignore
  }
  return "";
}

export default function AboutPage() {
  const teamPhoto = getTeamPhoto();
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--bg-tertiary)] py-16 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
                <Link href="/" className="hover:text-[var(--color-primary)]">
                  Главная
                </Link>
                <span>/</span>
                <span>О компании</span>
              </nav>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                О компании{" "}
                <span className="text-[var(--color-accent)]">КупитьСтул</span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] mb-8">
                Мы — команда профессионалов, влюблённых в качественную мебель. С
                2014 года помогаем создавать уютные интерьеры для дома, офиса и
                HoReCa.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold text-[var(--color-primary)]">
                      {stat.value}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {teamPhoto ? (
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden">
                  <Image
                    src={teamPhoto}
                    alt="Команда КупитьСтул"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center text-[var(--text-muted)]">
                  Фото команды / шоурума
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Наши ценности */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">Наши ценности</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Принципы, которыми мы руководствуемся каждый день
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6">
                <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-[var(--color-accent)]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* История */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">Наша история</h2>
            <p className="text-[var(--text-secondary)]">
              Путь от маленького шоурума до крупного интернет-магазина
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Линия */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[var(--border-light)]" />

              {timeline.map((item, index) => (
                <div
                  key={item.year}
                  className="relative flex gap-6 pb-8 last:pb-0"
                >
                  {/* Точка */}
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  {/* Контент */}
                  <div className="bg-white rounded-xl p-6 flex-1 shadow-sm">
                    <div className="text-[var(--color-accent)] font-bold mb-1">
                      {item.year}
                    </div>
                    <h3 className="font-semibold mb-2 text-[#374151]">
                      {item.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Почему мы */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Почему выбирают нас?</h2>
              <div className="space-y-4">
                {[
                  "Прямые поставки от производителей без посредников",
                  "Гарантия качества на всю продукцию — 1 год",
                  "Бесплатная доставка по Москве от 100 000 ₽",
                  "Профессиональная консультация дизайнера",
                  "Удобная рассрочка от Сбера и Т-Банка",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-2xl p-8 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-8 h-8 text-[var(--color-accent)] fill-[var(--color-accent)]"
                  />
                ))}
              </div>
              <div className="text-4xl font-bold mb-2">5 из 5</div>
              <div className="text-[var(--text-secondary)] mb-4">
                Средняя оценка от клиентов
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                На основе 2000+ отзывов
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-[var(--bg-dark)] text-white">
        <div className="container text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Готовы начать сотрудничество?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Свяжитесь с нами для получения консультации или посетите наш шоурум
            в Москве.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/catalog" className="btn-accent">
              Перейти в каталог
            </Link>
            <Link
              href="/kontakty"
              className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-[var(--color-primary)]"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
