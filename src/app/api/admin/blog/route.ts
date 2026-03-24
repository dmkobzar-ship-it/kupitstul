import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BLOG_CONFIG_PATH = path.join(process.cwd(), "data", "blog-articles.json");

export interface BlogArticleConfig {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured: boolean;
  tags: string[];
}

function getArticles(): BlogArticleConfig[] {
  try {
    if (fs.existsSync(BLOG_CONFIG_PATH)) {
      const raw = fs.readFileSync(BLOG_CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveArticles(articles: BlogArticleConfig[]) {
  const dir = path.dirname(BLOG_CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BLOG_CONFIG_PATH, JSON.stringify(articles, null, 2));
}

// GET — return all articles
export async function GET() {
  const articles = getArticles();
  return NextResponse.json({ success: true, articles });
}

// POST — add or update an article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const articles = getArticles();

    if (body.id) {
      // Update existing
      const idx = articles.findIndex((a) => a.id === body.id);
      if (idx >= 0) {
        articles[idx] = { ...articles[idx], ...body };
      } else {
        articles.push(body);
      }
    } else {
      // Add new — generate ID
      const maxId = articles.reduce((max, a) => Math.max(max, a.id || 0), 0);
      body.id = maxId + 1;
      if (!body.slug) {
        body.slug = body.title
          .toLowerCase()
          .replace(/[^a-zа-яё0-9\s]/gi, "")
          .replace(/\s+/g, "-")
          .substring(0, 60);
      }
      articles.unshift(body);
    }

    saveArticles(articles);
    return NextResponse.json({ success: true, articles });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 400 },
    );
  }
}

// DELETE — remove an article
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    let articles = getArticles();
    articles = articles.filter((a) => a.id !== id);
    saveArticles(articles);
    return NextResponse.json({ success: true, articles });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 400 },
    );
  }
}
