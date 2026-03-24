import { NextResponse } from "next/server";
import { HttpsProxyAgent } from "https-proxy-agent";

/** Прямой тест MAX API через прокси, env переменные напрямую */
export async function GET() {
  const token = process.env.MAX_BOT_TOKEN;
  const userId = process.env.MAX_USER_ID;
  const proxy = process.env.HTTPS_PROXY || "http://127.0.0.1:12334";

  if (!token)
    return NextResponse.json({ ok: false, error: "MAX_BOT_TOKEN не задан" });
  if (!userId)
    return NextResponse.json({
      ok: false,
      error: "MAX_USER_ID не задан",
      found: { TOKEN: !!token, USER_ID: userId },
    });

  try {
    const agent = new HttpsProxyAgent(proxy);
    const res = await fetch(
      `https://platform-api.max.ru/messages?user_id=${userId}`,
      {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚀 **Тест MAX + прокси**\n✅ Прямой вызов через ${proxy}\n🕐 ${new Date().toLocaleString("ru-RU")}`,
          format: "markdown",
        }),
        agent: agent as any,
      },
    );
    const json = (await res.json()) as any;
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      messageId: json.messageId,
      error: json.message,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message });
  }
}
