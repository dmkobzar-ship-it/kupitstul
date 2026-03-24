import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { sendOrderNotification } from "@/lib/telegram";
import { sendOrderNotification as sendMaxNotification } from "@/lib/max-notify";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Generate order number like KS-2026-00001
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `KS-${year}-${seq}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customer,
      delivery,
      payment,
      comment,
      items,
      subtotal,
      deliveryPrice,
      total,
    } = body;

    if (!customer?.name || !customer?.phone) {
      return NextResponse.json(
        { success: false, error: "Имя и телефон обязательны" },
        { status: 400 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Корзина пуста" },
        { status: 400 },
      );
    }

    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      number: generateOrderNumber(),
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
      },
      delivery: {
        method: delivery?.method || "courier",
        city: delivery?.city || "",
        address: delivery?.address || "",
      },
      payment: {
        method: payment?.method || "cash",
        status: "pending",
      },
      comment: comment || "",
      items: items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || "",
        slug: item.slug || "",
        total: item.price * item.quantity,
      })),
      subtotal: subtotal || 0,
      deliveryPrice: deliveryPrice || 0,
      total: total || 0,
      status: "new",
      statusHistory: [
        {
          status: "new",
          comment: "Заказ создан",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = await getDatabase();
    if (!db.data!.orders) {
      db.data!.orders = [];
    }
    db.data!.orders.unshift(order);
    await db.write();

    const notifData = {
      orderNumber: order.number,
      customer: order.customer,
      delivery: order.delivery,
      payment: order.payment,
      items: order.items,
      subtotal: order.subtotal,
      deliveryPrice: order.deliveryPrice,
      total: order.total,
      comment: order.comment,
    };

    // Send Telegram notification (async, don't block response)
    sendOrderNotification(notifData).catch((err) =>
      console.error("❌ Telegram error:", err?.message),
    );

    // Send MAX notification (async, don't block response)
    sendMaxNotification(notifData).catch((err) =>
      console.error("❌ MAX error:", err?.message),
    );

    return NextResponse.json({
      success: true,
      data: { id: order.id, number: order.number },
      message: "Заказ успешно создан",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при создании заказа" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = await getDatabase();
    let orders = db.data!.orders || [];

    if (status) {
      orders = orders.filter((o: any) => o.status === status);
    }

    const total = orders.length;
    const start = (page - 1) * limit;
    const paginated = orders.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при получении заказов" },
      { status: 500 },
    );
  }
}
