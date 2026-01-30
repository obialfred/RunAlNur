import { useMemo } from "react";
import { useApi } from "@/lib/hooks/useApi";

export function useHubSpotStatus() {
  return useApi<{ connected: boolean }>("/api/hubspot/status", { connected: false });
}

export function useHubSpotContacts(armId?: string) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (armId) params.set("arm_id", armId);
    const query = params.toString();
    return `/api/hubspot/contacts${query ? `?${query}` : ""}`;
  }, [armId]);
  return useApi<any[]>(url, []);
}

export async function syncHubSpotContacts(armId?: string) {
  const params = new URLSearchParams();
  params.set("sync", "1");
  if (armId) params.set("arm_id", armId);

  const response = await fetch(`/api/hubspot/contacts?${params.toString()}`);
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json?.error || "Failed to sync HubSpot contacts");
  }
  return response.json();
}

export async function syncHubSpotDeals(armId?: string) {
  const params = new URLSearchParams();
  params.set("sync", "1");
  if (armId) params.set("arm_id", armId);

  const response = await fetch(`/api/hubspot/deals?${params.toString()}`);
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json?.error || "Failed to sync HubSpot deals");
  }
  return response.json();
}
