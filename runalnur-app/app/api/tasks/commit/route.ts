import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";

// POST /api/tasks/commit - Commit a task to a specific day (Sunsama-style)
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
    const { task_id, date, auto_schedule } = body;

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: "task_id is required" },
        { status: 400 }
      );
    }

    // Default to today if no date provided
    const commitDate = date || new Date().toISOString().split("T")[0];

    // Verify task exists and belongs to user
    const { data: existingRaw, error: fetchError } = await supabase
      .from("tasks")
      .select("id, name, status, context")
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

    const existing = existingRaw as { id: string; name: string; status: string; context: string };

    // Update the task with committed_date
    const updateData: Record<string, unknown> = {
      committed_date: commitDate,
      do_date: commitDate,
      updated_at: new Date().toISOString(),
    };

    // If auto_schedule is requested, set auto_schedule = true and clear any existing scheduled_block
    if (auto_schedule) {
      updateData.auto_schedule = true;
      // Don't clear scheduled_block_id here - let the scheduler handle it
    }

    const { data, error: updateError } = await supabase
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

    await logEvent({
      type: "task_committed",
      description: `Committed task "${existing.name}" to ${commitDate}`,
      metadata: { task_id, date: commitDate },
    });

    return NextResponse.json({
      success: true,
      data,
      message: `Task committed to ${commitDate}`,
    });
  } catch (err) {
    console.error("Error committing task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to commit task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/commit - Uncommit a task (move back to backlog)
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get("task_id");

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: "task_id is required" },
        { status: 400 }
      );
    }

    // Verify task exists and belongs to user
    const { data: existingRaw, error: fetchError } = await supabase
      .from("tasks")
      .select("id, name, scheduled_block_id")
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

    const existing = existingRaw as { id: string; name: string; scheduled_block_id: string | null };

    // Clear committed_date and scheduled_block_id
    const { data, error: updateError } = await supabase
      .from("tasks")
      .update({
        committed_date: null,
        do_date: null,
        scheduled_block_id: null,
        updated_at: new Date().toISOString(),
      } as never)
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

    // Delete the associated focus block if it exists
    if (existing.scheduled_block_id) {
      await supabase
        .from("focus_blocks")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", existing.scheduled_block_id);
    }

    await logEvent({
      type: "task_uncommitted",
      description: `Moved task "${existing.name}" back to backlog`,
      metadata: { task_id },
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Task moved to backlog",
    });
  } catch (err) {
    console.error("Error uncommitting task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to uncommit task" },
      { status: 500 }
    );
  }
}
