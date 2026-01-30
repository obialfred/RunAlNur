import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { context, error } = await getAuthContext(request);
    if (!context) return unauthorizedResponse(error || "Authentication required");
    const { user, tenantId, supabase } = context;
    if (!supabase) return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });

    // Interactions are stored as activities of type "interaction"
    const { data, error: dbError } = await supabase
      .from("activities")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .eq("type", "interaction")
      .order("created_at", { ascending: false })
      .limit(50);

    if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, interactions: data || [] });
  } catch (error) {
    console.error("Error in interactions API:", error);
    return NextResponse.json({ success: false, interactions: [] });
  }
}

type InteractionType = "call" | "meeting" | "email" | "event" | "message" | "social" | "other";
type Sentiment = "great" | "good" | "neutral" | "cold";

export async function POST(request: NextRequest) {
  try {
    const { context, error } = await getAuthContext(request);
    if (!context) return unauthorizedResponse(error || "Authentication required");
    const { user, tenantId, supabase } = context;
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const body = await request.json();

    // Validate required fields
    if (!body.contactId || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: contactId and type" },
        { status: 400 }
      );
    }

    // Demo-only fallback (never in production)
    if (process.env.DEMO_MODE === "true" && user.id === "dev-user") {
      return NextResponse.json({
        success: true,
        interaction: {
          id: crypto.randomUUID(),
          contact_id: body.contactId,
          interaction_type: body.type,
          sentiment: body.sentiment,
          notes: body.notes,
          occurred_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        followup: body.followUpDate
          ? {
              id: crypto.randomUUID(),
              contact_id: body.contactId,
              due_at: body.followUpDate,
              status: "open",
              note: body.followUpNote || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null,
      });
    }

    const interactionType = String(body.type) as InteractionType;
    const sentiment = (body.sentiment ? String(body.sentiment) : "neutral") as Sentiment;
    const notes = body.notes ? String(body.notes) : null;

    const db = supabase as unknown as { from: (t: string) => any };

    // Record as an activity (so it's visible across modes)
    const { data: activity, error: activityError } = await db
      .from("activities")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        type: "interaction",
        description: `${interactionType.toUpperCase()} interaction`,
        contact_id: body.contactId,
        metadata: {
          interaction_type: interactionType,
          sentiment,
          notes,
        },
      })
      .select("*")
      .single();

    if (activityError) {
      return NextResponse.json({ success: false, error: activityError.message }, { status: 500 });
    }

    let followup: unknown | null = null;
    if (body.followUpDate) {
      const dueAt = String(body.followUpDate);
      const note = body.followUpNote ? String(body.followUpNote) : null;
      const { data: createdFollowup, error: followupError } = await db
        .from("influence_followups")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          contact_id: body.contactId,
          due_at: dueAt,
          status: "open",
          note,
          source: "interaction",
        })
        .select("*")
        .single();

      if (followupError) {
        // Still return the interaction; followup creation can fail independently
        followup = null;
      } else {
        followup = createdFollowup;
      }
    }

    return NextResponse.json({
      success: true,
      interaction: activity,
      followup,
    });
  } catch (error) {
    console.error("Error in interactions POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
