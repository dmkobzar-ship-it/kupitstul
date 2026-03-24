import { NextRequest, NextResponse } from "next/server";
import { getImportedProducts } from "@/data/importedProducts";

// Category slug to Russian names mapping for search
const categoryNames: Record<string, string[]> = {
  "barnye-stulya": ["барные стулья", "барный стул", "барные"],
  stulya: ["стулья", "стул", "обеденные стулья", "кухонные стулья"],
  kresla: ["кресла", "кресло", "мягкие кресла"],
  stoly: ["столы", "стол", "обеденные столы", "кухонные столы"],
  krovati: ["кровати", "кровать"],
  pufy: ["пуфы", "пуф", "банкетки", "банкетка"],
  komody: ["комоды", "комод"],
  stellazhi: ["стеллажи", "стеллаж"],
  "kompyuternye-kresla": [
    "компьютерные кресла",
    "компьютерное кресло",
    "офисные кресла",
    "офисное кресло",
    "офисные стулья",
    "игровое кресло",
  ],
  divany: ["диваны", "диван"],
  "tumby-tv": ["тумбы тв", "тумба тв", "тумба под телевизор"],
  tumby: ["тумбы", "тумба", "тумбочки", "тумбочка", "прикроватная тумба"],
  shkafy: ["шкафы", "шкаф"],
  "ofisnye-stulya": ["офисные стулья"],
  zerkala: ["зеркала", "зеркало"],
  "sadovaya-mebel": ["садовая мебель"],
};

// Build reverse index: Russian search term -> category slug
const termToCategory: Record<string, string> = {};
for (const [slug, terms] of Object.entries(categoryNames)) {
  for (const term of terms) {
    termToCategory[term] = slug;
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Check if the query matches a category name
  const matchedCategorySlug =
    termToCategory[q] ||
    Object.entries(termToCategory).find(
      ([term]) => term.includes(q) || q.includes(term),
    )?.[1];

  let results;

  if (matchedCategorySlug) {
    // If query matches a category, prioritize products from that category
    const allProducts = getImportedProducts();
    const categoryProducts = allProducts.filter(
      (p) => p.category === matchedCategorySlug,
    );
    const otherMatches = allProducts.filter(
      (p) =>
        p.category !== matchedCategorySlug &&
        (p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)),
    );

    results = [...categoryProducts.slice(0, 10), ...otherMatches.slice(0, 2)]
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        oldPrice: p.oldPrice,
        category: p.category,
        image: p.images?.[0] || null,
      }));
  } else {
    // Standard text search
    results = getImportedProducts()
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        oldPrice: p.oldPrice,
        category: p.category,
        image: p.images?.[0] || null,
      }));
  }

  // Return matched category slug for "show all" navigation
  return NextResponse.json({
    results,
    matchedCategory: matchedCategorySlug || null,
  });
}
