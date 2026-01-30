import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

// GET /api/ai/status - report which AI providers are configured
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId } = context;

  const anthropicKey = await getApiKey(tenantId, user.id, "anthropic");
  const openaiKey = await getApiKey(tenantId, user.id, "openai");
  const geminiKey = await getApiKey(tenantId, user.id, "gemini");

  return NextResponse.json({
    success: true,
    providers: {
      anthropic: Boolean(anthropicKey || process.env.ANTHROPIC_API_KEY),
      openai: Boolean(openaiKey || process.env.OPENAI_API_KEY),
      gemini: Boolean(geminiKey || process.env.GOOGLE_AI_API_KEY),
    },
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
