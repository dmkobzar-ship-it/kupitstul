import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/checkout",
          "/cart",
          "/favorites",
          "/_next/",
        ],
      },
      {
        // Yandex bot — no delay needed for fast indexing
        userAgent: "Yandex",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/checkout",
          "/cart",
          "/favorites",
          "/_next/",
        ],
      },
      {
        // Google — allow everything public
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/checkout",
          "/cart",
          "/favorites",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://kupitstul.ru/sitemap.xml",
    host: "https://kupitstul.ru",
  };
}
