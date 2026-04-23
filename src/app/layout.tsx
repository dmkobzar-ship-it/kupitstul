import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RevealAnimations from "@/components/layout/RevealAnimations";
import { CartProvider } from "@/components/cart/CartProvider";
import { FavoritesProvider } from "@/components/cart/FavoritesProvider";
import FeedbackWidget from "@/components/dev/FeedbackWidget";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "КупитьСтул — Премиальная мебель с доставкой по России",
    template: "%s | КупитьСтул",
  },
  description:
    "Интернет-магазин премиальной мебели: стулья, столы, кресла, диваны. Более 5000 товаров. Быстрая доставка по всей России. Гарантия качества.",
  keywords: [
    "мебель",
    "стулья",
    "столы",
    "кресла",
    "диваны",
    "купить мебель",
    "интернет-магазин мебели",
  ],
  authors: [{ name: "КупитьСтул" }],
  creator: "КупитьСтул",
  publisher: "КупитьСтул",
  metadataBase: new URL("https://kupitstul.ru"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://kupitstul.ru",
    siteName: "КупитьСтул",
    title: "КупитьСтул — Премиальная мебель с доставкой по России",
    description:
      "Интернет-магазин премиальной мебели: стулья, столы, кресла, диваны. Более 5000 товаров.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "КупитьСтул - Премиальная мебель",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "КупитьСтул — Премиальная мебель",
    description: "Интернет-магазин премиальной мебели с доставкой по России",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "КупитьСтул",
    url: "https://kupitstul.ru",
    logo: "https://kupitstul.ru/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Русский",
    },
    sameAs: [],
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "КупитьСтул",
    url: "https://kupitstul.ru",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://kupitstul.ru/catalog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        {/* Яндекс.Метрика - заглушка */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Yandex.Metrika counter will be here
              // window.ym = window.ym || function() { (window.ym.a = window.ym.a || []).push(arguments); };
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <CartProvider>
          <FavoritesProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            {process.env.NODE_ENV === "development" && <FeedbackWidget />}
            <RevealAnimations />
            {/* Онлайн-чат виджет */}
            <script
              src="/chat-widget.js"
              data-color="#2563eb"
              data-title="Онлайн-консультант"
              data-subtitle="Обычно отвечаем в течение 5 минут"
              data-greeting="Здравствуйте! Чем могу помочь? Напишите ваш вопрос, и мы ответим как можно скорее."
            />
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
