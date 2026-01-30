"use client";

import type { RenovationPhase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RenovationTracker({ phases }: { phases: RenovationPhase[] }) {
  return (
    <div className="agentic-card">
      <div className="agentic-card-header">
        <h2 className="text-section">Renovation Phases</h2>
      </div>
      <div className="agentic-card-content space-y-4">
        {phases.length === 0 ? (
          <div className="text-sm text-muted-foreground">No phases yet</div>
        ) : (
          phases.map((phase) => (
            <div key={phase.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{phase.name}</div>
                <div className="text-xs text-muted-foreground">
                  {phase.start_date || "—"} → {phase.end_date || "—"}
                </div>
              </div>
              <span
                className={cn(
                  "variant-badge",
                  phase.status === "in_progress" && "deployed",
                  phase.status === "completed" && "!bg-[var(--live)] text-white",
                  phase.status === "pending" && "draft"
                )}
              >
                {phase.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
