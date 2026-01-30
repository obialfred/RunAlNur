import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Routes that don't require authentication at all
const PUBLIC_ROUTES = [
  "/login",
  "/signup", 
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/status",
];

// API routes that are public (health checks, webhooks with their own verification)
const PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/status",
  "/api/auth/session",         // Session management endpoint
  "/api/clickup/webhook",      // Has its own signature verification
  "/api/process-street/webhook", // Has its own signature verification
  "/api/webhooks/incoming",    // Has its own secret verification
  "/api/clickup/oauth",        // OAuth callback
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/rive") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public pages
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Allow specific public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Allow cron endpoints only with explicit secret (no session cookies)
  if (pathname.startsWith("/api/cron/")) {
    const configured = Boolean(process.env.CRON_SECRET);
    const provided =
      request.headers.get("x-cron-secret") ||
      request.headers.get("x-vercel-cron-secret") ||
      request.headers.get("authorization");
    const ok =
      configured &&
      (provided === process.env.CRON_SECRET ||
        provided === `Bearer ${process.env.CRON_SECRET}`);
    if (ok) return NextResponse.next();
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check for session cookie for all protected routes (pages and API)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured - allow through only in explicit DEMO_MODE
    if (process.env.DEMO_MODE === "true") {
      return NextResponse.next();
    }
    // In production without Supabase, reject
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication service not configured" },
        { status: 503 }
      );
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Get access token from cookie
  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    // For pages, redirect to login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Verify token by checking with Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  // If access token is expired, try to refresh using refresh token
  if (error || !user) {
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;
    
    if (refreshToken) {
      // Try to refresh the session
      const refreshSupabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: refreshData, error: refreshError } = await refreshSupabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshData.session && refreshData.user) {
        // Session refreshed successfully - set new cookies and continue
        const response = NextResponse.next();
        const isProduction = process.env.NODE_ENV === "production";
        
        response.cookies.set("sb-access-token", refreshData.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          maxAge: refreshData.session.expires_in || 3600,
        });
        
        if (refreshData.session.refresh_token) {
          response.cookies.set("sb-refresh-token", refreshData.session.refresh_token, {
            path: "/",
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }

        response.headers.set("x-user-id", refreshData.user.id);
        response.headers.set("x-user-email", refreshData.user.email || "");
        
        return response;
      }
    }

    // Refresh failed or no refresh token - require re-authentication
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    // For pages, redirect to login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Add user info to request headers for API routes to use
  const response = NextResponse.next();
  response.headers.set("x-user-id", user.id);
  response.headers.set("x-user-email", user.email || "");
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - rive (Rive animation files)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|rive/).*)",
  ],
};
