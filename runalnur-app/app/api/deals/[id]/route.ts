import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
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
  const { data, error: dbError } = await supabase
    .from("deals")
    .update(body as never)
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

  const { error: deleteError } = await supabase.from("deals").delete().eq("tenant_id", tenantId).eq("id", id);
  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
