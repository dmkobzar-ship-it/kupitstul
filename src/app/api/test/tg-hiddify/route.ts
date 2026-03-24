import { NextRequest, NextResponse } from "next/server";
import * as https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";

// Hiddify system proxy on port 12334
const PROXY = "http://127.0.0.1:12334";

function httpsPost(
  url: string,
  body: string,
  agent: https.Agent,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        agent,
        timeout: 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.write(body);
    req.end();
  });
}

export async function GET(_req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;

  const body = JSON.stringify({
    chat_id: Number(chatId),
    text: `🚀 <b>Hiddify прокси тест</b>\n✅ Node.js → 127.0.0.1:12334 → Telegram\n🕐 ${new Date().toLocaleString("ru-RU")}`,
    parse_mode: "HTML",
  });

  try {
    const agent = new HttpsProxyAgent(PROXY);
    const raw = await httpsPost(
      `https://api.telegram.org/bot${token}/sendMessage`,
      body,
      agent,
    );
    const json = JSON.parse(raw) as any;
    return NextResponse.json({
      proxy: PROXY,
      ok: json.ok,
      message_id: json.result?.message_id,
      error: json.description,
    });
  } catch (err: any) {
    return NextResponse.json({
      proxy: PROXY,
      ok: false,
      error: err?.message ?? String(err),
    });
  }
}
