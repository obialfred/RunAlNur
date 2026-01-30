import { NextRequest, NextResponse } from "next/server";
import { getHubSpotClient, HubSpotClient, hubspotContactToContact } from "@/lib/integrations/hubspot";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

// GET /api/hubspot/contacts - Fetch and optionally sync HubSpot contacts
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const armId = searchParams.get("arm_id");
  const sync = searchParams.get("sync") === "1";

  const apiKey = await getApiKey(tenantId, user.id, "hubspot");
  const client = apiKey ? new HubSpotClient({ accessToken: apiKey }) : (process.env.DEMO_MODE === "true" ? getHubSpotClient() : null);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "HubSpot not connected. Connect via Settings page." },
      { status: 400 }
    );
  }

  try {
    const data = await client.getContacts({ limit });
    const contacts = data.results || [];

    if (sync) {
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: "Database not configured" },
          { status: 503 }
        );
      }

      const payload = contacts.map((c) => {
        const mapped = hubspotContactToContact(c, armId || "");
        return {
          ...mapped,
          arm_id: armId || null,
          tenant_id: tenantId,
          owner_id: user.id, // Associate synced contacts with the user
        };
      });

      const { error: upsertError } = await supabase
        .from("contacts")
        .upsert(payload as never[], {
          onConflict: "tenant_id,hubspot_id",
        });

      if (upsertError) {
        console.error("HubSpot sync error:", upsertError);
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

    return NextResponse.json({ success: true, data: contacts });
  } catch (err) {
    console.error("HubSpot contacts error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch HubSpot contacts" },
      { status: 500 }
    );
  }
}
