"use client";

interface ChecklistViewProps {
  steps: Array<{ id: string; name: string; status?: string }>;
  onToggle?: (stepId: string, status?: string) => void;
}

export function ChecklistView({ steps, onToggle }: ChecklistViewProps) {
  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center justify-between gap-2 text-sm border border-border rounded-sm px-2 py-1">
          <div className="flex items-center gap-2">
            <span
              className={
                step.status === "Completed"
                  ? "status-dot live"
                  : step.status === "InProgress"
                    ? "status-dot warning"
                    : "status-dot"
              }
            />
            <span>{step.name}</span>
          </div>
          {onToggle && step.status !== "Completed" && (
            <button
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onToggle(step.id, "Completed")}
            >
              Mark done
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
