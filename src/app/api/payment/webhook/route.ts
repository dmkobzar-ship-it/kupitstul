import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/payment";
import { getDatabase } from "@/lib/database";

/**
 * POST /api/payment/webhook
 * YooKassa webhook handler for payment status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // YooKassa sends events like:
    // { type: "notification", event: "payment.succeeded", object: { ... } }
    const { event, object: payment } = body;

    if (!event || !payment) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 },
      );
    }

    console.log(`[Payment Webhook] Event: ${event}, Payment ID: ${payment.id}`);

    const orderId = payment.metadata?.orderId;

    if (!orderId) {
      console.warn("[Payment Webhook] No orderId in metadata");
      return NextResponse.json({ received: true });
    }

    const db = await getDatabase();

    // Find the order
    const order = db.data.orders?.find((o: { id: string }) => o.id === orderId);

    if (!order) {
      console.warn(`[Payment Webhook] Order ${orderId} not found`);
      return NextResponse.json({ received: true });
    }

    switch (event) {
      case "payment.succeeded":
        // Payment successful - update order
        order.paymentStatus = "paid";
        order.paymentId = payment.id;
        order.status = "paid";
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: "paid",
          timestamp: new Date().toISOString(),
          comment: `Оплата получена (YooKassa: ${payment.id})`,
        });
        break;

      case "payment.canceled":
        // Payment canceled
        order.paymentStatus = "cancelled";
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: "payment_cancelled",
          timestamp: new Date().toISOString(),
          comment: `Оплата отменена (YooKassa: ${payment.id})`,
        });
        break;

      case "refund.succeeded":
        // Refund successful
        order.paymentStatus = "refunded";
        order.status = "refunded";
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
          status: "refunded",
          timestamp: new Date().toISOString(),
          comment: `Возврат выполнен (${payment.amount?.value} ${payment.amount?.currency})`,
        });
        break;

      default:
        console.log(`[Payment Webhook] Unhandled event: ${event}`);
    }

    await db.write();

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    // Always return 200 to YooKassa to prevent retries
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

/**
 * GET /api/payment/webhook?paymentId=xxx
 * Check payment status (for polling from frontend)
 */
export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 },
      );
    }

    const status = await getPaymentStatus(paymentId);
    return NextResponse.json(status);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
