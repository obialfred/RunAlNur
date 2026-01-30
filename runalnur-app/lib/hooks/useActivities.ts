import { useMemo } from "react";
import type { Activity } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

interface UseActivitiesOptions {
  armId?: string;
  projectId?: string;
  limit?: number;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const params = new URLSearchParams();
  if (options.armId) params.set("arm_id", options.armId);
  if (options.projectId) params.set("project_id", options.projectId);
  if (options.limit) params.set("limit", options.limit.toString());

  const url = useMemo(() => {
    const query = params.toString();
    return query ? `/api/activities?${query}` : "/api/activities";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.armId, options.projectId, options.limit]);

  return useApi<Activity[]>(url, []);
}
