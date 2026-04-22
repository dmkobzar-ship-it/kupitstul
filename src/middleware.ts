import { NextRequest, NextResponse } from "next/server";

function hasValidSession(request: NextRequest): boolean {
  const sessionToken = request.cookies.get("admin_session")?.value;
  if (sessionToken) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages (except login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionToken = request.cookies.get("admin_session")?.value;
    if (!sessionToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin API routes
  if (
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/login")
  ) {
    if (!hasValidSession(request)) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="KupitStul Admin"' },
      });
    }
  }

  // Protect upload API (create/update/delete products) — admin only
  if (pathname.startsWith("/api/upload")) {
    const method = request.method;
    if (method === "POST" || method === "PUT" || method === "DELETE") {
      if (!hasValidSession(request)) {
        return new NextResponse("Unauthorized", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="KupitStul Admin"' },
        });
      }
    }
  }

  // Protect orders listing (GET /api/orders) — admin only
  // POST (placing order) remains public
  if (pathname === "/api/orders" && request.method === "GET") {
    if (!hasValidSession(request)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/upload", "/api/orders"],
};
