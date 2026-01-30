import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

type TodayTask = {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  context?: string | null;
  focus_block_id?: string | null;
  created_at: string;
  updated_at: string;
};

type FocusBlockLite = {
  id: string;
  title: string;
  context: string;
  start_time: string;
  end_time: string;
  color: string | null;
  completed: boolean;
};

// GET /api/today - Today cockpit payload (tasks + focus blocks)
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const filterContext = searchParams.get("context"); // optional
  const limit = Math.min(Number(searchParams.get("limit") || 25), 100);

  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Tasks: committed today/overdue + backlog (uncommitted)
  const backlogFilter = "and(committed_date.is.null,do_date.is.null)";
  let tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("owner_id", user.id)
    .neq("status", "done")
    .or(
      `committed_date.lte.${today},do_date.lte.${today},due_date.lte.${today},${backlogFilter}`
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filterContext) {
    tasksQuery = tasksQuery.eq("context", filterContext);
  }

  const { data: tasksRaw, error: tasksErr } = await tasksQuery;
  if (tasksErr) {
    return NextResponse.json({ success: false, error: tasksErr.message }, { status: 500 });
  }

  const tasks = (tasksRaw as unknown as TodayTask[]).map((t) => ({
    ...t,
    // Safety: if DB hasn't been migrated yet, context may be missing/null
    context: (t as any).context ?? "house",
  }));

  // Focus blocks: next 24h (timezone-safe-ish)
  const endWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let blocksQuery = supabase
    .from("focus_blocks")
    .select("id,title,context,start_time,end_time,color,completed")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .gte("end_time", now.toISOString())
    .lte("start_time", endWindow.toISOString())
    .order("start_time", { ascending: true })
    .limit(12);

  if (filterContext) {
    blocksQuery = blocksQuery.eq("context", filterContext);
  }

  const { data: blocksRaw, error: blocksErr } = await blocksQuery;
  if (blocksErr) {
    return NextResponse.json({ success: false, error: blocksErr.message }, { status: 500 });
  }

  const focusBlocks = (blocksRaw as unknown as FocusBlockLite[]) || [];

  return NextResponse.json({
    success: true,
    data: {
      today,
      tasks,
      focusBlocks,
    },
  });
}

