import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { demoGetActiveSession, demoGetTodaySessions, demoStartSession } from "@/lib/coo/demo-store";

type FocusSessionRow = {
  id: string;
  user_id: string;
  priority_id: string | null;
  priority_rank: number | null;
  task_id: string | null;
  task_title: string;
  started_at: string;
  paused_at: string | null;
  ended_at: string | null;
  total_duration_minutes: number | null;
  outcome: "completed" | "paused" | "deferred" | "abandoned" | null;
  notes: string | null;
  created_at: string;
};

/**
 * GET /api/coo/sessions
 * Default: returns the most recent active (not ended) session, if any.
 *
 * Query params:
 * - scope=today   -> returns all sessions started today (for focus time totals)
 */
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      if (scope === "today") {
        return NextResponse.json({ success: true, data: demoGetTodaySessions(user.id) });
      }
      return NextResponse.json({ success: true, data: demoGetActiveSession(user.id) });
    }

    if (scope === "today") {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("coo_focus_sessions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .gte("started_at", `${today}T00:00:00`)
        .lt("started_at", `${today}T23:59:59`)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, data: data || [] });
    }

    const { data, error } = await supabase
      .from("coo_focus_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data && data.length > 0 ? data[0] : null,
    });
  } catch (err) {
    console.error("[COO Sessions API] Error fetching active session:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch sessions" }, { status: 500 });
  }
}

/**
 * POST /api/coo/sessions
 * Start a new focus session. If another session is active, it will be ended as outcome=paused.
 *
 * Body:
 * - priorityId?: string
 * - priorityRank?: number
 * - taskId?: string | null
 * - taskTitle: string
 */
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const body = await request.json().catch(() => ({}));
    const taskTitle = String(body?.taskTitle || "").trim();
    const priorityId = body?.priorityId ? String(body.priorityId) : null;
    const priorityRank = body?.priorityRank !== undefined ? Number(body.priorityRank) : null;
    const taskId = body?.taskId !== undefined && body?.taskId !== null ? String(body.taskId) : null;

    if (!taskTitle) {
      return NextResponse.json({ success: false, error: "taskTitle is required" }, { status: 400 });
    }

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      const created = demoStartSession(user.id, {
        priorityId,
        priorityRank,
        taskId,
        taskTitle,
      });
      return NextResponse.json({ success: true, data: created });
    }

    const now = new Date();

    // End any active session first (paused)
    const { data: active } = await supabase
      .from("coo_focus_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1);

    const activeSession =
      active && active.length > 0 ? (active[0] as unknown as FocusSessionRow) : null;
    if (activeSession) {
      const startedAt = new Date(String(activeSession.started_at)).getTime();
      const minutes = Math.max(0, Math.round((now.getTime() - startedAt) / 60000));
      const total = Number(activeSession.total_duration_minutes || 0) + minutes;

      await supabase
        .from("coo_focus_sessions")
        .update({
          paused_at: now.toISOString(),
          ended_at: now.toISOString(),
          total_duration_minutes: total,
          outcome: "paused",
        } as never)
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .eq("id", activeSession.id);

      await supabase.from("coo_accountability_log").insert({
        tenant_id: tenantId,
        user_id: user.id,
        event_type: "focus_paused",
        session_id: activeSession.id,
        priority_id: activeSession.priority_id || null,
        details: { autoPausedBy: "start_new_session" },
      } as never);
    }

    // Create new session
    const { data: created, error: createError } = await supabase
      .from("coo_focus_sessions")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        priority_id: priorityId,
        priority_rank: Number.isFinite(priorityRank as number) ? priorityRank : null,
        task_id: taskId,
        task_title: taskTitle,
        started_at: now.toISOString(),
        total_duration_minutes: 0,
        outcome: null,
      } as never)
      .select("*")
      .single();

    if (createError) throw createError;

    await supabase.from("coo_accountability_log").insert({
      tenant_id: tenantId,
      user_id: user.id,
      event_type: "focus_started",
      session_id: (created as unknown as FocusSessionRow)?.id,
      priority_id: priorityId,
      details: { taskTitle },
    } as never);

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error("[COO Sessions API] Error starting session:", err);
    return NextResponse.json({ success: false, error: "Failed to start session" }, { status: 500 });
  }
}

