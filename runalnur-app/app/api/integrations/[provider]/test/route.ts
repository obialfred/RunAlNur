import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import {
  getUserCredentials,
  IntegrationProvider,
} from "@/lib/integrations/user-credentials";
import { ApiKeyCredentials, OAuthCredentials } from "@/lib/security/crypto";

// Provider-specific client classes
import { HubSpotClient } from "@/lib/integrations/hubspot";
import { ProcessStreetClient } from "@/lib/integrations/process-street";
import { GuruClient } from "@/lib/integrations/guru";
import { ClickUpClient, getClickUpClient } from "@/lib/integrations/clickup";

// Validate provider param
function isValidProvider(provider: string): provider is IntegrationProvider {
  return ["clickup", "hubspot", "process_street", "guru", "openai", "anthropic", "gemini", "webpush"].includes(provider);
}

// POST /api/integrations/[provider]/test - Test existing connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      { success: false, error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  }

  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  // Get stored credentials
  const isOAuthProvider = provider === "clickup";
  
  let credentials: ApiKeyCredentials | OAuthCredentials | null = null;

  if (isOAuthProvider) {
    const result = await getUserCredentials<OAuthCredentials>(tenantId, user.id, provider);
    credentials = result?.credentials || null;
  } else {
    const result = await getUserCredentials<ApiKeyCredentials>(tenantId, user.id, provider);
    credentials = result?.credentials || null;
  }

  if (!credentials) {
    // Dev/local fallback: allow ClickUp to be "connected" via server env var token
    // (Settings "Status" uses the same fallback, so Test should behave consistently).
    if (provider === "clickup" && process.env.DEMO_MODE === "true") {
      const envClient = getClickUpClient();
      if (envClient) {
        try {
          const result = await envClient.getWorkspaces();
          return NextResponse.json({
            success: true,
            connected: true,
            metadata: { workspaceCount: result?.teams?.length || 0, mode: "env" },
          });
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          return NextResponse.json(
            { success: false, connected: false, error },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        error: `${provider} not connected. Please connect first.` 
      },
      { status: 400 }
    );
  }

  // Test the connection
  const testResult = await testProviderConnection(provider, credentials);

  return NextResponse.json({
    success: testResult.success,
    connected: testResult.success,
    error: testResult.error,
    details: testResult.details,
    metadata: testResult.metadata,
  });
}

/**
 * Test connection using stored credentials
 */
async function testProviderConnection(
  provider: IntegrationProvider,
  credentials: ApiKeyCredentials | OAuthCredentials
): Promise<{
  success: boolean;
  error?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}> {
  try {
    switch (provider) {
      case "clickup": {
        const oauthCreds = credentials as OAuthCredentials;
        const client = new ClickUpClient({ apiKey: oauthCreds.access_token });
        // Test by getting workspaces
        try {
          const result = await client.getWorkspaces();
          return {
            success: true,
            metadata: { workspaceCount: result?.teams?.length || 0, mode: "oauth" },
          };
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          return { success: false, error };
        }
      }

      case "hubspot": {
        const apiCreds = credentials as ApiKeyCredentials;
        const client = new HubSpotClient({ accessToken: apiCreds.api_key });
        try {
          await client.getContacts({ limit: 1 });
          return { success: true };
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          return { success: false, error };
        }
      }

      case "process_street": {
        const apiCreds = credentials as ApiKeyCredentials;
        const client = new ProcessStreetClient({ apiKey: apiCreds.api_key });
        try {
          const result = await client.getWorkflows();
          return {
            success: true,
            metadata: { workflowCount: result?.workflows?.length || 0 },
          };
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          return { success: false, error };
        }
      }

      case "guru": {
        const apiCreds = credentials as ApiKeyCredentials;
        const client = new GuruClient(apiCreds.api_key);
        try {
          const cards = await client.listCards({ limit: 1 });
          return {
            success: true,
            metadata: { hasCards: (cards?.length || 0) > 0 },
          };
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          return { success: false, error };
        }
      }

      case "openai": {
        const apiCreds = credentials as ApiKeyCredentials;
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiCreds.api_key}` },
        });
        if (!response.ok) {
          return { success: false, error: "API key is invalid or expired" };
        }
        return { success: true, metadata: { provider: "openai" } };
      }

      case "anthropic": {
        const apiCreds = credentials as ApiKeyCredentials;
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiCreds.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "test" }],
          }),
        });
        if (response.ok || response.status === 429) {
          return { success: true, metadata: { provider: "anthropic" } };
        }
        return { success: false, error: "API key is invalid or expired" };
      }

      case "gemini": {
        const apiCreds = credentials as ApiKeyCredentials;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiCreds.api_key)}`
        );
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          return { success: false, error: "Gemini API key test failed", details: text.slice(0, 500) };
        }
        return { success: true, metadata: { provider: "gemini" } };
      }

      default:
        return { success: false, error: `Testing not supported for ${provider}` };
    }
  } catch (err) {
    console.error(`Error testing ${provider} connection:`, err);
    return {
      success: false,
      error: "Connection test failed",
      details: err instanceof Error ? err.message : String(err),
    };
  }
}
