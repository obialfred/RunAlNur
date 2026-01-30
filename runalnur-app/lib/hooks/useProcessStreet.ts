import { useMemo } from "react";
import { useApi } from "@/lib/hooks/useApi";

export function useWorkflows() {
  return useApi<any[]>("/api/process-street/workflows", []);
}

export function useProcessStreetStatus() {
  return useApi<{ connected: boolean }>("/api/process-street/status", { connected: false });
}

export function useWorkflowRuns(workflowId?: string) {
  const url = useMemo(() => {
    return workflowId ? `/api/process-street/runs?workflow_id=${workflowId}` : null;
  }, [workflowId]);
  return useApi<any[]>(url, [], { enabled: Boolean(workflowId) });
}

export function useWorkflowTasks(runId?: string) {
  const url = useMemo(() => {
    return runId ? `/api/process-street/tasks?workflow_run_id=${runId}` : null;
  }, [runId]);
  return useApi<any[]>(url, [], { enabled: Boolean(runId) });
}

export async function updateWorkflowTask(params: {
  task_id: string;
  status?: string;
  assignee_email?: string;
  form_fields?: Record<string, unknown>;
}) {
  const response = await fetch("/api/process-street/tasks", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json?.error || "Failed to update Process Street task");
  }
  return response.json();
}
