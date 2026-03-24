# КупитьСтул — Система заказов и онлайн-чата

## Архитектура

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NGINX (порт 80/443)                        │
│                      Reverse Proxy + SSL + Rate Limit               │
├──────────┬──────────────┬─────────────────┬────────────────────────-─┤
│   /      │  /api/order  │  /ws/chat       │  /api/chat/*             │
│   ↓      │  /api/csrf   │  ↓              │  ↓                      │
│ Next.js  │  ↓           │ Chat Server     │ Chat Server              │
│ :3000    │ PHP-FPM      │ :3002           │ :3002                    │
│          │ :9000        │ (WebSocket)     │ (HTTP/Webhook)           │
└────┬─────┴──────┬───────┴────────┬────────┴──────────────────────────┘
     │            │                │
     │      ┌─────┴────────────────┤
     │      │     MySQL :3306      │
     │      │  ┌─────────────────┐ │
     │      │  │ orders          │ │
     │      │  │ csrf_tokens     │ │
     │      │  │ rate_limits     │ │
     │      │  │ chat_sessions   │ │
     │      │  │ chat_messages   │ │
     │      │  └─────────────────┘ │
     │      └──────────────────────┘
     │
┌────┴─────────────────────────────────────────────────────────────────┐
│                      Внешние сервисы                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────────┐ │
│  │ SMTP (Yandex)│  │ Telegram Bot  │  │ MAX Messenger Bot          │ │
│  │ Уведомления  │  │ Уведомления   │  │ Двусторонний чат           │ │
│  │ о заказах    │  │ о заказах/чат │  │ с оператором               │ │
│  └──────────────┘  └───────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Поток заказа

```
Посетитель →  Форма заказа  →  POST /api/order
                                    │
                        ┌───────────┼──────────────┐
                        │           │              │
                    Валидация   Rate Limit     CSRF Check
                        │           │              │
                        └───────────┼──────────────┘
                                    │ ✅
                        ┌───────────┼──────────────┐
                        │           │              │
                   MySQL INSERT  Email (SMTP)  Telegram Bot
                        │           │              │
                        └───────────┼──────────────┘
                                    │
                              JSON Response
                              { success: true,
                                order_id: 123 }
```

## Поток чата

```
Посетитель ─── WebSocket ──→ Chat Server ──→ MAX Bot API ──→ Оператор (MAX)
    ↑                            │     ↑                         │
    │                        MySQL DB  │                         │
    │                        (история) │                         │
    └──── WebSocket ←────────────┘     └──── Webhook ←───────────┘
```

1. Посетитель вводит имя → открывается WebSocket
2. Сообщение → сохраняется в MySQL → пересылается в MAX
3. Оператор отвечает в MAX → webhook → Chat Server → WebSocket → посетитель
4. Первое сообщение → уведомление в Telegram

---

## Структура проекта

```
services/
├── docker-compose.yml          # Docker Compose конфигурация
├── .env.example                # Шаблон переменных окружения
│
├── database/
│   └── schema.sql              # MySQL схема (orders, chat, CSRF, rate limits)
│
├── backend/                    # PHP бэкенд обработки заказов
│   ├── config.php              # Конфигурация (DB, SMTP, Telegram, MAX)
│   ├── helpers.php             # Утилиты (DB, CSRF, rate limit, email, TG)
│   ├── order.php               # POST /api/order — обработка заказа
│   ├── csrf.php                # GET /api/csrf-token — генерация CSRF
│   └── composer.json           # PHPMailer зависимость
│
├── chat-server/                # Node.js WebSocket сервер
│   ├── package.json            # Зависимости (ws, express, mysql2, axios)
│   └── server.js               # WebSocket + MAX relay + Telegram
│
├── frontend/                   # Встраиваемый виджет
│   └── chat-widget.js          # Самодостаточный JS (UI + CSS + логика)
│
└── docker/                     # Docker конфигурации
    ├── nginx/
    │   ├── default.conf        # Nginx — проксирование, WebSocket, rate limit
    │   └── nginx.conf          # Nginx — главный конфиг
    ├── php/
    │   └── Dockerfile          # PHP-FPM 8.2 + расширения
    └── node/
        └── Dockerfile          # Node.js 20 Alpine
```

---

## Быстрый старт

### 1. Настройка окружения

```bash
cd services
cp .env.example .env
# Отредактируйте .env — заполните реальные токены и пароли
```

### 2. Запуск

```bash
docker-compose up -d
```

Это запустит:

- **nginx** — порт 80 (reverse proxy)
- **nextjs** — порт 3000 (основной сайт)
- **php-fpm** — порт 9000 (обработка заказов)
- **chat-server** — порт 3002 (WebSocket чат)
- **mysql** — порт 3306 (база данных)

### 3. Проверка

```bash
# Статус контейнеров
docker-compose ps

# Логи
docker-compose logs -f chat-server
docker-compose logs -f php-fpm

# Здоровье чат-сервера
curl http://localhost:3002/health
```

### 4. Настройка ботов

#### Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен
3. Узнайте chat_id: отправьте сообщение боту, затем:
   ```
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Добавьте `TG_BOT_TOKEN` и `TG_CHAT_ID` в `.env`

#### MAX Messenger Bot

1. Создайте бота в MAX (https://max.ru)
2. Получите access token через MAX Bot API
3. Добавьте `MAX_BOT_TOKEN` в `.env`
4. Бот автоматически зарегистрирует webhook при запуске

---

## API Endpoints

### POST `/api/order` — Создание заказа

**Request:**

```json
{
  "name": "Иван Петров",
  "phone": "+7 (999) 123-45-67",
  "email": "ivan@example.com",
  "product": "Кресло офисное Comfort Pro",
  "message": "Хочу узнать наличие",
  "csrf_token": "abc123..."
}
```

**Response (200):**

```json
{
  "success": true,
  "order_id": 42,
  "message": "Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время."
}
```

**Ошибки:**

- `403` — Invalid CSRF token
- `422` — Validation error (details array)
- `429` — Rate limit exceeded (5 req / 5 min)
- `500` — Server error

### GET `/api/csrf-token` — Получение CSRF токена

**Response:**

```json
{
  "csrf_token": "abc123def456..."
}
```

### WebSocket `/ws/chat` — Онлайн-чат

**Подключение:**

```javascript
const ws = new WebSocket("wss://kupitstul.ru/ws/chat");
```

**Сообщения:**

```javascript
// Присоединиться к сессии
ws.send(
  JSON.stringify({
    type: "join",
    session_id: "uuid-here",
    name: "Иван",
    page: "https://kupitstul.ru/catalog/stulya",
  }),
);

// Отправить сообщение
ws.send(
  JSON.stringify({
    type: "message",
    body: "Здравствуйте!",
  }),
);

// Входящие
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  // data.type: 'joined', 'message', 'typing', 'error'
};
```

---

## Виджет чата

### Встраивание на сайт

```html
<script
  src="/chat-widget.js"
  data-ws="wss://kupitstul.ru/ws/chat"
  data-color="#2563eb"
  data-title="Онлайн-консультант"
  data-subtitle="Обычно отвечаем в течение 5 минут"
  data-greeting="Здравствуйте! Чем могу помочь?"
></script>
```

### Параметры

| Атрибут         | По умолчанию                  | Описание                    |
| --------------- | ----------------------------- | --------------------------- |
| `data-ws`       | `ws://localhost:3002/ws/chat` | URL WebSocket сервера       |
| `data-api`      | `http://localhost:3002`       | URL API сервера             |
| `data-position` | `right`                       | Позиция: `left` или `right` |
| `data-color`    | `#2563eb`                     | Основной цвет виджета       |
| `data-title`    | `Онлайн-консультант`          | Заголовок чата              |
| `data-subtitle` | `Обычно отвечаем...`          | Подзаголовок                |
| `data-greeting` | `Здравствуйте!...`            | Приветственное сообщение    |

### JavaScript API

```javascript
window.__ksChat.open(); // Открыть чат
window.__ksChat.close(); // Закрыть чат
window.__ksChat.toggle(); // Переключить
```

### Возможности виджета

- ✅ Плавающая кнопка с пульсирующей анимацией
- ✅ Бейдж непрочитанных сообщений
- ✅ Плавное открытие/закрытие (CSS transitions)
- ✅ Пузырьки сообщений с временными метками
- ✅ Индикатор набора текста (typing)
- ✅ Звуковое уведомление при входящем
- ✅ Форма ввода имени (pre-chat)
- ✅ Сохранение сессии в localStorage
- ✅ Автоматическое переподключение WebSocket
- ✅ Адаптивный дизайн (mobile fullscreen)
- ✅ Самодостаточный — один файл, без зависимостей

---

## Безопасность

### CSRF защита

- Одноразовые токены, хранятся в MySQL
- Срок действия: 2 часа
- Автоматическая очистка каждый час

### Rate Limiting

- Nginx: 2 req/s на IP (с burst 3)
- PHP: 5 запросов / 5 минут на IP (настраиваемо)
- Автоматическая очистка старых записей

### Input Validation

- Серверная валидация всех полей
- Санитизация: strip_tags + htmlspecialchars
- Максимальная длина каждого поля ограничена
- Email проверяется через filter_var

### WebSocket

- Проверка Origin
- Максимальный размер сообщения: 16KB
- Heartbeat каждые 30 секунд
- Автоматическое отключение мёртвых соединений

---

## Мониторинг

```bash
# Статус всех контейнеров
docker-compose ps

# Логи в реальном времени
docker-compose logs -f

# Здоровье чат-сервера
curl http://localhost:3002/health
# → {"status":"ok","sessions":3,"uptime":12345.67}

# Проверка MySQL
docker-compose exec mysql mysql -u kupitstul -p kupitstul -e "SELECT COUNT(*) FROM orders;"
```

---

## Production Checklist

- [ ] Заполнить `.env` реальными значениями
- [ ] Настроить SSL (Let's Encrypt / certbot)
- [ ] Создать Telegram бота и получить chat_id
- [ ] Создать MAX бота и получить access_token
- [ ] Настроить SMTP (Yandex/Mail.ru/свой сервер)
- [ ] Убрать порты MySQL/Chat из docker-compose (оставить только nginx)
- [ ] Настроить бэкапы MySQL
- [ ] Настроить мониторинг (uptime, логи)
- [ ] Добавить SSL сертификат в nginx конфиг
