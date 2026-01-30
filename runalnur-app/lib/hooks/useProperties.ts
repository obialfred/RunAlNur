import { useMemo } from "react";
import type { Property, RenovationPhase } from "@/lib/types";
import { useApi } from "@/lib/hooks/useApi";

export function useProperties(armId?: string) {
  const url = useMemo(() => {
    return armId ? `/api/properties?arm_id=${armId}` : "/api/properties";
  }, [armId]);

  return useApi<Property[]>(url, []);
}

export function useProperty(propertyId?: string) {
  const url = propertyId ? `/api/properties/${propertyId}` : null;
  return useApi<Property | null>(url, null, { enabled: Boolean(propertyId) });
}

export function useRenovationPhases(propertyId?: string) {
  const url = propertyId ? `/api/properties/${propertyId}/phases` : null;
  return useApi<RenovationPhase[]>(url, [], { enabled: Boolean(propertyId) });
}
