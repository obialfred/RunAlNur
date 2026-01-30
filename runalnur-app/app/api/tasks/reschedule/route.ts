import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";

// POST /api/tasks/reschedule - Reschedule a task to a different time/day
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { task_id, new_date, new_time, reason } = body;

    if (!task_id || !new_date) {
      return NextResponse.json(
        { success: false, error: "task_id and new_date are required" },
        { status: 400 }
      );
    }

    // Verify task exists and belongs to user
    const { data: existingRaw, error: fetchError } = await supabase
      .from("tasks")
      .select("id, name, scheduled_block_id, do_date, committed_date, duration_minutes, context")
      .eq("tenant_id", tenantId)
      .eq("owner_id", user.id)
      .eq("id", task_id)
      .single();

    if (fetchError || !existingRaw) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const existing = existingRaw as {
      id: string;
      name: string;
      scheduled_block_id: string | null;
      do_date: string | null;
      committed_date: string | null;
      duration_minutes: number | null;
      context: string;
    };

    // Update the task with new date
    const updateData: Record<string, unknown> = {
      do_date: new_date,
      committed_date: new_date,
      updated_at: new Date().toISOString(),
      scheduling_metadata: {
        last_rescheduled_at: new Date().toISOString(),
        reschedule_reason: reason || undefined,
      },
    };

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updateData as never)
      .eq("tenant_id", tenantId)
      .eq("id", task_id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // If there's an existing focus block, update or delete it
    if (existing.scheduled_block_id) {
      if (new_time) {
        // Calculate new start and end times
        const [hours, minutes] = new_time.split(":").map(Number);
        const startTime = new Date(new_date);
        startTime.setHours(hours, minutes, 0, 0);
        
        const duration = existing.duration_minutes || 30;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // Update the focus block
        await supabase
          .from("focus_blocks")
          .update({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            updated_at: new Date().toISOString(),
          } as never)
          .eq("tenant_id", tenantId)
          .eq("id", existing.scheduled_block_id);
      } else {
        // Delete the old focus block - it will be recreated by auto-scheduler
        await supabase
          .from("focus_blocks")
          .delete()
          .eq("tenant_id", tenantId)
          .eq("id", existing.scheduled_block_id);

        // Clear the scheduled_block_id on the task
        await supabase
          .from("tasks")
          .update({ scheduled_block_id: null } as never)
          .eq("tenant_id", tenantId)
          .eq("id", task_id);
      }
    }

    await logEvent({
      type: "task_rescheduled",
      description: `Rescheduled task "${existing.name}" to ${new_date}${new_time ? ` at ${new_time}` : ""}`,
      metadata: { 
        task_id, 
        new_date, 
        new_time,
        reason,
        previous_date: existing.do_date || existing.committed_date,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: `Task rescheduled to ${new_date}${new_time ? ` at ${new_time}` : ""}`,
    });
  } catch (err) {
    console.error("Error rescheduling task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to reschedule task" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/defer - Defer a task to a later date
export async function PUT(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { task_id, defer_to, reason } = body;

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: "task_id is required" },
        { status: 400 }
      );
    }

    // Calculate defer date
    let deferDate: string;
    const today = new Date();
    
    if (!defer_to || defer_to === "tomorrow") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      deferDate = tomorrow.toISOString().split("T")[0];
    } else if (defer_to === "next_week") {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      deferDate = nextWeek.toISOString().split("T")[0];
    } else if (defer_to === "someday") {
      // Someday = no specific date, move to backlog
      deferDate = "";
    } else {
      deferDate = defer_to;
    }

    // Verify task exists
    const { data: existingRaw, error: fetchError } = await supabase
      .from("tasks")
      .select("id, name, scheduled_block_id, scheduling_metadata")
      .eq("tenant_id", tenantId)
      .eq("owner_id", user.id)
      .eq("id", task_id)
      .single();

    if (fetchError || !existingRaw) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const existing = existingRaw as {
      id: string;
      name: string;
      scheduled_block_id: string | null;
      scheduling_metadata: Record<string, unknown> | null;
    };

    // Track defer count for accountability
    const currentMetadata = existing.scheduling_metadata || {};
    const deferCount = ((currentMetadata.defer_count as number) || 0) + 1;

    // Update the task
    const updateData: Record<string, unknown> = {
      committed_date: deferDate || null,
      do_date: deferDate || null,
      scheduled_block_id: null,
      updated_at: new Date().toISOString(),
      scheduling_metadata: {
        ...currentMetadata,
        defer_count: deferCount,
        last_deferred_at: new Date().toISOString(),
        defer_reason: reason || undefined,
      },
    };

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updateData as never)
      .eq("tenant_id", tenantId)
      .eq("id", task_id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Delete the associated focus block
    if (existing.scheduled_block_id) {
      await supabase
        .from("focus_blocks")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", existing.scheduled_block_id);
    }

    await logEvent({
      type: "task_deferred",
      description: `Deferred task "${existing.name}" to ${deferDate || "someday"} (deferred ${deferCount} time${deferCount > 1 ? "s" : ""})`,
      metadata: { task_id, defer_to: deferDate || "someday", reason, defer_count: deferCount },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: `Task deferred to ${deferDate || "backlog"}`,
      deferCount,
    });
  } catch (err) {
    console.error("Error deferring task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to defer task" },
      { status: 500 }
    );
  }
}
