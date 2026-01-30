import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyClickUpWebhook, webhookUnauthorizedResponse } from "@/lib/api/webhooks";

export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await request.text();
  
  // Verify webhook signature
  const verification = await verifyClickUpWebhook(request, rawBody);
  
  if (!verification.valid) {
    console.error("ClickUp webhook verification failed:", verification.error);
    return webhookUnauthorizedResponse(verification.error);
  }

  // Parse the verified payload
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  // ClickUp webhook event types include taskCreated, taskUpdated, taskDeleted
  const event = payload?.event;
  const task = payload?.task;

  try {
    if (event === "taskDeleted" && task?.id) {
      await supabase.from("tasks").delete().eq("clickup_id", task.id);
    }

    if ((event === "taskCreated" || event === "taskUpdated") && task) {
      const listId: string | undefined =
        task?.list?.id || task?.list_id || task?.list?.list_id;

      if (!listId) {
        // Can't map to a user/project without a list id
        return NextResponse.json({ success: true, skipped: true, reason: "No list id on task" });
      }

      // Find the user + arm mapping for this list
      const { data: mappings, error: mapError } = await supabase
        .from("clickup_mappings")
        .select("tenant_id, user_id, arm_id, list_id, list_name")
        .eq("list_id", listId);

      if (mapError) {
        console.error("ClickUp webhook mapping lookup failed:", mapError);
        return NextResponse.json({ success: false, error: "Mapping lookup failed" }, { status: 500 });
      }

      // If nobody mapped this list, ignore the webhook safely
      if (!mappings || mappings.length === 0) {
        return NextResponse.json({ success: true, skipped: true, reason: "No mapping for list_id" });
      }

      // Apply to each mapped user (usually one)
      for (const mapping of mappings) {
        const tenantId = (mapping as unknown as { tenant_id?: string }).tenant_id;
        const userId = mapping.user_id;
        const armId = mapping.arm_id;
        if (!tenantId) continue;

        // Ensure there's a project representing this ClickUp list
        const { data: existingProject } = await supabase
          .from("projects")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("owner_id", userId)
          .eq("clickup_id", listId)
          .maybeSingle();

        let projectId = existingProject?.id;
        if (!projectId) {
          const projectName =
            mapping.list_name ||
            task?.list?.name ||
            "ClickUp List";
          const { data: createdProject, error: createProjectError } = await supabase
            .from("projects")
            .insert({
              tenant_id: tenantId,
              owner_id: userId,
              arm_id: armId,
              name: `ClickUp — ${projectName}`,
              description: `Auto-synced from ClickUp list ${listId}`,
              status: "in_progress",
              priority: "medium",
              clickup_id: listId,
              progress: 0,
              tasks_total: 0,
              tasks_completed: 0,
            } as never)
            .select("id")
            .single();
          if (createProjectError) {
            console.error("Failed to create ClickUp project shell:", createProjectError);
            continue;
          }
          projectId = createdProject?.id;
        }

        // Upsert task by (owner_id, clickup_id) manually (no unique constraint on clickup_id)
        const { data: existingTask } = await supabase
          .from("tasks")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("owner_id", userId)
          .eq("clickup_id", task.id)
          .maybeSingle();

        const normalized = {
          tenant_id: tenantId,
          owner_id: userId,
          project_id: projectId,
          clickup_id: task.id,
          name: task.name,
          description: task.description || null,
          status: mapClickUpStatus(task.status?.status),
          priority: mapClickUpPriority(task.priority?.priority),
          due_date: task.due_date ? new Date(parseInt(task.due_date, 10)).toISOString().slice(0, 10) : null,
          updated_at: new Date().toISOString(),
        };

        if (existingTask?.id) {
          await supabase
            .from("tasks")
            .update(normalized as never)
            .eq("tenant_id", tenantId)
            .eq("id", existingTask.id);
        } else {
          // Ensure required fields exist (tasks.name/project_id/owner_id)
          await supabase
            .from("tasks")
            .insert({
              ...normalized,
              created_at: new Date().toISOString(),
            } as never);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ClickUp webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Map ClickUp status to internal status
function mapClickUpStatus(clickUpStatus: string | undefined): string {
  const statusMap: Record<string, string> = {
    "to do": "todo",
    "in progress": "in_progress",
    "review": "review",
    "complete": "done",
    "closed": "done",
  };
  
  return statusMap[clickUpStatus?.toLowerCase() || ""] || "todo";
}

// Map ClickUp priority to internal priority
function mapClickUpPriority(clickUpPriority: string | undefined): string {
  const priorityMap: Record<string, string> = {
    "urgent": "critical",
    "high": "high",
    "normal": "medium",
    "low": "low",
  };
  
  return priorityMap[clickUpPriority?.toLowerCase() || ""] || "medium";
}
