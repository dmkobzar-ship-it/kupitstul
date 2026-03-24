import { NextRequest, NextResponse } from "next/server";
import * as https from "https";

/** Прямой тест через https.request с family:4 (IPv4) */
export async function GET(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const result: Record<string, any> = {
    token: token ? "✅" : "❌",
    chatId: chatId || "❌",
  };

  if (!token || !chatId || token === "ВАШ_ТОКЕН_БОТА") {
    return NextResponse.json({ ...result, error: "Не заданы переменные" });
  }

  const text = `✅ <b>IPv4 тест OK</b>\n🕐 ${new Date().toLocaleString("ru-RU")}`;

  try {
    const json = await new Promise<any>((resolve, reject) => {
      const payload = JSON.stringify({
        chat_id: Number(chatId),
        text,
        parse_mode: "HTML",
      });
      const req = https.request(
        {
          hostname: "api.telegram.org",
          path: `/bot${token}/sendMessage`,
          method: "POST",
          family: 4,
          servername: "api.telegram.org",
          rejectUnauthorized: false,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": "TelegramBot/1.0",
          },
        },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(d));
            } catch {
              resolve(d);
            }
          });
        },
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    return NextResponse.json({
      ...result,
      telegram: json.ok
        ? { sent: true, message_id: json.result?.message_id }
        : { sent: false, error: json.description },
    });
  } catch (err: any) {
    return NextResponse.json({
      ...result,
      telegram: { sent: false, error: err?.message },
    });
  }
}
