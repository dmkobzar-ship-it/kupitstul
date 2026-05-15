import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Server-side image cache — processes each URL only once per container lifetime
// Stored in /app/img-cache (Docker named volume, persists across deploys)
const CACHE_DIR = path.join(process.cwd(), "img-cache");
try {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} catch {
  // If dir is not writable — proceed without caching
}

// Preload overlay image once at startup
const OVERLAY_BUF: Buffer | null = (() => {
  try {
    return fs.readFileSync(path.join(process.cwd(), "data", "заглушка.jpeg"));
  } catch {
    return null;
  }
})();

// заглушка.jpeg native size: 1429×483 → aspect ≈ 2.96
const OVERLAY_ASPECT = 1429 / 483;

// Allowed image source domains (prevents SSRF)
const ALLOWED_HOSTNAMES = new Set([
  "cdn3.avito.st",
  "cdn4.avito.st",
  "img.avito.st",
  "www.red-black.ru",
  "red-black.ru",
  "content.tetchair.ru",
  "tetchair.ru",
  "price.tetchair.ru",
  "millargo.ru",
  "www.millargo.ru",
  "splitavia.ru",
]);

function isAllowedUrl(raw: string): boolean {
  try {
    const { hostname, protocol } = new URL(raw);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (ALLOWED_HOSTNAMES.has(hostname)) return true;
    if (hostname.endsWith(".avito.st")) return true;
    return false;
  } catch {
    return false;
  }
}

function isAvitoUrl(raw: string): boolean {
  try {
    const { hostname } = new URL(raw);
    return hostname.endsWith(".avito.st");
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  // Serve from disk cache if already processed (instant, no Avito roundtrip)
  const cacheKey = crypto.createHash("sha256").update(url).digest("hex");
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.webp`);
  try {
    if (fs.existsSync(cachePath)) {
      const cached = fs.readFileSync(cachePath);
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }
  } catch {
    // Cache read failed — proceed to fetch fresh
  }

  let imageBuffer: Buffer;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.avito.ru/",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return new NextResponse("Failed to fetch image", { status: 502 });
    }
    imageBuffer = Buffer.from(await res.arrayBuffer());
  } catch {
    return new NextResponse("Image fetch error", { status: 502 });
  }

  // For non-Avito sources — convert to WebP for uniform caching
  if (!isAvitoUrl(url) || !OVERLAY_BUF) {
    try {
      const webp = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();
      try { fs.writeFileSync(cachePath, webp); } catch {}
      return new NextResponse(new Uint8Array(webp), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        },
      });
    } catch {
      // sharp failed (corrupted / non-image) — return original bytes uncached
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        },
      });
    }
  }

  // Avito image — overlay заглушка.jpeg in bottom-right corner
  try {
    const img = sharp(imageBuffer);
    const { width = 600, height = 600 } = await img.metadata();

    // Overlay width = 35% of image width, height derived from aspect ratio
    const oW = Math.round(width * 0.35);
    const oH = Math.round(oW / OVERLAY_ASPECT);
    const margin = 4;

    const overlayResized = await sharp(OVERLAY_BUF)
      .resize(oW, oH, { fit: "fill" })
      .toBuffer();

    const processed = await img
      .composite([
        {
          input: overlayResized,
          top: height - oH - margin,
          left: width - oW - margin,
        },
      ])
      .webp({ quality: 82 })
      .toBuffer();

    // Save processed image to cache for instant future responses
    try { fs.writeFileSync(cachePath, processed); } catch {}

    return new NextResponse(new Uint8Array(processed), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    // On processing error return original image unchanged
    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
