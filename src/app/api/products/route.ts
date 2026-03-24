import { NextRequest, NextResponse } from "next/server";
import { productRepository } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");

    const filters: any = {
      page,
      limit,
    };

    if (category) filters.category = category;
    if (search) filters.search = search;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (inStock === "true") filters.inStock = true;
    if (inStock === "false") filters.inStock = false;

    const { products, total } = await productRepository.findAll(filters);

    // Добавляем вычисляемое поле скидки
    const productsWithDiscount = products.map((product) => ({
      ...product,
      discount:
        product.originalPrice && product.price < product.originalPrice
          ? Math.round(
              ((product.originalPrice - product.price) /
                product.originalPrice) *
                100
            )
          : null,
    }));

    return NextResponse.json({
      success: true,
      data: productsWithDiscount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении товаров" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await productRepository.create({
      name: body.name,
      price: parseFloat(body.price),
      originalPrice: body.originalPrice
        ? parseFloat(body.originalPrice)
        : undefined,
      category: body.category,
      description: body.description || "",
      material: body.material || [],
      color: body.color || [],
      images: body.images || [],
      inStock: body.inStock !== undefined ? body.inStock : true,
      stockCount: body.stockCount || 1,
      tags: body.tags || [],
      sku: body.sku || `SKU-${Date.now()}`,
      source: "manual",
      roomType: body.roomType || [],
      subcategory: body.subcategory,
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: "Товар успешно создан",
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании товара" },
      { status: 500 }
    );
  }
}
