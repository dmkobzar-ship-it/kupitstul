import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const cartItems = items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || "",
      slug: item.slug || "",
      total: item.price * item.quantity,
    }));

    const deliveryAddress = delivery
      ? { method: delivery.method || "courier", city: delivery.city || "", address: delivery.address || "" }
      : null;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || null,
        customerComment: comment || null,
        cartItems,
        subtotal: subtotal || 0,
        deliveryPrice: deliveryPrice || 0,
        total: total || 0,
        status: "new",
        deliveryMethod: delivery?.method || "courier",
        deliveryAddress,
        paymentMethod: payment?.method || "cash",
        paymentStatus: "pending",
        statusHistory: [
          { status: "new", comment: "Заказ создан", createdAt: new Date().toISOString() },
        ],
      },
    });

    const notifData = {
      orderNumber: order.orderNumber,
      customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail || "" },
      delivery: deliveryAddress || {},
      payment: { method: order.paymentMethod },
      items: cartItems,
      subtotal: order.subtotal,
      deliveryPrice: order.deliveryPrice,
      total: order.total,
      comment: order.customerComment || "",
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
      data: { id: order.id, number: order.orderNumber },
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

    const where = status ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
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
