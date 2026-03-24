<?php
/**
 * КупитьСтул — Helpers
 * Database connection, CSRF, rate limiting, Telegram, CORS.
 */

/**
 * Get a PDO connection (singleton per request).
 */
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $cfg = require __DIR__ . '/config.php';
    $db  = $cfg['db'];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'], $db['port'], $db['database'], $db['charset']
    );

    $pdo = new PDO($dsn, $db['username'], $db['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}

/**
 * CORS headers.
 */
function handleCORS(): void
{
    $cfg     = require __DIR__ . '/config.php';
    $origins = $cfg['allowed_origins'];
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $origins, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Generate a CSRF token and store it in DB.
 */
function generateCSRFToken(): string
{
    $token = bin2hex(random_bytes(32));
    $db    = getDB();
    $stmt  = $db->prepare('INSERT INTO csrf_tokens (token) VALUES (?)');
    $stmt->execute([$token]);
    return $token;
}

/**
 * Validate and consume a CSRF token.
 */
function validateCSRFToken(string $token): bool
{
    if (empty($token) || strlen($token) !== 64) {
        return false;
    }

    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT token FROM csrf_tokens WHERE token = ? AND used = 0 AND created_at > NOW() - INTERVAL 2 HOUR LIMIT 1'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
        return false;
    }

    // Mark as used
    $stmt = $db->prepare('UPDATE csrf_tokens SET used = 1 WHERE token = ?');
    $stmt->execute([$token]);

    return true;
}

/**
 * Check rate limit. Returns true if allowed.
 */
function checkRateLimit(string $ip, string $endpoint = 'order'): bool
{
    $cfg    = require __DIR__ . '/config.php';
    $limit  = $cfg['rate_limit'];
    $db     = getDB();

    // Count recent hits
    $stmt = $db->prepare(
        'SELECT COUNT(*) as cnt FROM rate_limits WHERE ip_address = ? AND endpoint = ? AND hit_at > NOW() - INTERVAL ? SECOND'
    );
    $stmt->execute([$ip, $endpoint, $limit['window_sec']]);
    $count = (int) $stmt->fetchColumn();

    if ($count >= $limit['max_requests']) {
        return false;
    }

    // Record hit
    $stmt = $db->prepare('INSERT INTO rate_limits (ip_address, endpoint) VALUES (?, ?)');
    $stmt->execute([$ip, $endpoint]);

    return true;
}

/**
 * Get client IP address.
 */
function getClientIP(): string
{
    $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '0.0.0.0';
}

/**
 * Send Telegram notification.
 */
function sendTelegramNotification(string $text): bool
{
    $cfg = require __DIR__ . '/config.php';
    $tg  = $cfg['telegram'];

    if (empty($tg['bot_token']) || empty($tg['chat_id'])) {
        error_log('Telegram not configured, skipping notification');
        return false;
    }

    $url = "https://api.telegram.org/bot{$tg['bot_token']}/sendMessage";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_POSTFIELDS     => json_encode([
            'chat_id'    => $tg['chat_id'],
            'text'       => $text,
            'parse_mode' => 'HTML',
        ]),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    ]);

    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        error_log("Telegram error ($code): $resp");
        return false;
    }

    return true;
}

/**
 * Send MAX messenger notification.
 */
function sendMAXNotification(string $text, ?int $chatId = null): bool
{
    $cfg = require __DIR__ . '/config.php';
    $max = $cfg['max'];

    if (empty($max['bot_token'])) {
        error_log('MAX Bot not configured, skipping');
        return false;
    }

    // If no specific chat, we can't send
    if ($chatId === null) {
        error_log('No MAX chat_id provided');
        return false;
    }

    $url = "https://botapi.max.ru/messages?access_token=" . urlencode($max['bot_token'])
         . "&chat_id=" . $chatId;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_POSTFIELDS     => json_encode([
            'text' => $text,
        ]),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    ]);

    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        error_log("MAX error ($code): $resp");
        return false;
    }

    return true;
}

/**
 * Send email via PHPMailer.
 */
function sendOrderEmail(array $order): bool
{
    $cfg  = require __DIR__ . '/config.php';
    $smtp = $cfg['smtp'];

    require_once __DIR__ . '/vendor/autoload.php';

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = $smtp['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp['username'];
        $mail->Password   = $smtp['password'];
        $mail->SMTPSecure = $smtp['encryption'] === 'ssl'
            ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $smtp['port'];
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom($smtp['from_email'], $smtp['from_name']);
        $mail->addAddress($smtp['to_email']);

        if (!empty($order['email'])) {
            $mail->addReplyTo($order['email'], $order['name']);
        }

        $mail->isHTML(true);
        $mail->Subject = "🛒 Новый заказ №{$order['id']} — КупитьСтул";

        $mail->Body = buildOrderEmailHTML($order);
        $mail->AltBody = buildOrderEmailText($order);

        $mail->send();
        return true;
    } catch (\Exception $e) {
        error_log("Email error: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Build HTML email body.
 */
function buildOrderEmailHTML(array $o): string
{
    $date = date('d.m.Y H:i', strtotime($o['created_at'] ?? 'now'));
    return <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#2563eb;color:#fff;padding:24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;">🛒 Новый заказ №{$o['id']}</h1>
      <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">{$date}</p>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#666;">Имя</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;font-weight:600;">{$o['name']}</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#666;">Телефон</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;font-weight:600;">
            <a href="tel:{$o['phone']}" style="color:#2563eb;text-decoration:none;">{$o['phone']}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#666;">Email</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">{$o['email']}</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#666;">Товар</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">{$o['product']}</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;color:#666;vertical-align:top;">Сообщение</td>
          <td style="padding:10px 8px;">{$o['message']}</td>
        </tr>
      </table>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;text-align:center;color:#999;font-size:12px;">
      IP: {$o['ip_address']} • КупитьСтул.ру
    </div>
  </div>
</body>
</html>
HTML;
}

/**
 * Build plain-text email body.
 */
function buildOrderEmailText(array $o): string
{
    return implode("\n", [
        "Новый заказ №{$o['id']}",
        str_repeat('─', 30),
        "Имя:      {$o['name']}",
        "Телефон:  {$o['phone']}",
        "Email:    {$o['email']}",
        "Товар:    {$o['product']}",
        "Сообщение: {$o['message']}",
        str_repeat('─', 30),
        "IP: {$o['ip_address']}",
        "Дата: " . date('d.m.Y H:i'),
    ]);
}

/**
 * JSON response helper.
 */
function jsonResponse(int $code, array $data): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Sanitize string input.
 */
function sanitize(string $value, int $maxLen = 255): string
{
    $value = trim($value);
    $value = strip_tags($value);
    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    return mb_substr($value, 0, $maxLen);
}
