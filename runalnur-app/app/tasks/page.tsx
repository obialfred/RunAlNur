"use client";

import { useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Inbox,
  Calendar,
  CalendarDays,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { Task, TaskPriorityLevel } from "@/lib/types";
import { useTasks } from "@/lib/hooks/useTasks";
import { useFocusBlocks } from "@/lib/hooks/useFocusBlocks";
import { TaskRow } from "@/components/tasks/TaskRow";
import { RecurringSeriesItem } from "@/components/tasks/RecurringSeriesItem";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { ContextChip } from "@/components/ui/ContextChip";
import { Button } from "@/components/ui/button";

// Priority weights for sorting
const PRIORITY_WEIGHTS: Record<TaskPriorityLevel, number> = {
  p1: 100,
  p2: 75,
  p3: 50,
  p4: 25,
};

// Views
type TaskView = "today" | "backlog" | "upcoming" | "all" | "recurring";

const VIEWS: { id: TaskView; label: string; icon: React.ReactNode }[] = [
  { id: "today", label: "Today", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "backlog", label: "Backlog", icon: <Inbox className="w-4 h-4" /> },
  { id: "upcoming", label: "Upcoming", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "all", label: "All Tasks", icon: <Filter className="w-4 h-4" /> },
  { id: "recurring", label: "Recurring", icon: <Zap className="w-4 h-4" /> },
];

// Sort tasks by priority, then overdue, then due date
function sortTasks(tasks: Task[], today: string): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority level first
    const aPriority = PRIORITY_WEIGHTS[a.priority_level || "p3"];
    const bPriority = PRIORITY_WEIGHTS[b.priority_level || "p3"];
    if (aPriority !== bPriority) return bPriority - aPriority;

    // Then overdue tasks
    const ad = a.due_date?.slice(0, 10);
    const bd = b.due_date?.slice(0, 10);
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

// Group tasks by date for upcoming view
function groupByDate(tasks: Task[]): Record<string, Task[]> {
  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const date = task.do_date || task.due_date?.slice(0, 10) || "no-date";
    if (!groups[date]) groups[date] = [];
    groups[date].push(task);
  }
  return groups;
}

// Format date for display
function formatDateLabel(dateStr: string): string {
  if (dateStr === "no-date") return "No Due Date";
  
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Calculate total time estimate
function getTotalMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.duration_minutes || 30), 0);
}

// Format time nicely
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as TaskView) || "today";
  
  const [activeView, setActiveView] = useState<TaskView>(initialView);
  const [activeContext, setActiveContext] = useState<string>("all");
  const [showAddTask, setShowAddTask] = useState(false);
  
  const { data: allTasks, loading, refresh } = useTasks();
  const today = new Date().toISOString().split("T")[0];

  // Filter tasks by context
  const filteredTasks = useMemo(() => {
    if (activeContext === "all") return allTasks;
    return allTasks.filter((t) => t.context === activeContext);
  }, [allTasks, activeContext]);

  // Get unique contexts
  const contexts = useMemo(() => {
    const set = new Set<string>();
    set.add("personal");
    set.add("house");
    for (const t of allTasks) set.add(t.context || "house");
    return ["all", ...Array.from(set).filter(Boolean)];
  }, [allTasks]);

  // Categorize tasks
  const { todayTasks, backlogTasks, upcomingTasks, doneTasks } = useMemo(() => {
    const todayList: Task[] = [];
    const backlogList: Task[] = [];
    const upcomingList: Task[] = [];
    const doneList: Task[] = [];

    for (const task of filteredTasks) {
      if (task.status === "done") {
        doneList.push(task);
        continue;
      }

      // Today = committed to today OR due today/overdue
      const isCommittedToday = task.committed_date === today || task.do_date === today;
      const isDueToday = task.due_date && task.due_date.slice(0, 10) <= today;

      if (isCommittedToday || isDueToday) {
        todayList.push(task);
      } else if (task.committed_date || task.do_date || task.due_date) {
        upcomingList.push(task);
      } else {
        backlogList.push(task);
      }
    }

    return {
      todayTasks: sortTasks(todayList, today),
      backlogTasks: sortTasks(backlogList, today),
      upcomingTasks: sortTasks(upcomingList, today),
      doneTasks: sortTasks(doneList, today),
    };
  }, [filteredTasks, today]);

  // At-risk tasks
  const atRiskTasks = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (t.status === "done") return false;
      if (!t.due_date) return false;
      const due = t.due_date.slice(0, 10);
      return due < today || (due === today && t.status === "todo");
    });
  }, [filteredTasks, today]);

  const recurringSeries = useMemo(
    () => filteredTasks.filter((t) => t.recurrence_rule && !t.parent_task_id),
    [filteredTasks]
  );

  // Get current view tasks
  const currentTasks = useMemo(() => {
    switch (activeView) {
      case "today":
        return todayTasks;
      case "backlog":
        return backlogTasks;
      case "upcoming":
        return upcomingTasks;
      case "all":
        return sortTasks(filteredTasks.filter((t) => t.status !== "done"), today);
      case "recurring":
        return recurringSeries;
      default:
        return todayTasks;
    }
  }, [activeView, todayTasks, backlogTasks, upcomingTasks, filteredTasks, recurringSeries, today]);

  // Handlers
  const onToggle = useCallback(async (task: Task, nextStatus: Task["status"]) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await refresh();
  }, [refresh]);

  const onCommitToToday = useCallback(async (task: Task) => {
    await fetch(`/api/tasks/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, date: today, auto_schedule: true }),
    });
    const scheduleResponse = await fetch("/api/tasks/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_ids: [task.id], target_date: today, max_tasks: 1 }),
    });
    let scheduleResult: any = null;
    try {
      scheduleResult = await scheduleResponse.json();
    } catch (err) {
      scheduleResult = null;
    }
    if (!scheduleResponse.ok || !scheduleResult?.success) {
      toast.error(scheduleResult?.error || "Failed to auto-schedule task.");
    } else if (scheduleResult?.data) {
      const { scheduled, unscheduled, atRisk, errors } = scheduleResult.data;
      toast.success(
        `Scheduled ${scheduled} block${scheduled === 1 ? "" : "s"} · ${unscheduled} unscheduled · ${atRisk} at risk`
      );
      if (errors?.length) {
        console.error("Scheduling errors:", errors);
        toast.error(`${errors.length} scheduling error${errors.length === 1 ? "" : "s"} (see console).`);
      }
    }
    await refresh();
  }, [refresh, today]);

  const onDefer = useCallback(async (task: Task) => {
    await fetch(`/api/tasks/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, defer_to: "tomorrow" }),
    });
    await refresh();
  }, [refresh]);

  const onReschedule = useCallback(async (task: Task, newDate: string, newTime?: string) => {
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
  }, [refresh]);

  const onAutoSchedule = useCallback(async () => {
    const scheduleResponse = await fetch("/api/tasks/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_date: today }),
    });
    let scheduleResult: any = null;
    try {
      scheduleResult = await scheduleResponse.json();
    } catch (err) {
      scheduleResult = null;
    }
    if (!scheduleResponse.ok || !scheduleResult?.success) {
      toast.error(scheduleResult?.error || "Failed to auto-schedule tasks.");
    } else if (scheduleResult?.data) {
      const { scheduled, unscheduled, atRisk, errors } = scheduleResult.data;
      toast.success(
        `Scheduled ${scheduled} block${scheduled === 1 ? "" : "s"} · ${unscheduled} unscheduled · ${atRisk} at risk`
      );
      if (errors?.length) {
        console.error("Scheduling errors:", errors);
        toast.error(`${errors.length} scheduling error${errors.length === 1 ? "" : "s"} (see console).`);
      }
    }
    await refresh();
  }, [refresh, today]);

  // Stats
  const totalMinutes = getTotalMinutes(todayTasks.filter((t) => t.status !== "done"));
  const completedToday = todayTasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-muted-foreground">
              {completedToday}/{todayTasks.length} today
            </span>
            {totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(totalMinutes)} remaining
              </span>
            )}
            {atRiskTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {atRiskTasks.length} at risk
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoSchedule}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Auto-Schedule
          </Button>
          <Button size="sm" onClick={() => setShowAddTask(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Quick Add (collapsible) */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="agentic-card p-4"
          >
            <QuickAddTask
              defaultContext={activeContext === "all" ? "house" : activeContext}
              onCreated={() => {
                refresh();
                setShowAddTask(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* View tabs + context filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* View tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeView === view.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view.icon}
              {view.label}
              {view.id === "today" && todayTasks.length > 0 && (
                <span className="text-[10px] font-mono">({todayTasks.length})</span>
              )}
              {view.id === "backlog" && backlogTasks.length > 0 && (
                <span className="text-[10px] font-mono">({backlogTasks.length})</span>
              )}
              {view.id === "recurring" && recurringSeries.length > 0 && (
                <span className="text-[10px] font-mono">({recurringSeries.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Context filters */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
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

      {/* Task list */}
      <div className="agentic-card">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sm font-medium">
              {activeView === "today" && "No tasks for today"}
              {activeView === "backlog" && "Backlog is empty"}
              {activeView === "upcoming" && "No upcoming tasks"}
              {activeView === "all" && "No tasks found"}
              {activeView === "recurring" && "No recurring tasks"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {activeView === "today" && backlogTasks.length > 0
                ? `${backlogTasks.length} tasks in backlog - commit some to today`
                : "Add a task to get started"}
            </div>
            {activeView === "today" && backlogTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView("backlog")}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
              >
                View backlog <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : activeView === "recurring" ? (
          <div className="space-y-3 p-4">
            {currentTasks.map((task) => (
              <RecurringSeriesItem key={task.id} task={task} onUpdated={refresh} />
            ))}
          </div>
        ) : activeView === "upcoming" ? (
          // Grouped by date for upcoming view
          <div className="divide-y divide-border">
            {Object.entries(groupByDate(currentTasks))
              .sort(([a], [b]) => (a === "no-date" ? 1 : b === "no-date" ? -1 : a.localeCompare(b)))
              .map(([date, tasks]) => (
                <div key={date}>
                  <div className="px-4 py-3 bg-muted/30 sticky top-0">
                    <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                      {formatDateLabel(date)}
                    </h3>
                  </div>
                  {tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={(s) => onToggle(task, s)}
                      onCommit={() => onCommitToToday(task)}
                      onReschedule={(date, time) => onReschedule(task, date, time)}
                      showPriority
                      showDuration
                      showActions
                      isBacklog
                    />
                  ))}
                </div>
              ))}
          </div>
        ) : (
          // Regular list for other views
          <div className="divide-y divide-border">
            {currentTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={(s) => onToggle(task, s)}
                onCommit={activeView !== "today" ? () => onCommitToToday(task) : undefined}
                onDefer={activeView === "today" ? () => onDefer(task) : undefined}
                onReschedule={
                  activeView !== "all" ? (date, time) => onReschedule(task, date, time) : undefined
                }
                showPriority
                showDuration
                showActions={activeView !== "all"}
                isBacklog={activeView === "backlog"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently completed (collapsible) */}
      {doneTasks.length > 0 && activeView === "today" && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            {doneTasks.filter((t) => t.updated_at?.startsWith(today)).length} completed today
          </summary>
          <div className="agentic-card mt-3 divide-y divide-border opacity-60">
            {doneTasks
              .filter((t) => t.updated_at?.startsWith(today))
              .slice(0, 5)
              .map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={(s) => onToggle(task, s)}
                  showPriority={false}
                  showDuration={false}
                />
              ))}
          </div>
        </details>
      )}

      {/* Quick actions footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <Link href="/calendar" className="hover:text-foreground inline-flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
          <Link href="/coo" className="hover:text-foreground inline-flex items-center gap-1">
            <Zap className="w-4 h-4" />
            COO Briefing
          </Link>
        </div>
        <div>
          Total: {allTasks.filter((t) => t.status !== "done").length} active tasks
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading tasks...</div>}>
      <TasksPageContent />
    </Suspense>
  );
}
