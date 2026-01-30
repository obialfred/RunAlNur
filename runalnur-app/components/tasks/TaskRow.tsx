"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskPriorityLevel } from "@/lib/types";
import { spring } from "@/lib/motion/tokens";
import { getContextConfig, type FocusContext } from "@/lib/calendar/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Priority level colors and labels
const PRIORITY_CONFIG: Record<TaskPriorityLevel, { color: string; label: string; bgClass: string }> = {
  p1: { color: "#EF4444", label: "P1", bgClass: "bg-red-500/10 text-red-600 dark:text-red-400" },
  p2: { color: "#F59E0B", label: "P2", bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  p3: { color: "#3B82F6", label: "P3", bgClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  p4: { color: "#6B7280", label: "P4", bgClass: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

// Format duration for display
function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Check if task is overdue
function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const [datePart] = String(value).split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function TaskRow({
  task,
  onToggle,
  onCommit,
  onDefer,
  onReschedule,
  showContext = true,
  showPriority = true,
  showDuration = true,
  showActions = false,
  isBacklog = false,
  className,
}: {
  task: Task;
  onToggle: (nextStatus: Task["status"]) => void;
  onCommit?: () => void;
  onDefer?: () => void;
  onReschedule?: (newDate: string, newTime?: string) => void;
  showContext?: boolean;
  showPriority?: boolean;
  showDuration?: boolean;
  showActions?: boolean;
  isBacklog?: boolean;
  className?: string;
}) {
  const isDone = task.status === "done";
  const due = task.due_date ? String(task.due_date).slice(0, 10) : null;
  const doDate = task.do_date ? String(task.do_date).slice(0, 10) : null;
  const showDoDate = doDate && (!due || doDate !== due);
  const cfg = getContextConfig(((task.context || "other") as unknown) as FocusContext);
  const priorityLevel = task.priority_level || "p3";
  const priorityCfg = PRIORITY_CONFIG[priorityLevel];
  const duration = task.duration_minutes;
  const overdue = isOverdue(task.due_date);
  const atRisk = task.scheduling_metadata?.at_risk;
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleValue, setRescheduleValue] = useState("");

  const defaultRescheduleValue = useMemo(() => {
    const base = parseDateOnly(task.do_date) ?? (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    })();
    base.setHours(9, 0, 0, 0);
    return formatLocalDateTime(base);
  }, [task.do_date]);

  useEffect(() => {
    if (rescheduleOpen) {
      setRescheduleValue(defaultRescheduleValue);
    }
  }, [rescheduleOpen, defaultRescheduleValue]);

  return (
    <motion.div
      layout
      transition={spring.snappy}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        "border-b border-border last:border-b-0",
        atRisk && !isDone && "bg-red-500/5",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(isDone ? "todo" : "done")}
        className={cn(
          "flex items-center gap-3 min-h-[44px] flex-1 text-left active:scale-[0.99]",
          "transition-opacity"
        )}
      >
        {/* Checkbox */}
        <span
          className={cn(
            "h-5 w-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
            isDone 
              ? "bg-foreground text-background border-foreground" 
              : priorityLevel === "p1" 
                ? "border-red-500" 
                : "border-border"
          )}
          aria-hidden
        >
          {isDone ? "✓" : ""}
        </span>

        <div className="min-w-0 flex-1">
          {/* Task name */}
          <div className={cn(
            "text-sm font-medium truncate",
            isDone && "line-through opacity-60",
            overdue && !isDone && "text-red-600 dark:text-red-400"
          )}>
            {task.name}
          </div>
          
          {/* Metadata row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Priority badge */}
            {showPriority && (
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                priorityCfg.bgClass
              )}>
                {priorityCfg.label}
              </span>
            )}
            
            {/* Context */}
            {showContext && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.name}
              </span>
            )}
            
            {/* Duration */}
            {showDuration && duration && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDuration(duration)}
              </span>
            )}
            
            {/* Due date */}
            {due && (
              <span className={cn(
                "text-[10px] font-mono",
                overdue && !isDone ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}>
                {overdue && !isDone && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                Due {due}
              </span>
            )}

            {/* Do date (when to work) */}
            {showDoDate && (
              <span className="text-[10px] font-mono text-muted-foreground">
                Do {doDate}
              </span>
            )}
            
            {/* Auto-scheduled indicator */}
            {task.scheduled_block_id && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <Zap className="w-3 h-3" />
                Scheduled
              </span>
            )}

            {task.recurrence_rule && !task.parent_task_id && (
              <span className="text-[10px] text-muted-foreground">
                Recurring
              </span>
            )}
            {task.parent_task_id && (
              <span className="text-[10px] text-muted-foreground">
                Instance
              </span>
            )}
            
            {/* Inbox indicator */}
            {!task.project_id && !task.committed_date && (
              <span className="text-[10px] text-muted-foreground">
                Inbox
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Action buttons */}
      {showActions && !isDone && (
        <div className="flex items-center gap-1">
          {onCommit && (
            <button
              type="button"
              onClick={onCommit}
              className="min-h-[36px] min-w-[36px] px-2 text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors"
              title="Commit to today"
            >
              Today
            </button>
          )}
          {onDefer && (
            <button
              type="button"
              onClick={onDefer}
              className="min-h-[36px] min-w-[36px] px-2 text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors"
              title="Defer"
            >
              Later
            </button>
          )}
          {onReschedule && (
            <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="min-h-[36px] min-w-[36px] px-2 text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded transition-colors"
                  title="Reschedule"
                >
                  Reschedule
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    New date & time
                  </div>
                  <Input
                    type="datetime-local"
                    value={rescheduleValue}
                    onChange={(e) => setRescheduleValue(e.target.value)}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRescheduleOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const [datePart, timePart] = rescheduleValue.split("T");
                        if (datePart) {
                          onReschedule(datePart, timePart);
                        }
                        setRescheduleOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </motion.div>
  );
}

