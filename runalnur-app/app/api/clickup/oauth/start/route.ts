import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import crypto from "crypto";

// GET /api/clickup/oauth/start - Start ClickUp OAuth flow
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId, supabase } = context;

  const clientId = process.env.CLICKUP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { 
        success: false, 
        error: "ClickUp OAuth not configured. Set CLICKUP_CLIENT_ID in environment." 
      },
      { status: 503 }
    );
  }

  // Generate a secure state parameter
  const state = crypto.randomBytes(32).toString("hex");
  
  // Determine redirect URI (use configured or construct from host)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/clickup/oauth`;

  // Store state in database for verification (with expiration)
  if (supabase) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Delete any existing state for this user
    await supabase
      .from("oauth_states")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .eq("provider", "clickup");

    // Insert new state
    await supabase.from("oauth_states").insert({
      tenant_id: tenantId,
      user_id: user.id,
      provider: "clickup",
      state,
      redirect_uri: redirectUri,
      expires_at: expiresAt.toISOString(),
    } as never);
  }

  // Also store state in cookie as fallback/backup
  const cookieStore = await cookies();
  cookieStore.set("clickup_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  // Build the authorization URL
  const authUrl = new URL("https://app.clickup.com/api");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.json({
    success: true,
    authUrl: authUrl.toString(),
    state, // Include for client to verify if needed
  });
}
