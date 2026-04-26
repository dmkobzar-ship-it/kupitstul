import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getImportedProducts, getImportedCategories } from "@/data/importedProducts";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const products = getImportedProducts();
    const categories = getImportedCategories();
    const activeProducts = products.filter((p: any) => p.isActive !== false && p.status !== "hidden");
    const inStockProducts = activeProducts.filter((p: any) => p.inStock);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalRevenue, totalOrders, recentOrders, todayOrders, statusRows, allOrders] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.order.findMany({ select: { cartItems: true } }),
    ]);

    // Top products by revenue
    const productOrderCount: Record<string, { name: string; count: number; revenue: number }> = {};
    allOrders.forEach((order: any) => {
      ((order.cartItems as any[]) || []).forEach((item: any) => {
        if (!productOrderCount[item.productId]) {
          productOrderCount[item.productId] = { name: item.name, count: 0, revenue: 0 };
        }
        productOrderCount[item.productId].count += item.quantity || 1;
        productOrderCount[item.productId].revenue += item.total || item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productOrderCount)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ productId: id, ...data }));

    const statusCounts: Record<string, number> = {};
    statusRows.forEach((r: any) => { statusCounts[r.status] = r._count.id; });

    return NextResponse.json({
      success: true,
      data: {
        products: {
          total: activeProducts.length,
          inStock: inStockProducts.length,
          outOfStock: activeProducts.length - inStockProducts.length,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          thisMonth: recentOrders,
          statuses: statusCounts,
        },
        revenue: {
          total: totalRevenue._sum.total || 0,
          average: totalOrders > 0 ? Math.round((totalRevenue._sum.total || 0) / totalOrders) : 0,
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
