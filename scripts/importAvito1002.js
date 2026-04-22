// Объединённый импорт товаров из обоих xlsx файлов
// c дедупликацией по ID

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const excel1 = path.join(
  __dirname,
  "..",
  "data",
  "142483789_2026-01-19T08_08_01Z.xlsx",
);
const excel2 = path.join(__dirname, "..", "data", "автозагрузка 1002.xlsx");
const outputPath = path.join(__dirname, "..", "src", "data", "products.json");

const sheetToCategory = {
  "Столы и стулья-Табуретки": "taburetki",
  "Шкафы, комоды и-Комоды и тумбы": "komody",
  "Шкафы, комоды и-Стеллажи и этаж": "stellazhi",
  "Тумбы-Тумбы под телевизор": "tumby-tv",
  "Кресла и стулья-Стулья для рабо": "ofisnye-stulya",
  "Предметы интерьера, иск-Зеркала": "zerkala",
  "Садовая мебель-Садовые стулья и": "sadovaya-mebel",
  "Столы и стулья-Стулья": "stulya",
  "Кресла и стулья-Компьютерные кр": "kompyuternye-kresla",
  "Столы и стулья-Столы": "stoly",
  "Тумбы-Тумбы": "tumby",
  "Шкафы, комоды и-Шкафы и буфеты": "shkafy",
  "Кровати, диваны и кресла-Кресла": "kresla",
  "Кровати, диваны-Пуфы и банкетки": "pufy",
  "Кровати, диваны и кресла-Диваны": "divany",
  "Кровати, диваны и кресл-Кровати": "krovati",
};

// Millargo-format sheets (different column layout: id=0, name=2, desc=3, images=4, price=11)
const millargoSheetToCategory = {
  "Садовые стулья и табуреты": "sadovaya-mebel",
  "Садовые кресла": "sadovaya-mebel",
  "Комплекты садовой мебели": "sadovaya-mebel",
  "Садовые столы": "sadovaya-mebel",
  "Садовые диваны": "sadovaya-mebel",
};

const categoryNames = {
  stulya: "Стулья",
  "barnye-stulya": "Барные стулья",
  stoly: "Столы",
  kresla: "Кресла",
  "kompyuternye-kresla": "Компьютерные кресла",
  "ofisnye-stulya": "Офисные стулья",
  taburetki: "Табуретки",
  komody: "Комоды и тумбы",
  stellazhi: "Стеллажи",
  tumby: "Тумбы",
  "tumby-tv": "Тумбы под ТВ",
  shkafy: "Шкафы и буфеты",
  pufy: "Пуфы и банкетки",
  zerkala: "Зеркала",
  "sadovaya-mebel": "Садовая мебель",
  divany: "Диваны",
  krovati: "Кровати",
};

const translitMap = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function generateSlug(name, id) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  slug = slug
    .split("")
    .map((c) => translitMap[c] || c)
    .join("");
  slug = slug.replace(/[^a-z0-9-]/g, "").substring(0, 50);
  return slug + "-" + String(id).substring(0, 8);
}

function parseColor(colorName) {
  const colorMap = {
    белый: "#ffffff",
    черный: "#1a1a1a",
    чёрный: "#1a1a1a",
    серый: "#808080",
    бежевый: "#d4a574",
    коричневый: "#8b4513",
    венге: "#3d2b1f",
    орех: "#5c4033",
    дуб: "#a0826d",
    красный: "#dc2626",
    синий: "#2563eb",
    зеленый: "#16a34a",
    зелёный: "#16a34a",
    желтый: "#eab308",
    жёлтый: "#eab308",
    оранжевый: "#ea580c",
    розовый: "#ec4899",
    фиолетовый: "#9333ea",
    голубой: "#0ea5e9",
    бордовый: "#881337",
    бордо: "#881337",
    натуральный: "#deb887",
    молочный: "#fdfff5",
    кремовый: "#fffdd0",
  };
  const lower = (colorName || "").toLowerCase();
  for (const [name, hex] of Object.entries(colorMap)) {
    if (lower.includes(name)) return { name: colorName, hex };
  }
  return { name: colorName || "Стандартный", hex: "#808080" };
}

function cleanHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

function parseSheet(ws, colMap, baseCategory, seenIds, filePrefix) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const products = [];

  // Auto-detect price column from header rows (try row 1, then row 0)
  const headerRow = data[1] || [];
  const headerRow0 = data[0] || [];
  let priceCol = colMap.price; // fallback to configured
  // First try row 1 (most sheets), then row 0 (some sheets)
  for (const hRow of [headerRow, headerRow0]) {
    let found = false;
    for (let c = 0; c < hRow.length; c++) {
      const h = String(hRow[c] || "")
        .toLowerCase()
        .trim();
      if (h === "цена") {
        priceCol = c;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Detect data start row: skip header rows (look for first row where col0 is numeric ID)
  let dataStart = 4;
  for (let i = 1; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row[0] && /^\d{8,}$/.test(String(row[0]).trim())) {
      dataStart = i;
      break;
    }
  }

  for (let i = dataStart; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[colMap.id] || !row[colMap.name]) continue;

    const rawId = String(row[colMap.id]).trim();
    // Include file prefix so same Avito IDs across files don't collide
    const id = filePrefix ? `${filePrefix}_${rawId}` : rawId;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const name = String(row[colMap.name] || "").trim();
    const description = cleanHtml(String(row[colMap.desc] || ""));
    const price = parseFloat(row[priceCol]) || 0;
    const imagesRaw = String(row[colMap.images] || "");
    const weight = parseFloat(row[colMap.weight]) || undefined;
    const depth = parseFloat(row[colMap.depth]) || undefined;
    const height = parseFloat(row[colMap.height]) || undefined;
    const width = parseFloat(row[colMap.width]) || undefined;
    const colorName = String(row[colMap.color1] || row[colMap.color2] || "");
    const chairType = String(row[colMap.chairType] || "");
    const seatMaterial = String(row[colMap.seatMat] || "");
    const frameMaterial = String(row[colMap.frameMat] || "");

    if (!name || price <= 0) continue;

    let category = baseCategory;
    const text = name.toLowerCase() + " " + description.toLowerCase();
    // Переводим в barnye-stulya только если базовая категория — стулья (не столы, кресла и т.д.)
    if (baseCategory === "stulya") {
      if (chairType.toLowerCase().includes("барн") || text.includes("барн")) {
        category = "barnye-stulya";
      }
    }

    const images = imagesRaw
      .split("|")
      .map((url) => {
        url = url.trim();
        if (url.includes("avito.ru/autoload") && url.includes("imageSlug=")) {
          const match = url.match(/imageSlug=([^&]+)/);
          if (match)
            return "https://00.img.avito.st" + decodeURIComponent(match[1]);
        }
        return url;
      })
      .filter((url) => url.startsWith("http"));

    const color = parseColor(colorName);
    const specs = {};
    if (width) specs.width = width;
    if (height) specs.height = height;
    if (depth) specs.depth = depth;
    if (weight) specs.weight = weight;
    if (frameMaterial) specs.material = frameMaterial;
    if (seatMaterial) specs.seatMaterial = seatMaterial;

    products.push({
      id,
      name,
      category,
      slug: generateSlug(name, id),
      description: description || undefined,
      price,
      images,
      inStock: true,
      specifications: Object.keys(specs).length > 0 ? specs : undefined,
      colors: colorName ? [color] : undefined,
      materials: [seatMaterial, frameMaterial].filter(Boolean),
      rating: (4.5 + Math.random() * 0.5).toFixed(1),
      reviewsCount: Math.floor(Math.random() * 50) + 5,
      badges: [],
    });
  }
  return products;
}

function parseMillargoSheet(ws, category, seenIds, filePrefix) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const products = [];
  // Millargo format: header in row 0, data from row 1
  // id=0, name=2, desc=3, images=4 (or 5 for Комплекты), price=11 (or 12 for Комплекты)
  // color=16 (or 17), width=17 (or 18), depth=18 (or 19), height=19 (or 20)
  // Detect if there's an extra column (Состав комплекта) by checking header
  const header = data[0] || [];
  const hasComposition = String(header[4] || "").includes("Состав");
  const imgCol = hasComposition ? 5 : 4;
  const priceCol = hasComposition ? 12 : 11;
  const colorCol = hasComposition ? 17 : 16;
  const widthCol = hasComposition ? 18 : 17;
  const depthCol = hasComposition ? 19 : 18;
  const heightCol = hasComposition ? 20 : 19;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    const rawId = String(row[0]).trim();
    const id = filePrefix ? `${filePrefix}_${rawId}` : rawId;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const name = String(row[2] || "").trim();
    const description = cleanHtml(String(row[3] || ""));
    const price = parseFloat(row[priceCol]) || 0;
    const imagesRaw = String(row[imgCol] || "");
    const colorName = String(row[colorCol] || "");
    const width = parseFloat(row[widthCol]) || undefined;
    const depth = parseFloat(row[depthCol]) || undefined;
    const height = parseFloat(row[heightCol]) || undefined;

    if (!name || price <= 0) continue;

    const images = imagesRaw
      .split("|")
      .map((url) => url.trim())
      .filter((url) => url.startsWith("http"));

    const color = parseColor(colorName);
    const specs = {};
    if (width) specs.width = width;
    if (height) specs.height = height;
    if (depth) specs.depth = depth;

    products.push({
      id,
      name,
      category,
      slug: generateSlug(name, id),
      description: description || undefined,
      price,
      images,
      inStock: true,
      specifications: Object.keys(specs).length > 0 ? specs : undefined,
      colors: colorName ? [color] : undefined,
      materials: [],
      rating: (4.5 + Math.random() * 0.5).toFixed(1),
      reviewsCount: Math.floor(Math.random() * 50) + 5,
      badges: [],
    });
  }
  return products;
}

function parseXlsx(excelPath, colMap, seenIds, filePrefix) {
  console.log(`\n📖 ${path.basename(excelPath)}`);
  const wb = XLSX.readFile(excelPath);
  const sheets = wb.SheetNames.filter(
    (n) =>
      !n.startsWith("Спр-") &&
      n !== "Инструкция" &&
      !n.includes("Фото-") &&
      !n.includes("Ремонт"),
  );

  let total = 0;
  const products = [];
  for (const sheetName of sheets) {
    // Standard Avito format
    const cat = sheetToCategory[sheetName];
    if (cat) {
      const ws = wb.Sheets[sheetName];
      const p = parseSheet(ws, colMap, cat, seenIds, filePrefix);
      process.stdout.write(`   ${sheetName}: ${p.length}\n`);
      products.push(...p);
      total += p.length;
      continue;
    }
    // Millargo format
    const milCat = millargoSheetToCategory[sheetName];
    if (milCat) {
      const ws = wb.Sheets[sheetName];
      const p = parseMillargoSheet(ws, milCat, seenIds, filePrefix);
      process.stdout.write(`   ${sheetName} [millargo]: ${p.length}\n`);
      products.push(...p);
      total += p.length;
    }
  }
  console.log(`   → Total: ${total}`);
  return products;
}

function main() {
  // Each file gets its own seenIds to avoid cross-file ID collision
  const seenIds1 = new Set();
  const seenIds2 = new Set();

  // File 1: price=col7, images=col8
  const colMap1 = {
    id: 0,
    name: 5,
    desc: 6,
    price: 7,
    images: 8,
    weight: 13,
    depth: 14,
    height: 15,
    width: 16,
    color1: 20,
    color2: 21,
    chairType: 26,
    seatMat: 27,
    frameMat: 28,
  };

  // File 2: price=col16, images=col7
  const colMap2 = {
    id: 0,
    name: 5,
    desc: 6,
    price: 16,
    images: 7,
    weight: 12,
    depth: 13,
    height: 14,
    width: 15,
    color1: 21,
    color2: 22,
    chairType: 26,
    seatMat: 27,
    frameMat: 28,
  };

  const products1 = parseXlsx(excel1, colMap1, seenIds1, "f1");
  const products2 = parseXlsx(excel2, colMap2, seenIds2, "f2");

  // Deduplicate across files by name fingerprint (same name+price = same product)
  const nameFingerprints = new Set(
    products1.map((p) => p.name.trim().toLowerCase() + "_" + p.price),
  );
  const uniqueProducts2 = products2.filter((p) => {
    const fp = p.name.trim().toLowerCase() + "_" + p.price;
    return !nameFingerprints.has(fp);
  });

  const merged = [...products1, ...uniqueProducts2];

  console.log(`\n📊 Total: ${merged.length} unique products`);
  console.log(
    `   File 1: ${products1.length} | File 2 raw: ${products2.length} | File 2 new: ${uniqueProducts2.length}`,
  );

  const catStats = {};
  for (const p of merged)
    catStats[p.category] = (catStats[p.category] || 0) + 1;

  const categories = Object.entries(catStats)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({
      slug,
      name: categoryNames[slug] || slug,
      count,
    }));

  // Write compact JSON (not TS) — loaded at server runtime, NOT bundled into JS
  const jsonContent = JSON.stringify({ products: merged, categories }, null, 2);
  fs.writeFileSync(outputPath, jsonContent, "utf-8");
  console.log(`\n💾 Written: ${outputPath}`);

  console.log("\nBy category:");
  categories.forEach((c) => console.log(`  ${c.name}: ${c.count}`));
  console.log("\n🎉 Done!");
}

main();
