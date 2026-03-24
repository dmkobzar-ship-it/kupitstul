<?php
/**
 * КупитьСтул — Configuration
 * Copy to config.php and fill in real values.
 */

return [
    // ─── Database ───────────────────────────────
    'db' => [
        'host'     => getenv('DB_HOST')     ?: 'mysql',
        'port'     => getenv('DB_PORT')     ?: 3306,
        'database' => getenv('DB_NAME')     ?: 'kupitstul',
        'username' => getenv('DB_USER')     ?: 'kupitstul',
        'password' => getenv('DB_PASS')     ?: 'CHANGE_ME_STRONG_PASSWORD',
        'charset'  => 'utf8mb4',
    ],

    // ─── SMTP (PHPMailer) ───────────────────────
    'smtp' => [
        'host'       => getenv('SMTP_HOST')     ?: 'smtp.yandex.ru',
        'port'       => (int)(getenv('SMTP_PORT') ?: 465),
        'encryption' => getenv('SMTP_ENC')      ?: 'ssl',       // ssl | tls
        'username'   => getenv('SMTP_USER')     ?: 'noreply@kupitstul.ru',
        'password'   => getenv('SMTP_PASS')     ?: '',
        'from_email' => getenv('SMTP_FROM')     ?: 'noreply@kupitstul.ru',
        'from_name'  => 'КупитьСтул',
        'to_email'   => getenv('ORDER_EMAIL')   ?: 'jobhunter@list.ru',
    ],

    // ─── Telegram ───────────────────────────────
    'telegram' => [
        'bot_token' => getenv('TG_BOT_TOKEN')   ?: '',
        'chat_id'   => getenv('TG_CHAT_ID')     ?: '',
    ],

    // ─── MAX Messenger Bot ──────────────────────
    'max' => [
        'bot_token'  => getenv('MAX_BOT_TOKEN')   ?: '',
        'webhook_url'=> getenv('MAX_WEBHOOK_URL')  ?: 'https://yourdomain.com/api/chat/webhook',
    ],

    // ─── Rate Limiting ──────────────────────────
    'rate_limit' => [
        'max_requests' => 5,          // per window
        'window_sec'   => 300,        // 5 minutes
    ],

    // ─── CORS ───────────────────────────────────
    'allowed_origins' => [
        'https://kupitstul.ru',
        'https://www.kupitstul.ru',
        'http://localhost:3000',
        'http://localhost:3001',
    ],
];
