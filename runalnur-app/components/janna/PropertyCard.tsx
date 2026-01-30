"use client";

import type { Property } from "@/lib/types";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="agentic-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm">{property.name}</div>
          <div className="text-xs text-muted-foreground mt-1">{property.address || "—"}</div>
        </div>
        <span className="variant-badge draft">{property.status || "planning"}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-muted-foreground">
        <div>
          <div className="text-[10px] uppercase tracking-wider">Units</div>
          <div className="text-sm text-foreground font-mono">{property.units ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider">Sqft</div>
          <div className="text-sm text-foreground font-mono">{property.sqft ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider">Budget</div>
          <div className="text-sm text-foreground font-mono">
            {property.renovation_budget ? `$${property.renovation_budget.toLocaleString()}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
