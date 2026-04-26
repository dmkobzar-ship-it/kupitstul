import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

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

  let imageBuffer: Buffer;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.avito.ru/",
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

  // For non-Avito sources — return image as-is, no overlay
  if (!isAvitoUrl(url) || !OVERLAY_BUF) {
    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
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

    return new NextResponse(new Uint8Array(processed), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
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
