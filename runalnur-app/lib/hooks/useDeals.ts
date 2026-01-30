import { useMemo } from "react";
import type { Deal } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

export function useDeals(armId?: string) {
  const url = useMemo(() => {
    return armId ? `/api/deals?arm_id=${armId}` : "/api/deals";
  }, [armId]);

  return useApi<Deal[]>(url, []);
}
