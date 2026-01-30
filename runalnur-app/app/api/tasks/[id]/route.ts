import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";
import { getTasks, sampleTasks, getProject } from "@/lib/data/store";
import { getClickUpClientForUser } from "@/lib/clickup/client";
import { CLICKUP_PRIORITY_MAP } from "@/lib/integrations/clickup";
import { awardPoints, type StandingDomain } from "@/lib/gamification/standing";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PRIORITY_LEVEL_FROM_PRIORITY: Record<string, "p1" | "p2" | "p3" | "p4"> = {
  critical: "p1",
  high: "p2",
  medium: "p3",
  low: "p4",
};

interface TaskRecord {
  id: string;
  name: string;
  project_id: string;
  clickup_id?: string | null;
  projects?: { owner_id?: string } | null;
  [key: string]: unknown;
}

// GET /api/tasks/[id] - Get single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;

  if (!supabase) {
    const task = getTasks().find((t) => t.id === id);
    if (!task) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (task.project_id) {
      getProject(String(task.project_id));
    }
    return NextResponse.json({ success: true, data: task });
  }

  const { data, error: dbError } = await supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;
  const body = await request.json();

  if (!supabase) {
    const idx = sampleTasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const existing = sampleTasks[idx] as unknown as TaskRecord;
    const project = getProject(existing.project_id);
    const { id: bodyId, project_id, owner_id, tenant_id, ...safeBody } = body;
    const updated = { ...existing, ...safeBody, updated_at: new Date().toISOString() };
    sampleTasks[idx] = updated;
    await logEvent({
      type: "task_updated",
      description: `Updated task "${updated.name}"`,
      project_id: updated.project_id,
    });
    return NextResponse.json({ success: true, data: updated });
  }

  // Ensure task exists (RLS scopes to the authenticated user within tenant)
  const { data: existingRaw, error: fetchError } = await supabase
    .from("tasks")
    .select("id, name, project_id, clickup_id, status, context")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  const existing = existingRaw as unknown as { id: string; name: string; project_id: string | null; clickup_id?: string | null; status?: string; context?: string | null } | null;

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  // Prevent changing sensitive fields
  const { id: bodyId, project_id, owner_id, tenant_id, ...safeBody } = body;
  
  const updateData = { 
    ...safeBody, 
    updated_at: new Date().toISOString() 
  };

  if ("priority" in safeBody && !("priority_level" in safeBody)) {
    const nextPriority = (safeBody as { priority?: string }).priority;
    if (nextPriority) {
      updateData.priority_level = PRIORITY_LEVEL_FROM_PRIORITY[nextPriority] || "p3";
    }
  }

  const { data, error: updateError } = await supabase
    .from("tasks")
    .update(updateData as never)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    );
  }

  const updatedTask = data as TaskRecord;

  // Award standing points when a task is completed (subtle gamification overlay)
  try {
    const prevStatus = existing.status;
    const nextStatus = (updatedTask as any)?.status as string | undefined;
    if (prevStatus !== "done" && nextStatus === "done") {
      const ctx = String((updatedTask as any)?.context || existing.context || "house");
      const domain: StandingDomain =
        ctx === "janna" || ctx === "maison"
          ? "capital"
          : ctx === "personal" || ctx === "training"
            ? "growth"
            : "command";
      await awardPoints(tenantId, user.id, domain, 10, "task_completed");
    }
  } catch (e) {
    // Non-fatal
    console.warn("Standing award failed:", e);
  }

  // RunAlNur -> ClickUp write-through (optional)
  try {
    const clickupId = updatedTask.clickup_id;
    if (clickupId) {
      const clientResult = await getClickUpClientForUser(tenantId, user.id);
      if (clientResult) {
        const updateFields = updateData as Partial<{
          name: string;
          description: string | null;
          priority: string;
          due_date: string | null;
        }>;
        const dueMs = updateFields.due_date ? new Date(String(updateFields.due_date)).getTime() : undefined;
        await clientResult.client.updateTask(clickupId, {
          name: updateFields.name,
          description: updateFields.description ?? undefined,
          priority: updateFields.priority
            ? CLICKUP_PRIORITY_MAP[updateFields.priority as keyof typeof CLICKUP_PRIORITY_MAP]
            : undefined,
          due_date: Number.isFinite(dueMs as number) ? (dueMs as number) : undefined,
          // Intentionally not syncing status yet (depends on your ClickUp status template)
        });
      }
    }
  } catch (syncErr) {
    console.warn("ClickUp update write-through failed:", syncErr);
  }

  await logEvent({
    type: "task_updated",
    description: `Updated task "${updatedTask.name}"`,
    project_id: updatedTask.project_id,
  });

  return NextResponse.json({ success: true, data });
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;

  if (!supabase) {
    const idx = sampleTasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const existing = sampleTasks[idx] as unknown as TaskRecord;
    const project = getProject(existing.project_id);
    sampleTasks.splice(idx, 1);
    await logEvent({
      type: "task_deleted",
      description: `Deleted task "${existing.name}"`,
      project_id: existing.project_id,
    });
    return NextResponse.json({ success: true });
  }

  const { data: existingRaw, error: fetchError } = await supabase
    .from("tasks")
    .select("id, name, project_id, clickup_id")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  const existing = existingRaw as unknown as { id: string; name: string; project_id: string; clickup_id?: string | null } | null;

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("tasks")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 }
    );
  }

  // RunAlNur -> ClickUp write-through delete (optional)
  try {
    const clickupId = existing.clickup_id;
    if (clickupId) {
      const clientResult = await getClickUpClientForUser(tenantId, user.id);
      if (clientResult) {
        await clientResult.client.deleteTask(clickupId);
      }
    }
  } catch (syncErr) {
    console.warn("ClickUp delete write-through failed:", syncErr);
  }

  await logEvent({
    type: "task_deleted",
    description: `Deleted task "${existing.name}"`,
    project_id: existing.project_id,
  });

  return NextResponse.json({ success: true });
}
