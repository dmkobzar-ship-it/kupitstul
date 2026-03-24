/**
 * Admin Authentication Middleware
 * Basic HTTP auth for admin routes
 *
 * Set environment variables:
 *   ADMIN_USERNAME (default: admin)
 *   ADMIN_PASSWORD (default: kupitstul2025)
 */

import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kupitstul2025";

/**
 * Check if request has valid admin credentials
 */
export function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii",
  );
  const [username, password] = credentials.split(":");

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Return 401 Unauthorized response with WWW-Authenticate header
 */
export function unauthorized(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="KupitStul Admin"',
    },
  });
}

/**
 * Middleware helper: protect an API route
 *
 * Usage in API routes:
 * ```
 * import { requireAdmin } from "@/lib/auth";
 *
 * export async function GET(request: NextRequest) {
 *   const authError = requireAdmin(request);
 *   if (authError) return authError;
 *   // ... your logic
 * }
 * ```
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (!isAuthenticated(request)) {
    return unauthorized();
  }
  return null;
}

/**
 * Check admin session from cookie (for pages)
 * Returns true if user has valid admin session
 */
export function hasAdminSession(request: NextRequest): boolean {
  const sessionToken = request.cookies.get("admin_session")?.value;
  if (!sessionToken) return false;

  // Simple token validation - in production use JWT or database sessions
  try {
    const decoded = Buffer.from(sessionToken, "base64").toString("ascii");
    return decoded === `${ADMIN_USERNAME}:${Date.now().toString().slice(0, 8)}`;
  } catch {
    return false;
  }
}

/**
 * Create an admin session token
 */
export function createAdminSession(): string {
  const token = Buffer.from(
    `${ADMIN_USERNAME}:${Date.now().toString().slice(0, 8)}`,
  ).toString("base64");
  return token;
}
