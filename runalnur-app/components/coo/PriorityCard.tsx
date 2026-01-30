"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, Pause, Check, Clock, ArrowRight, ChevronDown } from "lucide-react";
import type { COOPriorityItem } from "@/lib/coo/types";
import { useState } from "react";

interface PriorityCardProps {
  priority: COOPriorityItem;
  onStart?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onDefer?: () => void;
  isActive?: boolean;
  className?: string;
}

const statusColors = {
  pending: "border-l-muted-foreground/30",
  in_progress: "border-l-[var(--sapphire)]",
  completed: "border-l-[var(--emerald)]",
  deferred: "border-l-[var(--amber)]",
};

const statusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  deferred: "Deferred",
};

export function PriorityCard({
  priority,
  onStart,
  onPause,
  onComplete,
  onDefer,
  isActive = false,
  className,
}: PriorityCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "agentic-card border-l-4 transition-all",
        statusColors[priority.status],
        isActive && "ring-2 ring-[var(--sapphire)] ring-opacity-50",
        className
      )}
    >
      <div className="agentic-card-content">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Rank badge */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                Priority #{priority.rank}
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                {statusLabels[priority.status]}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-foreground truncate">{priority.title}</h3>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {priority.effort && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {priority.effort}
                </span>
              )}
              {priority.armId && (
                <span className="uppercase">{priority.armId}</span>
              )}
              {priority.source && (
                <span className="capitalize">{priority.source}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {priority.status === "pending" && (
              <Button
                size="sm"
                className="h-8 px-3 text-[10px] font-medium tracking-wider uppercase"
                onClick={onStart}
              >
                <Play className="w-3 h-3 mr-1" />
                Start
              </Button>
            )}

            {priority.status === "in_progress" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-[10px] font-medium tracking-wider uppercase"
                  onClick={onPause}
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-[10px] font-medium tracking-wider uppercase bg-[var(--emerald)] hover:bg-[var(--emerald)]/90"
                  onClick={onComplete}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
              </>
            )}

            {(priority.status === "pending" || priority.status === "in_progress") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-[10px] font-medium tracking-wider uppercase text-muted-foreground"
                onClick={onDefer}
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Reasoning toggle */}
        {priority.reasoning && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform",
                expanded && "rotate-180"
              )}
            />
            Why this is priority #{priority.rank}
          </button>
        )}

        {/* Expanded reasoning */}
        {expanded && priority.reasoning && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {priority.reasoning}
            </p>
            {priority.guruContext && priority.guruContext.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {priority.guruContext.map((ctx, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm"
                  >
                    {ctx}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact priority item for the top bar
 */
interface PriorityBarItemProps {
  priority: COOPriorityItem;
  isActive?: boolean;
  onClick?: () => void;
}

export function PriorityBarItem({ priority, isActive, onClick }: PriorityBarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-sm transition-colors text-left",
        isActive
          ? "bg-foreground text-background"
          : "hover:bg-muted"
      )}
    >
      <span className={cn(
        "w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-medium",
        priority.status === "completed" && "bg-[var(--emerald)] text-white",
        priority.status === "in_progress" && "bg-[var(--sapphire)] text-white",
        priority.status === "pending" && "bg-muted text-muted-foreground",
        priority.status === "deferred" && "bg-[var(--amber)] text-white"
      )}>
        {priority.status === "completed" ? (
          <Check className="w-3 h-3" />
        ) : (
          priority.rank
        )}
      </span>
      <span className={cn(
        "text-xs truncate max-w-[200px]",
        priority.status === "completed" && "line-through opacity-60"
      )}>
        {priority.title}
      </span>
    </button>
  );
}
