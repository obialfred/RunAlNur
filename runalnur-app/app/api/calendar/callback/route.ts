import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/calendar/google";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("calendar_error", error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("calendar_error", "missing_params");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Decode and validate state
    const stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
    
    // Check state is not too old (15 minutes)
    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("calendar_error", "expired");
      return NextResponse.redirect(redirectUrl);
    }

    const userId = stateData.userId;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens in database
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Database not configured");
    }

    // Upsert calendar sync config
    const configData = {
      user_id: userId,
      google_calendar_enabled: true,
      google_access_token_enc: tokens.accessToken, // TODO: Encrypt in production
      google_refresh_token_enc: tokens.refreshToken, // TODO: Encrypt in production
      google_token_expires_at: tokens.expiresAt.toISOString(),
      last_sync_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from("calendar_sync_config")
      .upsert(configData as never, {
        onConflict: "user_id",
      });

    if (dbError) {
      throw new Error(dbError.message);
    }

    // Redirect to settings with success
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("calendar_connected", "true");
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Calendar callback error:", err);
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("calendar_error", "callback_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
