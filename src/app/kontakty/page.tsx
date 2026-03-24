import { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакты — КупитьСтул | Магазин мебели в Москве",
  description:
    "Контакты интернет-магазина КупитьСтул. Телефон: +7 (926) 908-41-58. Адрес шоурума: Москва, ул. Мебельная, 15. Работаем ежедневно с 9:00 до 21:00.",
  keywords: [
    "контакты КупитьСтул",
    "магазин мебели Москва",
    "шоурум мебели",
    "адрес магазина мебели",
  ],
};

const contacts = [
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (926) 908-41-58",
    href: "tel:+79269084158",
    description: "Звоните с 9:00 до 21:00",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@kupitstul.ru",
    href: "mailto:info@kupitstul.ru",
    description: "Ответим в течение часа",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "+7 (926) 908-41-58",
    href: "https://wa.me/79269084158",
    description: "Пишите в любое время",
  },
  {
    icon: Send,
    title: "Telegram",
    value: "@kupitstul",
    href: "https://t.me/kupitstul",
    description: "Быстрые ответы",
  },
];

export default function ContactsPage() {
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
              <span>Контакты</span>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Контакты</h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Свяжитесь с нами любым удобным способом. Наши консультанты помогут
              с выбором мебели и ответят на все вопросы.
            </p>
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contacts.map((contact) => (
              <a
                key={contact.title}
                href={contact.href}
                className="bg-white border border-[var(--border-light)] rounded-xl p-6 hover:shadow-lg hover:border-[var(--color-accent)] transition-all group"
              >
                <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent)] transition-colors">
                  <contact.icon className="w-6 h-6 text-[var(--color-primary)] group-hover:text-white transition-colors" />
                </div>
                <div className="text-sm text-[var(--text-muted)] mb-1">
                  {contact.title}
                </div>
                <div className="font-semibold text-lg mb-1">
                  {contact.value}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {contact.description}
                </div>
              </a>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Форма обратной связи */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Напишите нам</h2>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Имя *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ваше имя"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+7 (___) ___-__-__"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Сообщение
                  </label>
                  <textarea
                    className="input min-h-[120px]"
                    placeholder="Ваш вопрос или комментарий"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    className="mt-1"
                    required
                  />
                  <label
                    htmlFor="privacy"
                    className="text-sm text-[var(--text-secondary)]"
                  >
                    Я согласен с{" "}
                    <Link
                      href="/privacy"
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      политикой конфиденциальности
                    </Link>
                  </label>
                </div>
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  Отправить сообщение
                </button>
              </form>
            </div>

            {/* Шоурум */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Шоурум в Москве</h2>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <MapPin className="w-6 h-6 text-[var(--color-accent)] flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Адрес</div>
                    <div className="text-[var(--text-secondary)]">
                      Москва, ул. Мебельная, 15
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Станция метро: Мебельная (5 минут пешком)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-[var(--color-accent)] flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">Время работы</div>
                    <div className="text-[var(--text-secondary)]">
                      Ежедневно с 9:00 до 21:00
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Без выходных и перерывов
                    </div>
                  </div>
                </div>
              </div>

              {/* Карта (заглушка) */}
              <div className="aspect-video bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-[var(--text-muted)]">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Здесь будет Яндекс.Карта</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Реквизиты */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">Реквизиты компании</h2>
          <div className="bg-white rounded-xl p-6 max-w-2xl">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[var(--text-muted)] mb-1">
                  Юридическое лицо
                </div>
                <div className="font-medium">ООО «КупитьСтул»</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] mb-1">ИНН</div>
                <div className="font-medium">7712345678</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] mb-1">КПП</div>
                <div className="font-medium">771201001</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] mb-1">ОГРН</div>
                <div className="font-medium">1167746123456</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[var(--text-muted)] mb-1">
                  Юридический адрес
                </div>
                <div className="font-medium">
                  123456, г. Москва, ул. Мебельная, д. 15, офис 101
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
