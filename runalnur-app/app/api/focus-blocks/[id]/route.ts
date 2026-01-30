import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/focus-blocks/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });

  const { id } = await params;
  const body = await request.json();

  const { id: bodyId, user_id, tenant_id, ...safeBody } = body || {};

  const { data, error: updateError } = await supabase
    .from("focus_blocks")
    .update({ ...safeBody, updated_at: new Date().toISOString() } as never)
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  const taskId = (data?.metadata as Record<string, unknown> | null)?.task_id;
  let taskSyncError: string | null = null;

  if (taskId && data?.start_time && data?.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    const durationMinutes = Math.max(
      15,
      Math.round((end.getTime() - start.getTime()) / 60000)
    );
    const { error: taskUpdateError } = await supabase
      .from("tasks")
      .update({
        scheduled_block_id: data.id,
        do_date: start.toISOString().split("T")[0],
        duration_minutes: durationMinutes,
      } as never)
      .eq("tenant_id", tenantId)
      .eq("id", taskId as string);

    if (taskUpdateError) {
      console.error("Error syncing task with focus block:", taskUpdateError);
      taskSyncError = taskUpdateError.message;
    }
  }

  return NextResponse.json({ success: true, data, taskSyncError });
}

// DELETE /api/focus-blocks/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });

  const { id } = await params;

  const { data: existing, error: fetchError } = await supabase
    .from("focus_blocks")
    .select("id, metadata")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("focus_blocks")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  const taskId = (existing?.metadata as Record<string, unknown> | null)?.task_id;
  if (taskId) {
    const { error: taskUpdateError } = await supabase
      .from("tasks")
      .update({ scheduled_block_id: null } as never)
      .eq("tenant_id", tenantId)
      .eq("id", taskId as string);

    if (taskUpdateError) {
      console.error("Error clearing task scheduled_block_id:", taskUpdateError);
    }
  }

  return NextResponse.json({ success: true });
}

