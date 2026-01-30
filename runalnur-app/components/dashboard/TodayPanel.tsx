"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CalendarDays, AlertTriangle, Inbox, Zap, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { Task, TaskPriorityLevel } from "@/lib/types";
import { useTodayCockpit } from "@/lib/hooks/useTodayCockpit";
import { ContextChip } from "@/components/ui/ContextChip";
import { TaskRow } from "@/components/tasks/TaskRow";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { getContextConfig, type FocusContext } from "@/lib/calendar/types";
import { useApi } from "@/lib/hooks/useApi";
import { getLevelTitle, type StandingPoints } from "@/lib/gamification/standing";

// Priority weights for sorting
const PRIORITY_WEIGHTS: Record<TaskPriorityLevel, number> = {
  p1: 100,
  p2: 75,
  p3: 50,
  p4: 25,
};

// Sort tasks by priority, then overdue, then due date
function sortTasksForToday(tasks: Task[], today: string) {
  const norm = (d?: string) => (d ? String(d).slice(0, 10) : null);
  return [...tasks].sort((a, b) => {
    // Priority level first
    const aPriority = PRIORITY_WEIGHTS[a.priority_level || 'p3'];
    const bPriority = PRIORITY_WEIGHTS[b.priority_level || 'p3'];
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Then overdue tasks
    const ad = norm(a.due_date || undefined);
    const bd = norm(b.due_date || undefined);
    const aOver = ad ? ad < today : false;
    const bOver = bd ? bd < today : false;
    if (aOver !== bOver) return aOver ? -1 : 1;
    
    // Then due today
    const aToday = ad === today;
    const bToday = bd === today;
    if (aToday !== bToday) return aToday ? -1 : 1;
    
    // Then by due date
    if (ad && bd && ad !== bd) return ad.localeCompare(bd);
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    
    return (b.updated_at || "").localeCompare(a.updated_at || "");
  });
}

// Calculate at-risk tasks
function getAtRiskTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    const due = t.due_date.slice(0, 10);
    // Overdue
    if (due < today) return true;
    // Due today but not started
    if (due === today && t.status === 'todo') return true;
    // Has at_risk flag
    if (t.scheduling_metadata?.at_risk) return true;
    return false;
  });
}

// Calculate total time estimate
function getTotalMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.duration_minutes || 30), 0);
}

// Format time nicely
function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function TodayPanel({ className }: { className?: string }) {
  const [activeContext, setActiveContext] = useState<string>("all");
  const [showBacklog, setShowBacklog] = useState(false);
  const { data, loading, refresh } = useTodayCockpit({
    context: activeContext === "all" ? undefined : activeContext,
    limit: 25,
  });
  const { data: standing } = useApi<StandingPoints | null>("/api/standing?domain=command", null);

  const contexts = useMemo(() => {
    const set = new Set<string>();
    set.add("personal");
    set.add("house");
    for (const t of data.tasks) set.add((t.context || "house") as string);
    for (const b of data.focusBlocks) set.add(String(b.context || "other"));
    return ["all", ...Array.from(set).filter(Boolean)];
  }, [data.tasks, data.focusBlocks]);

  // Separate committed tasks from backlog
  const { committedTasks, backlogTasks } = useMemo(() => {
    const today = data.today;
    const committed: Task[] = [];
    const backlog: Task[] = [];
    
    for (const task of data.tasks) {
      // Committed = has committed_date OR has due_date today/overdue
      const isCommitted = 
        task.committed_date === today ||
        task.do_date === today ||
        (task.due_date && task.due_date.slice(0, 10) <= today);
      
      if (isCommitted) {
        committed.push(task);
      } else {
        backlog.push(task);
      }
    }
    
    return {
      committedTasks: sortTasksForToday(committed, today),
      backlogTasks: sortTasksForToday(backlog, today),
    };
  }, [data.tasks, data.today]);

  const sortedTasks = useMemo(
    () => committedTasks.slice(0, 7),
    [committedTasks]
  );

  // At-risk tasks
  const atRiskTasks = useMemo(
    () => getAtRiskTasks(data.tasks, data.today),
    [data.tasks, data.today]
  );

  // Time estimates
  const totalMinutes = useMemo(() => getTotalMinutes(sortedTasks.filter(t => t.status !== 'done')), [sortedTasks]);
  const completedCount = sortedTasks.filter(t => t.status === 'done').length;

  const onToggle = async (task: Task, nextStatus: Task["status"]) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await refresh();
  };

  const onCommitToToday = async (task: Task) => {
    const today = new Date().toISOString().split("T")[0];
    await fetch(`/api/tasks/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, date: today, auto_schedule: true }),
    });
    await fetch("/api/tasks/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_ids: [task.id], target_date: today, max_tasks: 1 }),
    });
    await refresh();
  };

  const onDefer = async (task: Task) => {
    await fetch(`/api/tasks/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, defer_to: "tomorrow" }),
    });
    await refresh();
  };

  const onReschedule = async (task: Task, newDate: string, newTime?: string) => {
    const response = await fetch(`/api/tasks/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, new_date: newDate, new_time: newTime }),
    });
    let result: any = null;
    try {
      result = await response.json();
    } catch (err) {
      result = null;
    }
    if (!response.ok || !result?.success) {
      toast.error(result?.error || "Failed to reschedule task.");
    } else {
      toast.success(result?.message || "Task rescheduled.");
    }
    await refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className={cn("agentic-card overflow-hidden", className)}
    >
      {/* At-risk warning banner */}
      <AnimatePresence>
        {atRiskTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">
                {atRiskTasks.length} task{atRiskTasks.length > 1 ? 's' : ''} at risk of missing deadline
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="agentic-card-header flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-section">Today</h2>
            {/* Progress indicator */}
            {sortedTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {completedCount}/{sortedTasks.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {data.today}
            </span>
            {totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTotalTime(totalMinutes)} remaining
              </span>
            )}
          </div>
          {standing && (
            <div className="text-[10px] text-muted-foreground mt-2">
              Standing:{" "}
              <span className="text-foreground/80">
                {getLevelTitle(standing.level)}
              </span>{" "}
              · <span className="font-mono">{standing.points}</span> pts ·{" "}
              <span className="font-mono">{standing.streak_days}</span>d streak
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 min-h-[44px] px-2 rounded-sm hover:bg-muted/60"
          >
            Tasks <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            href="/calendar"
            className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 min-h-[44px] px-2 -mr-2 rounded-sm hover:bg-muted/60"
          >
            Calendar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Context filters */}
      <div className="px-4 py-4 border-b border-border">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          data-horizontal-scroll="true"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {contexts.map((c) => (
            <ContextChip
              key={c}
              context={c === "all" ? "other" : c}
              label={c === "all" ? "All" : undefined}
              active={activeContext === c}
              onClick={() => setActiveContext(c)}
              isMetaFilter={c === "all"}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Tasks */}
        <div className="border-b lg:border-b-0 lg:border-r border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowBacklog(false)}
                className={cn(
                  "text-xs font-medium tracking-wider uppercase transition-colors",
                  !showBacklog ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Committed
              </button>
              <button
                type="button"
                onClick={() => setShowBacklog(true)}
                className={cn(
                  "text-xs font-medium tracking-wider uppercase transition-colors inline-flex items-center gap-1",
                  showBacklog ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Inbox className="w-3 h-3" />
                Backlog
                {backlogTasks.length > 0 && (
                  <span className="text-[10px] font-mono ml-1">({backlogTasks.length})</span>
                )}
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {showBacklog ? backlogTasks.length : sortedTasks.length}
            </span>
          </div>

          <div className="px-4 pb-4">
            <QuickAddTask
              defaultContext={activeContext === "all" ? "house" : activeContext}
              onCreated={refresh}
            />
          </div>

          {loading ? (
            <div className="px-4 py-6 space-y-3">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-4 w-56 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
          ) : showBacklog ? (
            // Backlog view
            backlogTasks.length === 0 ? (
              <div className="px-4 py-8">
                <div className="text-sm font-medium">Backlog is empty.</div>
                <div className="text-xs text-muted-foreground mt-1">
                  All tasks are committed to today.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {backlogTasks.slice(0, 5).map((t) => (
                  <TaskRow 
                    key={t.id} 
                    task={t} 
                    onToggle={(s) => onToggle(t, s)}
                    onCommit={() => onCommitToToday(t)}
                    onDefer={() => onDefer(t)}
                    onReschedule={(date, time) => onReschedule(t, date, time)}
                    showActions
                    isBacklog
                  />
                ))}
                {backlogTasks.length > 5 && (
                  <Link
                    href="/tasks?view=backlog"
                    className="block px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all {backlogTasks.length} backlog tasks →
                  </Link>
                )}
              </div>
            )
          ) : (
            // Committed tasks view
            sortedTasks.length === 0 ? (
              <div className="px-4 py-8">
                <div className="text-sm font-medium">No tasks committed for today.</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Add a task or commit from backlog to start your day.
                </div>
                {backlogTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBacklog(true)}
                    className="mt-4 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-2 min-h-[44px]"
                  >
                    <Inbox className="w-3 h-3" />
                    View {backlogTasks.length} tasks in backlog
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedTasks.map((t) => (
                  <TaskRow 
                    key={t.id} 
                    task={t} 
                    onToggle={(s) => onToggle(t, s)}
                    showPriority
                    showDuration
                    showActions
                    onDefer={() => onDefer(t)}
                    onReschedule={(date, time) => onReschedule(t, date, time)}
                  />
                ))}
                {committedTasks.length > 7 && (
                  <Link
                    href="/tasks"
                    className="block px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all {committedTasks.length} tasks →
                  </Link>
                )}
              </div>
            )
          )}
        </div>

        {/* Schedule */}
        <div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground inline-flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Next up
            </div>
            <span className="text-[10px] text-muted-foreground">
              {data.focusBlocks.length}
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-6 space-y-3">
              <div className="h-4 w-56 bg-muted rounded" />
              <div className="h-4 w-40 bg-muted rounded" />
            </div>
          ) : data.focusBlocks.length === 0 ? (
            <div className="px-4 py-8">
              <div className="text-sm font-medium">No focus blocks scheduled.</div>
              <div className="text-xs text-muted-foreground mt-1">
                Plan a block to shape your day.
              </div>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-2 mt-4 text-xs text-muted-foreground hover:text-foreground min-h-[44px]"
              >
                Open calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.focusBlocks.map((b) => {
                const cfg = getContextConfig((b.context || "other") as FocusContext);
                const start = new Date(b.start_time);
                const end = new Date(b.end_time);
                const time = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
                return (
                  <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{b.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="font-mono">{time}</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color || cfg.color }} />
                          {cfg.name}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/calendar"
                      className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
                    >
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

