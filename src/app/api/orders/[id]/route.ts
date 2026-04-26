import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });

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

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Заказ не найден" },
        { status: 404 },
      );
    }

    const statusHistory = (existing.statusHistory as any[]) || [];
    if (body.status) {
      statusHistory.push({
        status: body.status,
        comment: body.comment || "",
        createdAt: new Date().toISOString(),
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.adminComment !== undefined && { adminComment: body.adminComment }),
        statusHistory,
      },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка обновления" },
      { status: 500 },
    );
  }
}
