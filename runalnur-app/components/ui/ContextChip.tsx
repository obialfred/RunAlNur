"use client";

import { cn } from "@/lib/utils";
import { getContextConfig, type FocusContext } from "@/lib/calendar/types";

export function ContextChip({
  context,
  label,
  active,
  onClick,
  className,
  isMetaFilter,
}: {
  context: string;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  /** When true, renders as a meta-filter (like "All") without a context dot */
  isMetaFilter?: boolean;
}) {
  const safe = (context || "other") as FocusContext;
  const cfg = getContextConfig(safe);
  const text = label ?? cfg.name;

  // Meta-filter style (like "All") - no colored dot, neutral colors
  if (isMetaFilter) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
          "min-h-[44px] whitespace-nowrap transition-colors active:scale-95",
          active
            ? "bg-foreground text-background border-foreground"
            : "bg-background hover:bg-muted/40 text-muted-foreground hover:text-foreground border-border",
          className
        )}
      >
        {text}
      </button>
    );
  }

  // Regular context chip with colored dot
  const style = active
    ? { backgroundColor: cfg.color, borderColor: cfg.color, color: "white" }
    : { borderColor: "var(--border)" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
        "min-h-[44px] whitespace-nowrap transition-colors active:scale-95",
        active ? "" : "bg-background hover:bg-muted/40 text-muted-foreground hover:text-foreground",
        className
      )}
      style={style}
    >
      <span
        className={cn("h-2 w-2 rounded-full shrink-0", active ? "bg-white/80" : "")}
        style={active ? undefined : { backgroundColor: cfg.color, opacity: 0.85 }}
      />
      {text}
    </button>
  );
}
