import { NextRequest, NextResponse } from "next/server";

// Временное хранение в памяти (вместо базы данных)
let products: any[] = [];
let importLogs: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products: importedProducts } = body;

    if (!importedProducts || !Array.isArray(importedProducts)) {
      return NextResponse.json(
        { error: "Некорректные данные" },
        { status: 400 }
      );
    }

    const errors: any[] = [];
    const successfulImports: any[] = [];

    for (let i = 0; i < importedProducts.length; i++) {
      const item = importedProducts[i];

      try {
        // Валидация
        if (!item.name || !item.price || !item.category) {
          throw new Error("Отсутствуют обязательные поля");
        }

        // Создаем товар
        const newProduct = {
          id: `prod_${Date.now()}_${i}`,
          name: item.name,
          price: parseFloat(item.price),
          originalPrice: item.originalPrice
            ? parseFloat(item.originalPrice)
            : undefined,
          category: item.category,
          description: item.description || "",
          sku: item.sku || `SKU-${Date.now()}-${i}`,
          inStock: item.inStock !== undefined ? item.inStock : true,
          stockCount: item.stockCount || 1,
          images: item.images ? item.images.split(",") : [],
          tags: item.tags ? item.tags.split(",") : [],
          material: item.material ? item.material.split(",") : [],
          color: item.color ? item.color.split(",") : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        products.push(newProduct);
        successfulImports.push(newProduct);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
          data: item,
        });
      }
    }

    // Создаем лог импорта
    const importLog = {
      id: `log_${Date.now()}`,
      fileName: body.fileName || "import.csv",
      fileType: body.fileType || "csv",
      totalRows: importedProducts.length,
      importedRows: successfulImports.length,
      failedRows: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    importLogs.unshift(importLog);

    // Ограничиваем количество логов
    if (importLogs.length > 100) {
      importLogs = importLogs.slice(0, 100);
    }

    return NextResponse.json({
      success: true,
      message: `Успешно импортировано ${successfulImports.length} товаров`,
      imported: successfulImports.length,
      failed: errors.length,
      importId: importLog.id,
      errors: errors.length > 0 ? errors : undefined,
      sample: successfulImports.slice(0, 3), // Первые 3 товара для примера
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Ошибка при импорте товаров",
        details: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API импорта товаров",
    stats: {
      totalProducts: products.length,
      totalImports: importLogs.length,
      recentImports: importLogs.slice(0, 5),
    },
  });
}
