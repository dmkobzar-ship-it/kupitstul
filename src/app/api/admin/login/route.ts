import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kupitstul2025";

/**
 * POST /api/admin/login
 * Login to admin panel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const sessionToken = Buffer.from(
        `${ADMIN_USERNAME}:${Date.now()}`,
      ).toString("base64");

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
