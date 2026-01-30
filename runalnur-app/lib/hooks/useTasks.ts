import { useMemo } from "react";
import type { Task } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

interface UseTasksOptions {
  projectId?: string;
  status?: string;
}

export function useTasks(options: UseTasksOptions = {}) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (options.projectId) params.set("project_id", options.projectId);
    if (options.status) params.set("status", options.status);
    const query = params.toString();
    return query ? `/api/tasks?${query}` : "/api/tasks";
  }, [options.projectId, options.status]);

  const result = useApi<Task[]>(url, []);
  
  // Ensure data is always an array (API may return { success, data, total })
  const rawData = result.data;
  const tasks: Task[] = Array.isArray(rawData) 
    ? rawData 
    : (Array.isArray((rawData as { data?: Task[] })?.data) 
        ? (rawData as { data: Task[] }).data 
        : []);
  
  return {
    ...result,
    data: tasks,
  };
}
