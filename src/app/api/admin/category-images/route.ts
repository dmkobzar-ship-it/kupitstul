import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "category-images.json",
);

function loadImages(): Record<string, string> {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveImages(data: Record<string, string>) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET — load all category images
export async function GET() {
  const images = loadImages();
  return NextResponse.json({ success: true, data: images });
}

// POST — save category image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, imageUrl } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { success: false, error: "slug is required" },
        { status: 400 },
      );
    }

    const images = loadImages();

    if (imageUrl) {
      images[slug] = imageUrl;
    } else {
      delete images[slug];
    }

    saveImages(images);

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error("Category images error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
