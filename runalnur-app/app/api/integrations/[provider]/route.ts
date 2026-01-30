import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, badRequestResponse } from "@/lib/api/auth";
import {
  saveUserCredentials,
  disconnectIntegration,
  getIntegrationStatus,
  IntegrationProvider,
  getUserCredentials,
} from "@/lib/integrations/user-credentials";
import { ApiKeyCredentials, isEncryptionConfigured } from "@/lib/security/crypto";

// Provider-specific client classes for testing
import { HubSpotClient } from "@/lib/integrations/hubspot";
import { ProcessStreetClient } from "@/lib/integrations/process-street";
import { GuruClient } from "@/lib/integrations/guru";

// Valid providers for API key-based connections
const API_KEY_PROVIDERS: IntegrationProvider[] = [
  "hubspot",
  "process_street",
  "guru",
  "openai",
  "anthropic",
  "gemini",
];

// Validate provider param
function isValidProvider(provider: string): provider is IntegrationProvider {
  return ["clickup", "hubspot", "process_street", "guru", "openai", "anthropic", "gemini", "webpush"].includes(provider);
}

// GET /api/integrations/[provider] - Get connection status
export async function GET(
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
  const status = await getIntegrationStatus(context.tenantId, context.user.id, provider);
  return NextResponse.json({ success: true, ...status });
}

// POST /api/integrations/[provider] - Connect integration (save API key)
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

  // Check encryption is configured
  if (!isEncryptionConfigured()) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Server encryption not configured. Contact administrator." 
      },
      { status: 503 }
    );
  }

  // ClickUp uses OAuth, not API key
  if (provider === "clickup") {
    return NextResponse.json(
      { 
        success: false, 
        error: "ClickUp requires OAuth authentication. Use /api/clickup/oauth/start" 
      },
      { status: 400 }
    );
  }

  // WebPush has its own registration flow
  if (provider === "webpush") {
    return NextResponse.json(
      { 
        success: false, 
        error: "WebPush uses a separate registration flow. Use /api/notifications/register" 
      },
      { status: 400 }
    );
  }

  let body: { api_key?: string; api_secret?: string };
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  if (!body.api_key) {
    return badRequestResponse("api_key is required");
  }

  // Validate the API key by testing the connection
  const testResult = await testProviderConnection(provider, body.api_key, body.api_secret);
  
  if (!testResult.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: testResult.error || "Connection test failed",
        details: testResult.details,
      },
      { status: 400 }
    );
  }

  // Save the credentials
  const saveResult = await saveUserCredentials<ApiKeyCredentials>(
    context.tenantId,
    context.user.id,
    provider,
    "api_key",
    { api_key: body.api_key, api_secret: body.api_secret },
    { metadata: testResult.metadata }
  );

  if (!saveResult.success) {
    return NextResponse.json(
      { success: false, error: saveResult.error || "Failed to save credentials" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `${provider} connected successfully`,
    metadata: testResult.metadata,
  });
}

// DELETE /api/integrations/[provider] - Disconnect integration
export async function DELETE(
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

  const result = await disconnectIntegration(context.tenantId, context.user.id, provider);
  
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Failed to disconnect" },
      { status: 500 }
    );
  }

  // Provider-specific cleanup
  if (provider === "clickup") {
    await context.supabase
      .from("clickup_mappings")
      .delete()
      .eq("tenant_id", context.tenantId)
      .eq("user_id", context.user.id);
  }

  return NextResponse.json({
    success: true,
    message: `${provider} disconnected successfully`,
  });
}

/**
 * Test connection to a provider with the given credentials
 */
async function testProviderConnection(
  provider: IntegrationProvider,
  apiKey: string,
  apiSecret?: string
): Promise<{
  success: boolean;
  error?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}> {
  try {
    switch (provider) {
      case "hubspot": {
        const client = new HubSpotClient({ accessToken: apiKey });
        // Test by fetching contacts (limit 1) to verify the key works
        try {
          await client.getContacts({ limit: 1 });
          return { success: true };
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          return { success: false, error };
        }
      }

      case "process_street": {
        const client = new ProcessStreetClient({ apiKey });
        // Test by listing workflows
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
        // Guru uses email:token format or just token
        const client = new GuruClient(apiKey);
        // Test by listing cards (limit 1)
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
        // Test OpenAI key by listing models
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          return {
            success: false,
            error: "Invalid API key",
            details: error?.error?.message,
          };
        }
        return { success: true, metadata: { provider: "openai" } };
      }

      case "anthropic": {
        // Test Anthropic key by making a minimal request
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "test" }],
          }),
        });
        // Even a rate limit means the key is valid
        if (response.ok || response.status === 429) {
          return { success: true, metadata: { provider: "anthropic" } };
        }
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: "Invalid API key",
          details: error?.error?.message,
        };
      }

      case "gemini": {
        // Minimal connectivity test: list models
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
        );
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          return { success: false, error: "Gemini API key test failed", details: text.slice(0, 500) };
        }
        return { success: true, metadata: { provider: "gemini" } };
      }

      default:
        return { success: false, error: `Provider ${provider} does not support API key validation` };
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
