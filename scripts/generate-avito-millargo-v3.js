#!/usr/bin/env node
/**
 * generate-avito-millargo-v3.js
 *
 * 1. Scrapes https://millargo.ru/product-category/tables/
 *    → finds each table's "Материал столешницы" attribute
 *    → updates column "Материал сиденья" (col 13) for matching rows
 *
 * 2. Scrapes https://millargo.ru/product-category/collections/ (+ sub-pages)
 *    → finds each product's frame color (RAL or other color attr)
 *    → updates column "Основной цвет" (col 14) for matching rows
 *
 * 3. mm → cm conversion re-applied to any rows not yet converted
 *
 * Input:  data/avito_millargo_sadovaya_mebel_v2.xlsx  (untouched)
 * Cache:  data/avito_millargo_attrs_cache.json        (resume-safe)
 * Output: data/avito_millargo_sadovaya_mebel_v3.xlsx
 *
 * Usage:
 *   node scripts/generate-avito-millargo-v3.js             – full run
 *   node scripts/generate-avito-millargo-v3.js --no-scrape – rebuild from cache only
 */
"use strict";

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// ── Paths ─────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, "..", "data");
const INPUT_FILE = path.join(DATA_DIR, "avito_millargo_sadovaya_mebel_v2.xlsx");
const ATTRS_CACHE = path.join(DATA_DIR, "avito_millargo_attrs_cache.json");
const OUTPUT_FILE = path.join(
  DATA_DIR,
  "avito_millargo_sadovaya_mebel_v3.xlsx",
);

const TABLES_URL = "https://millargo.ru/product-category/tables/";
const COLLECTIONS_URL = "https://millargo.ru/product-category/collections/";

const DELAY_MS = 1800;

// ── Load Excel ─────────────────────────────────────────────────────────────────

const wb = XLSX.readFile(INPUT_FILE);
const ws = wb.Sheets[wb.SheetNames[0]];
const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

const headers = aoa[0];
const rows = aoa.slice(1);

// Column index map
const COL = {};
headers.forEach((h, i) => {
  COL[String(h).trim()] = i;
});

const C = {
  id: COL["Id"] ?? 0,
  name: COL["Название"] ?? 1,
  frame: COL["Материал каркаса"] ?? 12,
  seat: COL["Материал сиденья"] ?? 13, // for tables: tabletop material
  color: COL["Основной цвет"] ?? 14,
  width: COL["Ширина"] ?? 15,
  depth: COL["Глубина"] ?? 16,
  height: COL["Высота"] ?? 17,
  url: COL["# URL"] ?? 19,
};

// ── Title lookup map (normalized → row index) ─────────────────────────────────

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const titleMap = new Map(); // normalized title → row index
const urlMap = new Map(); // product URL → row index

rows.forEach((row, i) => {
  titleMap.set(norm(row[C.name]), i);
  const u = String(row[C.url] || "")
    .trim()
    .replace(/\/$/, "");
  if (u) urlMap.set(u, i);
});

function findRowByTitle(title) {
  const n = norm(title);
  if (titleMap.has(n)) return titleMap.get(n);
  // starts-with fallback
  for (const [key, idx] of titleMap) {
    if (n.startsWith(key) || key.startsWith(n)) return idx;
  }
  return -1;
}

function findRowByUrl(url) {
  const u = String(url || "")
    .trim()
    .replace(/\/$/, "");
  if (urlMap.has(u)) return urlMap.get(u);
  return -1;
}

// ── Load / save attrs cache ────────────────────────────────────────────────────

let attrsCache = {};
if (fs.existsSync(ATTRS_CACHE)) {
  try {
    attrsCache = JSON.parse(fs.readFileSync(ATTRS_CACHE, "utf8"));
  } catch {
    attrsCache = {};
  }
  console.log(
    `   Loaded ${Object.keys(attrsCache).length} cached attrs entries\n`,
  );
}

function saveAttrsCache() {
  fs.writeFileSync(ATTRS_CACHE, JSON.stringify(attrsCache, null, 2), "utf8");
}

// ── HTTP + HTML helpers ────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
    validateStatus: (s) => s < 404,
  });
  if (resp.status >= 400) throw new Error(`HTTP ${resp.status}`);
  return resp.data;
}

// ── Scrape product page: return { title, attrs }  ─────────────────────────────
// Supports both WoodMart (.wd-attr) and plain WooCommerce table structure

async function scrapeProductAttrs(url) {
  const cacheKey = url.replace(/\/$/, "");
  if (attrsCache[cacheKey]) return attrsCache[cacheKey];

  const cheerio = require("cheerio");
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title = $("h1.product_title, h1.entry-title, h1").first().text().trim();
  const attrs = {};

  // ── WoodMart .wd-attr structure: each .wd-attr wraps a label + one or more terms
  $(".wd-attr").each((_, el) => {
    const label = $(el).find(".wd-attr-name").text().trim();
    const vals = [];
    $(el)
      .find(".wd-attr-term p")
      .each((_, p) => {
        const v = $(p).text().trim();
        if (v) vals.push(v);
      });
    // Fallback: .wd-attr-value text if no term <p> found
    if (!vals.length) {
      const fallback = $(el).find(".wd-attr-value").text().trim();
      if (fallback) vals.push(fallback);
    }
    if (label && vals.length) attrs[label] = vals.join(", ");
  });

  // ── WooCommerce attributes table (fallback / additional)
  const tableSelectors = [
    ".woocommerce-product-attributes tr",
    ".product-attributes tr",
    "table.shop_attributes tr",
  ].join(", ");
  $(tableSelectors).each((_, row) => {
    const cells = $(row).find("th, td");
    if (cells.length < 2) return;
    const key = $(cells.eq(0)).text().trim();
    const val = $(cells.eq(1)).text().replace(/\s+/g, " ").trim();
    if (key && val && !attrs[key]) attrs[key] = val;
  });

  // ── Generic table rows (last resort — captures WoodMart spec tables)
  $("table tr").each((_, row) => {
    const cells = $(row).find("th, td");
    if (cells.length < 2) return;
    const key = $(cells.eq(0)).text().trim();
    const val = $(cells.eq(1)).text().replace(/\s+/g, " ").trim();
    if (key && val && !attrs[key]) attrs[key] = val;
  });

  const result = { title, attrs };
  attrsCache[cacheKey] = result;
  return result;
}

// ── Scrape category page: return list of product URLs ─────────────────────────
// Handles WooCommerce pagination (/page/N/)

async function getCategoryProductUrls(categoryUrl) {
  const cheerio = require("cheerio");
  const found = new Set();
  let page = 1;

  while (true) {
    const url =
      page === 1
        ? categoryUrl
        : categoryUrl.replace(/\/$/, "") + `/page/${page}/`;

    let html;
    try {
      html = await fetchHtml(url);
    } catch {
      break;
    }

    const $ = cheerio.load(html);
    let before = found.size;

    // WooCommerce product links (various themes)
    const selectors = [
      "a.woocommerce-LoopProduct-link",
      "li.product > a",
      ".wd-product-grid-item a",
      ".product-image-wrapper a",
      "h2.woocommerce-loop-product__title a",
      "h2.wd-entities-title a",
      ".woocommerce-loop-product__title a",
    ];
    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr("href") || "";
        if (
          href.includes("/product/") &&
          !href.includes("/product-category/")
        ) {
          found.add(href.split("?")[0].replace(/\/$/, ""));
        }
      });
    }
    // Also scan all <a> tags pointing to /product/ paths
    $('a[href*="/product/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href.includes("/product-category/") && href.includes("/product/")) {
        found.add(href.split("?")[0].replace(/\/$/, ""));
      }
    });

    const added = found.size - before;
    console.log(`   Page ${page}: +${added} products`);

    const hasNext =
      $("a.next.page-numbers, .woocommerce-pagination .next").length > 0;
    if (!hasNext) break;
    page++;
    await sleep(DELAY_MS);
  }

  return [...found];
}

// ── Scrape category recursively (follows subcategory links too) ───────────────

async function getCategoryProductUrlsDeep(categoryUrl, depth = 0) {
  if (depth > 2) return [];
  const cheerio = require("cheerio");

  // First collect direct product URLs
  const directUrls = await getCategoryProductUrls(categoryUrl);

  // Check for subcategory links on the first page
  let html;
  try {
    html = await fetchHtml(categoryUrl);
  } catch {
    return directUrls;
  }
  const $ = cheerio.load(html);

  const subcatUrls = new Set();
  $('a[href*="/product-category/"]').each((_, el) => {
    const href = ($(el).attr("href") || "").split("?")[0].replace(/\/$/, "");
    // Only direct children, not parent
    if (
      href !== categoryUrl.replace(/\/$/, "") &&
      href.startsWith(categoryUrl.split("/product-category/")[0])
    ) {
      subcatUrls.add(href);
    }
  });

  const all = new Set(directUrls);
  for (const sub of subcatUrls) {
    if (sub === categoryUrl.replace(/\/$/, "")) continue;
    console.log(`   → subcategory: ${sub}`);
    const subUrls = await getCategoryProductUrls(sub + "/");
    subUrls.forEach((u) => all.add(u));
    await sleep(DELAY_MS);
  }

  return [...all];
}

// ── Extract "Материал столешницы" from attrs object ──────────────────────────

function extractTabletopMaterial(attrs) {
  // Explicit keys (case-insensitive partial match)
  for (const [key, val] of Object.entries(attrs)) {
    const lk = key.toLowerCase();
    if (lk.includes("столешн")) return val;
    if (lk.includes("tabletop")) return val;
  }
  // Fallback: look for ceramics / stone / wood values in any attr
  for (const val of Object.values(attrs)) {
    const lv = val.toLowerCase();
    if (
      lv.includes("керамогранит") ||
      lv.includes("мрамор") ||
      lv.includes("камен") ||
      lv.includes("стекло") ||
      lv.includes("массив")
    )
      return val;
  }
  return "";
}

// ── Extract color from attrs object ──────────────────────────────────────────

function extractColor(attrs) {
  // Priority: keys containing 'цвет' or 'color' or 'ral'
  for (const [key, val] of Object.entries(attrs)) {
    const lk = key.toLowerCase();
    if (lk.includes("цвет") || lk.includes("color") || lk.includes("ral")) {
      return cleanColorValue(val);
    }
  }
  // Fallback: find any value containing 'RAL'
  for (const val of Object.values(attrs)) {
    if (String(val).toUpperCase().includes("RAL")) {
      return cleanColorValue(val);
    }
  }
  return "";
}

// Strip "RAL XXXX " prefix → keep human-readable color name
function cleanColorValue(raw) {
  const s = String(raw).trim();
  // "RAL 1013 Жемчужно-белый" → "Жемчужно-белый"
  const m = s.match(/^ral\s+\d{3,5}\s+(.+)$/i);
  if (m) return m[1].trim();
  return s;
}

// ── mm → cm (only convert likely mm values: > 100) ───────────────────────────

function mmToCm(raw) {
  const n = parseFloat(String(raw));
  if (!n || isNaN(n)) return "";
  return n > 100 ? String(Math.round(n / 10)) : String(Math.round(n));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const noScrape = process.argv.includes("--no-scrape");

  // ── PHASE 1: Tables → Материал столешницы ──────────────────────────────────
  console.log("\n📦 PHASE 1 – Scraping /product-category/tables/\n");

  let tableProductUrls = [];
  if (!noScrape) {
    tableProductUrls = await getCategoryProductUrls(TABLES_URL);
    console.log(`   Found ${tableProductUrls.length} table product URLs\n`);
  } else {
    // Use URLs already known from Excel for table rows
    rows.forEach((row) => {
      const subtype = String(row[COL["Подвид товара"] ?? 6] || "");
      const name = String(row[C.name] || "").toLowerCase();
      if (subtype === "Столы" || name.includes("стол")) {
        const u = String(row[C.url] || "")
          .trim()
          .replace(/\/$/, "");
        if (u) tableProductUrls.push(u);
      }
    });
    console.log(
      `   --no-scrape: using ${tableProductUrls.length} table URLs from Excel\n`,
    );
  }

  let tabletopUpdates = 0;
  for (let i = 0; i < tableProductUrls.length; i++) {
    const url = tableProductUrls[i];
    const pct = String(
      Math.round(((i + 1) / tableProductUrls.length) * 100),
    ).padStart(3);
    const slug = decodeURIComponent(
      url.replace("https://millargo.ru/product/", ""),
    ).padEnd(40);
    process.stdout.write(
      `  [${pct}%] ${i + 1}/${tableProductUrls.length}  ${slug} `,
    );

    let result;
    try {
      result = await scrapeProductAttrs(url);
      if (!noScrape && i < tableProductUrls.length - 1) await sleep(DELAY_MS);
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`);
      continue;
    }

    const tabletop = extractTabletopMaterial(result.attrs);
    const rowIdx =
      findRowByUrl(url) !== -1
        ? findRowByUrl(url)
        : findRowByTitle(result.title);

    if (tabletop && rowIdx !== -1) {
      rows[rowIdx][C.seat] = tabletop;
      tabletopUpdates++;
      process.stdout.write(
        `✓ "${result.title}" → Материал столешницы: ${tabletop}\n`,
      );
    } else if (rowIdx === -1) {
      process.stdout.write(`– "${result.title}" (not in Excel, skipping)\n`);
    } else {
      process.stdout.write(
        `~ "${result.title}" (no tabletop material found)\n`,
      );
    }

    // Save cache every 5
    if ((i + 1) % 5 === 0) saveAttrsCache();
  }

  saveAttrsCache();
  console.log(`\n   ✅ Tabletop material updates: ${tabletopUpdates}\n`);

  // ── PHASE 2: Collections → Основной цвет ──────────────────────────────────
  console.log("🎨 PHASE 2 – Scraping /product-category/collections/\n");

  let collectionProductUrls = [];
  if (!noScrape) {
    collectionProductUrls = await getCategoryProductUrlsDeep(COLLECTIONS_URL);
    // Deduplicate
    collectionProductUrls = [...new Set(collectionProductUrls)];
    console.log(
      `\n   Found ${collectionProductUrls.length} collection product URLs\n`,
    );
  } else {
    // All product URLs from Excel
    rows.forEach((row) => {
      const u = String(row[C.url] || "")
        .trim()
        .replace(/\/$/, "");
      if (u) collectionProductUrls.push(u);
    });
    collectionProductUrls = [...new Set(collectionProductUrls)];
    console.log(
      `   --no-scrape: using ${collectionProductUrls.length} URLs from Excel\n`,
    );
  }

  let colorUpdates = 0;
  for (let i = 0; i < collectionProductUrls.length; i++) {
    const url = collectionProductUrls[i];
    const pct = String(
      Math.round(((i + 1) / collectionProductUrls.length) * 100),
    ).padStart(3);
    const slug = decodeURIComponent(
      url.replace("https://millargo.ru/product/", ""),
    ).padEnd(40);
    process.stdout.write(
      `  [${pct}%] ${i + 1}/${collectionProductUrls.length}  ${slug} `,
    );

    let result;
    try {
      result = await scrapeProductAttrs(url);
      if (!noScrape && i < collectionProductUrls.length - 1)
        await sleep(DELAY_MS);
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`);
      continue;
    }

    const color = extractColor(result.attrs);
    const rowIdx =
      findRowByUrl(url) !== -1
        ? findRowByUrl(url)
        : findRowByTitle(result.title);

    if (color && rowIdx !== -1) {
      rows[rowIdx][C.color] = color;
      colorUpdates++;
      process.stdout.write(`✓ "${result.title}" → Цвет: ${color}\n`);
    } else if (!color && rowIdx !== -1) {
      process.stdout.write(`~ "${result.title}" (no color attr found)\n`);
    } else {
      process.stdout.write(`– "${result.title}" (not in Excel)\n`);
    }

    if ((i + 1) % 5 === 0) saveAttrsCache();
  }

  saveAttrsCache();
  console.log(`\n   ✅ Color updates: ${colorUpdates}\n`);

  // ── PHASE 3: mm → cm safety pass ──────────────────────────────────────────
  let dimFixes = 0;
  rows.forEach((row) => {
    for (const col of [C.width, C.depth, C.height]) {
      const raw = String(row[col] || "");
      const n = parseFloat(raw);
      if (n > 100) {
        row[col] = String(Math.round(n / 10));
        dimFixes++;
      }
    }
  });
  if (dimFixes) console.log(`📐 Fixed ${dimFixes} dimension values (mm→cm)\n`);

  // ── Write v3 Excel ─────────────────────────────────────────────────────────
  const newWsData = [headers, ...rows];
  const newWs = XLSX.utils.aoa_to_sheet(newWsData);
  if (ws["!cols"]) newWs["!cols"] = ws["!cols"];
  if (ws["!views"]) newWs["!views"] = ws["!views"];

  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, newWs, "Авито автозагрузка");
  XLSX.writeFile(newWb, OUTPUT_FILE);

  console.log(`✅  Saved: ${OUTPUT_FILE}`);
  console.log(`   Tabletop material fills : ${tabletopUpdates}`);
  console.log(`   Color fills             : ${colorUpdates}`);
  if (dimFixes) console.log(`   Dimension fixes (mm→cm) : ${dimFixes}`);

  // Per-type summary
  const byType = {};
  rows.forEach((r) => {
    const t = r[COL["Подвид товара"] ?? 6];
    byType[t] = (byType[t] || 0) + 1;
  });
  console.log("\n📋 By GoodsSubType:");
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`   ${String(n).padStart(3)}  ${t}`));
  console.log("");
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
