import { NextRequest, NextResponse } from "next/server";
import { maxBotGetMe, maxGetUpdates, maxSendMessage } from "@/lib/max-notify";

/**
 * GET /api/test/max
 *   Диагностика и пошаговая настройка MAX-уведомлений.
 *
 * ?step=me        → проверить токен бота (GET /me)
 * ?step=updates   → получить обновления и найти ваш user_id
 * ?step=send      → отправить тестовое уведомление о заказе
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step") || "status";

  const result: Record<string, any> = {
    config: {
      MAX_BOT_TOKEN: process.env.MAX_BOT_TOKEN
        ? process.env.MAX_BOT_TOKEN === "ВАШ_ТОКЕН_БОТА_MAX"
          ? "⚠️ НЕ ЗАДАН (placeholder)"
          : "✅ задан"
        : "⚠️ пуст",
      MAX_USER_ID:
        process.env.MAX_USER_ID ||
        (process.env.MAX_CHAT_ID && process.env.MAX_CHAT_ID !== "ВАШ_CHAT_ID"
          ? process.env.MAX_CHAT_ID + " (из MAX_CHAT_ID)"
          : "⚠️ не задан"),
    },
  };

  // ── Шаг 1: Проверить токен ─────────────────────────────────────────────
  if (step === "me") {
    try {
      const me = await maxBotGetMe();
      result.bot = { ok: true, ...me };
      result.next =
        "Токен работает! Теперь напишите боту любое сообщение в MAX, затем откройте /api/test/max?step=updates";
    } catch (err: any) {
      result.bot = { ok: false, error: err?.message };
      result.hint =
        "Проверьте MAX_BOT_TOKEN в .env.local. Токен можно взять на business.max.ru → Чат-боты → Интеграция → Получить токен";
    }
    return NextResponse.json(result);
  }

  // ── Шаг 2: Получить обновления и найти user_id ────────────────────────
  if (step === "updates") {
    try {
      const updates = await maxGetUpdates();
      const msgs = (updates.updates || []).filter(
        (u: any) => u.update_type === "message_created" && u.message?.sender,
      );

      if (msgs.length === 0) {
        result.updates = {
          ok: false,
          message:
            "Сообщений нет. Напишите боту любое сообщение в MAX и попробуйте снова.",
          raw: updates,
        };
      } else {
        const senders = msgs.map((u: any) => ({
          user_id: u.message.sender.user_id,
          name: u.message.sender.name,
          username: u.message.sender.username,
        }));
        const unique = [
          ...new Map(senders.map((s: any) => [s.user_id, s])).values(),
        ];
        result.updates = { ok: true, senders: unique };
        result.next = `Скопируйте нужный user_id, добавьте MAX_USER_ID=<user_id> в .env.local, затем откройте /api/test/max?step=send`;
      }
    } catch (err: any) {
      result.updates = { ok: false, error: err?.message };
    }
    return NextResponse.json(result);
  }

  // ── Шаг 3: Отправить тестовое сообщение ───────────────────────────────
  if (step === "send") {
    try {
      const text = [
        "✅ **Тест уведомлений — КупитьСтул**",
        "",
        "🛒 **Заказ KS-TEST-00001**",
        "",
        "👤 Иван Иванов",
        "📞 +7 999 000-00-00",
        "",
        "📦 **Товары:**",
        "• Кресло офисное ×1 — 15 000 ₽",
        "• Стул барный ×2 — 8 000 ₽",
        "",
        "🚚 Доставка: курьер",
        "📍 Москва, ул. Тестовая 1",
        "💳 Оплата: наличные",
        "",
        "💰 **Итого: 23 000 ₽**",
        "",
        `🕐 ${new Date().toLocaleString("ru-RU")}`,
      ].join("\n");

      const info = await maxSendMessage(text);
      result.send = { ok: true, messageId: info?.message?.body?.mid };
      result.success =
        "🎉 Тестовое сообщение отправлено! Проверьте MAX на телефоне/компьютере.";
    } catch (err: any) {
      result.send = { ok: false, error: err?.message };
      result.hint =
        "Убедитесь, что MAX_USER_ID задан в .env.local и сервер перезапущен (Next.js должен подхватить .env.local)";
    }
    return NextResponse.json(result);
  }

  // ── Статус ─────────────────────────────────────────────────────────────
  result.steps = {
    "1_check_token": "GET /api/test/max?step=me — проверить токен бота",
    "2_get_user_id":
      "GET /api/test/max?step=updates — найти ваш user_id (после отправки любого сообщения боту)",
    "3_send_test":
      "GET /api/test/max?step=send — отправить тестовое уведомление",
  };
  return NextResponse.json(result);
}
