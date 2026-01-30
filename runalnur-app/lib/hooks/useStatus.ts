import { useApi } from "@/lib/hooks/useApi";

export function useSystemStatus() {
  return useApi<{ supabase: { configured: boolean } }>("/api/status", {
    supabase: { configured: false },
  });
}
