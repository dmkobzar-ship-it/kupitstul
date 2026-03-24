/**
 * КупитьСтул — Live Chat Widget
 * Self-contained: injects CSS, creates DOM, manages WebSocket.
 *
 * Usage:
 *   <script src="/chat-widget.js"
 *           data-ws="wss://yourdomain.com/ws/chat"
 *           data-position="right"
 *           data-color="#2563eb">
 *   </script>
 *
 * Features:
 *   • Floating button with unread badge
 *   • Smooth open/close animation
 *   • Auto-reconnect WebSocket
 *   • Message bubbles with timestamps
 *   • Typing indicator
 *   • Session persistence (localStorage)
 *   • Mobile responsive
 *   • Sound notification
 *   • Pre-chat name form
 */

(function () {
  "use strict";

  // ─── Configuration ──────────────────────────────────────

  const scriptTag = document.currentScript;
  const CONF = {
    wsUrl: scriptTag?.getAttribute("data-ws") || "ws://localhost:3002/ws/chat",
    apiUrl: scriptTag?.getAttribute("data-api") || "http://localhost:3002",
    position: scriptTag?.getAttribute("data-position") || "right", // 'left' | 'right'
    color: scriptTag?.getAttribute("data-color") || "#2563eb",
    title: scriptTag?.getAttribute("data-title") || "Онлайн-консультант",
    subtitle:
      scriptTag?.getAttribute("data-subtitle") ||
      "Обычно отвечаем в течение 5 минут",
    greeting:
      scriptTag?.getAttribute("data-greeting") ||
      "Здравствуйте! Чем могу помочь?",
    storageKey: "kupitstul_chat",
  };

  // ─── State ────────────────────────────────────────────

  let ws = null;
  let isOpen = false;
  let isConnected = false;
  let sessionId = null;
  let visitorName = "";
  let messages = [];
  let unreadCount = 0;
  let reconnectTimer = null;
  let reconnectDelay = 1000;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  let typingTimer = null;
  let hasGreeted = false;
  let wsAvailable = true;

  // ─── Load State from localStorage ─────────────────────

  function loadState() {
    try {
      const saved = localStorage.getItem(CONF.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        sessionId = data.sessionId || null;
        visitorName = data.visitorName || "";
        hasGreeted = data.hasGreeted || false;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        CONF.storageKey,
        JSON.stringify({
          sessionId,
          visitorName,
          hasGreeted,
        }),
      );
    } catch (e) {
      /* ignore */
    }
  }

  // ─── Generate UUID ────────────────────────────────────

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
  }

  // ─── CSS Injection ────────────────────────────────────

  function injectStyles() {
    const pos = CONF.position === "left" ? "left" : "right";
    const posOpp = pos === "left" ? "right" : "left";

    const style = document.createElement("style");
    style.textContent = `
      /* ─── Chat Button ─────────────────── */
      #ks-chat-btn {
        position: fixed;
        bottom: 24px;
        ${pos}: 24px;
        ${posOpp}: auto;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${CONF.color};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        animation: ks-pulse 2s ease-in-out infinite;
      }
      #ks-chat-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(37, 99, 235, 0.5);
      }
      #ks-chat-btn.ks-open {
        transform: rotate(90deg) scale(1);
        animation: none;
      }
      #ks-chat-btn svg {
        width: 28px;
        height: 28px;
        fill: #fff;
        transition: transform 0.3s;
      }
      @keyframes ks-pulse {
        0%, 100% { box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4); }
        50% { box-shadow: 0 4px 24px rgba(37, 99, 235, 0.6); }
      }

      /* ─── Badge ───────────────────────── */
      #ks-chat-badge {
        position: absolute;
        top: -4px;
        ${posOpp}: -4px;
        ${pos}: auto;
        background: #ef4444;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1;
        animation: ks-badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #ks-chat-badge.ks-show {
        display: flex;
      }
      @keyframes ks-badge-pop {
        0% { transform: scale(0); }
        100% { transform: scale(1); }
      }

      /* ─── Chat Window ─────────────────── */
      #ks-chat-window {
        position: fixed;
        bottom: 100px;
        ${pos}: 24px;
        ${posOpp}: auto;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 520px;
        max-height: calc(100vh - 140px);
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
        z-index: 99998;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #ks-chat-window.ks-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* ─── Header ──────────────────────── */
      .ks-chat-header {
        background: ${CONF.color};
        color: #fff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .ks-chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .ks-chat-avatar svg {
        width: 22px;
        height: 22px;
        fill: #fff;
      }
      .ks-chat-header-text h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .ks-chat-header-text p {
        margin: 2px 0 0;
        font-size: 12px;
        opacity: 0.8;
      }
      .ks-chat-close {
        margin-${pos}: auto;
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: background 0.2s;
        display: flex;
        align-items: center;
      }
      .ks-chat-close:hover {
        background: rgba(255,255,255,0.2);
      }
      .ks-chat-close svg {
        width: 20px;
        height: 20px;
        fill: #fff;
      }

      /* ─── Status ──────────────────────── */
      .ks-chat-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ks-chat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #86efac;
        flex-shrink: 0;
      }
      .ks-chat-dot.ks-offline {
        background: #fbbf24;
      }

      /* ─── Messages ────────────────────── */
      .ks-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
      }
      .ks-chat-messages::-webkit-scrollbar {
        width: 4px;
      }
      .ks-chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      .ks-chat-messages::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      /* ─── Message Bubble ──────────────── */
      .ks-msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
        animation: ks-msg-in 0.3s ease;
      }
      .ks-msg.ks-visitor {
        align-self: flex-end;
        background: ${CONF.color};
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .ks-msg.ks-operator {
        align-self: flex-start;
        background: #fff;
        color: #1e293b;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .ks-msg-time {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 4px;
      }
      .ks-msg.ks-visitor .ks-msg-time {
        text-align: right;
      }
      @keyframes ks-msg-in {
        0% { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      /* ─── Typing Indicator ────────────── */
      .ks-typing {
        align-self: flex-start;
        background: #fff;
        padding: 12px 18px;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        display: none;
        gap: 4px;
        align-items: center;
      }
      .ks-typing.ks-show {
        display: flex;
      }
      .ks-typing span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #94a3b8;
        animation: ks-dot-bounce 1.4s ease-in-out infinite;
      }
      .ks-typing span:nth-child(2) { animation-delay: 0.2s; }
      .ks-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes ks-dot-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }

      /* ─── Input ───────────────────────── */
      .ks-chat-input {
        display: flex;
        padding: 12px 16px;
        gap: 8px;
        border-top: 1px solid #e2e8f0;
        background: #fff;
        flex-shrink: 0;
      }
      .ks-chat-input textarea {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
        max-height: 80px;
        min-height: 40px;
        transition: border-color 0.2s;
        line-height: 1.4;
      }
      .ks-chat-input textarea:focus {
        border-color: ${CONF.color};
      }
      .ks-chat-input textarea::placeholder {
        color: #94a3b8;
      }
      .ks-chat-input button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${CONF.color};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.2s, transform 0.15s;
        align-self: flex-end;
      }
      .ks-chat-input button:hover {
        background: ${adjustColor(CONF.color, -15)};
        transform: scale(1.05);
      }
      .ks-chat-input button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      .ks-chat-input button svg {
        width: 18px;
        height: 18px;
        fill: #fff;
      }

      /* ─── Pre-chat Form ───────────────── */
      .ks-prechat {
        padding: 24px 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #f8fafc;
      }
      .ks-prechat h4 {
        margin: 0;
        font-size: 16px;
        color: #1e293b;
        text-align: center;
      }
      .ks-prechat p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        text-align: center;
      }
      .ks-prechat input {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 14px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      .ks-prechat input:focus {
        border-color: ${CONF.color};
      }
      .ks-prechat button {
        background: ${CONF.color};
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        font-family: inherit;
      }
      .ks-prechat button:hover {
        background: ${adjustColor(CONF.color, -15)};
      }

      /* ─── Powered By ──────────────────── */
      .ks-powered {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: #94a3b8;
        background: #fff;
        border-top: 1px solid #f1f5f9;
      }

      /* ─── Mobile ──────────────────────── */
      @media (max-width: 480px) {
        #ks-chat-window {
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          bottom: 0;
          ${pos}: 0;
          border-radius: 0;
        }
        #ks-chat-btn {
          bottom: 16px;
          ${pos}: 16px;
          width: 54px;
          height: 54px;
        }
        #ks-chat-btn svg {
          width: 24px;
          height: 24px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Color Helper ─────────────────────────────────────

  function adjustColor(hex, amount) {
    hex = hex.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ─── SVG Icons ────────────────────────────────────────

  const ICONS = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    operator:
      '<svg viewBox="0 0 24 24"><path d="M20 21v-2c0-2.21-3.58-4-8-4s-8 1.79-8 4v2h16zM12 13c2.76 0 5-2.24 5-5S14.76 3 12 3 7 5.24 7 8s2.24 5 5 5z"/></svg>',
  };

  // ─── Build DOM ────────────────────────────────────────

  function buildWidget() {
    // Button
    const btn = document.createElement("button");
    btn.id = "ks-chat-btn";
    btn.setAttribute("aria-label", "Открыть чат");
    btn.innerHTML = ICONS.chat + '<span id="ks-chat-badge"></span>';
    btn.onclick = toggleChat;

    // Window
    const win = document.createElement("div");
    win.id = "ks-chat-window";
    win.innerHTML = `
      <div class="ks-chat-header">
        <div class="ks-chat-avatar">${ICONS.operator}</div>
        <div class="ks-chat-header-text">
          <h3>${CONF.title}</h3>
          <div class="ks-chat-status">
            <span class="ks-chat-dot" id="ks-status-dot"></span>
            <p id="ks-status-text">${CONF.subtitle}</p>
          </div>
        </div>
        <button class="ks-chat-close" onclick="window.__ksChat.toggle()" aria-label="Закрыть">
          ${ICONS.close}
        </button>
      </div>
      <div id="ks-chat-body"></div>
      <div class="ks-powered">КупитьСтул • Онлайн-поддержка</div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(win);
  }

  // ─── Render Body (pre-chat or messages) ───────────────

  function renderBody() {
    const body = document.getElementById("ks-chat-body");
    if (!body) return;

    if (!visitorName && !sessionId) {
      // Pre-chat form
      body.innerHTML = `
        <div class="ks-prechat">
          <h4>👋 Добро пожаловать!</h4>
          <p>${CONF.subtitle}</p>
          <input type="text" id="ks-name-input" placeholder="Ваше имя" maxlength="100" autocomplete="name" />
          <button id="ks-start-btn">Начать чат</button>
        </div>
      `;

      const nameInput = document.getElementById("ks-name-input");
      const startBtn = document.getElementById("ks-start-btn");

      startBtn.onclick = () => {
        const name = (nameInput.value || "").trim();
        if (name.length < 1) {
          nameInput.style.borderColor = "#ef4444";
          nameInput.focus();
          return;
        }
        visitorName = name;
        sessionId = sessionId || uuid();
        saveState();
        renderChatView();
        connectWS();
      };

      nameInput.onkeydown = (e) => {
        if (e.key === "Enter") startBtn.click();
        nameInput.style.borderColor = "#e2e8f0";
      };

      setTimeout(() => nameInput?.focus(), 300);
    } else {
      renderChatView();
      connectWS();
    }
  }

  function renderChatView() {
    const body = document.getElementById("ks-chat-body");
    if (!body) return;

    body.innerHTML = `
      <div class="ks-chat-messages" id="ks-messages"></div>
      <div class="ks-chat-input">
        <textarea id="ks-input" placeholder="Введите сообщение..." rows="1"></textarea>
        <button id="ks-send-btn" aria-label="Отправить">${ICONS.send}</button>
      </div>
    `;

    const input = document.getElementById("ks-input");
    const sendBtn = document.getElementById("ks-send-btn");

    sendBtn.onclick = sendMessage;

    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    // Auto-resize textarea
    input.oninput = () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 80) + "px";
    };

    // Render existing messages
    renderMessages();

    // Add greeting if first time
    if (!hasGreeted && messages.length === 0) {
      hasGreeted = true;
      saveState();
      setTimeout(() => {
        addMessage("operator", CONF.greeting);
        renderMessages();
      }, 500);
    }

    setTimeout(() => input?.focus(), 300);
  }

  // ─── Messages Rendering ───────────────────────────────

  function renderMessages() {
    const container = document.getElementById("ks-messages");
    if (!container) return;

    container.innerHTML =
      messages
        .map((msg) => {
          const timeStr = formatTime(msg.timestamp);
          return `
        <div class="ks-msg ks-${msg.sender}">
          <div>${escapeHtml(msg.body)}</div>
          <div class="ks-msg-time">${timeStr}</div>
        </div>
      `;
        })
        .join("") +
      '<div class="ks-typing" id="ks-typing"><span></span><span></span><span></span></div>';

    scrollToBottom();
  }

  function addMessage(sender, body, timestamp) {
    messages.push({
      sender,
      body,
      timestamp: timestamp || new Date().toISOString(),
    });
    renderMessages();
  }

  function scrollToBottom() {
    const container = document.getElementById("ks-messages");
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  // ─── Send Message ─────────────────────────────────────

  function sendMessage() {
    const input = document.getElementById("ks-input");
    if (!input) return;

    const text = input.value.trim();
    if (!text || !isConnected) return;

    ws.send(
      JSON.stringify({
        type: "message",
        body: text,
        name: visitorName,
      }),
    );

    addMessage("visitor", text);
    input.value = "";
    input.style.height = "auto";
    input.focus();
  }

  // ─── WebSocket ────────────────────────────────────────

  function connectWS() {
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (!wsAvailable) return;

    try {
      ws = new WebSocket(CONF.wsUrl);
    } catch (err) {
      console.warn("[Chat] WS unavailable");
      wsAvailable = false;
      updateStatus(false);
      return;
    }

    ws.onopen = () => {
      isConnected = true;
      reconnectDelay = 1000;
      reconnectAttempts = 0;
      wsAvailable = true;
      updateStatus(true);

      // Join session
      ws.send(
        JSON.stringify({
          type: "join",
          session_id: sessionId,
          name: visitorName,
          page: window.location.href,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "joined":
            // Load history
            if (data.history && data.history.length > 0) {
              messages = data.history.map((m) => ({
                sender: m.sender,
                body: m.body,
                timestamp: m.created_at,
              }));
              renderMessages();
            }
            break;

          case "message":
            if (data.sender === "operator") {
              addMessage("operator", data.body, data.timestamp);
              hideTyping();

              if (!isOpen) {
                unreadCount++;
                updateBadge();
                playSound();
              }
            }
            break;

          case "typing":
            if (data.sender === "operator") {
              showTyping();
            }
            break;

          case "error":
            console.error("[Chat] Server error:", data.message);
            break;
        }
      } catch (err) {
        console.error("[Chat] Parse error:", err);
      }
    };

    ws.onclose = (e) => {
      isConnected = false;
      updateStatus(false);
      if (e.code !== 1000) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      isConnected = false;
      reconnectAttempts++;
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        wsAvailable = false;
        updateStatus(false);
      }
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      wsAvailable = false;
      return;
    }
    reconnectTimer = setTimeout(
      () => {
        reconnectTimer = null;
        if (sessionId && isOpen && wsAvailable) {
          connectWS();
        }
      },
      Math.min(reconnectDelay, 15000),
    );
    reconnectDelay *= 1.5;
  }

  // ─── UI Updates ───────────────────────────────────────

  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById("ks-chat-window");
    const btn = document.getElementById("ks-chat-btn");

    if (isOpen) {
      win?.classList.add("ks-visible");
      btn?.classList.add("ks-open");
      btn.innerHTML = ICONS.close + '<span id="ks-chat-badge"></span>';
      unreadCount = 0;
      updateBadge();
      renderBody();
    } else {
      win?.classList.remove("ks-visible");
      btn?.classList.remove("ks-open");
      btn.innerHTML = ICONS.chat + '<span id="ks-chat-badge"></span>';
    }
  }

  function updateBadge() {
    const badge = document.getElementById("ks-chat-badge");
    if (!badge) return;
    if (unreadCount > 0 && !isOpen) {
      badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
      badge.classList.add("ks-show");
    } else {
      badge.classList.remove("ks-show");
    }
  }

  function updateStatus(online) {
    const dot = document.getElementById("ks-status-dot");
    const text = document.getElementById("ks-status-text");
    if (dot) {
      dot.classList.toggle("ks-offline", !online);
    }
    if (text) {
      text.textContent = online ? CONF.subtitle : "Переподключение...";
    }
  }

  function showTyping() {
    const el = document.getElementById("ks-typing");
    if (el) el.classList.add("ks-show");
    scrollToBottom();

    clearTimeout(typingTimer);
    typingTimer = setTimeout(hideTyping, 3000);
  }

  function hideTyping() {
    const el = document.getElementById("ks-typing");
    if (el) el.classList.remove("ks-show");
  }

  // ─── Sound ────────────────────────────────────────────

  function playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      /* ignore */
    }
  }

  // ─── Helpers ──────────────────────────────────────────

  function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Init ─────────────────────────────────────────────

  function init() {
    loadState();
    injectStyles();
    buildWidget();

    // Public API for external control
    window.__ksChat = {
      toggle: toggleChat,
      open: () => {
        if (!isOpen) toggleChat();
      },
      close: () => {
        if (isOpen) toggleChat();
      },
    };
  }

  // Wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
