import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

// GET /api/focus-blocks - list focus blocks (default next 14 days)
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data, error: dbError } = await supabase
    .from("focus_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString())
    .order("start_time", { ascending: true });

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/focus-blocks - create focus block
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });

  const body = await request.json();
  const { title, description, context: focusContext, start_time, end_time, notes, recurrence_rule, color } = body || {};

  if (!title || !focusContext || !start_time || !end_time) {
    return NextResponse.json(
      { success: false, error: "title, context, start_time, end_time are required" },
      { status: 400 }
    );
  }

  const insertData = {
    tenant_id: tenantId,
    user_id: user.id,
    title,
    description: description || null,
    context: focusContext,
    start_time,
    end_time,
    notes: notes || null,
    recurrence_rule: recurrence_rule || null,
    color: color || null,
    sync_status: "local_only",
  };

  const { data, error: insertError } = await supabase
    .from("focus_blocks")
    .insert(insertData as never)
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

