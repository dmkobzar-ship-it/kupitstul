import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Star, Truck, Shield, Check } from "lucide-react";
import { getImportedProducts, getProductBySlug } from "@/data/importedProducts";
import ProductGallery from "@/components/product/ProductGallery";
import ProductActions from "@/components/product/ProductActions";
import RelatedProducts from "@/components/product/RelatedProducts";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Товар не найден" };
  }

  const description =
    product.description?.slice(0, 160) ||
    `Купить ${product.name} по цене ${product.price.toLocaleString("ru-RU")} ₽ в интернет-магазине КупитьСтул. Доставка по Москве, гарантия 1 год.`;

  const ogImage = product.images?.[0] || "/og-default.jpg";

  return {
    title: `${product.name} — купить за ${product.price.toLocaleString("ru-RU")} ₽ | КупитьСтул`,
    description,
    keywords: [
      product.name,
      product.category,
      "купить мебель",
      "мебель москва",
    ],
    openGraph: {
      title: `${product.name} — ${product.price.toLocaleString("ru-RU")} ₽`,
      description,
      images: [{ url: ogImage, width: 800, height: 800, alt: product.name }],
      type: "website",
      siteName: "КупитьСтул",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${product.price.toLocaleString("ru-RU")} ₽`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `/catalog/product/${product.slug}`,
    },
  };
}

export async function generateStaticParams() {
  return getImportedProducts()
    .slice(0, 50)
    .map((product) => ({
      slug: product.slug,
    }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const categoryNames: Record<string, string> = {
    stulya: "Стулья",
    stoly: "Столы",
    kresla: "Кресла",
    divany: "Диваны",
    osveschenie: "Освещение",
    aksessuary: "Аксессуары",
  };

  const categoryName = categoryNames[product.category] || product.category;

  // Parse images
  const images: string[] = product.images || [];

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  // Parse rating
  const ratingValue =
    typeof product.rating === "string"
      ? parseFloat(product.rating) || 0
      : product.rating || 0;

  // Related products - smart algorithm: same category, scored by similarity
  const allProducts = getImportedProducts();
  const productColorNames = (product.colors || []).map((c) =>
    c.name.toLowerCase(),
  );
  const productMaterials = (product.materials || []).map((m) =>
    m.toLowerCase(),
  );
  const productPrice = product.price;

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .map((p) => {
      let score = 0;

      // Color match: +3 for each shared color keyword
      const pColors = (p.colors || []).map((c) => c.name.toLowerCase());
      for (const pc of productColorNames) {
        if (pColors.some((c) => c.includes(pc) || pc.includes(c))) score += 3;
      }

      // Material match: +2 for shared material
      const pMats = (p.materials || []).map((m) => m.toLowerCase());
      for (const pm of productMaterials) {
        if (pMats.includes(pm)) score += 2;
      }

      // Price proximity: +2 if within 30%, +1 if within 50%
      const priceDiff = Math.abs(p.price - productPrice) / (productPrice || 1);
      if (priceDiff < 0.3) score += 2;
      else if (priceDiff < 0.5) score += 1;

      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => ({
      id: r.product.id,
      name: r.product.name,
      slug: r.product.slug,
      price: r.product.price,
      images: r.product.images,
    }));

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Купить ${product.name}`,
    image:
      images.length > 0
        ? images.length === 1
          ? images[0]
          : images
        : undefined,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "КупитьСтул",
    },
    offers: {
      "@type": "Offer",
      url: `https://kupitstul.ru/catalog/product/${product.slug}`,
      priceCurrency: "RUB",
      price: product.price,
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .split("T")[0],
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "КупитьСтул",
        url: "https://kupitstul.ru",
      },
    },
    ...(ratingValue > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ratingValue.toFixed(1),
        reviewCount: product.reviewsCount || 1,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: "https://kupitstul.ru",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: "https://kupitstul.ru/catalog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `https://kupitstul.ru/catalog/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `https://kupitstul.ru/catalog/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD: Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumbs */}
      <section className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href="/catalog"
              className="hover:text-gray-900 transition-colors"
            >
              Каталог
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/catalog/${product.category}`}
              className="hover:text-gray-900 transition-colors"
            >
              {categoryName}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Main */}
      <section className="py-8 lg:py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images - Client Component */}
            <ProductGallery
              images={images}
              productName={product.name}
              badges={product.badges}
              productId={product.id}
              category={product.category}
            />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#374151] mb-3">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(ratingValue)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-500 text-gray-500"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-[#6b7280]">
                      {ratingValue.toFixed(1)} ({product.reviewsCount || 0}{" "}
                      отзывов)
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Артикул: {product.id}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl lg:text-4xl font-bold text-[#374151]">
                  {formatPrice(product.price)} ₽
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.oldPrice)} ₽
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">В наличии на складе</span>
              </div>

              {/* Colors */}
              {(() => {
                // Filter out junk color names (dates, category names, etc.)
                const validColorPatterns =
                  /^(бел|черн|чёрн|сер|коричнев|бежев|венге|орех|дуб|красн|зелен|голуб|розов|синий|жёлт|желт|оранж|натуральн|графит|вишн|слонов|молочн|капучино|шоколад|антрацит|лаванд|бордо|кремов|светл|тёмн|темн|махагон|мятн|бирюзов|изумруд|песочн|пепельн|стальн|медн|золот|серебр)/i;
                const goodColors = (product.colors || []).filter((c) => {
                  if (!c.name || c.name.length < 2 || c.name.length > 40)
                    return false;
                  if (/^\d{4}-\d{2}/.test(c.name)) return false; // dates
                  if (
                    /^(В наличии|Активно|Металл|Кресла|Комоды|Тумбы|Этажерка|Кресло|Обычное|Стулья|ДСП|Массив|искусственная|велюр)/i.test(
                      c.name,
                    )
                  )
                    return false;
                  return validColorPatterns.test(c.name.trim());
                });

                // Also find related products with same base name but different colors
                const baseName = product.name
                  .replace(
                    /\s+(бел|черн|чёрн|сер|коричнев|бежев|венге|орех|дуб|красн|зелен|голуб|розов|синий|натуральн|графит|махагон|капучино|шоколад|светл|тёмн|темн)[\wа-яё]*/gi,
                    "",
                  )
                  .trim();
                const sameNameProducts = allProducts
                  .filter((p) => {
                    if (p.id === product.id) return false;
                    const pBase = p.name
                      .replace(
                        /\s+(бел|черн|чёрн|сер|коричнев|бежев|венге|орех|дуб|красн|зелен|голуб|розов|синий|натуральн|графит|махагон|капучино|шоколад|светл|тёмн|темн)[\wа-яё]*/gi,
                        "",
                      )
                      .trim();
                    return pBase === baseName && pBase.length > 5;
                  })
                  .slice(0, 8);

                if (goodColors.length === 0 && sameNameProducts.length === 0)
                  return null;

                return (
                  <div>
                    <h3 className="font-medium text-[#374151] mb-3">Цвет:</h3>
                    <div className="flex flex-wrap gap-2">
                      {goodColors.map((color, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-[#374151] ${
                            index === 0
                              ? "border-[#374151] bg-gray-100"
                              : "border-gray-300"
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </div>
                      ))}
                      {sameNameProducts.map((p) => {
                        // Extract color hint from name difference
                        const colorHint = p.name
                          .replace(baseName, "")
                          .trim()
                          .replace(/^[-–—\s]+/, "");
                        return (
                          <Link
                            key={p.id}
                            href={`/catalog/product/${p.slug}`}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#374151] hover:border-[#374151] hover:bg-gray-100 transition-colors"
                          >
                            {p.images?.[0] && (
                              <span className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 inline-block flex-shrink-0">
                                <img
                                  src={p.images[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </span>
                            )}
                            {colorHint || p.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Quantity & Add to Cart - Client Component */}
              <ProductActions
                productId={product.id}
                productName={product.name}
                price={product.price}
                oldPrice={product.oldPrice}
                image={product.images?.[0]}
                slug={product.slug}
                category={product.category}
              />

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-[#374151]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#374151]">
                      Доставка
                    </p>
                    <p className="text-xs text-[#6b7280]">от 1 дня</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#374151]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#374151]">
                      Гарантия
                    </p>
                    <p className="text-xs text-[#6b7280]">1 год</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[#374151]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#374151]">
                      На рынке
                    </p>
                    <p className="text-xs text-[#6b7280]">более 10 лет</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description & Specifications */}
      <section className="py-8 lg:py-12 bg-gray-50 border-t border-gray-200">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Описание</h2>
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                {product.description ? (
                  <div className="prose prose-gray max-w-none">
                    {product.description
                      .split("\n")
                      .filter((p) => p.trim())
                      .map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-gray-600 leading-relaxed mb-4 last:mb-0"
                        >
                          {paragraph.trim()}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Описание товара отсутствует
                  </p>
                )}
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Характеристики
              </h2>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {(() => {
                      const specs: { label: string; value: string }[] = [];
                      const desc = product.description || "";

                      // Parse dimensions from description
                      const dimPatterns = [
                        /размер[ыь]?[:\s—–-]*([^\n.✔✨❤💯🔒📦⚙️📐]+)/i,
                        /(\d+)\s*[хxX×]\s*(\d+)\s*[хxX×]\s*(\d+)\s*(?:см|мм)/,
                        /(?:ширин|длин|высот|глубин)[аыу]?\s*[:\s—–-]*\s*(\d+[\d.,]*)\s*(?:см|мм)/gi,
                      ];

                      // Width
                      if (product.specifications?.width) {
                        specs.push({
                          label: "Ширина",
                          value: `${product.specifications.width} см`,
                        });
                      }
                      // Height
                      if (product.specifications?.height) {
                        specs.push({
                          label: "Высота",
                          value: `${product.specifications.height} см`,
                        });
                      }
                      // Depth
                      if (product.specifications?.depth) {
                        specs.push({
                          label: "Глубина",
                          value: `${product.specifications.depth} см`,
                        });
                      }

                      // Try to extract dimensions from description if not in specs
                      if (
                        !product.specifications?.width &&
                        !product.specifications?.height
                      ) {
                        const dimMatch = desc.match(
                          /размер[ыь]?[:\s—–-]*([^\n✔✨❤💯🔒📦⚙️]{5,80})/i,
                        );
                        if (dimMatch) {
                          specs.push({
                            label: "Размеры",
                            value: dimMatch[1].replace(/[.!]+$/, "").trim(),
                          });
                        }
                        // Also try WxHxD pattern
                        const whd = desc.match(
                          /(\d+)\s*[хxX×]\s*(\d+)\s*[хxX×]\s*(\d+)\s*(см|мм)/,
                        );
                        if (whd && !dimMatch) {
                          specs.push({
                            label: "Размеры (Ш×В×Г)",
                            value: `${whd[1]}×${whd[2]}×${whd[3]} ${whd[4]}`,
                          });
                        }
                      }

                      // Weight
                      if (product.specifications?.weight) {
                        specs.push({
                          label: "Вес",
                          value: `${product.specifications.weight} кг`,
                        });
                      } else {
                        const weightMatch = desc.match(
                          /вес[:\s—–-]*\s*([\d.,]+)\s*кг/i,
                        );
                        if (weightMatch) {
                          specs.push({
                            label: "Вес",
                            value: `${weightMatch[1]} кг`,
                          });
                        }
                      }

                      // Volume
                      const volMatch = desc.match(
                        /объ[её]м\s*(?:упаковки)?[:\s—–-]*\s*([\d.,]+)\s*м[³3]/i,
                      );
                      if (volMatch) {
                        specs.push({
                          label: "Объём упаковки",
                          value: `${volMatch[1]} м³`,
                        });
                      }

                      // Material
                      const realMaterials = [
                        "Металл",
                        "Дерево",
                        "Ткань",
                        "Пластик",
                        "Экокожа",
                        "Искусственная кожа",
                        "Массив березы",
                        "Массив бука",
                        "Бук",
                        "Хром",
                        "Велюр",
                        "ДСП",
                        "МДФ",
                        "ЛДСП",
                        "Фанера",
                      ];
                      if (
                        product.specifications?.material &&
                        !product.specifications.material.includes("@") &&
                        realMaterials.some((m) =>
                          product
                            .specifications!.material!.toLowerCase()
                            .includes(m.toLowerCase()),
                        )
                      ) {
                        specs.push({
                          label: "Материал каркаса",
                          value: product.specifications.material,
                        });
                      }
                      if (
                        product.specifications?.seatMaterial &&
                        realMaterials.some((m) =>
                          product
                            .specifications!.seatMaterial!.toLowerCase()
                            .includes(m.toLowerCase()),
                        )
                      ) {
                        specs.push({
                          label: "Материал сиденья",
                          value: product.specifications.seatMaterial,
                        });
                      }
                      // Fallback: derive material from materials array or description
                      if (specs.every((s) => !s.label.includes("Материал"))) {
                        const validMats = (product.materials || []).filter(
                          (m) =>
                            realMaterials.some((rm) =>
                              m.toLowerCase().includes(rm.toLowerCase()),
                            ),
                        );
                        if (validMats.length > 0) {
                          specs.push({
                            label: "Материал",
                            value: validMats.join(", "),
                          });
                        }
                      }

                      // Assembly from description
                      const assemblyMatch = desc.match(
                        /(?:поставки|сборка|собранном)[:\s—–-]*([^\n.✔✨❤💯]{5,60})/i,
                      );
                      if (assemblyMatch) {
                        specs.push({
                          label: "Поставка",
                          value: assemblyMatch[1].replace(/[!]+$/, "").trim(),
                        });
                      }

                      // Colors
                      if (product.colors && product.colors.length > 0) {
                        const validColorNames = [
                          "Белый",
                          "Черный",
                          "Чёрный",
                          "Серый",
                          "Коричневый",
                          "Бежевый",
                          "Венге",
                          "Орех",
                          "Дуб",
                          "Красный",
                          "Синий",
                          "Зеленый",
                          "Голубой",
                          "Розовый",
                          "Натуральный",
                        ];
                        const goodColors = product.colors.filter((c) =>
                          validColorNames.some((vc) =>
                            c.name.toLowerCase().includes(vc.toLowerCase()),
                          ),
                        );
                        if (goodColors.length > 0) {
                          specs.push({
                            label: "Доступные цвета",
                            value: goodColors.map((c) => c.name).join(", "),
                          });
                        }
                      }

                      // Category
                      specs.push({ label: "Категория", value: categoryName });
                      // SKU
                      specs.push({ label: "Артикул", value: product.id });

                      return specs.map((spec, index) => (
                        <tr
                          key={spec.label}
                          className={
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }
                        >
                          <td className="px-5 py-3 text-sm text-gray-500 w-1/2">
                            {spec.label}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900 font-medium">
                            {spec.value}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products - Client Component */}
      {relatedProducts.length > 0 && (
        <section className="py-8 lg:py-12 border-t border-gray-200">
          <div className="container">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Похожие товары
            </h2>
            <RelatedProducts products={relatedProducts} />
          </div>
        </section>
      )}
    </>
  );
}
