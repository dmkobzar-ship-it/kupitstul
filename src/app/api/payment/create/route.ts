import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/payment";

/**
 * POST /api/payment/create
 * Create a payment for an order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderNumber, amount, description, email, phone } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId and amount are required" },
        { status: 400 },
      );
    }

    const result = await createPayment({
      orderId,
      orderNumber: orderNumber || orderId,
      amount,
      description: description || `Оплата заказа ${orderNumber || orderId}`,
      customerEmail: email,
      customerPhone: phone,
    });

    return NextResponse.json({
      success: true,
      paymentId: result.id,
      confirmationUrl: result.confirmationUrl,
      status: result.status,
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    const message =
      error instanceof Error ? error.message : "Payment creation failed";

    // If YooKassa is not configured, return a helpful message
    if (message.includes("credentials not configured")) {
      return NextResponse.json(
        {
          error: "Платёжная система не настроена",
          details:
            "Установите YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в переменных окружения",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
