import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";
import { autoSchedule, DEFAULT_SCHEDULER_PREFERENCES } from "@/lib/scheduler";
import type { Task } from "@/lib/types";
import type { FocusBlock } from "@/lib/calendar/types";

interface TaskRow {
  id: string;
  name: string;
  status: string;
  priority_level: string | null;
  due_date: string | null;
  do_date: string | null;
  duration_minutes: number | null;
  committed_date: string | null;
  auto_schedule: boolean;
  scheduled_block_id: string | null;
  context: string;
  [key: string]: unknown;
}

interface FocusBlockRow {
  id: string;
  title: string;
  context: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  [key: string]: unknown;
}

// POST /api/tasks/schedule - Auto-schedule tasks into Focus Blocks
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
    const { target_date, task_ids, max_tasks } = body;

    const targetDate = target_date ? new Date(target_date) : new Date();
    const today = targetDate.toISOString().split("T")[0];

    // Get tasks to schedule
    let tasksQuery = supabase
      .from("tasks")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("owner_id", user.id)
      .neq("status", "done")
      .eq("auto_schedule", true)
      .is("scheduled_block_id", null);

    if (task_ids && task_ids.length > 0) {
      tasksQuery = tasksQuery.in("id", task_ids);
    }

    if (max_tasks) {
      tasksQuery = tasksQuery.limit(max_tasks);
    }

    const { data: tasksRaw, error: tasksErr } = await tasksQuery;
    if (tasksErr) {
      return NextResponse.json(
        { success: false, error: tasksErr.message },
        { status: 500 }
      );
    }

    const tasks = (tasksRaw as unknown as TaskRow[]).map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status as "todo" | "in_progress" | "done",
      priority: "medium" as const,
      priority_level: (t.priority_level || "p3") as "p1" | "p2" | "p3" | "p4",
      due_date: t.due_date || undefined,
      do_date: t.do_date || undefined,
      duration_minutes: t.duration_minutes || 30,
      committed_date: t.committed_date || undefined,
      auto_schedule: t.auto_schedule,
      scheduled_block_id: t.scheduled_block_id,
      context: t.context || "house",
      created_at: "",
      updated_at: "",
    })) as Task[];

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          scheduled: 0,
          unscheduled: 0,
          atRisk: 0,
          message: "No tasks to schedule",
        },
      });
    }

    // Get existing focus blocks for the scheduling horizon
    const horizonEnd = new Date(targetDate);
    horizonEnd.setDate(horizonEnd.getDate() + DEFAULT_SCHEDULER_PREFERENCES.schedulingHorizon);

    const { data: blocksRaw, error: blocksErr } = await supabase
      .from("focus_blocks")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .gte("end_time", targetDate.toISOString())
      .lte("start_time", horizonEnd.toISOString());

    if (blocksErr) {
      return NextResponse.json(
        { success: false, error: blocksErr.message },
        { status: 500 }
      );
    }

    const existingBlocks = (blocksRaw as unknown as FocusBlockRow[]).map((b) => ({
      id: b.id,
      user_id: user.id,
      title: b.title,
      context: b.context as any,
      start_time: b.start_time,
      end_time: b.end_time,
      timezone: "America/Chicago",
      completed: b.completed,
      sync_status: "synced" as const,
      created_at: "",
      updated_at: "",
    })) as FocusBlock[];

    // Run the scheduler
    const result = await autoSchedule({
      tasks,
      existingBlocks,
      preferences: DEFAULT_SCHEDULER_PREFERENCES,
      targetDate,
    });

    // Create focus blocks and update tasks
    const createdBlockIds: string[] = [];
    const taskErrors: Array<{
      task_id: string;
      name: string;
      stage: "create_focus_block" | "update_task" | "mark_at_risk";
      error: string;
    }> = [];

    for (const scheduled of result.scheduledTasks) {
      const block = result.createdBlocks.find(
        (b) => b.metadata?.task_id === scheduled.task.id
      );

      if (block) {
        // Create the focus block
        const { data: newBlock, error: blockErr } = await supabase
          .from("focus_blocks")
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
            title: block.title,
            description: block.description,
            context: block.context,
            start_time: block.start_time,
            end_time: block.end_time,
            timezone: block.timezone || "America/Chicago",
            completed: false,
            sync_status: "pending",
            metadata: block.metadata,
          } as never)
          .select("id")
          .single();

        if (blockErr) {
          console.error("Error creating focus block:", blockErr);
          taskErrors.push({
            task_id: scheduled.task.id,
            name: scheduled.task.name,
            stage: "create_focus_block",
            error: blockErr.message,
          });
          continue;
        }

        if (newBlock) {
          const blockId = (newBlock as { id: string }).id;
          createdBlockIds.push(blockId);

          // Update the task with the scheduled block ID and do_date
          const { error: taskUpdateErr } = await supabase
            .from("tasks")
            .update({
              scheduled_block_id: blockId,
              do_date: scheduled.scheduledStart.toISOString().split("T")[0],
              scheduling_metadata: {
                last_scheduled_at: new Date().toISOString(),
                schedule_attempts: 1,
              },
            } as never)
            .eq("tenant_id", tenantId)
            .eq("id", scheduled.task.id);

          if (taskUpdateErr) {
            console.error("Error updating task after scheduling:", taskUpdateErr);
            taskErrors.push({
              task_id: scheduled.task.id,
              name: scheduled.task.name,
              stage: "update_task",
              error: taskUpdateErr.message,
            });
          }
        }
      }
    }

    // Mark at-risk tasks
    for (const atRisk of result.atRiskTasks) {
      const { error: atRiskErr } = await supabase
        .from("tasks")
        .update({
          scheduling_metadata: {
            at_risk: true,
            at_risk_reason: atRisk.reason,
          },
        } as never)
        .eq("tenant_id", tenantId)
        .eq("id", atRisk.task.id);

      if (atRiskErr) {
        console.error("Error marking task at risk:", atRiskErr);
        taskErrors.push({
          task_id: atRisk.task.id,
          name: atRisk.task.name,
          stage: "mark_at_risk",
          error: atRiskErr.message,
        });
      }
    }

    await logEvent({
      type: "tasks_scheduled",
      description: `Auto-scheduled ${result.summary.totalScheduled} tasks`,
      metadata: {
        scheduled: result.summary.totalScheduled,
        unscheduled: result.summary.totalUnscheduled,
        atRisk: result.summary.totalAtRisk,
        totalMinutes: result.summary.totalMinutesScheduled,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        scheduled: result.summary.totalScheduled,
        unscheduled: result.summary.totalUnscheduled,
        atRisk: result.summary.totalAtRisk,
        totalMinutesScheduled: result.summary.totalMinutesScheduled,
        createdBlockIds,
        errors: taskErrors,
        atRiskTasks: result.atRiskTasks.map((t) => ({
          id: t.task.id,
          name: t.task.name,
          reason: t.reason,
          suggestedAction: t.suggestedAction,
        })),
      },
    });
  } catch (err) {
    console.error("Error scheduling tasks:", err);
    return NextResponse.json(
      { success: false, error: "Failed to schedule tasks" },
      { status: 500 }
    );
  }
}
