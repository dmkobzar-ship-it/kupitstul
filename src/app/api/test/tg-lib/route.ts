import { NextResponse } from "next/server";
import { tgSendMessage } from "@/lib/telegram";

/** Тест отправки через lib/telegram.ts (с прокси) */
export async function GET() {
  try {
    const result = await tgSendMessage(
      `🔧 <b>Тест lib/telegram.ts</b>\n✅ Прокси через Hiddify\n🕐 ${new Date().toLocaleString("ru-RU")}`,
    );
    return NextResponse.json({ ok: true, message_id: result?.message_id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message });
  }
}
