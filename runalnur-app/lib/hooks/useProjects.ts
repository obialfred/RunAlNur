import { useMemo } from "react";
import type { Project } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

interface UseProjectsOptions {
  armId?: string;
  status?: string;
  priority?: string;
  enabled?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (options.armId) params.set("arm_id", options.armId);
    if (options.status) params.set("status", options.status);
    if (options.priority) params.set("priority", options.priority);
    const query = params.toString();
    return query ? `/api/projects?${query}` : "/api/projects";
  }, [options.armId, options.status, options.priority]);

  const result = useApi<Project[]>(url, [], { enabled: options.enabled ?? true });
  
  // Ensure data is always an array (API may return { success, data, total })
  const rawData = result.data;
  const projects: Project[] = Array.isArray(rawData) 
    ? rawData 
    : (Array.isArray((rawData as { data?: Project[] })?.data) 
        ? (rawData as { data: Project[] }).data 
        : []);
  
  return {
    ...result,
    data: projects,
  };
}

export function useProject(projectId?: string) {
  const url = projectId ? `/api/projects/${projectId}` : null;
  return useApi<Project | null>(url, null, { enabled: Boolean(projectId) });
}
