import { NextRequest, NextResponse } from "next/server";
// v2 - uses tgSendMessage with proxy
import { tgGetMe, tgGetUpdates, tgSendMessage } from "@/lib/telegram";

/**
 * GET /api/test/telegram
 *
 * ?step=me        → проверить токен бота
 * ?step=updates   → получить обновления и найти chat_id
 * ?step=send      → отправить тестовое уведомление о заказе
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step") || "status";

  const result: Record<string, any> = {
    config: {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
        ? process.env.TELEGRAM_BOT_TOKEN === "ВАШ_ТОКЕН_БОТА"
          ? "⚠️ НЕ ЗАДАН (placeholder)"
          : "✅ задан"
        : "⚠️ пуст",
      TELEGRAM_CHAT_ID:
        process.env.TELEGRAM_CHAT_ID &&
        process.env.TELEGRAM_CHAT_ID !== "ВАШ_CHAT_ID"
          ? "✅ " + process.env.TELEGRAM_CHAT_ID
          : "⚠️ не задан",
    },
  };

  // ── Шаг 1: Проверить токен ─────────────────────────────────────────────
  if (step === "me") {
    try {
      const me = await tgGetMe();
      result.bot = { ok: true, ...me };
      result.next =
        "Токен работает! Напишите боту любое сообщение в Telegram, затем откройте /api/test/telegram?step=updates";
    } catch (err: any) {
      result.bot = { ok: false, error: err?.message };
      result.hint =
        "Проверьте TELEGRAM_BOT_TOKEN в .env.local. Токен выдаёт @BotFather в Telegram.";
    }
    return NextResponse.json(result);
  }

  // ── Шаг 2: Получить обновления и найти chat_id ────────────────────────
  if (step === "updates") {
    try {
      const updates = await tgGetUpdates();
      if (!updates || updates.length === 0) {
        result.updates = {
          ok: false,
          message:
            "Сообщений нет. Откройте Telegram → найдите вашего бота → напишите ему /start или любое слово → обновите эту страницу.",
        };
      } else {
        const senders = updates
          .filter((u: any) => u.message?.from)
          .map((u: any) => ({
            chat_id: u.message.chat.id,
            from:
              u.message.from.first_name +
              (u.message.from.last_name ? " " + u.message.from.last_name : ""),
            username: u.message.from.username
              ? "@" + u.message.from.username
              : null,
          }));
        const unique = [
          ...new Map(senders.map((s: any) => [s.chat_id, s])).values(),
        ];
        result.updates = { ok: true, senders: unique };
        result.next =
          "Скопируйте нужный chat_id, добавьте TELEGRAM_CHAT_ID=<chat_id> в .env.local (Next.js подхватит автоматически), затем откройте /api/test/telegram?step=send";
      }
    } catch (err: any) {
      result.updates = { ok: false, error: err?.message };
    }
    return NextResponse.json(result);
  }

  // ── Шаг 3: Отправить тестовое сообщение ───────────────────────────────
  if (step === "send") {
    const text = [
      "✅ <b>Тест уведомлений — КупитьСтул</b>",
      "",
      "🛒 <b>Заказ KS-TEST-00001</b>",
      "",
      "👤 Иван Иванов",
      "📞 +7 999 000-00-00",
      "",
      "<b>📦 Товары:</b>",
      "  • Кресло офисное ×1 — 15 000 ₽",
      "  • Стул барный ×2 — 8 000 ₽",
      "",
      "🚚 Доставка: курьер",
      "📍 Москва, ул. Тестовая 1",
      "💳 Оплата: наличные",
      "",
      `💰 <b>Итого: 23 000 ₽</b>`,
      "",
      `🕐 ${new Date().toLocaleString("ru-RU")}`,
    ].join("\n");

    // Прямой вызов через https.request с family:4 (IPv4) — обход IPv6
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      result.send = { ok: false, error: "Токен или chat_id не заданы" };
      return NextResponse.json(result);
    }

    try {
      const msgResult = await tgSendMessage(text);
      result.send = { ok: true, message_id: msgResult?.message_id };
      result.success =
        "🎉 Тестовое сообщение отправлено! Проверьте Telegram на телефоне/компьютере.";
    } catch (err: any) {
      result.send = { ok: false, error: err?.message };
      result.hint = "Ошибка отправки: " + err?.message;
    }
    return NextResponse.json(result);
  }

  // ── Статус / подсказка ─────────────────────────────────────────────────
  result.steps = {
    "1_check_token": "/api/test/telegram?step=me",
    "2_get_chat_id":
      "/api/test/telegram?step=updates  (после отправки любого сообщения боту)",
    "3_send_test": "/api/test/telegram?step=send",
  };
  return NextResponse.json(result);
}
