"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubSpotSyncProps {
  armId?: string;
  onSynced?: () => void;
}

export function HubSpotSync({ armId, onSynced }: HubSpotSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    
    try {
      // Use the correct endpoint: GET /api/hubspot/contacts?sync=1
      const params = new URLSearchParams({ sync: "1" });
      if (armId) params.set("arm_id", armId);
      
      const response = await fetch(`/api/hubspot/contacts?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }
      
      setResult({
        success: true,
        message: `Synced ${data.synced || 0} contacts`,
      });
      
      onSynced?.();
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
      
      // Clear result after 3 seconds
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-[10px] h-7 px-2 gap-1"
        onClick={handleSync}
        disabled={syncing}
      >
        <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
        {syncing ? "SYNCING..." : "SYNC HUBSPOT"}
      </Button>
      
      {result && (
        <span className={cn(
          "text-[10px] flex items-center gap-1",
          result.success ? "text-[var(--live)]" : "text-[var(--error)]"
        )}>
          {result.success ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {result.message}
        </span>
      )}
    </div>
  );
}
