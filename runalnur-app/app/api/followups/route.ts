import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "open";
  const contactId = searchParams.get("contact_id");
  const overdueOnly = searchParams.get("overdue") === "1";

  const db = supabase as unknown as { from: (t: string) => any };

  let q = db
    .from("influence_followups")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .order("due_at", { ascending: true });

  if (status) q = q.eq("status", status);
  if (contactId) q = q.eq("contact_id", contactId);
  if (overdueOnly) {
    const today = new Date().toISOString().split("T")[0];
    q = q.lte("due_at", today);
  }

  const { data, error: dbError } = await q;
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.contactId || !body.dueAt) {
    return NextResponse.json({ success: false, error: "contactId and dueAt are required" }, { status: 400 });
  }

  const db = supabase as unknown as { from: (t: string) => any };
  const { data, error: dbError } = await db
    .from("influence_followups")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      contact_id: String(body.contactId),
      due_at: String(body.dueAt),
      status: body.status || "open",
      note: body.note || null,
      source: body.source || "manual",
    })
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

