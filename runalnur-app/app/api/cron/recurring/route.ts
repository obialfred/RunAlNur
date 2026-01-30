import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";
import { expandRecurringDates } from "@/lib/recurrence/expand";

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization") || "";
  return authHeader === `Bearer ${secret}`;
}

async function runRecurringCron() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);

  const { data: parentsRaw, error: parentError } = await supabase
    .from("tasks")
    .select("*")
    .is("parent_task_id", null)
    .not("recurrence_rule", "is", null);

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
        tenant_id: (parent as any).tenant_id,
        owner_id: (parent as any).owner_id,
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
    return NextResponse.json({ success: true, data: { created: 0, skipped, pausedSeries } });
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
}

// GET /api/cron/recurring - Vercel Cron Jobs invoke via GET
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return runRecurringCron();
}

// POST /api/cron/recurring - allow manual secure invocation too
export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return runRecurringCron();
}
