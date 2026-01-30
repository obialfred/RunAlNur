import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// POST /api/auth/session - Set session cookies after client-side login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, expires_in } = body;

    if (!access_token) {
      return NextResponse.json(
        { success: false, error: "Missing access token" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    // Set access token cookie
    cookieStore.set("sb-access-token", access_token, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: expires_in || 3600, // Default 1 hour
    });

    // Set refresh token cookie if provided
    if (refresh_token) {
      cookieStore.set("sb-refresh-token", refresh_token, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session set error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set session" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/session - Clear session cookies on logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session clear error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear session" },
      { status: 500 }
    );
  }
}

// GET /api/auth/session - Refresh session using refresh token
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { success: false, error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: "No refresh token" },
      { status: 401 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    // Clear invalid cookies
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");
    
    return NextResponse.json(
      { success: false, error: error?.message || "Session refresh failed" },
      { status: 401 }
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Update cookies with new tokens
  cookieStore.set("sb-access-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: data.session.expires_in || 3600,
  });

  if (data.session.refresh_token) {
    cookieStore.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
    },
  });
}
