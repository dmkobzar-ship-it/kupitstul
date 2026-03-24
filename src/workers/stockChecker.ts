/**
 * Stock Checker Worker
 * Periodically checks Avito listings for stock/price changes
 *
 * Can be run as:
 * 1. Cron job: node -r tsx scripts/stockChecker.js
 * 2. API endpoint: POST /api/admin/stock-check
 * 3. Next.js cron route (Vercel): export const revalidate = 3600
 *
 * Schedule: Every 6 hours (recommended)
 */

// Crontab example: 0 0,6,12,18 * * * cd /opt/kupitstul && npx tsx src/workers/stockChecker.ts

import { getDatabase } from "@/lib/database";

export interface StockCheckResult {
  total: number;
  checked: number;
  updated: number;
  errors: number;
  priceChanges: Array<{
    productId: string;
    name: string;
    oldPrice: number;
    newPrice: number;
  }>;
  outOfStock: Array<{
    productId: string;
    name: string;
  }>;
  backInStock: Array<{
    productId: string;
    name: string;
  }>;
  duration: number; // ms
}

/**
 * Check a single Avito listing for updates
 */
async function checkAvitoListing(
  avitoUrl: string,
): Promise<{ available: boolean; price?: number } | null> {
  try {
    // Note: Avito has anti-scraping. In production, use:
    // 1. Avito API (if you have autoload access)
    // 2. Proxy rotation service
    // 3. Headless browser with stealth

    const response = await fetch(avitoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.status === 404 || response.status === 410) {
      return { available: false };
    }

    if (!response.ok) {
      return null; // Can't determine, skip
    }

    const html = await response.text();

    // Check if listing is active
    const isRemoved =
      html.includes("Объявление снято") ||
      html.includes("Объявление не найдено") ||
      html.includes("Объявление заблокировано");

    if (isRemoved) {
      return { available: false };
    }

    // Try to extract price from HTML
    const priceMatch = html.match(/itemProp="price"\s+content="(\d+)"/);
    const price = priceMatch ? parseInt(priceMatch[1]) : undefined;

    return { available: true, price };
  } catch (error) {
    console.error(`[StockChecker] Error checking ${avitoUrl}:`, error);
    return null;
  }
}

/**
 * Run stock check for all products with Avito URLs
 */
export async function runStockCheck(): Promise<StockCheckResult> {
  const startTime = Date.now();
  const db = await getDatabase();

  const result: StockCheckResult = {
    total: 0,
    checked: 0,
    updated: 0,
    errors: 0,
    priceChanges: [],
    outOfStock: [],
    backInStock: [],
    duration: 0,
  };

  // Get products with Avito URLs
  const products =
    db.data.products?.filter(
      (p): p is typeof p & { avitoUrl: string } => !!p.avitoUrl,
    ) || [];

  result.total = products.length;
  console.log(`[StockChecker] Starting check for ${products.length} products`);

  // Process in batches of 5 with delay to avoid rate limiting
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 3000; // 3 seconds between batches

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    const checks = await Promise.allSettled(
      batch.map(async (product) => {
        const checkResult = await checkAvitoListing(product.avitoUrl);

        if (!checkResult) {
          result.errors++;
          return;
        }

        result.checked++;
        let changed = false;

        // Check stock status change
        if (checkResult.available !== product.inStock) {
          if (!checkResult.available) {
            result.outOfStock.push({
              productId: product.id,
              name: product.name,
            });
            product.inStock = false;
          } else {
            result.backInStock.push({
              productId: product.id,
              name: product.name,
            });
            product.inStock = true;
          }
          changed = true;
        }

        // Check price change
        if (
          checkResult.price &&
          checkResult.price !== product.price &&
          Math.abs(checkResult.price - product.price) > 100 // Ignore tiny changes
        ) {
          result.priceChanges.push({
            productId: product.id,
            name: product.name,
            oldPrice: product.price,
            newPrice: checkResult.price,
          });
          product.price = checkResult.price;
          changed = true;
        }

        if (changed) {
          result.updated++;
        }
      }),
    );

    // Check for errors in settled promises
    checks.forEach((c: PromiseSettledResult<void>) => {
      if (c.status === "rejected") {
        result.errors++;
      }
    });

    // Wait between batches
    if (i + BATCH_SIZE < products.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }

    // Log progress
    const progress = Math.round(((i + batch.length) / products.length) * 100);
    console.log(`[StockChecker] Progress: ${progress}%`);
  }

  // Save changes
  await db.write();

  result.duration = Date.now() - startTime;

  console.log(`[StockChecker] Complete in ${result.duration}ms`);
  console.log(
    `  Checked: ${result.checked}, Updated: ${result.updated}, Errors: ${result.errors}`,
  );
  console.log(
    `  Price changes: ${result.priceChanges.length}, Out of stock: ${result.outOfStock.length}, Back in stock: ${result.backInStock.length}`,
  );

  return result;
}

// Run directly if executed as script
if (require.main === module) {
  runStockCheck()
    .then((result) => {
      console.log("\n=== Stock Check Report ===");
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Stock check failed:", error);
      process.exit(1);
    });
}
