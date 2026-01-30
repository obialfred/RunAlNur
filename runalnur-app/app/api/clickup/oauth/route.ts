import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { saveUserCredentials } from "@/lib/integrations/user-credentials";
import { OAuthCredentials, isEncryptionConfigured } from "@/lib/security/crypto";

// GET /api/clickup/oauth - OAuth callback handler
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("ClickUp OAuth error:", error);
    return NextResponse.redirect(new URL("/settings?error=oauth_denied", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=missing_code", origin));
  }

  if (!state) {
    return NextResponse.redirect(new URL("/settings?error=missing_state", origin));
  }

  // Verify OAuth credentials are configured
  const clientId = process.env.CLICKUP_CLIENT_ID;
  const clientSecret = process.env.CLICKUP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("ClickUp OAuth not configured");
    return NextResponse.redirect(new URL("/settings?error=oauth_not_configured", origin));
  }

  // Check encryption is configured
  if (!isEncryptionConfigured()) {
    console.error("Encryption not configured for storing tokens");
    return NextResponse.redirect(new URL("/settings?error=encryption_not_configured", origin));
  }

  // Verify state parameter
  const supabase = getSupabaseAdmin();
  let userId: string | null = null;
  let tenantId: string | null = null;

  if (supabase) {
    // Look up state in database
    interface OAuthStateRow {
      tenant_id: string;
      user_id: string;
      expires_at: string;
    }
    
    const { data, error: stateError } = await supabase
      .from("oauth_states")
      .select("tenant_id, user_id, expires_at")
      .eq("provider", "clickup")
      .eq("state", state)
      .single();
    
    const stateData = data as OAuthStateRow | null;

    if (stateError || !stateData) {
      // Try cookie fallback for state verification
      const cookieStore = await cookies();
      const cookieState = cookieStore.get("clickup_oauth_state")?.value;
      
      if (cookieState !== state) {
        console.error("OAuth state mismatch");
        return NextResponse.redirect(new URL("/settings?error=invalid_state", origin));
      }
      
      // State matched cookie but not in DB - try to get user from session cookie
      const accessToken = cookieStore.get("sb-access-token")?.value;
      if (accessToken && supabase) {
        // Verify the token and get user
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });
        
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          userId = user.id;
          // Resolve tenant from membership (earliest membership)
          const { data: memberships } = await userSupabase
            .from("tenant_memberships")
            .select("tenant_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1);
          tenantId = memberships?.[0]?.tenant_id ?? null;
        }
      }
    } else {
      // Check expiration
      if (new Date(stateData.expires_at) < new Date()) {
        console.error("OAuth state expired");
        return NextResponse.redirect(new URL("/settings?error=state_expired", origin));
      }
      
      userId = stateData.user_id;
      tenantId = stateData.tenant_id;
      
      // Delete the used state
      await supabase
        .from("oauth_states")
        .delete()
        .eq("provider", "clickup")
        .eq("state", state);
    }
  }

  if (!userId || !tenantId) {
    console.error("Could not determine user for OAuth callback");
    return NextResponse.redirect(new URL("/settings?error=auth_required", origin));
  }

  // Exchange code for tokens
  try {
    const tokenResponse = await fetch(
      `https://api.clickup.com/api/v2/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      { method: "POST" }
    );
    
    const tokenJson = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenJson.access_token) {
      console.error("Token exchange failed:", tokenJson);
      return NextResponse.redirect(new URL("/settings?error=token_exchange_failed", origin));
    }

    // Prepare credentials for storage
    const credentials: OAuthCredentials = {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      token_type: tokenJson.token_type || "Bearer",
    };

    // Calculate token expiration
    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + tokenJson.expires_in * 1000)
      : undefined;

    // Get user info from ClickUp for metadata
    let metadata: Record<string, unknown> = {};
    try {
      const userResponse = await fetch("https://api.clickup.com/api/v2/user", {
        headers: { Authorization: tokenJson.access_token },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        metadata = {
          clickup_user_id: userData.user?.id,
          clickup_username: userData.user?.username,
          clickup_email: userData.user?.email,
        };
      }
    } catch {
      // Non-critical: proceed without metadata
    }

    // Save encrypted credentials
    const saveResult = await saveUserCredentials(
      tenantId,
      userId,
      "clickup",
      "oauth",
      credentials,
      {
        metadata,
        expiresAt,
      }
    );

    if (!saveResult.success) {
      console.error("Failed to save ClickUp credentials:", saveResult.error);
      return NextResponse.redirect(new URL("/settings?error=save_failed", origin));
    }

    // Clear the state cookie
    const cookieStore = await cookies();
    cookieStore.delete("clickup_oauth_state");

    // Redirect to settings with success
    return NextResponse.redirect(new URL("/settings?connected=clickup", origin));

  } catch (err) {
    console.error("ClickUp OAuth error:", err);
    return NextResponse.redirect(new URL("/settings?error=oauth_error", origin));
  }
}
