import type { COODaySummary, COOFocusSession, COOPreferences, COOPriorityItem, COOCheckin, COOBriefing } from "@/lib/coo/types";
import { DEFAULT_COO_PREFERENCES } from "@/lib/coo/types";
import { sampleTasks } from "@/lib/data/store";

type DemoPrioritiesRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  priorities: COOPriorityItem[];
  generated_at: string;
  accepted_at: string | null;
  modified_at: string | null;
  model_used: "demo";
};

const state: {
  prioritiesByDate: Map<string, DemoPrioritiesRecord>;
  sessions: COOFocusSession[];
  preferences: COOPreferences | null;
} = {
  prioritiesByDate: new Map(),
  sessions: [],
  preferences: null,
};

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function pickDemoPriorities(maxPriorities: number): COOPriorityItem[] {
  const priorityScore: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 } as any;
  const statusScore: Record<string, number> = { in_progress: 2, todo: 1, done: 0 } as any;

  const sorted = [...sampleTasks].sort((a, b) => {
    const ap = priorityScore[a.priority] || 1;
    const bp = priorityScore[b.priority] || 1;
    if (bp !== ap) return bp - ap;
    const as = statusScore[a.status] || 0;
    const bs = statusScore[b.status] || 0;
    return bs - as;
  });

  return sorted.slice(0, maxPriorities).map((t, idx) => ({
    rank: idx + 1,
    taskId: t.id,
    source: "manual",
    title: t.name,
    reasoning: "Demo-mode priority (no external integrations configured).",
    effort: "~60 min",
    status: "pending",
    dueDate: t.due_date,
  }));
}

export function demoGetPriorities(dateStr = today()): DemoPrioritiesRecord | null {
  return state.prioritiesByDate.get(dateStr) || null;
}

export function demoGeneratePriorities(maxPriorities = 3, dateStr = today()): DemoPrioritiesRecord {
  const now = new Date().toISOString();
  const record: DemoPrioritiesRecord = {
    id: crypto.randomUUID(),
    date: dateStr,
    priorities: pickDemoPriorities(maxPriorities),
    generated_at: now,
    accepted_at: null,
    modified_at: null,
    model_used: "demo",
  };
  state.prioritiesByDate.set(dateStr, record);
  return record;
}

export function demoAcceptPriorities(dateStr = today()) {
  const rec = state.prioritiesByDate.get(dateStr);
  if (!rec) return null;
  rec.accepted_at = new Date().toISOString();
  return rec;
}

export function demoModifyPriorities(dateStr: string, priorities: COOPriorityItem[]) {
  const rec = state.prioritiesByDate.get(dateStr);
  if (!rec) return null;
  rec.priorities = priorities;
  rec.modified_at = new Date().toISOString();
  return rec;
}

export function demoGetPreferences(userId = "dev-user"): COOPreferences {
  if (state.preferences) return state.preferences;
  const now = new Date().toISOString();
  state.preferences = {
    id: "default",
    user_id: userId,
    ...DEFAULT_COO_PREFERENCES,
    created_at: now,
    updated_at: now,
  };
  return state.preferences;
}

export function demoUpdatePreferences(userId: string, updates: Partial<COOPreferences>): COOPreferences {
  const prev = demoGetPreferences(userId);
  const next: COOPreferences = {
    ...prev,
    ...updates,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  state.preferences = next;
  return next;
}

export function demoGetActiveSession(userId: string): COOFocusSession | null {
  const active = state.sessions
    .filter((s) => s.user_id === userId && !s.ended_at)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  return active[0] || null;
}

export function demoGetTodaySessions(userId: string, dateStr = today()): COOFocusSession[] {
  return state.sessions.filter(
    (s) => s.user_id === userId && String(s.started_at).startsWith(dateStr)
  );
}

export function demoStartSession(userId: string, input: { priorityId?: string | null; priorityRank?: number | null; taskId?: string | null; taskTitle: string }) {
  const now = new Date().toISOString();
  const existing = demoGetActiveSession(userId);
  if (existing) {
    existing.ended_at = now;
    existing.paused_at = now;
    existing.outcome = "paused";
  }

  const session: COOFocusSession = {
    id: crypto.randomUUID(),
    user_id: userId,
    priority_id: input.priorityId || null,
    priority_rank: input.priorityRank ?? null,
    task_id: input.taskId ?? null,
    task_title: input.taskTitle,
    started_at: now,
    paused_at: null,
    ended_at: null,
    total_duration_minutes: 0,
    outcome: null,
    notes: null,
    created_at: now,
  };
  state.sessions.push(session);
  return session;
}

export function demoPauseOrEndSession(
  userId: string,
  sessionId: string,
  action: "pause" | "end",
  outcome?: "completed" | "deferred" | "abandoned",
  notes?: string | null
) {
  const s = state.sessions.find((x) => x.id === sessionId && x.user_id === userId);
  if (!s) return null;
  if (s.ended_at) return s;

  const now = new Date().toISOString();
  const added = Math.max(0, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000));
  s.total_duration_minutes = Number(s.total_duration_minutes || 0) + added;
  s.notes = notes ?? s.notes;

  if (action === "pause") {
    s.paused_at = now;
    s.ended_at = now;
    s.outcome = "paused";
    return s;
  }

  s.ended_at = now;
  s.outcome = outcome || "completed";
  return s;
}

export function demoGenerateEODSummary(userId: string, dateStr = today()): COODaySummary {
  const rec = demoGetPriorities(dateStr) || demoGeneratePriorities(3, dateStr);
  const sessions = demoGetTodaySessions(userId, dateStr);
  const focusTimeMinutes =
    sessions.reduce((sum, s) => sum + Number(s.total_duration_minutes || 0), 0) +
    (demoGetActiveSession(userId) ? Math.max(0, Math.round((Date.now() - new Date(demoGetActiveSession(userId)!.started_at).getTime()) / 60000)) : 0);
  const completed = rec.priorities.filter((p) => p.status === "completed").length;
  const deferred = rec.priorities.filter((p) => p.status === "deferred").map((p) => p.title);

  return {
    date: dateStr,
    scorecard: {
      prioritiesCompleted: completed,
      prioritiesTotal: rec.priorities.length,
      completionRate: rec.priorities.length ? Math.round((completed / rec.priorities.length) * 100) : 0,
      focusTimeMinutes,
      deferredTasks: deferred,
    },
    assessment: "Demo EOD summary (connect Guru/LLM for full narrative).",
    tomorrowPreview: rec.priorities.map((p) => `Continue: ${p.title}`),
    generatedAt: new Date().toISOString(),
  };
}

export function demoGenerateCheckin(userId: string): COOCheckin {
  const dateStr = today();
  const rec = demoGetPriorities(dateStr) || demoGeneratePriorities(3, dateStr);
  const completedCount = rec.priorities.filter((p) => p.status === "completed").length;
  const currentFocus = demoGetActiveSession(userId)?.task_title || null;
  const focusTimeToday = demoGenerateEODSummary(userId, dateStr).scorecard.focusTimeMinutes;

  return {
    message: "Demo check-in: pick one priority and execute a 45m focus block right now.",
    tone: "direct",
    currentStatus: {
      completedCount,
      prioritiesTotal: rec.priorities.length,
      currentFocus,
      focusTimeToday,
      hoursIntoDay: 0,
      relationshipsNeedingAttention: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function demoMorningBriefing(userId: string): COOBriefing {
  const dateStr = today();
  const rec = demoGetPriorities(dateStr) || demoGeneratePriorities(3, dateStr);
  return {
    date: dateStr,
    greeting: "Good day.",
    priorities: rec.priorities,
    onRadar: {
      tasksDueThisWeek: 0,
      tasksAtRisk: 0,
      relationshipsNeedingAttention: 0,
    },
    recommendation: "Demo briefing: generate priorities, accept plan, start a focus session.",
    generatedAt: new Date().toISOString(),
    modelUsed: "opus",
  };
}

