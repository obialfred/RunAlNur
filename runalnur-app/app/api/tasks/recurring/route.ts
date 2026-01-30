import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

// GET /api/tasks/recurring - list recurring task series
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error: dbError } = await supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("owner_id", user.id)
    .is("parent_task_id", null)
    .not("recurrence_rule", "is", null)
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
