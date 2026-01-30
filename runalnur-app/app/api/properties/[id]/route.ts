import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(_);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("properties")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 400 });
  }

  const body = await request.json();
  const { tenant_id, owner_id, id: bodyId, ...safeBody } = body || {};
  const updateData = { ...safeBody, updated_at: new Date().toISOString() };
  const { data, error: dbError } = await supabase
    .from("properties")
    .update(updateData as never)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(_);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
