/**
 * Telegram Bot — уведомления о заказах
 * API: https://api.telegram.org/bot<token>/sendMessage
 *
 * Настройка (в .env.local):
 *   TELEGRAM_BOT_TOKEN  — токен от @BotFather
 *   TELEGRAM_CHAT_ID    — ваш chat_id (число)
 */

import * as https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";

const TG_HOST = "api.telegram.org";

function getToken(): string | null {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t || t === "ВАШ_ТОКЕН_БОТА") return null;
  return t;
}

function getChatId(): string | null {
  const id = process.env.TELEGRAM_CHAT_ID;
  if (!id || id === "ВАШ_CHAT_ID") return null;
  return id;
}

export function isTelegramConfigured(): boolean {
  return !!(getToken() && getChatId());
}

/** HTTP-запрос через https.request, с прокси если задан HTTPS_PROXY */
function tgRequest(path: string, body?: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    // Используем прокси: сначала переменная окружения, потом Hiddify по умолчанию (только локально)
    const proxy =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      "http://127.0.0.1:12334";
    const agent = new HttpsProxyAgent(proxy);
    const options: https.RequestOptions = {
      hostname: TG_HOST,
      path,
      method: body ? "POST" : "GET",
      agent,
      headers: body
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload!),
          }
        : {},
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Проверяет токен бота */
export async function tgGetMe(): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан в .env.local");
  const json = await tgRequest(`/bot${token}/getMe`);
  if (!json.ok) throw new Error(`Telegram getMe: ${JSON.stringify(json)}`);
  return json.result;
}

/** Получает последние обновления — нужно для нахождения chat_id */
export async function tgGetUpdates(): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан в .env.local");
  const json = await tgRequest(`/bot${token}/getUpdates?limit=10`);
  if (!json.ok) throw new Error(`Telegram getUpdates: ${JSON.stringify(json)}`);
  return json.result;
}

/** Отправляет HTML-сообщение в чат */
export async function tgSendMessage(
  text: string,
  chatId?: string,
): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан в .env.local");

  const targetChatId = chatId ?? getChatId();
  if (!targetChatId) throw new Error("TELEGRAM_CHAT_ID не задан в .env.local");

  const json = await tgRequest(`/bot${token}/sendMessage`, {
    chat_id: targetChatId,
    text,
    parse_mode: "HTML",
  });

  if (!json.ok)
    throw new Error(`Telegram sendMessage: ${JSON.stringify(json)}`);
  return json.result;
}

export interface OrderData {
  orderNumber: string;
  customer: { name: string; phone: string; email?: string };
  delivery: { method: string; city?: string; address?: string };
  payment: { method: string };
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryPrice: number;
  total: number;
  comment?: string;
}

/** Формирует и отправляет уведомление о новом заказе */
export async function sendOrderNotification(data: OrderData): Promise<void> {
  if (!isTelegramConfigured()) {
    console.log(
      "⚠️  TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — уведомление пропущено",
    );
    return;
  }

  const itemsList = data.items
    .map(
      (i) =>
        `  • ${i.name} ×${i.quantity} — ${(i.price * i.quantity).toLocaleString("ru-RU")} ₽`,
    )
    .join("\n");

  const lines = [
    `🛒 <b>Новый заказ ${data.orderNumber}</b>`,
    "",
    `👤 ${data.customer.name}`,
    `📞 ${data.customer.phone}`,
    data.customer.email ? `📧 ${data.customer.email}` : null,
    "",
    "<b>📦 Товары:</b>",
    itemsList,
    "",
    `🚚 Доставка: ${data.delivery.method}`,
    data.delivery.city
      ? `📍 ${data.delivery.city}${data.delivery.address ? ", " + data.delivery.address : ""}`
      : null,
    `💳 Оплата: ${data.payment.method}`,
    "",
    data.comment ? `💬 ${data.comment}` : null,
    `💰 <b>Итого: ${data.total.toLocaleString("ru-RU")} ₽</b>`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  try {
    await tgSendMessage(lines);
    console.log(
      `✅ Telegram уведомление отправлено для заказа ${data.orderNumber}`,
    );
  } catch (err: any) {
    console.error(`❌ Telegram уведомление не отправлено: ${err?.message}`);
  }
}
