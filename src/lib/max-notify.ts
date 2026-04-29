/**
 * MAX Messenger Bot API — уведомления о заказах
 * API: https://platform-api.max.ru
 * Docs: https://dev.max.ru/docs-api
 *
 * Настройка:
 *   MAX_BOT_TOKEN  — токен бота (business.max.ru → Чат-боты → Интеграция → Получить токен)
 *   MAX_USER_ID    — ваш user_id в MAX (получается через /api/test/max?setup=1)
 */

import { HttpsProxyAgent } from "https-proxy-agent";

const MAX_API = "https://platform-api.max.ru";

function maxFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) {
    return fetch(url, { ...options, agent: new HttpsProxyAgent(proxy) } as any);
  }
  return fetch(url, options);
}

function getToken(): string | null {
  const t = process.env.MAX_BOT_TOKEN;
  if (!t || t === "ВАШ_ТОКЕН_БОТА_MAX") return null;
  return t;
}

function getChatId(): string | null {
  const id =
    process.env.MAX_GROUP_CHAT_ID ||
    process.env.MAX_CHAT_ID ||
    process.env.MAX_USER_ID;
  if (!id || id === "ВАШ_CHAT_ID") return null;
  return id;
}

/** Проверяет токен бота — GET /me */
export async function maxBotGetMe(): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("MAX_BOT_TOKEN не задан в .env.local");
  const res = await maxFetch(`${MAX_API}/me`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`MAX /me: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Получает последние обновления — нужно для нахождения user_id */
export async function maxGetUpdates(): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("MAX_BOT_TOKEN не задан в .env.local");
  const res = await maxFetch(`${MAX_API}/updates?limit=10&timeout=5`, {
    headers: { Authorization: token },
  });
  if (!res.ok)
    throw new Error(`MAX /updates: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Отправляет текстовое сообщение в чат (личный или групповой) */
export async function maxSendMessage(
  text: string,
  chatId?: string | number,
): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("MAX_BOT_TOKEN не задан в .env.local");

  const targetChatId = chatId ?? getChatId();
  if (!targetChatId) throw new Error("MAX_GROUP_CHAT_ID не задан в env");

  const chatIdStr = String(targetChatId);
  const isGroup = chatIdStr.startsWith("-") || chatIdStr.length > 15;

  // Групповой чат — chat_id в теле запроса (integer), личный — user_id в query
  let url: string;
  let bodyData: object;
  if (isGroup) {
    url = `${MAX_API}/messages`;
    bodyData = { recipient: { chat_id: parseInt(chatIdStr, 10) }, text };
  } else {
    url = `${MAX_API}/messages?user_id=${chatIdStr}`;
    bodyData = { text };
  }

  const res = await maxFetch(url, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MAX /messages: ${res.status} ${body}`);
  }
  return res.json();
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
  const token = getToken();
  const chatId = getChatId();

  if (!token) {
    console.log("⚠️  MAX_BOT_TOKEN не задан — уведомление пропущено");
    return;
  }
  if (!chatId) {
    console.log("⚠️  MAX_GROUP_CHAT_ID не задан — уведомление пропущено");
    return;
  }

  const itemsList = data.items
    .map(
      (i) =>
        `• ${i.name} ×${i.quantity} — ${(i.price * i.quantity).toLocaleString("ru-RU")} ₽`,
    )
    .join("\n");

  const text = [
    `🛒 **Новый заказ ${data.orderNumber}**`,
    "",
    `👤 ${data.customer.name}`,
    `📞 ${data.customer.phone}`,
    data.customer.email ? `📧 ${data.customer.email}` : "",
    "",
    "📦 **Товары:**",
    itemsList,
    "",
    `🚚 Доставка: ${data.delivery.method}`,
    data.delivery.city
      ? `📍 ${data.delivery.city}${data.delivery.address ? ", " + data.delivery.address : ""}`
      : "",
    `💳 Оплата: ${data.payment.method}`,
    "",
    data.comment ? `💬 ${data.comment}` : "",
    `💰 **Итого: ${data.total.toLocaleString("ru-RU")} ₽**`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  try {
    await maxSendMessage(text);
    console.log(`✅ MAX уведомление отправлено для заказа ${data.orderNumber}`);
  } catch (err: any) {
    console.error(`❌ MAX уведомление не отправлено: ${err?.message}`);
  }
}
