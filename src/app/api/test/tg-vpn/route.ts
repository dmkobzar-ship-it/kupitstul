import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "env not set" });
  }

  const text = `✅ <b>VPN тест OK</b>\n🕐 ${new Date().toLocaleString("ru-RU")}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: Number(chatId),
          text,
          parse_mode: "HTML",
        }),
      },
    );
    const json = await res.json();
    return NextResponse.json({
      ok: json.ok,
      message_id: json.result?.message_id,
      description: json.description,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message,
      cause: err?.cause?.message,
    });
  }
}
