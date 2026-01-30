"use client";

import type { Deal } from "@/lib/types";
import { Stagger } from "@/components/motion/Stagger";
import { SlideIn } from "@/components/motion/SlideIn";

const stages = ["lead", "review", "due_diligence", "under_contract", "closed"];

export function DealPipeline({ deals }: { deals: Deal[] }) {
  return (
    <div className="agentic-card">
      <div className="agentic-card-header">
        <h2 className="text-section">Deal Pipeline</h2>
      </div>
      <Stagger className="agentic-card-content grid grid-cols-5 gap-3">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage);
          return (
            <SlideIn key={stage} className="border border-border rounded-sm p-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                {stage.replace("_", " ")}
              </div>
              <div className="space-y-2">
                {stageDeals.length === 0 ? (
                  <div className="text-xs text-muted-foreground">—</div>
                ) : (
                  stageDeals.map((deal) => (
                    <SlideIn key={deal.id} className="text-xs border border-border rounded-sm p-2">
                      <div className="font-medium">{deal.name}</div>
                      <div className="text-muted-foreground mt-1">
                        {deal.amount ? `$${deal.amount.toLocaleString()}` : "—"}
                      </div>
                    </SlideIn>
                  ))
                )}
              </div>
            </SlideIn>
          );
        })}
      </Stagger>
    </div>
  );
}
