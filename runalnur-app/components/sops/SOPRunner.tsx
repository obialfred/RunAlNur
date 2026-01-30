"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWorkflowTasks, updateWorkflowTask } from "@/lib/hooks/useProcessStreet";
import { ChecklistView } from "@/components/sops/ChecklistView";

interface SOPRunnerProps {
  workflowId: string;
  workflowName: string;
}

export function SOPRunner({ workflowId, workflowName }: SOPRunnerProps) {
  const [runId, setRunId] = useState<string | null>(null);
  const { data: tasks, refresh } = useWorkflowTasks(runId || undefined);

  const startRun = async () => {
    const response = await fetch("/api/process-street/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow_id: workflowId, name: workflowName }),
    });
    const json = await response.json();
    if (json?.data?.id) {
      setRunId(json.data.id);
    }
  };

  const handleToggle = async (taskId: string, status?: string) => {
    await updateWorkflowTask({ task_id: taskId, status });
    await refresh();
  };

  return (
    <div className="space-y-3">
      <Button size="sm" className="text-xs" onClick={startRun}>
        START SOP
      </Button>
      {runId && (
        <div className="text-xs text-muted-foreground">
          Run ID: {runId}
        </div>
      )}
      {tasks.length > 0 && (
        <ChecklistView
          steps={tasks.map((task: any) => ({
            id: task.id,
            name: task.name,
            status: task.status,
          }))}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
