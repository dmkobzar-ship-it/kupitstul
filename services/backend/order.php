<?php
/**
 * КупитьСтул — Order Processing Endpoint
 * POST /api/order
 *
 * Accepts JSON:
 *   { name, phone, email?, product?, message?, csrf_token }
 *
 * Flow:
 *   1. Validate CORS + CSRF
 *   2. Rate limit check
 *   3. Input validation
 *   4. Save to MySQL
 *   5. Send email (PHPMailer)
 *   6. Send Telegram notification
 *   7. Return JSON response
 */

require_once __DIR__ . '/helpers.php';

// ─── CORS ───────────────────────────────────────
handleCORS();

// ─── Accept only POST ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, ['error' => 'Method Not Allowed']);
}

// ─── Parse JSON body ────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    jsonResponse(400, ['error' => 'Invalid JSON']);
}

// ─── CSRF validation ────────────────────────────
$csrfToken = $body['csrf_token']
    ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

if (!validateCSRFToken($csrfToken)) {
    jsonResponse(403, ['error' => 'Invalid or expired CSRF token']);
}

// ─── Rate limiting ──────────────────────────────
$clientIP = getClientIP();

if (!checkRateLimit($clientIP, 'order')) {
    jsonResponse(429, ['error' => 'Слишком много запросов. Попробуйте через 5 минут.']);
}

// ─── Validate input ─────────────────────────────
$name    = sanitize($body['name']    ?? '', 255);
$phone   = sanitize($body['phone']   ?? '', 50);
$email   = sanitize($body['email']   ?? '', 255);
$product = sanitize($body['product'] ?? '', 500);
$message = sanitize($body['message'] ?? '', 2000);

$errors = [];

if (empty($name) || mb_strlen($name) < 2) {
    $errors[] = 'Укажите имя (минимум 2 символа)';
}

if (empty($phone)) {
    $errors[] = 'Укажите номер телефона';
} elseif (!preg_match('/^[\d\+\-\(\)\s]{7,20}$/', $phone)) {
    $errors[] = 'Некорректный номер телефона';
}

if (!empty($email) && !filter_var(html_entity_decode($email), FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Некорректный email';
}

if (!empty($errors)) {
    jsonResponse(422, ['error' => 'Validation failed', 'details' => $errors]);
}

// ─── UTM parameters ─────────────────────────────
$utmSource = sanitize($body['utm_source'] ?? '', 255);
$utmMedium = sanitize($body['utm_medium'] ?? '', 255);

// ─── Save to DB ─────────────────────────────────
try {
    $db = getDB();

    $stmt = $db->prepare(
        'INSERT INTO orders (name, phone, email, product, message, ip_address, user_agent, utm_source, utm_medium)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $stmt->execute([
        $name,
        $phone,
        $email,
        $product,
        $message,
        $clientIP,
        sanitize($_SERVER['HTTP_USER_AGENT'] ?? '', 512),
        $utmSource ?: null,
        $utmMedium ?: null,
    ]);

    $orderId = $db->lastInsertId();
} catch (\PDOException $e) {
    error_log("DB error: " . $e->getMessage());
    jsonResponse(500, ['error' => 'Ошибка сервера. Попробуйте позже.']);
}

// ─── Build order data ───────────────────────────
$order = [
    'id'         => $orderId,
    'name'       => $name,
    'phone'      => $phone,
    'email'      => $email,
    'product'    => $product,
    'message'    => $message,
    'ip_address' => $clientIP,
    'created_at' => date('Y-m-d H:i:s'),
];

// ─── Send email (async-safe: don't block response on failure) ─
$emailSent = false;
try {
    $emailSent = sendOrderEmail($order);
} catch (\Throwable $e) {
    error_log("Email send error: " . $e->getMessage());
}

// ─── Telegram notification ──────────────────────
$tgText = "🛒 <b>Новый заказ №{$orderId}</b>\n\n"
    . "👤 {$name}\n"
    . "📞 {$phone}\n"
    . ($email ? "📧 {$email}\n" : '')
    . ($product ? "🪑 {$product}\n" : '')
    . ($message ? "💬 {$message}\n" : '')
    . "\n🕐 " . date('d.m.Y H:i');

$tgSent = false;
try {
    $tgSent = sendTelegramNotification($tgText);
} catch (\Throwable $e) {
    error_log("Telegram error: " . $e->getMessage());
}

// ─── Success response ───────────────────────────
jsonResponse(200, [
    'success'  => true,
    'order_id' => (int) $orderId,
    'message'  => 'Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.',
]);
