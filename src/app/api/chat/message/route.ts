import { NextRequest, NextResponse } from "next/server";
import {
  getOrUpdateSession,
  addMessage,
  relayToMAX,
  notifyTelegram,
  countVisitorMessages,
  startMaxPoller,
} from "@/lib/chat-store";

function sanitize(str: unknown, maxLen: number): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const sessionId = sanitize(body.sessionId, 40).replace(
      /[^a-zA-Z0-9-]/g,
      "",
    );
    const text = sanitize(body.body, 2000);
    const visitorName = sanitize(body.name, 255);
    const visitorPage = sanitize(body.page, 1000);

    if (!sessionId || !text) {
      return NextResponse.json(
        { error: "sessionId and body are required" },
        { status: 400 },
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "";

    // Start MAX poller on first use (no-op if already running)
    startMaxPoller();

    getOrUpdateSession(sessionId, {
      visitor_name: visitorName,
      visitor_page: visitorPage,
      ip,
    });

    const msg = addMessage(sessionId, "visitor", text);

    // Fire-and-forget: relay to MAX operator group
    relayToMAX(sessionId, text, visitorName, visitorPage).catch(() => {});

    // Telegram notification on first visitor message
    const count = countVisitorMessages(sessionId);
    if (count <= 1) {
      notifyTelegram(sessionId, visitorName, text).catch(() => {});
    }

    return NextResponse.json({ ok: true, message: msg });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
