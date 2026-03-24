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

require("dotenv").config();

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

let pool;

async function initDB() {
  pool = mysql.createPool({
    ...CONFIG.db,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test connection
  const conn = await pool.getConnection();
  console.log("✅ MySQL connected");
  conn.release();
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

// CSRF token proxy (optional)
app.get("/api/chat/sessions", async (req, res) => {
  try {
    const sessionId = uuidv4();
    await pool.execute(
      "INSERT INTO chat_sessions (id, ip_address, user_agent) VALUES (?, ?, ?)",
      [sessionId, req.ip, req.headers["user-agent"] || ""],
    );
    res.json({ session_id: sessionId });
  } catch (err) {
    console.error("Session create error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Get chat history for a session
app.get("/api/chat/history/:sessionId", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT sender, body, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 200",
      [req.params.sessionId],
    );
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
  let isAlive = true;

  ws.on("pong", () => {
    isAlive = true;
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

          // Send history
          const [history] = await pool.execute(
            "SELECT sender, body, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 200",
            [sessionId],
          );

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
          const [countRows] = await pool.execute(
            "SELECT COUNT(*) as cnt FROM chat_messages WHERE session_id = ? AND sender = ?",
            [sessionId, "visitor"],
          );
          const msgCount = countRows[0]?.cnt || 0;

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
  await pool.execute(
    "INSERT INTO chat_messages (session_id, sender, body) VALUES (?, ?, ?)",
    [sessionId, sender, body],
  );
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
    // Get or create MAX chat for this session
    let [rows] = await pool.execute(
      "SELECT max_chat_id FROM chat_sessions WHERE id = ?",
      [sessionId],
    );

    let maxChatId = rows[0]?.max_chat_id;

    if (!maxChatId) {
      // Start a new chat with the operator
      // We need the operator's MAX user ID to create a chat
      // For now, send to the bot's own chat and track it
      // The operator should /start the bot first in MAX

      // Get bot info to find chats
      const infoResp = await axios.get(`${CONFIG.max.apiBase}/me`, {
        params: { access_token: CONFIG.max.botToken },
      });
      console.log("MAX bot info:", infoResp.data?.name || "unknown");

      // Get existing chats
      const chatsResp = await axios.get(`${CONFIG.max.apiBase}/chats`, {
        params: { access_token: CONFIG.max.botToken },
      });

      const chats = chatsResp.data?.chats || [];
      if (chats.length > 0) {
        // Use the first available chat (operator should have messaged the bot)
        maxChatId = chats[0].chat_id;

        // Save mapping
        await pool.execute(
          "UPDATE chat_sessions SET max_chat_id = ? WHERE id = ?",
          [maxChatId, sessionId],
        );
        maxChatToSession.set(maxChatId, sessionId);
      } else {
        console.log(
          "No MAX chats available. Operator needs to /start the bot.",
        );
        return;
      }
    }

    // Ensure mapping exists
    if (!maxChatToSession.has(maxChatId)) {
      maxChatToSession.set(maxChatId, sessionId);
    }

    // Send message to MAX
    const msgText = `💬 ${visitorName}:\n${text}`;
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

    console.log(`→ MAX: ${msgText.slice(0, 80)}`);
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

// ─── MAX Webhook Registration ───────────────────────────────

async function registerMAXWebhook() {
  if (!CONFIG.max.botToken || !CONFIG.max.webhookUrl) {
    console.log("⚠️  MAX Bot not configured, skipping webhook registration");
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

  server.listen(CONFIG.port, "0.0.0.0", () => {
    console.log(`✅ Chat server running on port ${CONFIG.port}`);
    console.log(`   WebSocket: ws://localhost:${CONFIG.port}/ws/chat`);
    console.log(`   Health:    http://localhost:${CONFIG.port}/health`);
    console.log(
      `   Webhook:   http://localhost:${CONFIG.port}/api/chat/webhook`,
    );
  });
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
