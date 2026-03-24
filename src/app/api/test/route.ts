import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API работает корректно",
    timestamp: new Date().toISOString(),
    data: {
      test: "test data",
      count: 42,
    },
  });
}
