"use client";

import { useEffect, useMemo, useState } from "react";

type SwUpdateState =
  | { status: "unsupported" }
  | { status: "idle" }
  | { status: "update_available"; registration: ServiceWorkerRegistration };

export function useServiceWorkerUpdate() {
  const [state, setState] = useState<SwUpdateState>({ status: "idle" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      setState({ status: "unsupported" });
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        const handleUpdateFound = () => {
          const installing = reg.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (cancelled) return;
            // When a new SW is installed and waiting, prompt user
            if (installing.state === "installed" && reg.waiting) {
              setState({ status: "update_available", registration: reg });
            }
          });
        };

        reg.addEventListener("updatefound", handleUpdateFound);

        // Also detect already-waiting SW (edge cases)
        if (reg.waiting) {
          setState({ status: "update_available", registration: reg });
        }

        return () => {
          reg.removeEventListener("updatefound", handleUpdateFound);
        };
      } catch {
        // ignore
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasUpdate = state.status === "update_available";

  const applyUpdate = async () => {
    if (state.status !== "update_available") return false;
    try {
      // Workbox listens for SKIP_WAITING
      state.registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      // Give it a moment to activate then reload
      setTimeout(() => window.location.reload(), 150);
      return true;
    } catch {
      return false;
    }
  };

  return useMemo(
    () => ({
      hasUpdate,
      applyUpdate,
    }),
    [hasUpdate]
  );
}

