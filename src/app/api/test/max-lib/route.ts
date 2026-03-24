import { NextResponse } from "next/server";
// v2 - with proxy + MAX_USER_ID
import { maxSendMessage } from "@/lib/max-notify";

/** Тест отправки через lib/max-notify.ts (с прокси) */
export async function GET() {
  try {
    const result = await maxSendMessage(
      `🔧 **Тест lib/max-notify.ts**\n✅ Прокси через Hiddify\n🕐 ${new Date().toLocaleString("ru-RU")}`,
    );
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message });
  }
}
