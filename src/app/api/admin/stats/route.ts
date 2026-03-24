import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const db = await getDatabase();
    const products = db.data!.products || [];
    const orders = db.data!.orders || [];
    const categories = db.data!.categories || [];

    const activeProducts = products.filter((p: any) => p.isActive !== false);
    const inStockProducts = activeProducts.filter((p: any) => p.inStock);

    // Revenue
    const totalRevenue = orders.reduce(
      (sum: number, o: any) => sum + (o.total || 0),
      0,
    );

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(
      (o: any) => new Date(o.createdAt) >= thirtyDaysAgo,
    );

    // Today's orders
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(
      (o: any) => o.createdAt?.slice(0, 10) === today,
    );

    // Top products by orders
    const productOrderCount: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};
    orders.forEach((order: any) => {
      (order.items || []).forEach((item: any) => {
        if (!productOrderCount[item.productId]) {
          productOrderCount[item.productId] = {
            name: item.name,
            count: 0,
            revenue: 0,
          };
        }
        productOrderCount[item.productId].count += item.quantity || 1;
        productOrderCount[item.productId].revenue +=
          item.total || item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productOrderCount)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ productId: id, ...data }));

    // Order statuses breakdown
    const statusCounts: Record<string, number> = {};
    orders.forEach((o: any) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        products: {
          total: activeProducts.length,
          inStock: inStockProducts.length,
          outOfStock: activeProducts.length - inStockProducts.length,
        },
        orders: {
          total: orders.length,
          today: todayOrders.length,
          thisMonth: recentOrders.length,
          statuses: statusCounts,
        },
        revenue: {
          total: totalRevenue,
          average:
            orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        },
        categories: categories.length,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка статистики" },
      { status: 500 },
    );
  }
}
