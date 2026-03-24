import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const order = (db.data!.orders || []).find((o: any) => o.id === id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Заказ не найден" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch {
    return NextResponse.json(
      { success: false, error: "Ошибка" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDatabase();

    const orders = db.data!.orders || [];
    const index = orders.findIndex((o: any) => o.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Заказ не найден" },
        { status: 404 },
      );
    }

    const order = orders[index];

    if (body.status) {
      order.status = body.status;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: body.status,
        comment: body.comment || "",
        createdAt: new Date().toISOString(),
      });
    }

    if (body.adminComment !== undefined) {
      order.adminComment = body.adminComment;
    }

    order.updatedAt = new Date().toISOString();
    db.data!.orders[index] = order;
    await db.write();

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка обновления" },
      { status: 500 },
    );
  }
}
