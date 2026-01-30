"use client";

import { useState, useEffect, useCallback } from "react";
import type { CrossModeAlert } from "@/lib/notifications/cross-mode";
import {
  groupAlertsByMode,
  getUnreadCountByMode,
  getTotalUnreadCount,
  sortAlerts,
} from "@/lib/notifications/cross-mode";
import type { Mode } from "@/lib/mode/context";

interface UseCrossModeAlertsReturn {
  alerts: CrossModeAlert[];
  alertsByMode: ReturnType<typeof groupAlertsByMode>;
  unreadByMode: Record<Mode, number>;
  totalUnread: number;
  loading: boolean;
  error: string | null;
  markAsRead: (alertId: string) => Promise<void>;
  dismiss: (alertId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCrossModeAlerts(): UseCrossModeAlertsReturn {
  const [alerts, setAlerts] = useState<CrossModeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/notifications/cross-mode");
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      
      const data = await response.json();
      setAlerts(sortAlerts(data.alerts || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Use mock data for now if API fails
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/notifications/cross-mode/${alertId}/read`, {
        method: "POST",
      });
      
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  }, []);

  const dismiss = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/notifications/cross-mode/${alertId}/dismiss`, {
        method: "POST",
      });
      
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, dismissed_at: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  }, []);

  return {
    alerts,
    alertsByMode: groupAlertsByMode(alerts),
    unreadByMode: getUnreadCountByMode(alerts),
    totalUnread: getTotalUnreadCount(alerts),
    loading,
    error,
    markAsRead,
    dismiss,
    refresh: fetchAlerts,
  };
}
