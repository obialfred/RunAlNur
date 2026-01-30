import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

// In-memory demo activities
const sampleActivities = [
  {
    id: "act-1",
    type: "project_created",
    description: "Created project 'Q1 Marketing Campaign'",
    arm_id: "nova",
    project_id: "1",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "act-2", 
    type: "task_completed",
    description: "Completed task 'Design landing page mockups'",
    arm_id: "janna",
    project_id: "2",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "act-3",
    type: "contact_added",
    description: "Added new contact 'Sarah Johnson'",
    arm_id: "silk",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "act-4",
    type: "deal_updated",
    description: "Deal 'Downtown Property' moved to Negotiation",
    arm_id: "janna",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "act-5",
    type: "project_updated",
    description: "Updated project status to 'In Progress'",
    arm_id: "nova",
    project_id: "1",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "act-6",
    type: "sop_started",
    description: "Started SOP 'New Tenant Onboarding'",
    arm_id: "janna",
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: "act-7",
    type: "ai_briefing",
    description: "AI generated daily briefing for Janna",
    arm_id: "janna",
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: "act-8",
    type: "integration_sync",
    description: "Synced 12 contacts from HubSpot",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

// GET /api/activities - List activities
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const armId = searchParams.get("arm_id");
  const projectId = searchParams.get("project_id");
  const limit = searchParams.get("limit");

  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    // Demo-mode fallback: return sample activities
    let activities = [...sampleActivities];
    if (armId) activities = activities.filter((a) => a.arm_id === armId);
    if (projectId) activities = activities.filter((a) => a.project_id === projectId);
    if (limit) activities = activities.slice(0, parseInt(limit, 10));
    return NextResponse.json({ success: true, data: activities });
  }

  let query = supabase
    .from("activities")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id);
  
  if (armId) query = query.eq("arm_id", armId);
  if (projectId) query = query.eq("project_id", projectId);
  if (limit) query = query.limit(parseInt(limit, 10));

  const { data, error: dbError } = await query.order("created_at", { ascending: false });
  
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/activities - Create activity
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  try {
    const body = await request.json();
    const demoMode = process.env.DEMO_MODE === "true";

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      // Demo-mode fallback: add to in-memory store
      const newActivity = {
        id: `act-${Date.now()}`,
        type: body.type || "unknown",
        description: body.description || "",
        arm_id: body.arm_id || null,
        project_id: body.project_id || null,
        contact_id: body.contact_id || null,
        metadata: body.metadata || null,
        created_at: new Date().toISOString(),
      };
      sampleActivities.unshift(newActivity);
      return NextResponse.json({ success: true, data: newActivity });
    }

    const insertData = {
      tenant_id: tenantId,
      type: body.type as string,
      description: body.description as string,
      arm_id: (body.arm_id as string) || null,
      project_id: (body.project_id as string) || null,
      contact_id: (body.contact_id as string) || null,
      metadata: (body.metadata as Record<string, unknown>) || null,
      user_id: user.id, // Associate with authenticated user
    };

    const { data, error: insertError } = await supabase
      .from("activities")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error creating activity:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
