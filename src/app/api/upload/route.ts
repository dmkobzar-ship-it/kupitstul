import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const PRODUCTS_JSON = path.join(process.cwd(), "src", "data", "products.json");

function loadProductsData(): { products: any[]; categories: any[] } {
  try {
    const raw = fs.readFileSync(PRODUCTS_JSON, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { products: [], categories: [] };
  }
}

function saveProductsData(data: { products: any[]; categories: any[] }) {
  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(data, null, 0), "utf-8");
}

function slugify(text: string): string {
  const tr: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "j",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => tr[c] || c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const data = loadProductsData();
    let filtered = [...data.products];

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.id?.toLowerCase().includes(s),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: start + limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

// POST - create a new product and persist to products.json
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loadProductsData();

    const slug = body.slug || slugify(body.name || "novyj-tovar");
    const id = slug || `manual_${Date.now()}`;

    const newProduct: Record<string, any> = {
      id,
      name: body.name || "Новый товар",
      slug,
      description: body.description || "",
      price: body.price || 0,
      oldPrice: body.originalPrice || undefined,
      category: body.category || "stulya",
      images: body.images || [],
      inStock: body.inStock !== false,
      specifications: body.specifications || {},
      colors: [],
      materials: [],
      rating: "5.0",
      reviewsCount: 0,
      badges: body.tags || [],
    };

    // Parse materials from specs
    if (newProduct.specifications) {
      for (const [key, val] of Object.entries(newProduct.specifications)) {
        if (
          typeof val === "string" &&
          val &&
          key.toLowerCase().includes("материал")
        ) {
          newProduct.materials.push(val);
        }
      }
    }

    data.products.push(newProduct);

    // Update category count
    const catIdx = data.categories.findIndex(
      (c: any) => c.slug === newProduct.category,
    );
    if (catIdx >= 0) {
      data.categories[catIdx].count = data.products.filter(
        (p: any) => p.category === newProduct.category,
      ).length;
    } else {
      data.categories.push({
        slug: newProduct.category,
        name: newProduct.category.replace(/-/g, " "),
        count: 1,
      });
    }

    saveProductsData(data);

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: "Товар успешно создан и сохранён в каталог",
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании товара" },
      { status: 500 },
    );
  }
}

// PUT - update an existing product in products.json
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loadProductsData();

    const productId = body.id;
    if (!productId) {
      return NextResponse.json(
        { error: "ID товара обязателен" },
        { status: 400 },
      );
    }

    const idx = data.products.findIndex((p: any) => p.id === productId);
    if (idx === -1) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const oldCategory = data.products[idx].category;

    // Merge updated fields into existing product
    const updated = {
      ...data.products[idx],
      name: body.name ?? data.products[idx].name,
      slug: body.slug ?? data.products[idx].slug,
      description: body.description ?? data.products[idx].description,
      price: body.price !== undefined ? body.price : data.products[idx].price,
      oldPrice:
        body.oldPrice !== undefined
          ? body.oldPrice
          : data.products[idx].oldPrice,
      category: body.category ?? data.products[idx].category,
      images: body.images ?? data.products[idx].images,
      inStock:
        body.inStock !== undefined ? body.inStock : data.products[idx].inStock,
      specifications: body.specifications ?? data.products[idx].specifications,
      colors: body.colors ?? data.products[idx].colors,
      materials: body.materials ?? data.products[idx].materials,
      rating: body.rating ?? data.products[idx].rating,
      reviewsCount:
        body.reviewsCount !== undefined
          ? body.reviewsCount
          : data.products[idx].reviewsCount,
      badges: body.badges ?? data.products[idx].badges,
    };

    data.products[idx] = updated;

    // Update category counts if category changed
    if (oldCategory !== updated.category) {
      recalcCategoryCounts(data);
    }

    saveProductsData(data);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Товар успешно обновлён",
    });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении товара" },
      { status: 500 },
    );
  }
}

// DELETE - remove a product from products.json
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "ID товара обязателен" },
        { status: 400 },
      );
    }

    const data = loadProductsData();
    const idx = data.products.findIndex((p: any) => p.id === productId);

    if (idx === -1) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    data.products.splice(idx, 1);
    recalcCategoryCounts(data);
    saveProductsData(data);

    return NextResponse.json({
      success: true,
      message: "Товар успешно удалён",
    });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении товара" },
      { status: 500 },
    );
  }
}

// Recalculate category counts based on current products
function recalcCategoryCounts(data: { products: any[]; categories: any[] }) {
  const counts: Record<string, number> = {};
  for (const p of data.products) {
    const cat = p.category || "other";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  // Update existing categories
  for (const cat of data.categories) {
    cat.count = counts[cat.slug] || 0;
  }

  // Add any new categories that appeared
  for (const [slug, count] of Object.entries(counts)) {
    if (!data.categories.find((c: any) => c.slug === slug)) {
      data.categories.push({
        slug,
        name: slug.replace(/-/g, " "),
        count,
      });
    }
  }

  // Remove categories with 0 products
  data.categories = data.categories.filter((c: any) => c.count > 0);
}
