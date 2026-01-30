"use client";

import { useMemo } from "react";
import { useApi } from "@/lib/hooks/useApi";
import type { FocusBlock } from "@/lib/calendar/types";

export function useFocusBlocks(options: { from?: string; to?: string } = {}) {
  const params = new URLSearchParams();
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);

  const url = useMemo(() => {
    const q = params.toString();
    return q ? `/api/focus-blocks?${q}` : "/api/focus-blocks";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.from, options.to]);

  return useApi<FocusBlock[]>(url, []);
}

