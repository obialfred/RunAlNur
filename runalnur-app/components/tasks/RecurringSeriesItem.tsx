"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/useApi";

function formatRule(rule?: string | null): string {
  if (!rule) return "Not set";
  if (rule.includes("FREQ=DAILY")) return "Daily";
  if (rule.includes("FREQ=MONTHLY")) return "Monthly";
  if (rule.includes("FREQ=WEEKLY") && rule.includes("INTERVAL=2")) return "Biweekly";
  if (rule.includes("FREQ=WEEKLY") && rule.includes("BYDAY=MO,TU,WE,TH,FR")) return "Weekdays";
  if (rule.includes("FREQ=WEEKLY")) return "Weekly";
  return rule;
}

export function RecurringSeriesItem({
  task,
  onUpdated,
}: {
  task: Task;
  onUpdated?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = useMemo(() => new Date(), []);
  const from = useMemo(() => today.toISOString().split("T")[0], [today]);
  const to = useMemo(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    return end.toISOString().split("T")[0];
  }, [today]);

  const url = expanded ? `/api/tasks/${task.id}/instances?from=${from}&to=${to}` : null;
  const { data: instances, loading, refresh } = useApi<Task[]>(url, [], { enabled: expanded });

  const paused = Boolean(task.scheduling_metadata?.recurrence_paused);

  const togglePause = async () => {
    const nextMetadata = {
      ...(task.scheduling_metadata || {}),
      recurrence_paused: !paused,
    };
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduling_metadata: nextMetadata }),
    });
    onUpdated?.();
  };

  const generateNow = async () => {
    await fetch(`/api/tasks/recurring/expand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, from, to }),
    });
    await refresh();
    onUpdated?.();
  };

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div>
            <div className="text-sm font-medium">{task.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {formatRule(task.recurrence_rule)}
              {paused && " · Paused"}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={togglePause}>
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button size="sm" variant="outline" onClick={generateNow}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Generate
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-muted/10">
          {loading ? (
            <div className="text-xs text-muted-foreground">Loading instances...</div>
          ) : instances.length === 0 ? (
            <div className="text-xs text-muted-foreground">No instances generated yet.</div>
          ) : (
            <div className="space-y-2">
              {instances.map((instance) => (
                <div
                  key={instance.id}
                  className={cn(
                    "text-xs flex items-center justify-between",
                    instance.status === "done" && "line-through text-muted-foreground"
                  )}
                >
                  <span>{instance.do_date || instance.due_date}</span>
                  <span className="text-[10px] text-muted-foreground">{instance.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
