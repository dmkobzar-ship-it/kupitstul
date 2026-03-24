import { Metadata } from "next";
import {
  Shield,
  Clock,
  RefreshCw,
  CheckCircle,
  Phone,
  FileText,
  Truck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Гарантия и возврат — КупитьСтул | Условия обмена товара",
  description:
    "Гарантия 1 год на всю мебель. Возврат и обмен в течение 14 дней. Простая процедура оформления возврата. Бесплатная доставка при обмене.",
  keywords: [
    "гарантия на мебель",
    "возврат мебели",
    "обмен товара",
    "гарантийные условия",
  ],
};

const warranties = [
  {
    icon: Shield,
    title: "Гарантия 1 год",
    description:
      "На всю мебель предоставляется гарантия 12 месяцев с момента покупки",
  },
  {
    icon: Clock,
    title: "Возврат 14 дней",
    description:
      "Вернём деньги за товар надлежащего качества в течение 14 дней",
  },
  {
    icon: RefreshCw,
    title: "Бесплатный обмен",
    description:
      "Обменяем товар на другой размер или цвет без доплаты за доставку",
  },
];

const guaranteeConditions = [
  {
    title: "Что входит в гарантию",
    items: [
      "Производственные дефекты материалов",
      "Неисправность механизмов (подъёмные, качания)",
      "Дефекты сварных швов и соединений",
      "Отклеивание кромки и шпона",
      "Неисправность газлифтов и роликов",
      "Поломка фурнитуры (ручки, петли)",
    ],
    type: "included",
  },
  {
    title: "Что не входит в гарантию",
    items: [
      "Механические повреждения (царапины, сколы)",
      "Естественный износ обивки и материалов",
      "Повреждения от неправильной эксплуатации",
      "Самостоятельный ремонт или модификация",
      "Воздействие влаги, химикатов, огня",
      "Повреждения при самовывозе/самосборке",
    ],
    type: "excluded",
  },
];

const returnSteps = [
  {
    step: 1,
    title: "Оформите заявку",
    description:
      "Позвоните нам или заполните форму на сайте. Укажите номер заказа и причину возврата.",
  },
  {
    step: 2,
    title: "Получите подтверждение",
    description:
      "Менеджер свяжется с вами в течение 1 часа для уточнения деталей.",
  },
  {
    step: 3,
    title: "Подготовьте товар",
    description: "Сохраните оригинальную упаковку и товарный вид изделия.",
  },
  {
    step: 4,
    title: "Передайте товар",
    description:
      "Курьер заберёт товар бесплатно или привезите сами в пункт выдачи.",
  },
  {
    step: 5,
    title: "Получите деньги",
    description:
      "Возврат на карту в течение 3-5 рабочих дней после получения товара.",
  },
];

const faq = [
  {
    question: "Можно ли вернуть товар, если он просто не подошёл?",
    answer:
      "Да, вы можете вернуть товар надлежащего качества в течение 14 дней с момента получения. Важно сохранить товарный вид, оригинальную упаковку и все ярлыки.",
  },
  {
    question: "Как быстро вернут деньги?",
    answer:
      "После получения и проверки товара возврат осуществляется в течение 3-5 рабочих дней на карту, с которой была оплата. При оплате наличными — наличными в офисе или переводом.",
  },
  {
    question: "Что делать, если товар пришёл с браком?",
    answer:
      "Свяжитесь с нами в течение 24 часов после получения. Мы организуем бесплатный вывоз и замену товара или вернём деньги. Сфотографируйте дефект для ускорения процесса.",
  },
  {
    question: "Можно ли обменять на другой цвет?",
    answer:
      "Да, обмен на другой цвет или размер возможен в течение 14 дней. Доставка при обмене — бесплатная. Если новый товар дороже, доплачиваете разницу.",
  },
  {
    question: "Как оформить гарантийный ремонт?",
    answer:
      "Позвоните на горячую линию или заполните форму гарантийного обращения. Приложите фото/видео дефекта и чек. Мастер выедет на диагностику в течение 3 рабочих дней.",
  },
  {
    question: "Нужен ли чек для гарантии?",
    answer:
      "Желательно сохранить чек, но мы можем найти заказ по номеру телефона или email. Для юридических лиц обязательны оригиналы документов.",
  },
];

export default function GarantiyaPage() {
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
            <span>Гарантия и возврат</span>
          </nav>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Гарантия и{" "}
            <span className="text-[var(--color-accent)]">возврат</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
            Мы уверены в качестве своей мебели и предоставляем расширенную
            гарантию. Если товар не подошёл — вернём деньги или обменяем.
          </p>
        </div>
      </section>

      {/* Основные преимущества */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            {warranties.map((item) => (
              <div
                key={item.title}
                className="bg-[var(--bg-secondary)] rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-[var(--color-accent)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-[var(--color-accent)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Условия гарантии */}
      <section className="section bg-[var(--bg-secondary)]">
        <div className="container">
          <h2 className="section-title text-center mb-12">Условия гарантии</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {guaranteeConditions.map((block) => (
              <div key={block.title} className="bg-white rounded-2xl p-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                  {block.type === "included" ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  )}
                  {block.title}
                </h3>
                <ul className="space-y-3">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          block.type === "included"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-[var(--text-secondary)]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Процесс возврата */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center mb-4">
            Как оформить возврат
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-12 max-w-2xl mx-auto">
            Простой процесс возврата в 5 шагов. Весь процесс занимает 3-7
            рабочих дней.
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-6">
              {returnSteps.map((item, index) => (
                <div key={item.step} className="text-center relative">
                  {/* Линия между шагами */}
                  {index < returnSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-[var(--border-light)]" />
                  )}
                  <div className="w-16 h-16 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 relative z-10">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <a
              href="tel:+79269084158"
              className="btn-accent inline-flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Оформить возврат: +7 (926) 908-41-58
            </a>
          </div>
        </div>
      </section>

      {/* Важная информация */}
      <section className="section bg-[var(--bg-tertiary)]">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[var(--color-accent)]" />
                <h3 className="font-semibold">Документы для возврата</h3>
              </div>
              <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
                <li>• Чек или накладная</li>
                <li>• Паспорт получателя</li>
                <li>• Заявление на возврат</li>
                <li>• Оригинальная упаковка</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-[var(--color-accent)]" />
                <h3 className="font-semibold">Способы возврата</h3>
              </div>
              <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
                <li>• Курьером (бесплатно по Москве)</li>
                <li>• Самовывоз в пункт выдачи</li>
                <li>• Транспортной компанией</li>
                <li>• В шоуруме при наличии</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-[var(--color-accent)]" />
                <h3 className="font-semibold">Сроки возврата денег</h3>
              </div>
              <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
                <li>• На карту: 3-5 рабочих дней</li>
                <li>• Наличными: сразу в офисе</li>
                <li>• На счёт ЮЛ: 5-7 рабочих дней</li>
                <li>• Электронные кошельки: 1-3 дня</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <h2 className="section-title text-center mb-12">Частые вопросы</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faq.map((item, index) => (
              <details
                key={index}
                className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden group"
              >
                <summary className="p-6 cursor-pointer font-medium flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors">
                  {item.question}
                  <span className="text-2xl text-[var(--color-accent)] group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-[var(--text-secondary)]">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-[var(--bg-dark)] text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Остались вопросы?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Наши специалисты помогут разобраться с любым вопросом по гарантии и
            возврату
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+79269084158" className="btn-accent">
              Позвонить нам
            </a>
            <Link
              href="/kontakty"
              className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-[var(--color-primary)]"
            >
              Написать в чат
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
