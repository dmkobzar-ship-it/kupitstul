import axios from "axios";
import * as cheerio from "cheerio";

interface ScrapedProduct {
  externalId: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  images: string[];
  category: string;
  url: string;
  source: "stoolgroup" | "other";
  scrapedAt: Date;
}

export class ProductScraper {
  async scrapeStoolGroup(): Promise<ScrapedProduct[]> {
    try {
      // Главная страница
      const { data } = await axios.get("https://stoolgroup.ru", {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MyParser/1.0)",
        },
      });

      const $ = cheerio.load(data);
      const products: ScrapedProduct[] = [];

      // Парсим по структуре Stool Group (на основе анализа их HTML)
      $("div").each((i, element) => {
        const name = $(element).find("h3, h4").first().text().trim();
        const priceText = $(element)
          .text()
          .match(/(\d[\d\s]*)\s*₽/);

        if (name && priceText && name.length > 3) {
          const price = parseInt(priceText[1].replace(/\s/g, ""));

          // Находим изображения
          const images: string[] = [];
          $(element)
            .find("img")
            .each((j, img) => {
              const src = $(img).attr("src");
              if (src && !src.includes("data:image")) {
                images.push(
                  src.startsWith("http") ? src : `https://stoolgroup.ru${src}`
                );
              }
            });

          // Определяем категорию по контексту
          const category = this.detectCategory(name);

          products.push({
            externalId: `stool_${Date.now()}_${i}`,
            name: name.substring(0, 100), // ограничиваем длину
            price,
            images: images.slice(0, 3), // берем до 3 изображений
            category,
            url: "https://stoolgroup.ru",
            source: "stoolgroup",
            scrapedAt: new Date(),
          });
        }
      });

      return products.filter((p) => p.price > 0 && p.name.length > 5);
    } catch (error) {
      console.error("Ошибка парсинга:", error);
      return [];
    }
  }

  private detectCategory(name: string): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("стул") || lowerName.includes("chair"))
      return "Стулья";
    if (lowerName.includes("стол") || lowerName.includes("table"))
      return "Столы";
    if (lowerName.includes("диван") || lowerName.includes("sofa"))
      return "Диваны";
    if (lowerName.includes("кресло") || lowerName.includes("armchair"))
      return "Кресла";
    if (lowerName.includes("светильник") || lowerName.includes("lamp"))
      return "Светильники";

    return "Другое";
  }

  async scrapeMultipleSources(): Promise<ScrapedProduct[]> {
    const sources = [
      this.scrapeStoolGroup(),
      // this.scrapeIkea(), // пример других источников
      // this.scrapeLeroyMerlin(),
    ];

    const results = await Promise.allSettled(sources);
    const allProducts: ScrapedProduct[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        allProducts.push(...result.value);
      }
    });

    return allProducts;
  }
}
