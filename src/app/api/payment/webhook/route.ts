import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

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

    const existing = await prisma.order.findUnique({ where: { id: orderId } });

    if (!existing) {
      console.warn(`[Payment Webhook] Order ${orderId} not found`);
      return NextResponse.json({ received: true });
    }

    const statusHistory = (existing.statusHistory as any[]) || [];
    let updateData: any = {};

    switch (event) {
      case "payment.succeeded":
        statusHistory.push({ status: "paid", timestamp: new Date().toISOString(), comment: `Оплата получена (YooKassa: ${payment.id})` });
        updateData = { paymentStatus: "paid", paymentId: payment.id, status: "paid", statusHistory };
        break;

      case "payment.canceled":
        statusHistory.push({ status: "payment_cancelled", timestamp: new Date().toISOString(), comment: `Оплата отменена (YooKassa: ${payment.id})` });
        updateData = { paymentStatus: "cancelled", statusHistory };
        break;

      case "refund.succeeded":
        statusHistory.push({ status: "refunded", timestamp: new Date().toISOString(), comment: `Возврат выполнен (${payment.amount?.value} ${payment.amount?.currency})` });
        updateData = { paymentStatus: "refunded", status: "refunded", statusHistory };
        break;

      default:
        console.log(`[Payment Webhook] Unhandled event: ${event}`);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.order.update({ where: { id: orderId }, data: updateData });
    }

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
