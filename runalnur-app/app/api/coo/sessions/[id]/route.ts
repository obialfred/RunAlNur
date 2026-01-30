import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { demoPauseOrEndSession } from "@/lib/coo/demo-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

function computeAddedMinutes(startedAtIso: string, nowIso: string) {
  const started = new Date(startedAtIso).getTime();
  const now = new Date(nowIso).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(now)) return 0;
  return Math.max(0, Math.round((now - started) / 60000));
}

/**
 * PATCH /api/coo/sessions/[id]
 * Actions: pause | end
 *
 * Body:
 * - action: 'pause' | 'end'
 * - outcome?: 'completed' | 'deferred' | 'abandoned'
 * - notes?: string
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");
    const notes = body?.notes !== undefined ? String(body.notes) : null;
    const nowIso = new Date().toISOString();

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      if (action === "pause") {
        const updated = demoPauseOrEndSession(user.id, id, "pause", undefined, notes);
        if (!updated) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
      }
      if (action === "end") {
        const rawOutcome = String(body?.outcome || "completed");
        const outcome = (["completed", "deferred", "abandoned"].includes(rawOutcome)
          ? rawOutcome
          : "completed") as "completed" | "deferred" | "abandoned";
        const updated = demoPauseOrEndSession(user.id, id, "end", outcome, notes);
        if (!updated) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
      }
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "pause" or "end".' },
        { status: 400 }
      );
    }

    // Load session (ensure ownership)
    const { data: session, error: fetchError } = await supabase
      .from("coo_focus_sessions")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const sessionRow = session as unknown as FocusSessionRow;

    if (sessionRow.ended_at) {
      return NextResponse.json({ success: false, error: "Session already ended" }, { status: 409 });
    }

    const addedMinutes = computeAddedMinutes(String(sessionRow.started_at), nowIso);
    const total = Number(sessionRow.total_duration_minutes || 0) + addedMinutes;

    if (action === "pause") {
      const { data: updated, error: updateError } = await supabase
        .from("coo_focus_sessions")
        .update({
          paused_at: nowIso,
          ended_at: nowIso,
          total_duration_minutes: total,
          outcome: "paused",
          notes,
        } as never)
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      await supabase.from("coo_accountability_log").insert({
        tenant_id: tenantId,
        user_id: user.id,
        event_type: "focus_paused",
        session_id: id,
        priority_id: sessionRow.priority_id || null,
        details: { total_duration_minutes: total },
      } as never);

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "end") {
      const outcome = String(body?.outcome || "completed");
      const allowed = ["completed", "deferred", "abandoned"];
      if (!allowed.includes(outcome)) {
        return NextResponse.json(
          { success: false, error: "Invalid outcome. Use completed, deferred, or abandoned." },
          { status: 400 }
        );
      }

      const eventType =
        outcome === "completed"
          ? "focus_completed"
          : outcome === "deferred"
            ? "priority_deferred"
            : "focus_paused";

      const { data: updated, error: updateError } = await supabase
        .from("coo_focus_sessions")
        .update({
          ended_at: nowIso,
          total_duration_minutes: total,
          outcome,
          notes,
        } as never)
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      await supabase.from("coo_accountability_log").insert({
        tenant_id: tenantId,
        user_id: user.id,
        event_type: eventType,
        session_id: id,
        priority_id: sessionRow.priority_id || null,
        details: { outcome, total_duration_minutes: total },
      } as never);

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "pause" or "end".' },
      { status: 400 }
    );
  } catch (err) {
    console.error("[COO Sessions API] Error updating session:", err);
    return NextResponse.json({ success: false, error: "Failed to update session" }, { status: 500 });
  }
}

