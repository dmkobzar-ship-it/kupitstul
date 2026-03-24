import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

export async function GET(_req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = JSON.stringify({
    chat_id: Number(chatId),
    text: `✅ <b>Прокси тест OK — КупитьСтул</b>\n🕐 ${new Date().toLocaleString("ru-RU")}`,
    parse_mode: "HTML",
  });

  // Hiddify system proxy port
  const proxyUrl = "http://127.0.0.1:12334";
  try {
    const dispatcher = new ProxyAgent(proxyUrl);
    const res = await undiciFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      dispatcher,
      signal: AbortSignal.timeout(15000),
    } as any);
    const json = (await res.json()) as any;
    return NextResponse.json({
      proxy: proxyUrl,
      ok: json.ok,
      message_id: json.result?.message_id,
      error: json.description,
    });
  } catch (err: any) {
    return NextResponse.json({
      proxy: proxyUrl,
      ok: false,
      error: err?.message,
    });
  }
}
