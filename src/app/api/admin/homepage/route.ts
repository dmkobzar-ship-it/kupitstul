import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CONFIG_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "homepage-config.json",
);

interface HeroSlide {
  url: string;
  alt: string;
  animation: string;
}

interface CategoryCard {
  id: string;
  name: string;
  count: number;
  href: string;
  image: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  href: string;
  image: string;
}

interface HomepageConfig {
  heroSlides: HeroSlide[];
  categories: CategoryCard[];
  collections: Collection[];
}

function loadConfig(): HomepageConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { heroSlides: [], categories: [], collections: [] };
  }
}

function saveConfig(config: HomepageConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// GET – read current homepage config
export async function GET() {
  try {
    const config = loadConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Homepage config read error:", error);
    return NextResponse.json(
      { error: "Ошибка чтения конфига" },
      { status: 500 },
    );
  }
}

// PUT – update a section of the homepage config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const config = loadConfig();

    // Update hero slides
    if (body.heroSlides !== undefined) {
      config.heroSlides = body.heroSlides;
    }

    // Update categories
    if (body.categories !== undefined) {
      config.categories = body.categories;
    }

    // Update collections
    if (body.collections !== undefined) {
      config.collections = body.collections;
    }

    saveConfig(config);

    return NextResponse.json({
      success: true,
      data: config,
      message: "Конфиг главной страницы обновлён",
    });
  } catch (error) {
    console.error("Homepage config update error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления конфига" },
      { status: 500 },
    );
  }
}
