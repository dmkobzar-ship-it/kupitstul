#!/usr/bin/env node
/**
 * generate-avito-millargo.js
 *
 * Reads milllargo_product_counter.yml.xml, scrapes product pages from millargo.ru,
 * and generates an Avito autoload Excel file for "Садовая мебель" category.
 *
 * Usage:
 *   node scripts/generate-avito-millargo.js              – scrape + generate
 *   node scripts/generate-avito-millargo.js --no-scrape  – use cached data only
 *
 * Output: data/avito_millargo_sadovaya_mebel.xlsx
 * Cache:  data/avito_millargo_scrape_cache.json  (keep between runs for resume)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// ── Config ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, "..", "data");
const XML_FILE = path.join(DATA_DIR, "milllargo_product_counter.yml.xml");
const PROGRESS_FILE = path.join(DATA_DIR, "avito_millargo_scrape_cache.json");
const OUTPUT_FILE = path.join(DATA_DIR, "avito_millargo_sadovaya_mebel.xlsx");

const DELAY_MS = 2000; // ms between HTTP requests

// ⚠️  Edit this to your actual Авито seller address before uploading
const AVITO_ADDRESS = "Москва";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── XML Parsing ───────────────────────────────────────────────────────────────

function parseXml() {
  const xml = fs.readFileSync(XML_FILE, "utf8");
  const offers = [];
  // The YML structure is regular — safe to use named-group regex here
  const offerRe = /<offer\s+id="(\d+)"[^>]*>([\s\S]*?)<\/offer>/g;
  let m;
  while ((m = offerRe.exec(xml)) !== null) {
    const [, id, body] = m;
    const price = body.match(/<price>(\d+(?:\.\d+)?)<\/price>/)?.[1];
    const url = body.match(/<url>([^<]+)<\/url>/)?.[1];
    const oldprice = body.match(/<oldprice>(\d+(?:\.\d+)?)<\/oldprice>/)?.[1];
    const countStr = body.match(/<count>(\d+)<\/count>/)?.[1];
    if (url && price) {
      offers.push({
        id,
        price: parseInt(price),
        url: url.trim(),
        oldprice: oldprice ? parseInt(oldprice) : null,
        count: countStr !== undefined ? parseInt(countStr) : null,
      });
    }
  }
  return offers;
}

// ── URL slug → Avito GoodsSubType ─────────────────────────────────────────────

function getGoodsSubType(url) {
  const raw = url
    .replace("https://millargo.ru/product/", "")
    .replace(/\/$/, "");
  const slug = decodeURIComponent(raw).toLowerCase();

  // Sets / комплекты (check before single items)
  if (/\bset\b/.test(slug) || /^et-/.test(slug) || slug.includes("комплект"))
    return "Комплекты мебели";

  // Sofas / диваны
  if (/\bsofa\b/.test(slug) || slug.includes("диван")) return "Диваны";

  // Armchairs (before generic chair)
  if (/\barmchair\b/.test(slug)) return "Садовые кресла";

  // Chairs / stulya – includes "the-flecto-chair", "libero-chair"
  if (/\bchair\b/.test(slug) || /^pouf-/.test(slug))
    return "Садовые стулья и табуреты";

  // Tables – "table", "coffee-table", "стол"
  if (/\btable\b/.test(slug) || slug.includes("стол")) return "Столы";

  return "Другое";
}

// ── Material helpers ──────────────────────────────────────────────────────────

const FRAME_MATERIAL_MAP = {
  алюмин: "Металл",
  металл: "Металл",
  сталь: "Металл",
  нержав: "Металл",
  "натур.*ротанг": "Натуральный ротанг",
  ротанг: "Искусственный ротанг",
  искусс: "Искусственный ротанг",
  дерев: "Дерево",
  ясень: "Дерево",
  дуб: "Дерево",
  сосн: "Дерево",
  пласт: "Пластик",
};

function matchMaterial(text, map, def) {
  const lc = (text || "").toLowerCase();
  for (const [pattern, value] of Object.entries(map)) {
    if (new RegExp(pattern).test(lc)) return value;
  }
  return def;
}

function extractFrameMaterial(specs) {
  return matchMaterial(
    specs["Каркас"] || specs["Frame"] || "",
    FRAME_MATERIAL_MAP,
    "Металл",
  );
}

function extractSeatMaterial(specs) {
  // Explicit "Роуп" spec key means rope weave seat
  if (specs["Роуп"] || specs["Rope"]) return "Роуп";

  const combined = [
    specs["Ткань"],
    specs["Материал сиденья"],
    specs["Материал"],
  ]
    .filter(Boolean)
    .join(" ");
  return matchMaterial(
    combined,
    {
      "натур.*ротанг": "Натуральный ротанг",
      ротанг: "Искусственный ротанг",
      "ткань|ткан": "Ткань",
      "кожа|leather": "Кожа",
      "дерев|ясень": "Дерево",
      "металл|алюм": "Металл",
      пласт: "Пластик",
    },
    "Роуп",
  ); // millargo default – most pieces have rope weave on aluminum
}

function extractDimensions(specs) {
  const raw =
    specs["Габариты"] || specs["Размеры"] || specs["Dimensions"] || "";
  // e.g. "1200 × 1200 × 727 мм"
  const m = raw.match(/(\d+)\s*[×xXхХ]\s*(\d+)\s*[×xXхХ]\s*(\d+)/);
  return m ? { width: m[1], depth: m[2], height: m[3] } : {};
}

function extractColor(specs) {
  const raw =
    specs["Цвет"] || specs["Основной цвет"] || specs["Цвет ткани"] || "";
  const lc = raw.toLowerCase();
  if (lc.includes("беж") || lc.includes("ямайка")) return "Бежевый";
  if (lc.includes("черн") || lc.includes("антрацит")) return "Чёрный";
  if (lc.includes("бел")) return "Белый";
  if (lc.includes("сер") || lc.includes("gray")) return "Серый";
  if (lc.includes("корич") || lc.includes("шоко")) return "Коричневый";
  if (lc.includes("голуб")) return "Светло-синий";
  if (lc.includes("зелен")) return "Зелёный";
  return "";
}

// ── HTML Scraping ─────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  const { default: axios } = await import("axios");
  const resp = await axios.get(url, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "ru-RU,ru;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  return resp.data;
}

async function scrapeProduct(url) {
  const cheerio = require("cheerio");
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // ── JSON-LD (most reliable on WooCommerce) ──────────────────────────────
  let title = "";
  let description = "";
  let images = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      let data = JSON.parse($(el).html() || "{}");
      if (Array.isArray(data["@graph"])) {
        data = data["@graph"].find((n) => n["@type"] === "Product") || {};
      }
      if (data["@type"] === "Product") {
        if (!title) title = String(data.name || "").trim();
        if (!description) description = String(data.description || "").trim();
        if (Array.isArray(data.image)) images = data.image.map(String);
        else if (data.image) images = [String(data.image)];
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  });

  // ── DOM fallbacks ────────────────────────────────────────────────────────
  if (!title) {
    title = $("h1.product_title, h1.entry-title, h1").first().text().trim();
  }
  if (!description) {
    description = (
      $(".woocommerce-product-details__short-description").text() ||
      $('[itemprop="description"]').first().text() ||
      $("div.summary > p").first().text()
    ).trim();
  }

  // ── Images ───────────────────────────────────────────────────────────────
  const imgSet = new Set(images.map((u) => u.replace(/\?.*$/, "")));

  const imgSelectors = [
    ".woocommerce-product-gallery__image img",
    ".woocommerce-product-gallery img",
    "figure.woocommerce-product-gallery__wrapper img",
    ".product-gallery img",
  ];
  for (const sel of imgSelectors) {
    $(sel).each((_, el) => {
      const src =
        $(el).attr("data-large_image") ||
        $(el).attr("data-src") ||
        $(el).attr("src") ||
        "";
      if (src.includes("/wp-content/uploads/")) {
        const clean = src.replace(/\?.*$/, "");
        imgSet.add(clean);
      }
    });
  }
  // Catch any high-res uploads (skip typical thumbnail sizes)
  $('img[src*="/wp-content/uploads/"]').each((_, el) => {
    const src = $(el).attr("src") || "";
    if (!src.match(/-(50|75|100|150|200|250|300|400|450)x/)) {
      imgSet.add(src.replace(/\?.*$/, ""));
    }
  });

  // Keep at most 10, prefer jpg/png over webp
  const allImgs = [...imgSet].filter((u) =>
    /\.(jpe?g|png|webp)(\?|$)/i.test(u),
  );
  const jpgFirst = [
    ...allImgs.filter((u) => /\.(jpe?g|png)(\?|$)/i.test(u)),
    ...allImgs.filter((u) => /\.webp(\?|$)/i.test(u)),
  ];
  // Deduplicate by base name ignoring extension
  const seenBase = new Set();
  images = jpgFirst
    .filter((u) => {
      const base = u.replace(/\.(jpe?g|png|webp)$/i, "");
      if (seenBase.has(base)) return false;
      seenBase.add(base);
      return true;
    })
    .slice(0, 10);

  // ── Specs table ──────────────────────────────────────────────────────────
  const specs = {};
  $(
    ".woocommerce-product-attributes tr, .product-attributes tr, table tr",
  ).each((_, row) => {
    const cells = $(row).find("th, td");
    if (cells.length >= 2) {
      const key = $(cells.eq(0)).text().trim();
      const val = $(cells.eq(1)).text().trim();
      if (key && val) specs[key] = val;
    }
  });

  // ── Categories ───────────────────────────────────────────────────────────
  const categories = [];
  $('.posted_in a, .product_meta a[rel="tag"], span.posted_in a').each(
    (_, el) => {
      categories.push($(el).text().trim());
    },
  );

  return { title, description, images, specs, categories };
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function cleanHtml(text) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildDescription(description, specs, maxLen = 7500) {
  let desc = cleanHtml(description || "");

  const relevantKeys = [
    "Габариты",
    "Размеры",
    "Каркас",
    "Роуп",
    "Ткань",
    "Материал",
    "Цвет",
    "Цвет ткани",
  ];
  const specLines = relevantKeys
    .filter((k) => specs[k])
    .map((k) => `${k}: ${specs[k]}`)
    .join("\n");

  if (specLines) {
    const append = "\n\nХарактеристики:\n" + specLines;
    if (desc.length + append.length <= maxLen) desc += append;
  }

  return desc.substring(0, maxLen).replace(/\s+$/, "");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  try {
    require("cheerio");
  } catch {
    console.error(
      "ERROR: cheerio not installed. Run: npm install cheerio --save-dev",
    );
    process.exit(1);
  }

  const noScrape = process.argv.includes("--no-scrape");

  console.log("📄 Parsing XML…");
  const offers = parseXml();
  console.log(`   Found ${offers.length} offers\n`);

  // Load progress cache
  let cache = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
      console.log(
        `   Loaded ${Object.keys(cache).length} cached entries from previous run\n`,
      );
    } catch {
      cache = {};
    }
  }

  // ── Scraping ─────────────────────────────────────────────────────────────
  if (!noScrape) {
    const todo = offers.filter((o) => !cache[o.id] || cache[o.id].error);
    console.log(
      `🌐 Scraping ${todo.length} pages (${offers.length - todo.length} already cached)…\n`,
    );

    for (let i = 0; i < todo.length; i++) {
      const offer = todo[i];
      const pct = String(Math.round(((i + 1) / todo.length) * 100)).padStart(3);
      const slug = decodeURIComponent(
        offer.url
          .replace("https://millargo.ru/product/", "")
          .replace(/\/$/, ""),
      );
      process.stdout.write(
        `  [${pct}%] ${i + 1}/${todo.length}  ${slug.padEnd(45)} `,
      );

      try {
        const data = await scrapeProduct(offer.url);
        cache[offer.id] = data;
        process.stdout.write(`✓  "${data.title}"\n`);
      } catch (err) {
        process.stdout.write(`✗  ${err.message}\n`);
        cache[offer.id] = {
          title: "",
          description: "",
          images: [],
          specs: {},
          categories: [],
          error: err.message,
        };
      }

      // Save progress every 5 products so we can resume on interruption
      if ((i + 1) % 5 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(cache, null, 2), "utf8");
      }

      if (i < todo.length - 1) await sleep(DELAY_MS);
    }

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(cache, null, 2), "utf8");
    console.log(`\n   Cache saved → ${PROGRESS_FILE}\n`);
  }

  // ── Build Excel rows ──────────────────────────────────────────────────────
  console.log("📊 Building Excel…");

  // Avito autoload column headers (Russian parameter names)
  const headers = [
    "Id",
    "Название",
    "Описание",
    "Ссылки на фото",
    "Категория",
    "Вид товара",
    "Подвид товара",
    "Вид продажи",
    "Состояние",
    "Доступность",
    "Цена",
    "Адрес",
    "Материал каркаса",
    "Материал сиденья",
    "Основной цвет",
    "Ширина",
    "Глубина",
    "Высота",
    "Бренд",
    // Reference columns (not Avito fields – delete before uploading if needed)
    "# URL",
    "# Старая цена",
    "# Остаток",
  ];

  const rows = offers.map((offer) => {
    const sc = cache[offer.id] || {};
    const { title = "", description = "", images = [], specs = {} } = sc;

    const goodsSubType = getGoodsSubType(offer.url);
    const frameMaterial = extractFrameMaterial(specs);
    const seatMaterial = extractSeatMaterial(specs);
    const dims = extractDimensions(specs);
    const color = extractColor(specs);

    const finalTitle = (title || `Садовая мебель Millargo`)
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100);
    const finalDesc = buildDescription(description, specs);
    const imageUrls = images.join(" | ");

    const availability =
      offer.count === null
        ? "В наличии"
        : offer.count > 0
          ? "В наличии"
          : "Под заказ";

    return [
      offer.id,
      finalTitle,
      finalDesc,
      imageUrls,
      "Мебель и интерьер",
      "Садовая мебель",
      goodsSubType,
      "Товар куплен на продажу",
      "Новое",
      availability,
      offer.price,
      AVITO_ADDRESS,
      frameMaterial,
      seatMaterial,
      color,
      dims.width || "",
      dims.depth || "",
      dims.height || "",
      "Millargo",
      offer.url,
      offer.oldprice || "",
      offer.count !== null ? offer.count : "",
    ];
  });

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 10 },
    { wch: 52 },
    { wch: 90 },
    { wch: 100 },
    { wch: 20 },
    { wch: 17 },
    { wch: 28 },
    { wch: 26 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 15 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 60 },
    { wch: 10 },
    { wch: 8 },
  ];

  // Freeze header row
  ws["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: "A2",
    activePane: "bottomLeft",
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Авито автозагрузка");
  XLSX.writeFile(wb, OUTPUT_FILE);

  console.log(`\n✅  Saved: ${OUTPUT_FILE}`);
  console.log(`   Rows: ${rows.length}`);

  // Summary by subtype
  const byType = {};
  rows.forEach((r) => {
    byType[r[6]] = (byType[r[6]] || 0) + 1;
  });
  console.log("\n📋  By GoodsSubType:");
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => {
      console.log(`   ${n.toString().padStart(3)}  ${t}`);
    });

  const noPhoto = rows.filter((r) => !r[3]).length;
  if (noPhoto > 0) {
    console.log(
      `\n⚠️   ${noPhoto} rows have no photos – check cache for errors`,
    );
  }
  console.log(
    "\n⚠️   Remember to update AVITO_ADDRESS at the top of the script before use!\n",
  );
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
