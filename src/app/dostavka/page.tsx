import { Metadata } from "next";
import {
  Truck,
  Clock,
  MapPin,
  Package,
  Calculator,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Доставка мебели по России — бесплатно от 100 000 ₽",
  description:
    "Доставка мебели по Москве, МО и всей России. Бесплатная доставка от 100 000 ₽. Самовывоз со склада. Расчёт стоимости онлайн. ПЭК, Яндекс.Доставка.",
  keywords: [
    "доставка мебели",
    "доставка стульев",
    "доставка по России",
    "бесплатная доставка мебели",
  ],
};

const deliveryMethods = [
  {
    icon: Truck,
    title: "Курьерская доставка",
    description: "По Москве и МО",
    price: "от 500 ₽",
    time: "1-3 дня",
    features: ["Подъём на этаж", "Занос в квартиру", "Проверка товара"],
  },
  {
    icon: Package,
    title: "Транспортные компании",
    description: "По всей России",
    price: "от 300 ₽",
    time: "3-14 дней",
    features: ["ПЭК", "Деловые Линии", "СДЭК", "Яндекс.Доставка"],
  },
  {
    icon: MapPin,
    title: "Самовывоз",
    description: "Со склада в Москве",
    price: "Бесплатно",
    time: "Сегодня",
    features: ["Адрес: ул. Мебельная, 15", "Время: 9:00-21:00", "Парковка"],
  },
];

const deliveryZones = [
  {
    zone: "Москва (в пределах МКАД)",
    price: "от 500 ₽",
    freeFrom: "от 100 000 ₽ — бесплатно",
  },
  {
    zone: "Москва (за МКАД до 10 км)",
    price: "от 700 ₽",
    freeFrom: "от 150 000 ₽ — бесплатно",
  },
  {
    zone: "Московская область",
    price: "от 1 000 ₽",
    freeFrom: "от 200 000 ₽ — бесплатно",
  },
  {
    zone: "Санкт-Петербург",
    price: "от 1 500 ₽",
    freeFrom: "от 250 000 ₽ — бесплатно",
  },
  { zone: "Регионы России", price: "Расчёт ТК", freeFrom: "Индивидуально" },
];

export default function DeliveryPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--bg-tertiary)] py-16">
        <div className="container">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
              <Link href="/" className="hover:text-[var(--color-primary)]">
                Главная
              </Link>
              <span>/</span>
              <span>Доставка</span>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Доставка мебели
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Доставляем мебель по всей России. Бесплатная доставка по Москве
              при заказе от 100 000 ₽. Работаем с ПЭК, СДЭК, Деловые Линии и
              Яндекс.Доставка.
            </p>
          </div>
        </div>
      </section>

      {/* Способы доставки */}
      <section className="section">
        <div className="container">
          <h2 className="section-title mb-10 reveal">Способы доставки</h2>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {deliveryMethods.map((method) => (
              <div
                key={method.title}
                className="bg-white border border-[var(--border-light)] rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center mb-4">
                  <method.icon className="w-7 h-7 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {method.title}
                </h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  {method.description}
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-[var(--color-accent)]">
                      {method.price}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Стоимость
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {method.time}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">Срок</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {method.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-[#374151]"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Стоимость доставки */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="section-title mb-10 reveal">Стоимость доставки</h2>
          <div className="bg-white rounded-xl overflow-hidden border border-[var(--border-light)]">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Зона доставки
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Стоимость
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Бесплатная доставка
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {deliveryZones.map((zone) => (
                  <tr
                    key={zone.zone}
                    className="hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="px-6 py-4 text-[#374151]">{zone.zone}</td>
                    <td className="px-6 py-4 font-medium text-[#374151]">
                      {zone.price}
                    </td>
                    <td className="px-6 py-4 text-green-600">
                      {zone.freeFrom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Калькулятор */}
      <section className="section">
        <div className="container">
          <div className="bg-[var(--bg-dark)] text-white rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Calculator className="w-12 h-12 text-[var(--color-accent)] mb-4" />
                <h2 className="text-3xl font-bold mb-4">
                  Рассчитать стоимость доставки
                </h2>
                <p className="text-gray-400 mb-6">
                  Узнайте точную стоимость доставки до вашего города. Наши
                  менеджеры подберут оптимальный вариант.
                </p>
                <a
                  href="https://max.ru/u/f9LHodD0cOIPBtWTVGHhK2vhVlvbzPiTQhNuprbM8QSn7Y0NiLP04Vv9eKs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent inline-flex items-center gap-2"
                >
                  Рассчитать доставку
                </a>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Ваш город</label>
                    <input
                      type="text"
                      placeholder="Например: Санкт-Петербург"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">
                      Примерный вес заказа
                    </label>
                    <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[#374151]">
                      <option>до 50 кг</option>
                      <option>50-100 кг</option>
                      <option>100-200 кг</option>
                      <option>более 200 кг</option>
                    </select>
                  </div>
                  <a
                    href="https://max.ru/u/f9LHodD0cOIPBtWTVGHhK2vhVlvbzPiTQhNuprbM8QSn7Y0NiLP04Vv9eKs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white py-3 rounded-lg font-medium transition-colors inline-block text-center"
                  >
                    Узнать стоимость
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="section-title mb-10">Частые вопросы о доставке</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl stagger-children">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold mb-2 text-gray-900">
                Как долго ждать доставку?
              </h3>
              <p className="text-[var(--text-secondary)]">
                По Москве — 1-3 рабочих дня. По России — от 3 до 14 дней в
                зависимости от региона.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold mb-2 text-gray-900">
                Можно ли отслеживать заказ?
              </h3>
              <p className="text-[var(--text-secondary)]">
                Да, после отправки вы получите трек-номер для отслеживания на
                сайте транспортной компании.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold mb-2 text-gray-900">
                Входит ли сборка в стоимость?
              </h3>
              <p className="text-[var(--text-secondary)]">
                Большинство товаров поставляются в собранном виде. Сборка
                отдельных позиций — от 500 ₽.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold mb-2 text-gray-900">
                Что делать при повреждении?
              </h3>
              <p className="text-[var(--text-secondary)]">
                При получении обязательно осмотрите товар. В случае повреждения
                — свяжитесь с нами, мы оперативно решим вопрос.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
