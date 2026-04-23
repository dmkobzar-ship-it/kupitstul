import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/chat-store";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const sessionId = (searchParams.get("sessionId") ?? "")
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9-]/g, "");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const since = searchParams.get("since") ?? undefined;

  const messages = getMessages(sessionId, since);
  return NextResponse.json({ messages });
}
