/**
 * Admin Authentication Middleware
 * Basic HTTP auth for admin routes
 *
 * Required environment variables (NO defaults — must be set explicitly):
 *   ADMIN_USERNAME  — admin panel login
 *   ADMIN_PASSWORD  — admin panel password
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error(
    "[SECURITY] ADMIN_USERNAME and ADMIN_PASSWORD env vars must be set — admin access disabled!",
  );
}

/**
 * Check if request has valid admin credentials
 */
export function isAuthenticated(request: NextRequest): boolean {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return false;

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
 * Check admin session from cookie — uses HMAC-SHA256 signature.
 * Token = base64(username + ":" + timestamp_ms + ":" + hmac)
 */
export function hasAdminSession(request: NextRequest): boolean {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return false;

  const sessionToken = request.cookies.get("admin_session")?.value;
  if (!sessionToken) return false;

  try {
    const decoded = Buffer.from(sessionToken, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 3) return false;

    const [user, tsStr, sig] = parts;
    const ts = parseInt(tsStr, 10);

    if (Date.now() - ts > 86_400_000) return false;
    if (user !== ADMIN_USERNAME) return false;

    const expected = createHmac("sha256", ADMIN_PASSWORD)
      .update(`${user}:${tsStr}`)
      .digest("hex");
    return sig === expected;
  } catch {
    return false;
  }
}

/**
 * Create an HMAC-signed admin session token
 */
export function createAdminSession(): string {
  const name = ADMIN_USERNAME ?? "admin";
  const ts = Date.now().toString();
  const sig = createHmac("sha256", ADMIN_PASSWORD ?? "")
    .update(`${name}:${ts}`)
    .digest("hex");
  return Buffer.from(`${name}:${ts}:${sig}`).toString("base64");
}
