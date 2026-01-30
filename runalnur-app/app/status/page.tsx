"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { useClickUpStatus } from "@/lib/hooks/useClickUp";
import { useProcessStreetStatus } from "@/lib/hooks/useProcessStreet";
import { useHubSpotStatus } from "@/lib/hooks/useHubSpot";
import { useSystemStatus } from "@/lib/hooks/useStatus";

export default function StatusPage() {
  const { data: clickup } = useClickUpStatus();
  const { data: processStreet } = useProcessStreetStatus();
  const { data: hubspot } = useHubSpotStatus();
  const { data: system } = useSystemStatus();

  const items = [
    { name: "Supabase", status: system.supabase.configured ? "connected" : "pending" },
    { name: "ClickUp", status: clickup.connected ? "connected" : "pending" },
    { name: "Process Street", status: processStreet.connected ? "connected" : "pending" },
    { name: "HubSpot", status: hubspot.connected ? "connected" : "pending" },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">System Status</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live integration health and connectivity
        </p>
      </FadeIn>

      <FadeIn className="agentic-card">
        <table className="agentic-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name}>
                <td className="font-medium">{item.name}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${item.status === "connected" ? "live" : ""}`} />
                    <span className="text-sm">
                      {item.status === "connected" ? "Connected" : "Pending"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FadeIn>
    </div>
  );
}
