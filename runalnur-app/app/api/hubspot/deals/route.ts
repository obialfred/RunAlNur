import { NextRequest, NextResponse } from "next/server";
import { getHubSpotClient, HubSpotClient } from "@/lib/integrations/hubspot";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

// GET /api/hubspot/deals - Fetch and optionally sync HubSpot deals
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const armId = searchParams.get("arm_id");
  const sync = searchParams.get("sync") === "1";

  const apiKey = await getApiKey(tenantId, user.id, "hubspot");
  const client = apiKey
    ? new HubSpotClient({ accessToken: apiKey })
    : process.env.DEMO_MODE === "true"
      ? getHubSpotClient()
      : null;
  if (!client) {
    return NextResponse.json(
      { success: false, error: "HubSpot not connected. Connect via Settings page." },
      { status: 400 }
    );
  }

  try {
    const data = await client.getDeals({ limit });
    const deals = data.results || [];

    if (sync) {
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: "Database not configured" },
          { status: 503 }
        );
      }

      const payload = deals.map((deal) => ({
        hubspot_id: deal.id,
        arm_id: armId || null,
        tenant_id: tenantId,
        owner_id: user.id, // Associate synced deals with the user
        name: deal.properties.dealname || "Unnamed Deal",
        stage: deal.properties.dealstage || "lead",
        score: 0,
        amount: deal.properties.amount ? Number(deal.properties.amount) : null,
        status: "open",
      }));

      const { error: upsertError } = await supabase
        .from("deals")
        .upsert(payload as never[], {
          onConflict: "tenant_id,hubspot_id",
        });

      if (upsertError) {
        console.error("HubSpot deals sync error:", upsertError);
        return NextResponse.json(
          { success: false, error: upsertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        synced: payload.length, 
        data: payload 
      });
    }

    return NextResponse.json({ success: true, data: deals });
  } catch (err) {
    console.error("HubSpot deals error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch HubSpot deals" },
      { status: 500 }
    );
  }
}
