import { NextRequest, NextResponse } from "next/server";
import { handleMAXWebhook } from "@/lib/chat-store";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    console.log("📨 MAX chat webhook:", JSON.stringify(update).slice(0, 300));

    if (
      update.update_type === "message_created" ||
      update.update_type === "message_callback"
    ) {
      const message = update.message;
      if (!message?.body) return NextResponse.json({ ok: true });

      const text: string = message.body.text || "";
      const maxChatId: string =
        message.recipient?.chat_id ?? message.chat_id ?? "";

      if (maxChatId && text) {
        handleMAXWebhook(maxChatId, text);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
