import { NextRequest, NextResponse } from "next/server";
import { getGuruClient, GuruClient } from "@/lib/integrations/guru";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey, getIntegrationStatus } from "@/lib/integrations/user-credentials";

// GET /api/guru/status - Check Guru connection status
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  // First check if user has stored credentials
  const status = await getIntegrationStatus(tenantId, user.id, "guru");
  
  if (!status.connected) {
    // Env fallback is DEMO_MODE only (never in production).
    if (process.env.DEMO_MODE === "true") {
      const client = getGuruClient();
      if (client) {
        try {
          const connected = await client.testConnection();
          if (connected) {
            const collections = await client.getCollections();
            return NextResponse.json({ 
              success: true, 
              connected: true,
              source: "env",
              collectionsCount: collections.length,
            });
          }
          return NextResponse.json({ success: false, connected: false });
        } catch (err) {
          return NextResponse.json({ 
            success: false, 
            connected: false,
            error: err instanceof Error ? err.message : "Connection test failed"
          });
        }
      }
    }
    return NextResponse.json({ success: false, connected: false, source: "none", error: "Not connected" });
  }

  // Get user's stored credentials (in "email:token" format)
  const credentials = await getApiKey(tenantId, user.id, "guru");
  if (!credentials) {
    return NextResponse.json({ 
      success: false, 
      connected: false, 
      error: "Token decryption failed" 
    });
  }

  // Test the connection
  try {
    const client = new GuruClient(credentials);
    const connected = await client.testConnection();
    
    if (connected) {
      const collections = await client.getCollections();
      return NextResponse.json({ 
        success: true, 
        connected: true,
        source: "user",
        collectionsCount: collections.length,
        metadata: status.metadata,
        connectedAt: status.connectedAt,
        scopes: status.scopes ?? null,
        expiresAt: status.expiresAt ?? null,
      });
    }
    
    return NextResponse.json({
      success: false,
      connected: false,
      error: "Connection test failed",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : "Guru connection failed",
    });
  }
}
