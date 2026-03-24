<?php
/**
 * КупитьСтул — CSRF Token Endpoint
 * GET /api/csrf-token
 *
 * Returns a fresh CSRF token for the order form.
 */

require_once __DIR__ . '/helpers.php';

handleCORS();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(405, ['error' => 'Method Not Allowed']);
}

$clientIP = getClientIP();

// Rate limit token generation too
if (!checkRateLimit($clientIP, 'csrf')) {
    jsonResponse(429, ['error' => 'Too many requests']);
}

$token = generateCSRFToken();

jsonResponse(200, [
    'csrf_token' => $token,
]);
