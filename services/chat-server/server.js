/**
 * КупитьСтул — WebSocket Chat Server
 *
 * Features:
 *   • WebSocket server for real-time visitor ↔ operator chat
 *   • MAX Messenger Bot API integration (relay messages to/from operator)
 *   • Telegram notifications for new chats
 *   • MySQL persistence for chat history
 *   • Express HTTP server for MAX webhook + health check
 *   • Session management with automatic reconnection
 *
 * Architecture:
 *   [Visitor Browser] ⟷ [WebSocket Server] ⟷ [MAX Bot API] ⟷ [Operator in MAX]
 *                                │
 *                          [MySQL DB] (history)
 *                                │
 *                          [Telegram Bot] (notifications)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env.local"),
});

const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const mysql = require("mysql2/promise");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// ─── Configuration ──────────────────────────────────────────

const CONFIG = {
  port: parseInt(process.env.CHAT_PORT || "3002"),
  db: {
    host: process.env.DB_HOST || "mysql",
    port: parseInt(process.env.DB_PORT || "3306"),
    database: process.env.DB_NAME || "kupitstul",
    user: process.env.DB_USER || "kupitstul",
    password: process.env.DB_PASS || "CHANGE_ME_STRONG_PASSWORD",
  },
  max: {
    botToken: process.env.MAX_BOT_TOKEN || "",
    webhookUrl: process.env.MAX_WEBHOOK_URL || "",
    groupChatId: process.env.MAX_GROUP_CHAT_ID || "", // ID группы заказов в MAX
    apiBase: "https://botapi.max.ru",
  },
  telegram: {
    botToken: process.env.TG_BOT_TOKEN || "",
    chatId: process.env.TG_CHAT_ID || "",
  },
  cors: {
    origins: (
      process.env.CORS_ORIGINS ||
      "http://localhost:3000,http://localhost:3001,https://kupitstul.ru"
    ).split(","),
  },
};

// ─── Database Pool ──────────────────────────────────────────

let pool = null;
let dbAvailable = false;

// In-memory fallback when MySQL is unavailable
const memSessions = new Map(); // sessionId → { max_chat_id, visitor_name }
const memMessages = new Map(); // sessionId → [{sender, body, created_at}]

async function initDB() {
  try {
    pool = mysql.createPool({
      ...CONFIG.db,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected");
    conn.release();
    dbAvailable = true;
  } catch (err) {
    console.warn(
      "⚠️  MySQL недоступен — работаем в режиме in-memory (история не сохраняется):",
      err.message,
    );
    pool = null;
    dbAvailable = false;
  }
}

// ─── Session Store ──────────────────────────────────────────
// Maps sessionId → Set<WebSocket>
const sessions = new Map();
// Maps MAX chatId → sessionId
const maxChatToSession = new Map();

// ─── Express App (for webhooks) ─────────────────────────────

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", sessions: sessions.size, uptime: process.uptime() });
});

// Test MAX relay endpoint
app.get("/test-max", async (req, res) => {
  if (!CONFIG.max.botToken || !CONFIG.max.groupChatId) {
    return res.json({
      ok: false,
      error: "MAX_BOT_TOKEN или MAX_GROUP_CHAT_ID не заданы",
    });
  }
  try {
    await axios.post(
      `${CONFIG.max.apiBase}/messages`,
      { text: "🧪 Тест чат-сервера: relay работает!" },
      {
        params: {
          access_token: CONFIG.max.botToken,
          chat_id: CONFIG.max.groupChatId,
        },
      },
    );
    res.json({
      ok: true,
      message: "Тестовое сообщение отправлено в MAX группу",
      chat_id: CONFIG.max.groupChatId,
    });
  } catch (err) {
    res.json({ ok: false, error: err.response?.data || err.message });
  }
});

// CSRF token proxy (optional)
app.get("/api/chat/sessions", async (req, res) => {
  try {
    const sessionId = uuidv4();
    if (dbAvailable) {
      await pool.execute(
        "INSERT INTO chat_sessions (id, ip_address, user_agent) VALUES (?, ?, ?)",
        [sessionId, req.ip, req.headers["user-agent"] || ""],
      );
    }
    res.json({ session_id: sessionId });
  } catch (err) {
    console.error("Session create error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Get chat history for a session
app.get("/api/chat/history/:sessionId", async (req, res) => {
  try {
    let rows = [];
    if (dbAvailable) {
      [rows] = await pool.execute(
        "SELECT sender, body, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 200",
        [req.params.sessionId],
      );
    } else {
      rows = (memMessages.get(req.params.sessionId) || []).slice(-200);
    }
    res.json({ messages: rows });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── MAX Bot Webhook ────────────────────────────────────────

app.post("/api/chat/webhook", async (req, res) => {
  try {
    const update = req.body;
    console.log("📨 MAX webhook:", JSON.stringify(update).slice(0, 300));

    if (
      update.update_type === "message_created" ||
      update.update_type === "message_callback"
    ) {
      const message = update.message;
      if (!message || !message.body) {
        return res.json({ ok: true });
      }

      const text = message.body.text || "";
      const maxChatId = message.recipient?.chat_id || message.chat_id;

      if (!maxChatId || !text) {
        return res.json({ ok: true });
      }

      // Find session for this MAX chat
      const sessionId = maxChatToSession.get(maxChatId);

      if (sessionId) {
        // Save to DB
        await saveMessage(sessionId, "operator", text);

        // Send to visitor via WebSocket
        broadcastToSession(sessionId, {
          type: "message",
          sender: "operator",
          body: text,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`No session found for MAX chat ${maxChatId}`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ─── HTTP + WebSocket Server ────────────────────────────────

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: "/ws/chat",
  maxPayload: 16 * 1024, // 16KB max message
});

// Suppress unhandled error when underlying HTTP server fails (e.g. EADDRINUSE)
wss.on("error", () => {});

wss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "";
  // Basic origin check
  if (
    CONFIG.cors.origins.length > 0 &&
    !CONFIG.cors.origins.includes(origin) &&
    origin !== ""
  ) {
    console.log(`Rejected connection from origin: ${origin}`);
    ws.close(4003, "Origin not allowed");
    return;
  }

  let sessionId = null;
  ws.isAlive = true; // инициализируем свойство объекта для heartbeat

  ws.on("pong", () => {
    ws.isAlive = true; // сбрасываем свойство объекта, а не локальную переменную
  });

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.type) {
        case "join": {
          sessionId = data.session_id;
          if (
            !sessionId ||
            typeof sessionId !== "string" ||
            sessionId.length > 40
          ) {
            ws.send(
              JSON.stringify({ type: "error", message: "Invalid session" }),
            );
            return;
          }

          // Register WebSocket in session
          if (!sessions.has(sessionId)) {
            sessions.set(sessionId, new Set());
          }
          sessions.get(sessionId).add(ws);

          // Update session info in DB
          const visitorName = sanitize(data.name || "", 255);
          const visitorPage = sanitize(data.page || "", 1000);
          const ip =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket.remoteAddress ||
            "";

          if (dbAvailable) {
            await pool.execute(
              `INSERT INTO chat_sessions (id, visitor_name, visitor_page, ip_address, user_agent)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE visitor_name = VALUES(visitor_name), visitor_page = VALUES(visitor_page), updated_at = NOW()`,
              [
                sessionId,
                visitorName,
                visitorPage,
                ip,
                req.headers["user-agent"] || "",
              ],
            );
          } else {
            const existing = memSessions.get(sessionId) || {};
            memSessions.set(sessionId, {
              ...existing,
              visitor_name: visitorName,
              visitor_page: visitorPage,
            });
          }

          // Send history
          let history = [];
          if (dbAvailable) {
            [history] = await pool.execute(
              "SELECT sender, body, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 200",
              [sessionId],
            );
          } else {
            history = (memMessages.get(sessionId) || []).slice(-200);
          }

          ws.send(
            JSON.stringify({
              type: "joined",
              session_id: sessionId,
              history: history,
            }),
          );

          console.log(
            `👤 Session joined: ${sessionId} (${visitorName || "anonymous"})`,
          );
          break;
        }

        case "message": {
          if (!sessionId) {
            ws.send(JSON.stringify({ type: "error", message: "Not joined" }));
            return;
          }

          const body = sanitize(data.body || "", 2000);
          if (!body) return;

          // Save to DB
          await saveMessage(sessionId, "visitor", body);

          // Broadcast to all tabs of this session
          broadcastToSession(sessionId, {
            type: "message",
            sender: "visitor",
            body: body,
            timestamp: new Date().toISOString(),
          });

          // Relay to MAX
          await relayToMAX(sessionId, body, data.name || "Посетитель");

          // Notify Telegram (first message only)
          let msgCount = 0;
          if (dbAvailable) {
            const [countRows] = await pool.execute(
              "SELECT COUNT(*) as cnt FROM chat_messages WHERE session_id = ? AND sender = ?",
              [sessionId, "visitor"],
            );
            msgCount = countRows[0]?.cnt || 0;
          } else {
            msgCount = (memMessages.get(sessionId) || []).filter(
              (m) => m.sender === "visitor",
            ).length;
          }

          if (msgCount <= 1) {
            await notifyTelegramNewChat(
              sessionId,
              data.name || "Посетитель",
              body,
            );
          }

          break;
        }

        case "typing": {
          if (sessionId) {
            broadcastToSession(
              sessionId,
              {
                type: "typing",
                sender: "visitor",
              },
              ws,
            );
          }
          break;
        }

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (err) {
      console.error("WS message error:", err);
      ws.send(JSON.stringify({ type: "error", message: "Server error" }));
    }
  });

  ws.on("close", () => {
    if (sessionId && sessions.has(sessionId)) {
      sessions.get(sessionId).delete(ws);
      if (sessions.get(sessionId).size === 0) {
        sessions.delete(sessionId);
      }
    }
  });

  ws.on("error", (err) => {
    console.error("WS error:", err.message);
  });
});

// Heartbeat
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => clearInterval(heartbeat));

// ─── Helper Functions ───────────────────────────────────────

async function saveMessage(sessionId, sender, body) {
  if (dbAvailable) {
    await pool.execute(
      "INSERT INTO chat_messages (session_id, sender, body) VALUES (?, ?, ?)",
      [sessionId, sender, body],
    );
  } else {
    if (!memMessages.has(sessionId)) memMessages.set(sessionId, []);
    memMessages
      .get(sessionId)
      .push({ sender, body, created_at: new Date().toISOString() });
  }
}

function broadcastToSession(sessionId, data, exclude = null) {
  const sockets = sessions.get(sessionId);
  if (!sockets) return;

  const json = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(json);
    }
  }
}

async function relayToMAX(sessionId, text, visitorName) {
  if (!CONFIG.max.botToken) return;

  try {
    let maxChatId = CONFIG.max.groupChatId || null;

    if (!maxChatId) {
      // Fallback: get or create per-session MAX chat
      if (dbAvailable) {
        let [rows] = await pool.execute(
          "SELECT max_chat_id FROM chat_sessions WHERE id = ?",
          [sessionId],
        );
        maxChatId = rows[0]?.max_chat_id;
      } else {
        maxChatId = memSessions.get(sessionId)?.max_chat_id;
      }

      if (!maxChatId) {
        const chatsResp = await axios.get(`${CONFIG.max.apiBase}/chats`, {
          params: { access_token: CONFIG.max.botToken },
        });
        const chats = chatsResp.data?.chats || [];
        if (chats.length > 0) {
          maxChatId = chats[0].chat_id;
          if (dbAvailable) {
            await pool.execute(
              "UPDATE chat_sessions SET max_chat_id = ? WHERE id = ?",
              [maxChatId, sessionId],
            );
          } else {
            const s = memSessions.get(sessionId) || {};
            s.max_chat_id = maxChatId;
            memSessions.set(sessionId, s);
          }
        } else {
          console.log("MAX_GROUP_CHAT_ID не настроен и нет доступных чатов.");
          return;
        }
      }
    }

    // Ensure session→chat mapping exists
    if (!maxChatToSession.has(maxChatId)) {
      maxChatToSession.set(maxChatId, sessionId);
    }

    // Format: include session short-id so operator knows which chat
    const shortId = sessionId.substring(0, 8);
    let visitorPage = "";
    if (dbAvailable) {
      const [rows] = await pool.execute(
        "SELECT visitor_page FROM chat_sessions WHERE id = ?",
        [sessionId],
      );
      visitorPage = rows[0]?.visitor_page || "";
    } else {
      visitorPage = memSessions.get(sessionId)?.visitor_page || "";
    }
    const pageLine = visitorPage ? `\n🔗 ${visitorPage}` : "";
    const msgText = `💬 [${shortId}] Клиент:${pageLine}\n${text}`;
    await axios.post(
      `${CONFIG.max.apiBase}/messages`,
      { text: msgText },
      {
        params: {
          access_token: CONFIG.max.botToken,
          chat_id: maxChatId,
        },
      },
    );

    console.log(`→ MAX [${maxChatId}]: ${msgText.slice(0, 80)}`);
  } catch (err) {
    console.error("MAX relay error:", err.response?.data || err.message);
  }
}

async function notifyTelegramNewChat(sessionId, visitorName, firstMessage) {
  if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) return;

  const text =
    `💬 <b>Новый чат на сайте</b>\n\n` +
    `👤 ${visitorName}\n` +
    `💬 ${firstMessage}\n` +
    `\n🔗 Сессия: <code>${sessionId}</code>`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`,
      {
        chat_id: CONFIG.telegram.chatId,
        text: text,
        parse_mode: "HTML",
      },
    );
    console.log("→ Telegram notification sent");
  } catch (err) {
    console.error("Telegram error:", err.response?.data || err.message);
  }
}

function sanitize(str, maxLen = 255) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
}

// ─── MAX Polling (получение ответов оператора из группы) ────
// Используется когда MAX_WEBHOOK_URL не задан (локальная разработка).
// Каждые 3 секунды запрашиваем /updates из группового чата.

let maxLastUpdateId = null; // маркер последнего полученного update

async function pollMAX() {
  if (!CONFIG.max.botToken || !CONFIG.max.groupChatId) return;
  if (CONFIG.max.webhookUrl) return;

  try {
    const resp = await axios.get(`${CONFIG.max.apiBase}/messages`, {
      params: {
        access_token: CONFIG.max.botToken,
        chat_id: CONFIG.max.groupChatId,
        count: 20,
      },
    });
    // MAX возвращает DESC (новые первые) — разворачиваем в хронологический порядок
    const msgs = (resp.data?.messages || []).slice().reverse();

    for (const msg of msgs) {
      const ts = msg.timestamp;

      // Пропускаем сообщения не новее нашего маркера
      if (maxLastUpdateId !== null && ts < maxLastUpdateId) continue;

      // Двигаем маркер вперёд
      if (!maxLastUpdateId || ts >= maxLastUpdateId) {
        maxLastUpdateId = ts + 1;
      }

      // Игнорируем сообщения от бота (наши исходящие)
      if (msg.sender?.is_bot) continue;
      const text = msg.body?.text || "";
      if (!text) continue;

      // Найти сессию по этому групповому чату
      const chatId = String(CONFIG.max.groupChatId);
      const sessionId = maxChatToSession.get(chatId);
      if (!sessionId) {
        console.log(`← MAX [нет сессии]: ${text.slice(0, 60)}`);
        continue;
      }

      console.log(
        `← MAX ответ [${sessionId.slice(0, 8)}]: ${text.slice(0, 80)}`,
      );
      await saveMessage(sessionId, "operator", text);
      broadcastToSession(sessionId, {
        type: "message",
        sender: "operator",
        body: text,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    if (err.response?.status !== 404) {
      console.error(
        "MAX poll error:",
        err.response?.data?.message || err.message,
      );
    }
  }
}

// ─── MAX Webhook Registration ───────────────────────────────

async function registerMAXWebhook() {
  if (!CONFIG.max.botToken || !CONFIG.max.webhookUrl) {
    if (!CONFIG.max.webhookUrl) {
      console.log(
        "ℹ️  MAX_WEBHOOK_URL не задан, webhook не регистрируется (работаем через group chat)",
      );
    }
    return;
  }

  try {
    const resp = await axios.post(
      `${CONFIG.max.apiBase}/subscriptions`,
      { url: CONFIG.max.webhookUrl },
      { params: { access_token: CONFIG.max.botToken } },
    );
    console.log("✅ MAX webhook registered:", resp.data);
  } catch (err) {
    console.error(
      "MAX webhook registration error:",
      err.response?.data || err.message,
    );
  }
}

// ─── Start Server ───────────────────────────────────────────

async function main() {
  console.log("🪑 КупитьСтул Chat Server starting...");

  await initDB();
  await registerMAXWebhook();

  // Load existing session-MAX mappings from DB
  if (dbAvailable) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, max_chat_id FROM chat_sessions WHERE max_chat_id IS NOT NULL AND status = ?",
        ["active"],
      );
      for (const row of rows) {
        maxChatToSession.set(row.max_chat_id, row.id);
      }
      console.log(`📋 Loaded ${rows.length} active MAX chat mappings`);
    } catch (err) {
      console.error("Failed to load chat mappings:", err.message);
    }
  }

  let retried = false;

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && !retried) {
      retried = true;
      console.warn(`⚡ Порт ${CONFIG.port} занят — пытаюсь освободить...`);
      try {
        const { execSync } = require("child_process");
        const out = execSync("netstat -ano", { encoding: "utf8" });
        const pids = new Set();
        for (const line of out.trim().split("\n")) {
          const parts = line.trim().split(/\s+/);
          const localAddr = parts[1] || "";
          const pid = parts[parts.length - 1];
          if (
            (localAddr === `0.0.0.0:${CONFIG.port}` ||
              localAddr === `[::]:${CONFIG.port}`) &&
            /^\d+$/.test(pid) &&
            pid !== "0"
          ) {
            pids.add(pid);
          }
        }
        for (const pid of pids) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: "pipe" });
            console.log(`  ✅ Убит PID ${pid}`);
          } catch {
            /* уже завершён */
          }
        }
      } catch (e) {
        console.error("  Не удалось освободить порт:", e.message);
      }
      // Повторяем listen через 800мс
      setTimeout(() => {
        server.listen(CONFIG.port, "0.0.0.0");
      }, 800);
    } else {
      console.error("❌ Server error:", err.message);
      process.exit(1);
    }
  });

  server.listen(CONFIG.port, "0.0.0.0", () => {
    console.log(`✅ Chat server running on port ${CONFIG.port}`);
    console.log(`   WebSocket: ws://localhost:${CONFIG.port}/ws/chat`);
    console.log(`   Health:    http://localhost:${CONFIG.port}/health`);
    console.log(
      `   Webhook:   http://localhost:${CONFIG.port}/api/chat/webhook`,
    );
    console.log(
      `   MAX token: ${CONFIG.max.botToken ? "✅ задан" : "❌ не задан"}`,
    );
    console.log(`   MAX group: ${CONFIG.max.groupChatId || "❌ не задан"}`);

    // Запускаем polling MAX если webhook не настроен
    if (
      CONFIG.max.botToken &&
      CONFIG.max.groupChatId &&
      !CONFIG.max.webhookUrl
    ) {
      startMAXPolling();
    }
  });
}

async function startMAXPolling() {
  // Инициализируем маркер — берём timestamp последнего сообщения чтоб не читать старые
  try {
    const initResp = await axios.get(`${CONFIG.max.apiBase}/messages`, {
      params: {
        access_token: CONFIG.max.botToken,
        chat_id: CONFIG.max.groupChatId,
        count: 1,
      },
    });
    const lastMsgs = initResp.data?.messages || [];
    // MAX возвращает DESC (новые первые) — берём первый
    maxLastUpdateId =
      lastMsgs.length > 0 ? lastMsgs[0].timestamp + 1 : Date.now();
  } catch {
    maxLastUpdateId = Date.now();
  }
  console.log(`   MAX poll:  ✅ каждые 3с (маркер: ${maxLastUpdateId})`);
  setInterval(pollMAX, 3000);
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
