"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PriorityBarItem } from "@/components/coo/PriorityCard";
import { useFocusSession, usePriorities } from "@/lib/hooks/useCOO";

function fmtMinutes(m: number) {
  if (!Number.isFinite(m) || m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm}m`;
  return `${h}h ${mm}m`;
}

export function PriorityBar() {
  const { priorityRecordId, priorities, updateStatus } = usePriorities();
  const { activeSession, activeMinutes, start, pause, end, todayMinutes } = useFocusSession();
  const [busy, setBusy] = useState(false);

  // Force a quick re-render tick for smoother timer perception (without hammering API)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!activeSession?.id) return;
    const t = setInterval(() => setTick((x) => x + 1), 5_000);
    return () => clearInterval(t);
  }, [activeSession?.id]);

  const activePriority = useMemo(() => {
    if (!priorities || !activeSession?.priority_rank) return null;
    return priorities.find((p) => p.rank === Number(activeSession.priority_rank)) || null;
  }, [activeSession?.priority_rank, priorities]);

  const top3 = useMemo(() => (priorities || []).slice(0, 3), [priorities]);

  const show = Boolean(activeSession || (priorities && priorities.length > 0));
  if (!show) return null;

  return (
    <div className="border-t border-border bg-background px-4 md:px-6 py-2 flex items-center gap-3">
      <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
        Now
      </div>

      <div className="flex-1 min-w-0">
        {activePriority ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{activePriority.title}</div>
              <div className="text-[10px] text-muted-foreground">
                Focus: {fmtMinutes(activeMinutes)} · Today: {fmtMinutes(todayMinutes)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] uppercase tracking-wider"
                disabled={busy}
                onClick={async () => {
                  if (!activeSession?.id) return;
                  setBusy(true);
                  try {
                    await pause(activeSession.id);
                    updateStatus(activePriority.rank, "pending");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-[10px] uppercase tracking-wider bg-[var(--emerald)] hover:bg-[var(--emerald)]/90"
                disabled={busy}
                onClick={async () => {
                  if (!activeSession?.id) return;
                  setBusy(true);
                  try {
                    await end(activeSession.id, "completed");
                    updateStatus(activePriority.rank, "completed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Check className="w-3 h-3 mr-1" />
                Done
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] uppercase tracking-wider text-muted-foreground"
                disabled={busy}
                onClick={async () => {
                  if (!activeSession?.id) return;
                  setBusy(true);
                  try {
                    await end(activeSession.id, "deferred");
                    updateStatus(activePriority.rank, "deferred");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            {top3.map((p) => (
              <PriorityBarItem
                key={p.rank}
                priority={p}
                isActive={false}
                onClick={async () => {
                  if (!priorityRecordId) return;
                  setBusy(true);
                  try {
                    updateStatus(p.rank, "in_progress");
                    await start({
                      priorityId: priorityRecordId,
                      priorityRank: p.rank,
                      taskId: p.taskId ?? null,
                      taskTitle: p.title,
                    });
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            ))}
            {top3.length === 0 ? (
              <div className="text-xs text-muted-foreground">No priorities yet</div>
            ) : null}
          </div>
        )}
      </div>

      {!activePriority ? (
        <div className={cn("text-[10px] text-muted-foreground", busy && "opacity-60")}>
          <Play className="w-3 h-3 inline-block mr-1" />
          Start
        </div>
      ) : null}
    </div>
  );
}

