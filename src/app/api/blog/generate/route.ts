import { NextResponse } from "next/server";
import { getTodayArticle, getWeekArticles } from "@/lib/blogGenerator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "today";

  if (mode === "week") {
    const articles = getWeekArticles();
    return NextResponse.json({ articles, count: articles.length });
  }

  const article = getTodayArticle();
  return NextResponse.json({ article });
}
