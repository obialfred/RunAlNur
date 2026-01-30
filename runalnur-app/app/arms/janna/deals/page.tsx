"use client";

import { useState } from "react";
import { DealPipeline } from "@/components/janna/DealPipeline";
import { useDeals } from "@/lib/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ARMS } from "@/lib/constants";
import { FadeIn } from "@/components/motion/FadeIn";
import { syncHubSpotDeals } from "@/lib/hooks/useHubSpot";

export default function JannaDealsPage() {
  const janna = ARMS.find(a => a.slug === "janna");
  const { data: deals, refresh } = useDeals(janna?.id);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arm_id: janna?.id,
        name: "New Deal",
        stage: "lead",
        score: 0,
        status: "open",
      }),
    });
    setCreating(false);
    refresh();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncHubSpotDeals(janna?.id);
      refresh();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Janna Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acquisition pipeline and deal flow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-7 px-2"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "SYNCING..." : "SYNC HUBSPOT"}
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handleCreate} disabled={creating}>
            <Plus className="w-3.5 h-3.5" />
            NEW DEAL
          </Button>
        </div>
      </FadeIn>

      <FadeIn>
        <DealPipeline deals={deals} />
      </FadeIn>
    </div>
  );
}
