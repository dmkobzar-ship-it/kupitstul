#!/usr/bin/env node
/**
 * generate-avito-millargo-v2.js
 *
 * Reads avito_millargo_sadovaya_mebel.xlsx (v1) and the scrape cache,
 * rewrites the "Описание" column with the full Avito marketing template,
 * converts dimensions mm → cm, generates 20 SEO tags per product.
 *
 * Usage:
 *   node scripts/generate-avito-millargo-v2.js
 *
 * Input:   data/avito_millargo_sadovaya_mebel.xlsx
 * Cache:   data/avito_millargo_scrape_cache.json
 * Output:  data/avito_millargo_sadovaya_mebel_v2.xlsx  (original untouched)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// ── Paths ─────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, "..", "data");
const INPUT_FILE = path.join(DATA_DIR, "avito_millargo_sadovaya_mebel.xlsx");
const CACHE_FILE = path.join(DATA_DIR, "avito_millargo_scrape_cache.json");
const OUTPUT_FILE = path.join(
  DATA_DIR,
  "avito_millargo_sadovaya_mebel_v2.xlsx",
);

// ── Load ──────────────────────────────────────────────────────────────────────

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
const wb = XLSX.readFile(INPUT_FILE);
const ws = wb.Sheets[wb.SheetNames[0]];
const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

const headers = aoa[0];
const rows = aoa.slice(1);

// Build column map from actual headers
const COL = {};
headers.forEach((h, i) => {
  COL[String(h).trim()] = i;
});

const C = {
  id: COL["Id"] ?? 0,
  name: COL["Название"] ?? 1,
  desc: COL["Описание"] ?? 2,
  subtype: COL["Подвид товара"] ?? 6,
  avail: COL["Доступность"] ?? 9,
  frame: COL["Материал каркаса"] ?? 12,
  seat: COL["Материал сиденья"] ?? 13,
  width: COL["Ширина"] ?? 15,
  depth: COL["Глубина"] ?? 16,
  height: COL["Высота"] ?? 17,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mmToCm(raw) {
  const n = parseFloat(String(raw));
  if (!n || isNaN(n)) return "";
  // Values > 100 are in mm (Millargo specs come as "1200 × 1200 × 727 мм")
  return n > 100 ? String(Math.round(n / 10)) : String(Math.round(n));
}

// Strip the "Характеристики:" block appended by the v1 script
function stripSpecSection(text) {
  const marker = text.indexOf("\n\nХарактеристики:\n");
  return (marker !== -1 ? text.substring(0, marker) : text)
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractCollection(title) {
  const cols = [
    "ФЛЕКТО",
    "ЛОТУС",
    "ТЕМПО",
    "ПРИМО",
    "КВАДРО",
    "ПАТИО",
    "НОВА",
    "МИРО",
    "ЛЕТТО",
    "КИПР",
    "ТИТУЛО",
    "ИМПЕРО",
    "РИВА",
    "ЛИБЕРО",
  ];
  for (const c of cols) {
    if (title.toUpperCase().includes(c)) return c;
  }
  return "";
}

// Product word form for tag building
function typeWord(subtype, title) {
  const t = (title || "").toLowerCase();
  if (t.includes("пуф")) return "пуф";
  if (t.includes("диван")) return "диван";
  if (t.includes("кресло")) return "кресло";
  if (t.includes("стул")) return "стул";
  if (t.includes("стол")) return "стол";
  if (t.includes("комплект")) return "комплект";
  const m = {
    Столы: "стол",
    Диваны: "диван",
    "Садовые кресла": "кресло",
    "Садовые стулья и табуреты": "стул",
    "Комплекты мебели": "комплект",
  };
  return m[subtype] || "изделие";
}

// ── Template text blocks (vary by product subtype) ────────────────────────────

function introLine(title, subtype, tw) {
  const phrases = {
    стол: "уличный садовый стол из ротанга для дома, бара, ресторана и кафе, для размещения во дворе, на террасе, веранде",
    диван:
      "уличный садовый диван из ротанга для дома, ресторана и кафе, для размещения во дворе, на террасе, веранде",
    кресло:
      "уличное садовое кресло из ротанга для дома, ресторана и кафе, для размещения во дворе, на террасе, веранде",
    стул: "уличный садовый стул из ротанга для дома, ресторана и кафе, для размещения во дворе, на террасе, веранде",
    пуф: "уличный садовый пуф из ротанга для дома, ресторана и кафе, для размещения во дворе, на террасе, веранде",
    комплект:
      "уличный комплект садовой мебели из ротанга для дома, ресторана и кафе, для размещения во дворе, на террасе, веранде",
  };
  const phrase =
    phrases[tw] ||
    "уличная садовая мебель из ротанга для дома и бизнеса, для размещения во дворе, на террасе, веранде";
  return `${title} — ${phrase}`;
}

function useCaseLine(tw) {
  const p = {
    стол: "акцент для уличных пространств: выглядит стильно и служит практично.",
    диван:
      "премиальный элемент уличного интерьера, создающий атмосферу комфорта на открытом воздухе.",
    кресло:
      "стильное уличное кресло для комфортного отдыха на открытом воздухе.",
    стул: "практичный и элегантный элемент уличного пространства.",
    пуф: "стильный пуф для использования на улице, террасе и веранде.",
    комплект: "законченное дизайнерское решение для уличного пространства.",
  };
  return p[tw] || "стильный элемент уличного пространства.";
}

function idealLine(tw) {
  const p = {
    стол: "Идеальное решение для веранд, террас, барных зон, кафе и ресторанов — добавьте стиль и функциональность!",
    диван:
      "Идеальное решение для уличных зон отдыха, террас, кафе и ресторанов — добавьте стиль и функциональность!",
    кресло:
      "Идеальное решение для террас, веранд, кафе и ресторанных зон — добавьте стиль и функциональность!",
    стул: "Идеальное решение для террас, веранд, кафе и ресторанных зон — добавьте стиль и функциональность!",
    пуф: "Идеальное решение для уличных зон отдыха, веранд и кафе — добавьте стиль и функциональность!",
    комплект:
      "Идеальное решение для создания стильного уличного пространства на террасах, верандах, в кафе и ресторанах!",
  };
  return (
    p[tw] ||
    "Идеальное решение для уличных пространств — добавьте стиль и функциональность!"
  );
}

function getUseCases(tw) {
  const u = {
    стол: [
      "Уличных домашних помещений — стильный и практичный садовый стол",
      "Баров и ресторанов с открытой верандой — современный дизайн",
      "Летних кафе и общественных зон — комфорт и надёжность",
    ],
    диван: [
      "Домашних садов и террас — комфортный уличный диван",
      "Ресторанных веранд и летних площадок — премиальный стиль",
      "Летних кафе и общественных зон — атмосферность и долговечность",
    ],
    кресло: [
      "Домашних садов и террас — стильное уличное кресло",
      "Ресторанных веранд и летних площадок — современный дизайн",
      "Летних кафе и общественных зон — комфорт и надёжность",
    ],
    стул: [
      "Домашних садов и террас — практичный уличный стул",
      "Баров и ресторанов с верандой — современный дизайн",
      "Летних кафе и общественных зон — комфорт и надёжность",
    ],
    пуф: [
      "Домашних садов и террас — стильный уличный пуф",
      "Ресторанных веранд и летних зон — дополнение к мебельному набору",
      "Летних кафе и общественных зон — комфорт и надёжность",
    ],
    комплект: [
      "Домашних садов и террас — законченный уличный интерьер",
      "Ресторанных веранд и летних площадок — премиальный набор",
      "Кафе и общественных зон — стиль и долговечность",
    ],
  };
  return u[tw] || u["кресло"];
}

// ── Material/spec extraction ───────────────────────────────────────────────────

function keyFeatures(specs) {
  const f = [];
  if (specs["Роуп"])
    f.push(
      `отделка из ротанга-верёвки (роуп), цвет — ${specs["Роуп"].toLowerCase()}`,
    );
  if (specs["Каркас"]) f.push(`каркас из ${specs["Каркас"].toLowerCase()}`);
  if (specs["Массив ясеня"])
    f.push(`акценты из массива ясеня (${specs["Массив ясеня"].toLowerCase()})`);
  if (specs["Цвет ткани"]) f.push(`ткань «${specs["Цвет ткани"]}»`);
  if (!f.length)
    f.push(
      "конструкция из атмосферостойких материалов",
      "устойчива к воде и ультрафиолету",
    );
  return f.join(", ");
}

function producerDesc(specs) {
  const mats = [];
  if (specs["Роуп"]) mats.push(`ротанг-верёвка (роуп) — ${specs["Роуп"]}`);
  if (specs["Каркас"]) mats.push(specs["Каркас"]);
  if (specs["Массив ясеня"])
    mats.push(`массив ясеня (${specs["Массив ясеня"]})`);
  const lines = [];
  if (mats.length) lines.push(`Материал: ${mats.join(", ")}`);
  if (specs["Цвет ткани"]) lines.push(`Цвет ткани: ${specs["Цвет ткани"]}`);
  if (specs["Габариты"]) lines.push(`Габариты: ${specs["Габариты"]}`);
  return lines.join(". ") + (lines.length ? "." : "");
}

function matLines(tw, specs, frameExcel, seatExcel) {
  const frame = specs["Каркас"] || frameExcel || "Алюминий";
  const hasRope = !!specs["Роуп"];
  const hasWood = !!specs["Массив ясеня"];

  if (tw === "стол") {
    const top = hasWood
      ? `Массив ясеня (${specs["Массив ясеня"]})`
      : hasRope
        ? "Ротанг-верёвка (роуп)"
        : "Металл/ротанг";
    const base = [frame, hasRope ? "ротанг-верёвка" : ""]
      .filter(Boolean)
      .join(", ");
    return [`Материал столешницы: ${top}`, `Материал основания: ${base}`];
  }
  if (tw === "диван" || tw === "комплект") {
    const seat = hasRope
      ? "Ротанг-верёвка (роуп)"
      : specs["Цвет ткани"]
        ? "Ткань"
        : seatExcel || "Роуп";
    return [`Материал сиденья и спинки: ${seat}`, `Материал каркаса: ${frame}`];
  }
  // кресло, стул, пуф
  const seat = hasRope
    ? "Ротанг-верёвка (роуп)"
    : specs["Цвет ткани"]
      ? "Ткань"
      : seatExcel || "Роуп";
  return [`Материал сиденья: ${seat}`, `Материал каркаса: ${frame}`];
}

// ── 20 SEO tags ────────────────────────────────────────────────────────────────

function buildTags(tw, specs, collection) {
  const hasRope = !!specs["Роуп"];
  const tags = [];

  // Block 1 – type-specific primary (5)
  const primary = {
    стол: [
      "садовый стол",
      "уличный стол",
      "стол для террасы",
      "стол для сада",
      "стол для дачи",
    ],
    диван: [
      "садовый диван",
      "уличный диван",
      "диван для террасы",
      "диван для сада",
      "диван для дачи",
    ],
    кресло: [
      "садовое кресло",
      "уличное кресло",
      "кресло для террасы",
      "кресло для сада",
      "кресло для дачи",
    ],
    стул: [
      "садовый стул",
      "уличный стул",
      "стул для террасы",
      "стул для сада",
      "стул для дачи",
    ],
    пуф: [
      "садовый пуф",
      "уличный пуф",
      "пуф для террасы",
      "пуф для сада",
      "пуф для дачи",
    ],
    комплект: [
      "уличный комплект мебели",
      "садовый комплект мебели",
      "набор мебели для сада",
      "комплект для террасы",
      "набор садовой мебели",
    ],
  };
  tags.push(...(primary[tw] || primary["стул"]));

  // Block 2 – material (4)
  if (hasRope) {
    tags.push(
      `${tw} из ротанга-верёвки`,
      `${tw} роуп`,
      "садовая мебель роуп",
      "уличная мебель роуп",
    );
  } else {
    tags.push(
      `${tw} из ротанга`,
      "плетёная садовая мебель",
      "садовая мебель из ротанга",
      "искусственный ротанг",
    );
  }

  // Block 3 – frame (2)
  tags.push("алюминиевый каркас", "уличная мебель алюминий");

  // Block 4 – venue (4)
  const venue = {
    стол: [
      `стол для кафе`,
      `стол для ресторана`,
      `стол для летней площадки`,
      `стол для беседки`,
    ],
    диван: [
      `диван для кафе`,
      `диван для ресторана`,
      `диван для загородного дома`,
      `диван для веранды`,
    ],
    кресло: [
      `кресло для кафе`,
      `кресло для ресторана`,
      `кресло для загородного дома`,
      `кресло для веранды`,
    ],
    стул: [
      `стул для кафе`,
      `стул для ресторана`,
      `стул для загородного дома`,
      `стул для веранды`,
    ],
    пуф: [
      `пуф для кафе`,
      `пуф для ресторана`,
      `пуф для загородного дома`,
      `пуф для веранды`,
    ],
    комплект: [
      "мебель для кафе",
      "мебель для ресторана",
      "мебель для загородного дома",
      "мебель для беседки",
    ],
  };
  tags.push(...(venue[tw] || venue["стул"]));

  // Block 5 – brand / collection (5)
  tags.push(
    "садовая мебель millargo",
    "купить садовую мебель",
    "уличная мебель из ротанга",
  );
  if (collection) {
    tags.push(
      `${tw} ${collection.toLowerCase()}`,
      `мебель ${collection.toLowerCase()}`,
    );
  } else {
    tags.push("уличная мебель премиум", "мебель для открытых пространств");
  }

  // Deduplicate and ensure exactly 20
  const unique = [...new Set(tags)];
  while (unique.length < 20) unique.push("садовая мебель для отдыха");
  return unique.slice(0, 20).join(", ");
}

// ── Main description builder ──────────────────────────────────────────────────

function buildFullDesc(row) {
  const id = String(row[C.id] || "");
  const title = String(row[C.name] || "");
  const subtype = String(row[C.subtype] || "");
  const avail = String(row[C.avail] || "В наличии");
  const frameEx = String(row[C.frame] || "");
  const seatEx = String(row[C.seat] || "");
  const rawDesc = String(row[C.desc] || "");

  const cached = cache[id] || {};
  const specs = cached.specs || {};
  const collection = extractCollection(title);
  const tw = typeWord(subtype, title);

  // Clean description: strip the "Характеристики:" appendix, normalise whitespace
  const cleanDesc = stripSpecSection(rawDesc);

  // Dimensions already stored in Excel columns; convert mm → cm
  const wCm = mmToCm(row[C.width]);
  const dCm = mmToCm(row[C.depth]);
  const hCm = mmToCm(row[C.height]);
  const hasDims = !!(hCm || wCm || dCm);

  const features = keyFeatures(specs);
  const pdesc = producerDesc(specs) || cleanDesc.split(".")[0].trim() + ".";
  const mLines = matLines(tw, specs, frameEx, seatEx);
  const cases = getUseCases(tw);
  const tags = buildTags(tw, specs, collection);
  const availLine =
    avail === "В наличии"
      ? "🔥 В наличии! 🔥"
      : "📦 Под заказ — срок до 15 дней 📦";

  let html = "";
  html += `<p>${introLine(title, subtype, tw)}<br> <br>\n`;
  html += `💯 Более 300 положительных отзывов на АВИТО! 💯 <br>\n`;
  html += `❤️‍🔥Средняя оценка — 5! ❤️‍🔥<br>\n`;
  html += `❤️‍🔥 7 лет создаём уют и комфорт в вашем доме и бизнесе! ❤️‍🔥 <br> <br>\n\n`;
  html += `✨ ${title} — ${useCaseLine(tw)} ${cleanDesc}<br>\n`;
  html += `🔧 Ключевые особенности: ${features}.<br>\n`;
  html += `📌 По описанию производителя: ${pdesc}<br>\n`;
  html += `❤️‍🔥 Отличный вариант для уличного отдыха — стиль и атмосфера под открытым небом.<br> <br>\n\n`;
  html += `${idealLine(tw)} ❤️‍🔥<br>\n`;
  html += `✨ Современный дизайн, практичность и лёгкость — всё в одном! ✨ <br>\n`;
  html += `${availLine}<br> <br>\n\n`;
  html += `Технические характеристики:<br>\n`;
  html += `🌿${mLines[0]} <br>\n`;
  html += `🌿${mLines[1]} <br>\n`;

  if (hasDims) {
    html += `<br>\n📐Размеры: <br>\n`;
    if (hCm) html += `общая высота — ${hCm} см,<br>\n`;
    if (dCm) html += `глубина — ${dCm} см,<br>\n`;
    if (wCm) html += `ширина — ${wCm} см ⚙️ <br> <br>\n`;
    else html += `⚙️ <br> <br>\n`;
  }

  html += `\nИдеально подходит для: <br>\n`;
  for (const uc of cases) html += `✔️ ${uc}<br>\n`;

  html += `<br>\nПочему выбирают нас?<br>\n`;
  html += `⏳ Время изготовления: до 15 дней при отсутствии на складе <br>\n`;
  html += `🤝 Работаем с физическими и юридическими лицами<br>\n`;
  html += `💸 Оплата при получении, возможна безналичная<br> <br>\n\n`;
  html += `Обратите внимание: <br>\n`;
  html += `Более 7 лет поставляем мебель высокого качества — доверие крупнейших клиентов, `;
  html += `таких как Лукойл, Оби, TUI, Татнефть, ВТБ и другие.<br><br>\n`;
  html += `${tags}</p>`;

  // Avito hard limit: 7500 chars
  if (html.length > 7500) {
    // Trim the clean description to fit
    const excess = html.length - 7500;
    const shortDesc =
      cleanDesc.substring(0, Math.max(50, cleanDesc.length - excess - 5)) + "…";
    html = buildFullDescWithShortDesc(
      title,
      subtype,
      tw,
      shortDesc,
      avail,
      specs,
      frameEx,
      seatEx,
      wCm,
      dCm,
      hCm,
      collection,
    );
  }

  return html;
}

// Fallback builder with truncated description
function buildFullDescWithShortDesc(
  title,
  subtype,
  tw,
  cleanDesc,
  avail,
  specs,
  frameEx,
  seatEx,
  wCm,
  dCm,
  hCm,
  collection,
) {
  const features = keyFeatures(specs);
  const pdesc = producerDesc(specs);
  const mLines = matLines(tw, specs, frameEx, seatEx);
  const cases = getUseCases(tw);
  const tags = buildTags(tw, specs, collection);
  const availLine =
    avail === "В наличии"
      ? "🔥 В наличии! 🔥"
      : "📦 Под заказ — срок до 15 дней 📦";
  const hasDims = !!(hCm || wCm || dCm);

  let html = `<p>${introLine(title, subtype, tw)}<br> <br>\n`;
  html += `💯 Более 300 положительных отзывов на АВИТО! 💯 <br>\n`;
  html += `❤️‍🔥Средняя оценка — 5! ❤️‍🔥<br>\n`;
  html += `❤️‍🔥 7 лет создаём уют и комфорт в вашем доме и бизнесе! ❤️‍🔥 <br> <br>\n\n`;
  html += `✨ ${title} — ${useCaseLine(tw)} ${cleanDesc}<br>\n`;
  html += `🔧 Ключевые особенности: ${features}.<br>\n`;
  html += `📌 По описанию производителя: ${pdesc}<br>\n`;
  html += `❤️‍🔥 Отличный вариант для уличного отдыха — стиль и атмосфера под открытым небом.<br> <br>\n\n`;
  html += `${idealLine(tw)} ❤️‍🔥<br>\n`;
  html += `✨ Современный дизайн, практичность и лёгкость — всё в одном! ✨ <br>\n`;
  html += `${availLine}<br> <br>\n\n`;
  html += `Технические характеристики:<br>\n`;
  html += `🌿${mLines[0]} <br>\n`;
  html += `🌿${mLines[1]} <br>\n`;

  if (hasDims) {
    html += `<br>\n📐Размеры: <br>\n`;
    if (hCm) html += `общая высота — ${hCm} см,<br>\n`;
    if (dCm) html += `глубина — ${dCm} см,<br>\n`;
    if (wCm) html += `ширина — ${wCm} см ⚙️ <br> <br>\n`;
  }

  html += `\nИдеально подходит для: <br>\n`;
  for (const uc of cases) html += `✔️ ${uc}<br>\n`;

  html += `<br>\nПочему выбирают нас?<br>\n`;
  html += `⏳ Время изготовления: до 15 дней при отсутствии на складе <br>\n`;
  html += `🤝 Работаем с физическими и юридическими лицами<br>\n`;
  html += `💸 Оплата при получении, возможна безналичная<br> <br>\n\n`;
  html += `Обратите внимание: <br>\n`;
  html += `Более 7 лет поставляем мебель высокого качества — доверие крупнейших клиентов, `;
  html += `таких как Лукойл, Оби, TUI, Татнефть, ВТБ и другие.<br><br>\n`;
  html += `${tags}</p>`;

  return html.substring(0, 7500);
}

// ── Process all rows ──────────────────────────────────────────────────────────

console.log(`\n📝 Processing ${rows.length} rows…\n`);

const stats = { converted: 0, noDesc: 0, tooLong: 0 };

const newRows = rows.map((row, idx) => {
  const newRow = [...row];
  const title = String(row[C.name] || "")
    .padEnd(38)
    .substring(0, 38);

  const desc = buildFullDesc(row);
  if (desc.length > 7500) stats.tooLong++;
  if (!String(row[C.desc] || "").trim()) stats.noDesc++;

  newRow[C.desc] = desc;
  newRow[C.width] = mmToCm(row[C.width]) || row[C.width];
  newRow[C.depth] = mmToCm(row[C.depth]) || row[C.depth];
  newRow[C.height] = mmToCm(row[C.height]) || row[C.height];

  stats.converted++;
  process.stdout.write(
    `  [${String(idx + 1).padStart(3)}/${rows.length}]  ${title}  ${desc.length} chars ✓\n`,
  );

  return newRow;
});

// ── Write v2 Excel (original untouched) ──────────────────────────────────────

const newWsData = [headers, ...newRows];
const newWs = XLSX.utils.aoa_to_sheet(newWsData);

// Carry over column widths; widen description column
const cols = (ws["!cols"] || []).map((c, i) => ({ ...c }));
if (cols[C.desc]) cols[C.desc].wch = 120; // wider for HTML
newWs["!cols"] = cols;
if (ws["!views"]) newWs["!views"] = ws["!views"];

const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newWs, "Авито автозагрузка");
XLSX.writeFile(newWb, OUTPUT_FILE);

console.log(`\n✅  Saved: ${OUTPUT_FILE}`);
console.log(`   Rows processed : ${stats.converted}`);
if (stats.tooLong) console.log(`   ⚠️  Truncated (>7500): ${stats.tooLong}`);
if (stats.noDesc) console.log(`   ⚠️  Had empty desc   : ${stats.noDesc}`);

// GoodsSubType summary
const byType = {};
newRows.forEach((r) => {
  byType[r[C.subtype]] = (byType[r[C.subtype]] || 0) + 1;
});
console.log("\n📋  By GoodsSubType:");
Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([t, n]) => {
    console.log(`   ${String(n).padStart(3)}  ${t}`);
  });
console.log("");
