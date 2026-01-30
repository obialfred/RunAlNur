import { NextRequest, NextResponse } from "next/server";
import { getClickUpClient, ClickUpClient } from "@/lib/integrations/clickup";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getOAuthAccessToken, getIntegrationStatus } from "@/lib/integrations/user-credentials";

// GET /api/clickup/status - Check ClickUp connection status
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  // First check if user has stored credentials
  const status = await getIntegrationStatus(tenantId, user.id, "clickup");
  
  if (!status.connected) {
    // Env fallback is DEMO_MODE only (never in production).
    if (process.env.DEMO_MODE === "true") {
      const client = getClickUpClient();
      if (client) {
        try {
          const result = await client.getWorkspaces();
          return NextResponse.json({
            connected: true,
            source: "env",
            workspaces: result.teams?.length || 0,
          });
        } catch {
          return NextResponse.json({ connected: false });
        }
      }
    }
    return NextResponse.json({ connected: false, source: "none" });
  }

  // Get the user's access token
  const accessToken = await getOAuthAccessToken(tenantId, user.id, "clickup");
  
  if (!accessToken) {
    return NextResponse.json({ 
      connected: false,
      error: "Token decryption failed",
    });
  }

  // Test the connection
  try {
    const client = new ClickUpClient({ apiKey: accessToken });
    const result = await client.getWorkspaces();
    
    return NextResponse.json({
      connected: true,
      source: "user",
      workspaces: result.teams?.length || 0,
      metadata: status.metadata,
      connectedAt: status.connectedAt,
      scopes: status.scopes ?? null,
      expiresAt: status.expiresAt ?? null,
    });
  } catch (err) {
    return NextResponse.json({ 
      connected: false,
      error: err instanceof Error ? err.message : "Connection test failed",
    });
  }
}
