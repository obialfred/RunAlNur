import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/[id]/instances - list instances for a recurring task
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const today = new Date();
  const start = from ? new Date(from) : today;
  const end = to ? new Date(to) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const startDate = start.toISOString().split("T")[0];
  const endDate = end.toISOString().split("T")[0];

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("owner_id", user.id)
    .eq("parent_task_id", id)
    .gte("do_date", startDate)
    .lte("do_date", endDate)
    .order("do_date", { ascending: true });

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
