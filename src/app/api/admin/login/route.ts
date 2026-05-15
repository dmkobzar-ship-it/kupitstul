import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error(
    "[SECURITY] ADMIN_USERNAME and ADMIN_PASSWORD env vars must be set!",
  );
}

// In-memory brute-force protection: max 10 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  if (entry.count > MAX_ATTEMPTS) return false;
  return true;
}

/**
 * POST /api/admin/login
 * Login to admin panel
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        success: false,
        error: "Слишком много попыток. Попробуйте через 15 минут.",
      },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Сервер не настроен" },
        { status: 503 },
      );
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const sessionToken = createAdminSession();

      const response = NextResponse.json({
        success: true,
        message: "Авторизация успешна",
      });

      // Set HTTP-only cookie
      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Неверный логин или пароль" },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Ошибка авторизации" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/login
 * Logout from admin panel
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}
