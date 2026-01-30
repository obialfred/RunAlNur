import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import type { Task } from "@/lib/types";
import { expandRecurringDates } from "@/lib/recurrence/expand";

// POST /api/tasks/recurring/expand - generate instances for recurring tasks
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
    const { from, to, task_id } = body || {};

    const start = from ? new Date(from) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = to ? new Date(to) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);

    let parentQuery = supabase
      .from("tasks")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("owner_id", user.id)
      .is("parent_task_id", null)
      .not("recurrence_rule", "is", null);

    if (task_id) {
      parentQuery = parentQuery.eq("id", task_id);
    }

    const { data: parentsRaw, error: parentError } = await parentQuery;

    if (parentError) {
      return NextResponse.json({ success: false, error: parentError.message }, { status: 500 });
    }

    const parents = (parentsRaw as Task[]) || [];
    if (parents.length === 0) {
      return NextResponse.json({ success: true, data: { created: 0, skipped: 0 } });
    }

    const parentIds = parents.map((p) => p.id);
    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];

    const { data: existingRaw, error: existingError } = await supabase
      .from("tasks")
      .select("parent_task_id, do_date")
      .eq("tenant_id", tenantId)
      .eq("owner_id", user.id)
      .in("parent_task_id", parentIds)
      .gte("do_date", startDate)
      .lte("do_date", endDate);

    if (existingError) {
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
    }

    const existingSet = new Set(
      (existingRaw || []).map((row: { parent_task_id: string; do_date: string | null }) =>
        `${row.parent_task_id}:${row.do_date}`
      )
    );

    const inserts: Record<string, unknown>[] = [];
    let skipped = 0;
    let pausedSeries = 0;

    for (const parent of parents) {
      if ((parent as any).scheduling_metadata?.recurrence_paused) {
        pausedSeries += 1;
        continue;
      }
      const dates = expandRecurringDates(parent, start, end);
      for (const date of dates) {
        const doDate = date.toISOString().split("T")[0];
        const key = `${parent.id}:${doDate}`;
        if (existingSet.has(key)) {
          skipped += 1;
          continue;
        }

        inserts.push({
          tenant_id: tenantId,
          owner_id: user.id,
          project_id: parent.project_id || null,
          name: parent.name,
          description: parent.description || null,
          status: "todo",
          priority: parent.priority || "medium",
          priority_level: parent.priority_level || "p3",
          due_date: doDate,
          do_date: doDate,
          committed_date: null,
          duration_minutes: parent.duration_minutes ?? 30,
          auto_schedule: parent.auto_schedule ?? true,
          recurrence_rule: null,
          parent_task_id: parent.id,
          context: parent.context || "house",
          scheduling_metadata: {
            recurrence_parent_id: parent.id,
            recurrence_generated_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (inserts.length === 0) {
      return NextResponse.json({
        success: true,
        data: { created: 0, skipped, pausedSeries },
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("tasks")
      .insert(inserts as never)
      .select("id");

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { created: inserted?.length || 0, skipped, pausedSeries },
    });
  } catch (err) {
    console.error("Error expanding recurring tasks:", err);
    return NextResponse.json(
      { success: false, error: "Failed to expand recurring tasks" },
      { status: 500 }
    );
  }
}
