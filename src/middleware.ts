import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  // Public paths that do not require authentication
  const isPublicPath = 
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes("."); // static files

  const token = request.cookies.get("cscp_session")?.value;

  if (isPublicPath) {
    if (token && request.nextUrl.pathname === "/login") {
      // Redirect logged-in users away from login page
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("cscp_session");
    return response;
  }

  // Clone the request headers and set user context for downstream API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-org-id", payload.organizationId);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-user-district", encodeURIComponent(payload.district || ""));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Ensure middleware only runs on necessary paths
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
