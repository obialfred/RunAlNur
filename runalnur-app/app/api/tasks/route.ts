import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";
import { getTasks, sampleTasks, getProject } from "@/lib/data/store";
import { getClickUpClientForUser } from "@/lib/clickup/client";
import { CLICKUP_PRIORITY_MAP } from "@/lib/integrations/clickup";

interface TaskRow {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  due_date: string | null;
  clickup_id: string | null;
  context: string;
  focus_block_id?: string | null;
  created_at: string;
  updated_at: string;
  owner_id?: string;
}

const PRIORITY_LEVEL_FROM_PRIORITY: Record<string, "p1" | "p2" | "p3" | "p4"> = {
  critical: "p1",
  high: "p2",
  medium: "p3",
  low: "p4",
};
const PRIORITY_FROM_LEVEL: Record<"p1" | "p2" | "p3" | "p4", "critical" | "high" | "medium" | "low"> = {
  p1: "critical",
  p2: "high",
  p3: "medium",
  p4: "low",
};

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const status = searchParams.get("status");
  const focusBlockId = searchParams.get("focus_block_id");
  const taskContext = searchParams.get("context");

  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    // Demo-mode fallback
    let tasks = getTasks();
    if (projectId) tasks = tasks.filter((t) => t.project_id === projectId);
    if (status) tasks = tasks.filter((t) => t.status === status);
    if (focusBlockId) tasks = tasks.filter((t: any) => (t as any).focus_block_id === focusBlockId);
    if (taskContext) tasks = tasks.filter((t: any) => (t as any).context === taskContext);
    return NextResponse.json({ success: true, data: tasks, total: tasks.length });
  }

  let query = supabase.from("tasks").select("*").eq("tenant_id", tenantId);
  
  // Filter by project if specified
  if (projectId) {
    query = query.eq("project_id", projectId);
  }
  
  if (status) {
    query = query.eq("status", status);
  }

  if (focusBlockId) {
    query = query.eq("focus_block_id", focusBlockId);
  }

  if (taskContext) {
    query = query.eq("context", taskContext);
  }

  const { data, error: dbError } = await query.order("created_at", { ascending: false });
  
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    success: true, 
    data: data || [], 
    total: data?.length || 0 
  });
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  try {
    const body = await request.json();
    const {
      project_id,
      name,
      description,
      status,
      priority,
      priority_level,
      due_date,
      do_date,
      committed_date,
      duration_minutes,
      auto_schedule,
      recurrence_rule,
      assignee,
      context,
    } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "name is required",
          // Dev-only debug to unblock UI audit (helps identify mismatched payload keys)
          debug: process.env.NODE_ENV === "development"
            ? { receivedKeys: Object.keys(body || {}), received: body }
            : undefined,
        },
        { status: 400 }
      );
    }

    const demoMode = process.env.DEMO_MODE === "true";

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      // Demo-mode: project_id is optional (inbox tasks)
      if (project_id) {
        const project = getProject(project_id);
        if (!project) {
          return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }
      }
      const fallbackPriority = priority || "medium";
      const resolvedPriorityLevel =
        (priority_level as "p1" | "p2" | "p3" | "p4") ||
        PRIORITY_LEVEL_FROM_PRIORITY[fallbackPriority] ||
        "p3";
      const resolvedPriority =
        priority || PRIORITY_FROM_LEVEL[resolvedPriorityLevel] || "medium";
      const newTask = {
        id: Date.now().toString(),
        project_id: project_id || null,
        name,
        description: description || null,
        status: status || "todo",
        priority: resolvedPriority,
        priority_level: resolvedPriorityLevel,
        assignee: assignee || null,
        due_date: due_date || null,
        do_date: do_date || null,
        committed_date: committed_date || null,
        duration_minutes: duration_minutes ?? 30,
        auto_schedule: auto_schedule ?? true,
        recurrence_rule: recurrence_rule || null,
        clickup_id: null,
        context: context || "house",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: user.id,
      };
      sampleTasks.push(newTask as unknown as (typeof sampleTasks)[number]);
      await logEvent({
        type: "task_created",
        description: `Created task "${newTask.name}"`,
        project_id: newTask.project_id,
      });
      return NextResponse.json({ success: true, data: newTask });
    }

    // Verify user has access to the project (if project_id provided)
    const projectData: { id: string; owner_id?: string; arm_id?: string | null } | null = project_id
      ? (await supabase
          .from("projects")
          .select("id, owner_id, arm_id")
          .eq("tenant_id", tenantId)
          .eq("id", project_id)
          .single()).data as unknown as { id: string; owner_id?: string; arm_id?: string | null } | null
      : null;

    if (project_id && !projectData) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (projectData?.owner_id && projectData.owner_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "You don't have access to this project" }, { status: 403 });
    }

    const fallbackPriority = priority || "medium";
    const resolvedPriorityLevel =
      (priority_level as "p1" | "p2" | "p3" | "p4") ||
      PRIORITY_LEVEL_FROM_PRIORITY[fallbackPriority] ||
      "p3";
    const resolvedPriority =
      priority || PRIORITY_FROM_LEVEL[resolvedPriorityLevel] || "medium";
    const insertData = {
      tenant_id: tenantId,
      project_id: project_id || null,
      name,
      description: description || null,
      status: status || "todo",
      priority: resolvedPriority,
      priority_level: resolvedPriorityLevel,
      due_date: due_date || null,
      do_date: do_date || null,
      committed_date: committed_date || null,
      duration_minutes: duration_minutes ?? 30,
      auto_schedule: auto_schedule ?? true,
      recurrence_rule: recurrence_rule || null,
      assignee: assignee || null,
      context: context || (projectData?.arm_id ? String(projectData.arm_id) : "house"),
      owner_id: user.id,
    };

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    const row = data as TaskRow;

    // -----------------------------------------------------------------------
    // RunAlNur -> ClickUp write-through (optional)
    // If user mapped this arm to a ClickUp list, create the task in ClickUp
    // and store clickup_id on the task row.
    // -----------------------------------------------------------------------
    try {
      const armId = projectData?.arm_id;
      if (armId) {
        const { data: mapping } = await supabase
          .from("clickup_mappings")
          .select("list_id")
          .eq("tenant_id", tenantId)
          .eq("user_id", user.id)
          .eq("arm_id", armId)
          .maybeSingle();

        const listId = (mapping as unknown as { list_id?: string } | null)?.list_id;
        if (listId) {
          const clientResult = await getClickUpClientForUser(tenantId, user.id);
          if (clientResult) {
            const dueMs =
              due_date ? new Date(String(due_date)).getTime() : undefined;
            const created = await clientResult.client.createTask(listId, {
              name,
              description: description || undefined,
              priority: priority ? CLICKUP_PRIORITY_MAP[priority as keyof typeof CLICKUP_PRIORITY_MAP] : undefined,
              due_date: Number.isFinite(dueMs as number) ? (dueMs as number) : undefined,
            });

            // Store ClickUp ID on our task
            await supabase
              .from("tasks")
              .update({ clickup_id: created.id } as never)
              .eq("tenant_id", tenantId)
              .eq("id", row.id);

            row.clickup_id = created.id;
          }
        }
      }
    } catch (syncErr) {
      // Non-fatal: task creation in RunAlNur must still succeed
      console.warn("ClickUp write-through failed:", syncErr);
    }

    await logEvent({
      type: "task_created",
      description: `Created task "${row.name}"`,
      project_id: row.project_id || undefined,
    });

    return NextResponse.json({ success: true, data: row });
  } catch (err) {
    console.error("Error creating task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
