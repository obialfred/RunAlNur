"use client";

import { useMemo } from "react";
import { useApi } from "@/lib/hooks/useApi";
import type { Task } from "@/lib/types";
import type { FocusBlock } from "@/lib/calendar/types";

export type TodayCockpitPayload = {
  today: string;
  tasks: Task[];
  focusBlocks: Pick<
    FocusBlock,
    "id" | "title" | "context" | "start_time" | "end_time" | "color" | "completed"
  >[];
};

export function useTodayCockpit(options: { context?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (options.context) params.set("context", options.context);
  if (options.limit) params.set("limit", String(options.limit));

  const url = useMemo(() => {
    const q = params.toString();
    return q ? `/api/today?${q}` : "/api/today";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.context, options.limit]);

  return useApi<TodayCockpitPayload>(url, {
    today: new Date().toISOString().slice(0, 10),
    tasks: [],
    focusBlocks: [],
  });
}

