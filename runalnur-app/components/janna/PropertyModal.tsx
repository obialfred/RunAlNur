"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Property } from "@/lib/types";

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  armId: string;
  onSaved?: () => void;
}

export function PropertyModal({ open, onOpenChange, property, armId, onSaved }: PropertyModalProps) {
  const [name, setName] = useState(property?.name || "");
  const [address, setAddress] = useState(property?.address || "");
  const [units, setUnits] = useState(property?.units?.toString() || "");
  const [sqft, setSqft] = useState(property?.sqft?.toString() || "");
  const [purchasePrice, setPurchasePrice] = useState(property?.purchase_price?.toString() || "");
  const [renovationBudget, setRenovationBudget] = useState(property?.renovation_budget?.toString() || "");
  const [targetRent, setTargetRent] = useState(property?.target_rent?.toString() || "");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(property?.id);

  useEffect(() => {
    setName(property?.name || "");
    setAddress(property?.address || "");
    setUnits(property?.units?.toString() || "");
    setSqft(property?.sqft?.toString() || "");
    setPurchasePrice(property?.purchase_price?.toString() || "");
    setRenovationBudget(property?.renovation_budget?.toString() || "");
    setTargetRent(property?.target_rent?.toString() || "");
  }, [property, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      arm_id: armId,
      name,
      address: address || null,
      units: units ? parseInt(units, 10) : null,
      sqft: sqft ? parseInt(sqft, 10) : null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      renovation_budget: renovationBudget ? parseFloat(renovationBudget) : null,
      target_rent: targetRent ? parseFloat(targetRent) : null,
    };

    const url = isEdit ? `/api/properties/${property?.id}` : "/api/properties";
    const method = isEdit ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-section">
            {isEdit ? "Edit Property" : "New Property"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Address
            </label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Units
              </label>
              <Input value={units} onChange={(e) => setUnits(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Sqft
              </label>
              <Input value={sqft} onChange={(e) => setSqft(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Purchase Price
              </label>
              <Input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Renovation Budget
              </label>
              <Input value={renovationBudget} onChange={(e) => setRenovationBudget(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Target Rent
              </label>
              <Input value={targetRent} onChange={(e) => setTargetRent(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
