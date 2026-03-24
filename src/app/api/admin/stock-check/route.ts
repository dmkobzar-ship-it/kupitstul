import { NextResponse } from "next/server";
import { runStockCheck } from "@/workers/stockChecker";

/**
 * POST /api/admin/stock-check
 * Trigger a manual stock check from admin panel
 */
export async function POST() {
  try {
    console.log("[Admin] Manual stock check triggered");
    const result = await runStockCheck();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Admin] Stock check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Stock check failed",
      },
      { status: 500 },
    );
  }
}
