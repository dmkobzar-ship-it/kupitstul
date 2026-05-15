import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Security: only allow localhost calls (from deploy script / cron)
function isLocalRequest(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "";
  return ip === "" || ip === "127.0.0.1" || ip === "::1";
}

let warmingInProgress = false;

// In the background, fetch all product first-images through /api/img
// so they get saved into the persistent img-cache volume.
async function warmImagesInBackground() {
  if (warmingInProgress) return;
  warmingInProgress = true;
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  try {
    const jsonPath = path.join(process.cwd(), "src", "data", "products.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(raw);
    const products: Array<{ id: string; images: string[] }> = data.products;

    // Collect all first images that are external URLs
    const urls: string[] = [];
    for (const p of products) {
      if (p.images?.[0] && p.images[0].startsWith("http")) {
        urls.push(p.images[0]);
      }
    }

    console.log(`[warm-cache] Starting warm-up for ${urls.length} images...`);

    // Process 8 at a time to avoid overwhelming the server
    const CONCURRENCY = 8;
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const batch = urls.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            const encoded = encodeURIComponent(url);
            const res = await fetch(
              `http://127.0.0.1:3000/api/img?url=${encoded}`,
              { signal: AbortSignal.timeout(20_000) }
            );
            if (res.ok) {
              // Drain body so connection is released
              await res.arrayBuffer();
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        })
      );
      // Small delay between batches to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(
      `[warm-cache] Done in ${elapsed}s — ${successCount} cached, ${errorCount} errors`
    );
  } catch (err) {
    console.error("[warm-cache] Error:", err);
  } finally {
    warmingInProgress = false;
  }
}

export async function GET(req: NextRequest) {
  if (!isLocalRequest(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (warmingInProgress) {
    return NextResponse.json({ status: "already_running" });
  }

  // Start warming in background (don't await)
  warmImagesInBackground().catch(() => {});

  return NextResponse.json({
    status: "started",
    message: "Cache warming started in background",
  });
}
