"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProperty, useRenovationPhases } from "@/lib/hooks/useProperties";
import { RenovationTracker } from "@/components/janna/RenovationTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { data: property } = useProperty(resolvedParams.id);
  const { data: phases, refresh } = useRenovationPhases(resolvedParams.id);
  
  const [newPhaseOpen, setNewPhaseOpen] = useState(false);
  const [phaseName, setPhaseName] = useState("");
  const [phaseStartDate, setPhaseStartDate] = useState("");
  const [phaseEndDate, setPhaseEndDate] = useState("");
  const [phaseBudget, setPhaseBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${resolvedParams.id}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: phaseName,
          start_date: phaseStartDate || null,
          end_date: phaseEndDate || null,
          budget: phaseBudget ? parseFloat(phaseBudget) : null,
          status: "planned",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create phase");
      }

      // Reset form and close dialog
      setPhaseName("");
      setPhaseStartDate("");
      setPhaseEndDate("");
      setPhaseBudget("");
      setNewPhaseOpen(false);
      
      // Refresh phases list
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create phase");
    } finally {
      setSaving(false);
    }
  };

  if (!property) {
    return (
      <div className="agentic-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/arms/janna/properties" className="text-xs text-muted-foreground">
          ← PROPERTIES
        </Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{property.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{property.address || "—"}</p>
          </div>
          <Button 
            size="sm" 
            className="gap-1.5 text-xs"
            onClick={() => setNewPhaseOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            NEW PHASE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="agentic-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Units</div>
          <div className="text-2xl font-semibold font-mono">{property.units ?? "—"}</div>
        </div>
        <div className="agentic-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sqft</div>
          <div className="text-2xl font-semibold font-mono">{property.sqft ?? "—"}</div>
        </div>
        <div className="agentic-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</div>
          <div className="text-2xl font-semibold font-mono">
            {property.renovation_budget ? `$${property.renovation_budget.toLocaleString()}` : "—"}
          </div>
        </div>
      </div>

      <RenovationTracker phases={phases} />

      {/* New Phase Dialog */}
      <Dialog open={newPhaseOpen} onOpenChange={setNewPhaseOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-section">Add Renovation Phase</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePhase} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Phase Name
              </label>
              <Input
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                placeholder="e.g., Demolition, Framing, Electrical..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={phaseStartDate}
                  onChange={(e) => setPhaseStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={phaseEndDate}
                  onChange={(e) => setPhaseEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Budget
              </label>
              <Input
                type="number"
                value={phaseBudget}
                onChange={(e) => setPhaseBudget(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {error && (
              <div className="text-xs text-[var(--error)]">{error}</div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNewPhaseOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Phase"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
