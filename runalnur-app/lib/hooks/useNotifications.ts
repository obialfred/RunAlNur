import { useMemo } from "react";
import { useApi } from "@/lib/hooks/useApi";

export function useNotifications(userId?: string) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (userId) params.set("user_id", userId);
    const query = params.toString();
    return `/api/notifications${query ? `?${query}` : ""}`;
  }, [userId]);

  return useApi<any[]>(url, []);
}

export async function markNotificationRead(id: string) {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json?.error || "Failed to mark notification read");
  }
  return response.json();
}
