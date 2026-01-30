"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type {
  COOBriefing,
  COOCheckin,
  COOFocusSession,
  COOPreferences,
  COOPriorityItem,
} from "@/lib/coo/types";

interface UsePrioritiesResult {
  priorityRecordId: string | null;
  priorities: COOPriorityItem[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  generate: () => Promise<boolean>;
  accept: () => Promise<boolean>;
  updateStatus: (rank: number, status: COOPriorityItem["status"]) => void;
}

/**
 * Hook for fetching and managing today's priorities
 */
export function usePriorities(): UsePrioritiesResult {
  const [priorityRecordId, setPriorityRecordId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<COOPriorityItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coo/priorities");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch priorities");
      }

      setPriorityRecordId(json.data?.id || null);
      setPriorities(json.data?.priorities || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPriorityRecordId(null);
      setPriorities(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coo/priorities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPriorities: 3 }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to generate priorities");
      }

      setPriorityRecordId(json.data?.id || null);
      setPriorities(json.data?.priorities || null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const accept = useCallback(async () => {
    try {
      const response = await fetch("/api/coo/priorities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "Failed to accept priorities");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const persistPriorities = useCallback(async (next: COOPriorityItem[]) => {
    try {
      const response = await fetch("/api/coo/priorities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "modify", priorities: next }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error((json as any)?.error || "Failed to update priorities");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const updateStatus = useCallback(
    (rank: number, status: COOPriorityItem["status"]) => {
      setPriorities((prev) => {
        if (!prev) return prev;
        const next = prev.map((p) => (p.rank === rank ? { ...p, status } : p));
        void persistPriorities(next);
        return next;
      });
    },
    [persistPriorities]
  );

  useEffect(() => {
    void fetchPriorities();
  }, [fetchPriorities]);

  return {
    priorityRecordId,
    priorities,
    loading,
    error,
    refresh: fetchPriorities,
    generate,
    accept,
    updateStatus,
  };
}

interface UseBriefingResult {
  briefing: COOBriefing | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching the morning briefing
 */
export function useBriefing(type: 'morning' | 'evening' = 'morning'): UseBriefingResult {
  const [briefing, setBriefing] = useState<COOBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coo/briefing?type=${type}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch briefing');
      }

      setBriefing(json.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void fetchBriefing();
  }, [fetchBriefing]);

  return { briefing, loading, error, refresh: fetchBriefing };
}

interface UseCheckinResult {
  checkin: COOCheckin | null;
  loading: boolean;
  error: string | null;
  request: () => Promise<boolean>;
}

/**
 * Hook for accountability check-ins
 */
export function useCheckin(): UseCheckinResult {
  const [checkin, setCheckin] = useState<COOCheckin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coo/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to get check-in');
      }

      setCheckin(json.data || null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkin, loading, error, request };
}

interface UsePreferencesResult {
  preferences: COOPreferences | null;
  loading: boolean;
  error: string | null;
  update: (updates: Partial<COOPreferences>) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook for COO preferences
 */
export function usePreferences(): UsePreferencesResult {
  const [preferences, setPreferences] = useState<COOPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coo/preferences");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch preferences');
      }

      setPreferences(json.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (updates: Partial<COOPreferences>) => {
    try {
      const response = await fetch("/api/coo/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to update preferences');
      }

      setPreferences(json.data || null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  useEffect(() => {
    void fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, loading, error, update, refresh: fetchPreferences };
}

function minutesSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.max(0, Math.round(ms / 60000));
}

export interface FocusSummary {
  todayMinutes: number;
  activeSession: COOFocusSession | null;
  activeMinutes: number;
}

export function useFocusSession() {
  const [activeSession, setActiveSession] = useState<COOFocusSession | null>(null);
  const [todaySessions, setTodaySessions] = useState<COOFocusSession[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeRes, todayRes] = await Promise.all([
        fetch("/api/coo/sessions"),
        fetch("/api/coo/sessions?scope=today"),
      ]);

      const activeJson = await activeRes.json().catch(() => ({}));
      const todayJson = await todayRes.json().catch(() => ({}));

      if (!activeRes.ok) throw new Error(activeJson.error || "Failed to fetch active session");
      if (!todayRes.ok) throw new Error(todayJson.error || "Failed to fetch today's sessions");

      setActiveSession((activeJson as any)?.data ?? null);
      setTodaySessions(((todayJson as any)?.data ?? []) as COOFocusSession[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeSession?.id) return;
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, [activeSession?.id]);

  const start = useCallback(
    async (input: { priorityId?: string | null; priorityRank?: number | null; taskId?: string | null; taskTitle: string }) => {
      setError(null);
      const response = await fetch("/api/coo/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((json as any)?.error || "Failed to start focus session");
      }
      await refresh();
      return (json as any).data as COOFocusSession;
    },
    [refresh]
  );

  const pause = useCallback(
    async (sessionId: string, notes?: string) => {
      setError(null);
      const response = await fetch(`/api/coo/sessions/${encodeURIComponent(sessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", notes }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((json as any)?.error || "Failed to pause session");
      }
      await refresh();
      return (json as any).data as COOFocusSession;
    },
    [refresh]
  );

  const end = useCallback(
    async (sessionId: string, outcome: "completed" | "deferred" | "abandoned", notes?: string) => {
      setError(null);
      const response = await fetch(`/api/coo/sessions/${encodeURIComponent(sessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", outcome, notes }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((json as any)?.error || "Failed to end session");
      }
      await refresh();
      return (json as any).data as COOFocusSession;
    },
    [refresh]
  );

  const summary: FocusSummary = useMemo(() => {
    const base = todaySessions.reduce((sum, s) => sum + Number((s as any).total_duration_minutes || 0), 0);
    const activeExtra = activeSession?.started_at
      ? Math.max(0, Math.round((now - new Date(activeSession.started_at).getTime()) / 60000))
      : 0;
    // If active session isn't ended yet, it may not be included in today's totals as minutes; add live minutes.
    return {
      todayMinutes: base + (activeSession ? activeExtra : 0),
      activeSession,
      activeMinutes: activeExtra,
    };
  }, [activeSession, now, todaySessions]);

  return { loading, error, refresh, start, pause, end, ...summary };
}
