"use client";

import { useState } from "react";
import { useProperties } from "@/lib/hooks/useProperties";
import { PropertyCard } from "@/components/janna/PropertyCard";
import { PropertyModal } from "@/components/janna/PropertyModal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/rive/EmptyState";
import { Plus } from "lucide-react";
import { ARMS } from "@/lib/constants";
import { FadeIn } from "@/components/motion/FadeIn";
import { Stagger } from "@/components/motion/Stagger";
import { SlideIn } from "@/components/motion/SlideIn";

export default function JannaPropertiesPage() {
  const janna = ARMS.find(a => a.slug === "janna");
  const { data: properties, refresh } = useProperties(janna?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<typeof properties[number] | null>(null);

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Janna Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Casablanca and Morocco asset portfolio
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          NEW PROPERTY
        </Button>
      </FadeIn>

      {properties.length === 0 ? (
        <FadeIn className="agentic-card">
          <EmptyState
            title="No properties yet"
            description="Add your first property to begin tracking renovations."
            riveSrc="/rive/empty-properties.riv"
          />
        </FadeIn>
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => (
            <SlideIn
              key={property.id}
              onClick={() => {
                setEditing(property);
                setModalOpen(true);
              }}
            >
              <PropertyCard property={property} />
            </SlideIn>
          ))}
        </Stagger>
      )}

      <PropertyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        property={editing || undefined}
        armId={janna?.id || ""}
        onSaved={refresh}
      />
    </div>
  );
}
