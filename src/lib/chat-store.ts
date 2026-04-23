/**
 * Chat Store — shared in-memory state for Long Polling chat
 *
 * Works because Next.js standalone runs as a persistent Node.js process.
 * Module-level Maps survive between API requests.
 *
 * Architecture:
 *   [Visitor Browser] → POST /api/chat/message  → MAX group chat
 *   [Visitor Browser] ← GET  /api/chat/messages ← poll every 3s
 *   [MAX operator]    → POST /api/chat/webhook  → saved to memMessages
 */

const MAX_API = "https://botapi.max.ru";

export interface ChatMessage {
  id: string;
  sender: "visitor" | "operator";
  body: string;
  timestamp: string; // ISO string
}

export interface ChatSession {
  visitor_name: string;
  visitor_page: string;
  ip: string;
  created_at: string;
}

// ─── Global singleton state ───────────────────────────────────
// Using globalThis so state survives Next.js hot-reload and is shared
// between instrumentation.ts and API routes (which may load the module separately).

declare global {
  // eslint-disable-next-line no-var
  var __chatStore:
    | {
        memSessions: Map<string, ChatSession>;
        memMessages: Map<string, ChatMessage[]>;
        maxChatToSession: Map<string, string>;
        maxLastTimestamp: number | null;
        pollerStarted: boolean;
      }
    | undefined;
}

if (!globalThis.__chatStore) {
  globalThis.__chatStore = {
    memSessions: new Map(),
    memMessages: new Map(),
    maxChatToSession: new Map(),
    maxLastTimestamp: null,
    pollerStarted: false,
  };
}

const store = globalThis.__chatStore;
const memSessions = store.memSessions;
const memMessages = store.memMessages;
const maxChatToSession = store.maxChatToSession;

// ─── Helpers ─────────────────────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function sanitize(str: unknown, maxLen = 2000): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
}

// ─── Session ───────────────────────────────────────────────────

export function getOrUpdateSession(
  sessionId: string,
  data: Partial<ChatSession>,
): ChatSession {
  const existing = memSessions.get(sessionId);
  if (existing) {
    if (data.visitor_page)
      existing.visitor_page = sanitize(data.visitor_page, 1000);
    if (data.visitor_name)
      existing.visitor_name = sanitize(data.visitor_name, 255);
    return existing;
  }
  const session: ChatSession = {
    visitor_name: sanitize(data.visitor_name ?? "", 255),
    visitor_page: sanitize(data.visitor_page ?? "", 1000),
    ip: data.ip ?? "",
    created_at: new Date().toISOString(),
  };
  memSessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): ChatSession | undefined {
  return memSessions.get(sessionId);
}

// ─── Messages ─────────────────────────────────────────────────

export function addMessage(
  sessionId: string,
  sender: "visitor" | "operator",
  body: string,
): ChatMessage {
  const msg: ChatMessage = {
    id: genId(),
    sender,
    body: sanitize(body, 2000),
    timestamp: new Date().toISOString(),
  };
  if (!memMessages.has(sessionId)) memMessages.set(sessionId, []);
  const msgs = memMessages.get(sessionId)!;
  msgs.push(msg);
  // Cap at 500 messages per session
  if (msgs.length > 500) msgs.splice(0, msgs.length - 500);
  return msg;
}

/** Returns up to last 100 messages, or messages with timestamp > since */
export function getMessages(sessionId: string, since?: string): ChatMessage[] {
  const all = memMessages.get(sessionId) ?? [];
  if (!since) return all.slice(-100);
  return all.filter((m) => m.timestamp > since);
}

export function countVisitorMessages(sessionId: string): number {
  return (memMessages.get(sessionId) ?? []).filter(
    (m) => m.sender === "visitor",
  ).length;
}

// ─── MAX Relay ────────────────────────────────────────────────

export async function relayToMAX(
  sessionId: string,
  text: string,
  visitorName: string,
  visitorPage: string,
): Promise<void> {
  const token = process.env.MAX_BOT_TOKEN;
  const groupChatId = process.env.MAX_GROUP_CHAT_ID;
  if (!token || !groupChatId) return;

  // Keep group chat → session mapping up to date
  maxChatToSession.set(groupChatId, sessionId);

  const shortId = sessionId.slice(0, 8);
  const pageLine = visitorPage ? `\n🔗 ${visitorPage}` : "";
  const msgText = `💬 [${shortId}] Клиент:${pageLine}\n${text}`;

  try {
    const res = await fetch(
      `${MAX_API}/messages?access_token=${encodeURIComponent(token)}&chat_id=${encodeURIComponent(groupChatId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msgText }),
      },
    );
    if (res.ok) {
      console.log(`→ MAX [${groupChatId}]: ${msgText.slice(0, 80)}`);
    } else {
      console.error("MAX relay error:", res.status, await res.text());
    }
  } catch (err: unknown) {
    console.error(
      "MAX relay fetch error:",
      err instanceof Error ? err.message : err,
    );
  }
}

// ─── Telegram notification ────────────────────────────────────

export async function notifyTelegram(
  sessionId: string,
  visitorName: string,
  firstMessage: string,
): Promise<void> {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `💬 <b>Новый чат на сайте</b>\n\n` +
    `👤 ${visitorName || "Посетитель"}\n` +
    `💬 ${firstMessage}\n` +
    `\n🔗 Сессия: <code>${sessionId}</code>`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err: unknown) {
    console.error(
      "Telegram notify error:",
      err instanceof Error ? err.message : err,
    );
  }
}

// ─── MAX Webhook handler ──────────────────────────────────────

/** Called when MAX sends an operator reply via webhook */
export function handleMAXWebhook(
  maxChatId: string,
  text: string,
): string | null {
  const sessionId = maxChatToSession.get(String(maxChatId));
  if (!sessionId) {
    console.log(`No session for MAX chat ${maxChatId}`);
    return null;
  }
  addMessage(sessionId, "operator", text);
  console.log(`← MAX reply [${sessionId.slice(0, 8)}]: ${text.slice(0, 80)}`);
  return sessionId;
}

// ─── MAX Poller (local dev — no webhook) ─────────────────────

/** Polls MAX group chat for operator replies every 3s.
 *  Used in local dev when MAX_WEBHOOK_URL is not set.
 *  Started once via instrumentation.ts */
export function startMaxPoller() {
  if (store.pollerStarted) return;
  store.pollerStarted = true;

  const token = process.env.MAX_BOT_TOKEN;
  const groupChatId = process.env.MAX_GROUP_CHAT_ID;
  if (!token || !groupChatId) return;

  console.log("🔄 MAX poller started (dev mode — no webhook)");

  setInterval(async () => {
    try {
      const res = await fetch(
        `${MAX_API}/messages?access_token=${encodeURIComponent(token)}&chat_id=${encodeURIComponent(groupChatId)}&count=20`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: any[] };
      const msgs = (data.messages ?? []).slice().reverse();

      for (const msg of msgs) {
        const ts: number = msg.timestamp;
        if (store.maxLastTimestamp !== null && ts < store.maxLastTimestamp)
          continue;
        if (!store.maxLastTimestamp || ts >= store.maxLastTimestamp)
          store.maxLastTimestamp = ts + 1;
        if (msg.sender?.is_bot) continue;
        const text: string = msg.body?.text || "";
        if (!text) continue;

        const sessionId = maxChatToSession.get(String(groupChatId));
        if (!sessionId) continue;

        addMessage(sessionId, "operator", text);
        console.log(
          `← MAX poll [${sessionId.slice(0, 8)}]: ${text.slice(0, 80)}`,
        );
      }
    } catch {
      // ignore network errors
    }
  }, 3000);
}
