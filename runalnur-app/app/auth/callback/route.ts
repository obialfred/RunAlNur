import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(new URL("/login?error=config", requestUrl.origin));
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
    }

    // Set the session cookies for the middleware to pick up
    const cookieStore = await cookies();
    if (data.session?.access_token) {
      cookieStore.set("sb-access-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.session.expires_in,
      });
    }
    if (data.session?.refresh_token) {
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Create profile using service role (server-side only)
    // This is secure because it's in a server route, not client-side
    if (data.user && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      // Check if profile already exists
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, role")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create new profile with default role (not owner - admin must elevate)
        // First user might be owner, subsequent users are members
        const { count } = await adminClient
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const isFirstUser = count === 0;

        await adminClient.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || null,
          // First user gets owner role, others get member
          role: isFirstUser ? "owner" : "member",
          arm_access: [], // Empty by default, admin can grant access
        } as never);
      }
    }

    // Redirect to the requested page or dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
