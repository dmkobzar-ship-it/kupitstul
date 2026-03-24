"use client";

import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  catalog: [
    { name: "Стулья", href: "/catalog/stulya" },
    { name: "Столы", href: "/catalog/stoly" },
    { name: "Кресла", href: "/catalog/kresla" },
    { name: "Диваны", href: "/catalog/divany" },
    { name: "Освещение", href: "/catalog/osveschenie" },
    { name: "Все товары", href: "/catalog" },
  ],
  company: [
    { name: "О компании", href: "/o-nas" },
    { name: "Блог", href: "/blog" },
    { name: "Контакты", href: "/kontakty" },
    { name: "Вакансии", href: "/vakansii" },
  ],
  help: [
    { name: "Доставка", href: "/dostavka" },
    { name: "Оплата", href: "/oplata" },
    { name: "Рассрочка", href: "/rassrochka" },
    { name: "FAQ", href: "/faq" },
  ],
};

export default function Footer() {
  const handleSubscribe = () => {
    window.open(
      "https://max.ru/u/f9LHodD0cOIPBtWTVGHhK2vhVlvbzPiTQhNuprbM8QSn7Y0NiLP04Vv9eKs",
      "_blank",
    );
  };

  return (
    <footer className="bg-white text-[#1f2937] border-t border-gray-200">
      {/* Подписка */}
      <div className="border-b border-gray-200">
        <div className="container py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-[#1f2937]">
                Подпишитесь на новинки и акции
              </h3>
              <p className="text-[#6b7280]">
                Напишите нам в MAX — узнавайте первыми о скидках и новых
                поступлениях
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <button
                onClick={handleSubscribe}
                className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>Написать в MAX</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Лого и контакты */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-bold text-[#1f2937]">
                КУПИТЬ<span className="text-[var(--color-accent)]">СТУЛ</span>
              </span>
            </Link>
            <p className="text-[#6b7280] mb-6 max-w-sm">
              Премиальная мебель с доставкой по России. Более 5000 товаров в
              каталоге. Гарантия качества.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+79269084158"
                className="flex items-center gap-3 text-[#6b7280] hover:text-[var(--color-accent)] transition-colors"
              >
                <Phone className="w-5 h-5 text-[var(--color-accent)]" />
                <span>+7 (926) 908-41-58</span>
              </a>
              <a
                href="mailto:info@kupitstul.ru"
                className="flex items-center gap-3 text-[#6b7280] hover:text-[var(--color-accent)] transition-colors"
              >
                <Mail className="w-5 h-5 text-[var(--color-accent)]" />
                <span>info@kupitstul.ru</span>
              </a>
              <div className="flex items-center gap-3 text-[#6b7280]">
                <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
                <span>Москва, ул. Мебельная, 15</span>
              </div>
              <div className="flex items-center gap-3 text-[#6b7280]">
                <Clock className="w-5 h-5 text-[var(--color-accent)]" />
                <span>9:00 — 21:00 ежедневно</span>
              </div>
            </div>
          </div>

          {/* Каталог */}
          <div>
            <h4 className="font-semibold mb-4 text-[#1f2937]">Каталог</h4>
            <ul className="space-y-2">
              {footerLinks.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#6b7280] hover:text-[var(--color-accent)] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Компания */}
          <div>
            <h4 className="font-semibold mb-4 text-[#1f2937]">Компания</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#6b7280] hover:text-[var(--color-accent)] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Помощь */}
          <div>
            <h4 className="font-semibold mb-4 text-[#1f2937]">Покупателям</h4>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#6b7280] hover:text-[var(--color-accent)] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Нижняя часть */}
      <div className="border-t border-gray-200">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#9ca3af] text-sm">
              © 2024—2026 КупитьСтул. Все права защищены.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-[#9ca3af] hover:text-[var(--color-accent)] text-sm transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link
                href="/oferta"
                className="text-[#9ca3af] hover:text-[var(--color-accent)] text-sm transition-colors"
              >
                Оферта
              </Link>
            </div>
            {/* Соцсети */}
            <div className="flex items-center gap-4">
              <a
                href="https://t.me/kupitstul"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                aria-label="Telegram"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="https://vk.com/kupitstul"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                aria-label="VK"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.814-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
