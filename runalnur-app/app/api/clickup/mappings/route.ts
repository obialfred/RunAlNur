import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId, supabase } = context;

  const { data, error: dbError } = await supabase
    .from("clickup_mappings")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId, supabase } = context;

  const body = await request.json();
  const { arm_id, list_id, list_name } = body;
  if (!arm_id || !list_id) {
    return NextResponse.json(
      { success: false, error: "arm_id and list_id are required" },
      { status: 400 }
    );
  }

  const upsertData = { tenant_id: tenantId, user_id: user.id, arm_id, list_id, list_name: list_name || null };
  const { data, error: dbError } = await supabase
    .from("clickup_mappings")
    .upsert(upsertData as never, { onConflict: "tenant_id,user_id,arm_id" })
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const armId = searchParams.get("arm_id");
  if (!armId) {
    return NextResponse.json({ success: false, error: "arm_id is required" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("clickup_mappings")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("arm_id", armId);

  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
