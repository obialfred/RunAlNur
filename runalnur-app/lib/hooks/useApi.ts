import { useCallback, useEffect, useState } from "react";

interface UseApiResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseApiOptions {
  enabled?: boolean;
}

export function useApi<T>(
  url: string | null,
  fallback: T,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(Boolean(options.enabled ?? true));
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || options.enabled === false) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let response = await fetch(url);

      // If our session expired but we still have a refresh token cookie,
      // refresh once and retry. This prevents "sometimes disappears" UI.
      if (response.status === 401) {
        try {
          const refreshRes = await fetch("/api/auth/session");
          if (refreshRes.ok) {
            response = await fetch(url);
          }
        } catch {
          // ignore refresh errors; original 401 handling below will surface
        }
      }

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((json as any)?.error || "Request failed");
      }

      // Normalize common API shapes:
      // - Some endpoints return raw arrays/objects.
      // - Many return { success: true, data: ... }.
      // - Some list endpoints return { success: true, data: [...], total, page, per_page, has_more }.
      //
      // We only unwrap `.data` when the response is a "simple" success wrapper.
      // If meta fields are present, keep the full object so callers can read total/page/etc.
      const isObject = json && typeof json === "object" && !Array.isArray(json);
      const hasSuccess = isObject && "success" in (json as any);
      const hasData = isObject && "data" in (json as any);
      const hasListMeta =
        isObject &&
        ("total" in (json as any) ||
          "page" in (json as any) ||
          "per_page" in (json as any) ||
          "has_more" in (json as any));

      const normalized = hasSuccess && hasData
        ? (hasListMeta ? (json as any) : (json as any).data)
        : ((json as any).data ?? (json as any));

      setData(normalized as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url, options.enabled]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
