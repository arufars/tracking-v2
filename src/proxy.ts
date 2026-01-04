// Proxy disabled.
// Rename this file to `proxy.ts` to enable it.
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy"

/**
 * Runs before requests complete.
 * Use for rewrites, redirects, or header changes.
 * Refer to Next.js Proxy docs for more examples.
 */
export async function proxy(request: NextRequest) {
  // Example: redirect to dashboard if user is logged in
  // const token = req.cookies.get("session_token")?.value;
  // if (token && req.nextUrl.pathname === "/auth/login")
  //   return NextResponse.redirect(new URL("/dashboard", req.url));

  return await updateSession(request)
}

/**
 * Matcher runs for all routes.
 * To skip assets or APIs, use a negative matcher from docs.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)",
  ],
};
