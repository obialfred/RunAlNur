"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plug } from "lucide-react";

export function ClickUpConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the OAuth URL from the server (includes state parameter)
      const response = await fetch("/api/clickup/oauth/start");
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to start OAuth");
        setLoading(false);
        return;
      }

      // Open the authorization URL in a new window/tab
      window.location.href = data.authUrl;
      
      // Note: We don't setLoading(false) here because we're navigating away
    } catch (err) {
      setError("Failed to connect to ClickUp");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="default"
        size="sm"
        className="text-[10px] h-7 px-3 gap-1"
        disabled={loading}
        onClick={handleConnect}
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            CONNECTING...
          </>
        ) : (
          <>
            <Plug className="w-3 h-3" />
            CONNECT
          </>
        )}
      </Button>
      {error && (
        <span className="text-[10px] text-[var(--error)]">{error}</span>
      )}
    </div>
  );
}
