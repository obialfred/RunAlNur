import { NextRequest, NextResponse } from "next/server";
import { getProcessStreetClient, ProcessStreetClient } from "@/lib/integrations/process-street";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey, getIntegrationStatus } from "@/lib/integrations/user-credentials";

// GET /api/process-street/status - Check Process Street connection status
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  // First check if user has stored credentials
  const status = await getIntegrationStatus(tenantId, user.id, "process_street");
  
  if (!status.connected) {
    // Env fallback is DEMO_MODE only (never in production).
    if (process.env.DEMO_MODE === "true") {
      const client = getProcessStreetClient();
      if (client) {
        try {
          await client.getWorkflows();
          return NextResponse.json({ 
            success: true, 
            connected: true,
            source: "env",
          });
        } catch {
          return NextResponse.json({ success: false, connected: false });
        }
      }
    }
    return NextResponse.json({ success: false, connected: false, source: "none", error: "Not connected" });
  }

  // Get user's API key
  const apiKey = await getApiKey(tenantId, user.id, "process_street");
  if (!apiKey) {
    return NextResponse.json({ 
      success: false, 
      connected: false, 
      error: "Token decryption failed" 
    });
  }

  // Test the connection
  try {
    const client = new ProcessStreetClient({ apiKey });
    await client.getWorkflows();
    
    return NextResponse.json({ 
      success: true, 
      connected: true,
      source: "user",
      metadata: status.metadata,
      connectedAt: status.connectedAt,
      scopes: status.scopes ?? null,
      expiresAt: status.expiresAt ?? null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : "Process Street connection failed",
    });
  }
}
