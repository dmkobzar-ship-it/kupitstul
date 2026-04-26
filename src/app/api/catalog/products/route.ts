import { NextRequest, NextResponse } from "next/server";
import { getImportedProducts } from "@/data/importedProducts";
import type { Product } from "@/types/product";

// Room to categories mapping (mirrors catalog/page.tsx)
const roomCategories: Record<string, string[]> = {
  kitchen: ["stulya", "stoly", "barnye-stulya"],
  living: ["divany", "kresla", "stoly", "stellazhi", "tumby-tv", "pufy"],
  bedroom: ["krovati", "komody", "tumby", "shkafy", "zerkala"],
  office: ["kompyuternye-kresla", "stoly", "stellazhi", "shkafy"],
  hallway: ["pufy", "shkafy", "zerkala", "komody", "stellazhi"],
};

// Style keywords mapping (mirrors catalog/page.tsx)
const styleKeywords: Record<string, string[]> = {
  loft: ["лофт", "loft", "индустриальн", "металл"],
  scandi: ["сканди", "scandi", "скандинав"],
  classic: ["классик", "classic", "классическ"],
  modern: ["модерн", "modern", "современн"],
  minimal: ["минимал", "minimal"],
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    48,
    Math.max(1, parseInt(searchParams.get("limit") || "24", 10)),
  );
  const room = searchParams.get("room") || "";
  const style = searchParams.get("style") || "";
  const q = searchParams.get("q") || "";
  const priceMin = parseFloat(searchParams.get("priceMin") || "0");
  const priceMax = parseFloat(searchParams.get("priceMax") || "0"); // 0 = no limit
  const materials =
    searchParams.get("materials")?.split(",").filter(Boolean) ?? [];
  const colors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const sortBy = searchParams.get("sortBy") || "popular";
  const category = searchParams.get("category") || "";

  let products: Product[] = getImportedProducts();

  // Apply category filter
  if (category) {
    // stulya includes barnye-stulya (merged in UI)
    if (category === "stulya") {
      products = products.filter(
        (p) => p.category === "stulya" || p.category === "barnye-stulya",
      );
    } else {
      products = products.filter((p) => p.category === category);
    }
  }

  // Apply room filter (interleave categories for diverse display)
  if (room && roomCategories[room]) {
    const cats = roomCategories[room];
    const byCategory = cats.map((cat) =>
      products.filter((p) => p.category === cat),
    );
    const interleaved: Product[] = [];
    const maxLen = Math.max(...byCategory.map((arr) => arr.length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const catProducts of byCategory) {
        if (i < catProducts.length) interleaved.push(catProducts[i]);
      }
    }
    products = interleaved;
  }

  // Apply style filter
  if (style && styleKeywords[style]) {
    const keywords = styleKeywords[style];
    products = products.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return keywords.some((kw) => name.includes(kw) || desc.includes(kw));
    });
  }

  // Apply search query
  if (q) {
    const ql = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(ql) ||
        (p.description || "").toLowerCase().includes(ql) ||
        p.category.toLowerCase().includes(ql),
    );
  }

  // Compute maxPriceValue before user price-filters
  const maxPriceValue =
    products.length > 0
      ? Math.ceil(Math.max(...products.map((p) => p.price)) / 10000) * 10000
      : 500000;

  // Price filter
  if (priceMin > 0) {
    products = products.filter((p) => p.price >= priceMin);
  }
  if (priceMax > 0 && priceMax < maxPriceValue) {
    products = products.filter((p) => p.price <= priceMax);
  }

  // Material filter
  if (materials.length > 0) {
    products = products.filter((p) => {
      const specMat = p.specifications?.material?.toLowerCase() || "";
      const seatMat = p.specifications?.seatMaterial?.toLowerCase() || "";
      const materialsArr = (p.materials || []).map((m: string) =>
        m.toLowerCase(),
      );
      const descLower = (p.description || "").toLowerCase();
      const nameLower = p.name.toLowerCase();
      return materials.some((fm) => {
        const fml = fm.toLowerCase();
        return (
          specMat.includes(fml) ||
          seatMat.includes(fml) ||
          materialsArr.some((m: string) => m.includes(fml)) ||
          descLower.includes(fml) ||
          nameLower.includes(fml)
        );
      });
    });
  }

  // Color filter
  if (colors.length > 0) {
    products = products.filter((p) => {
      const nameLower = p.name.toLowerCase();
      const descLower = (p.description || "").toLowerCase();
      const productColors = (p.colors || []).map((c: { name: string }) =>
        c.name.toLowerCase(),
      );
      return colors.some((fc) => {
        const fcl = fc.toLowerCase();
        return (
          nameLower.includes(fcl) ||
          descLower.includes(fcl) ||
          productColors.some((pc: string) => pc.includes(fcl))
        );
      });
    });
  }

  // Stock filter
  if (inStockOnly) {
    products = products.filter((p) => p.inStock);
  }

  // Sort
  switch (sortBy) {
    case "price-asc":
      products = [...products].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products = [...products].sort((a, b) => b.price - a.price);
      break;
    case "rating":
      products = [...products].sort((a, b) => {
        const rA =
          typeof a.rating === "string" ? parseFloat(a.rating) : a.rating || 0;
        const rB =
          typeof b.rating === "string" ? parseFloat(b.rating) : b.rating || 0;
        return rB - rA;
      });
      break;
    case "new":
      products = [...products].sort((a, b) => {
        const aNew = a.badges?.includes("Новинка") ? 1 : 0;
        const bNew = b.badges?.includes("Новинка") ? 1 : 0;
        return bNew - aNew;
      });
      break;
    default:
      // "popular" — preserve source order
      break;
  }

  const total = products.length;
  const start = (page - 1) * limit;
  const pageProducts = products.slice(start, start + limit);

  return NextResponse.json({
    products: pageProducts,
    total,
    page,
    limit,
    hasMore: start + limit < total,
    maxPrice: maxPriceValue,
  });
}
