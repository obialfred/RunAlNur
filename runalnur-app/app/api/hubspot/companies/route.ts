import { NextRequest, NextResponse } from "next/server";
import { getHubSpotClient, HubSpotClient } from "@/lib/integrations/hubspot";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId } = context;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const apiKey = await getApiKey(tenantId, user.id, "hubspot");
  const client = apiKey
    ? new HubSpotClient({ accessToken: apiKey })
    : process.env.DEMO_MODE === "true"
      ? getHubSpotClient()
      : null;
  if (!client) {
    return NextResponse.json({ success: false, error: "HubSpot not connected" }, { status: 400 });
  }

  const data = await client.getCompanies({ limit });
  return NextResponse.json({ success: true, data: data.results || [] });
}
