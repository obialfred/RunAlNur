import { useApi } from "@/lib/hooks/useApi";

export function useClickUpStatus() {
  return useApi<{
    connected: boolean;
    source?: "user" | "env" | "none";
    workspaces?: number;
    metadata?: Record<string, unknown> | null;
    scopes?: string[] | null;
    connectedAt?: string | null;
    expiresAt?: string | null;
    error?: string;
  }>("/api/clickup/status", { connected: false });
}
