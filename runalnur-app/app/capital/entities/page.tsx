"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, Building2, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion/tokens";

// Mock entities data
const mockEntities: Entity[] = [];

interface Entity {
  id: string;
  name: string;
  entityType: string;
  jurisdiction?: string;
  parentId?: string;
  status: string;
  holdingsCount?: number;
  totalValue?: number;
}

export default function EntitiesPage() {
  const shouldReduce = useReducedMotion();
  const [entities] = useState<Entity[]>(mockEntities);

  // Build entity tree
  const rootEntities = entities.filter((e) => !e.parentId);

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Entity Structure
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Legal entities, trusts, and holding structures
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Entity
        </Button>
      </div>

      {/* Entity Tree */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <div className="agentic-card-header">
          <h2 className="text-section">Ownership Structure</h2>
        </div>
        <div className="agentic-card-content">
          {entities.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No entities yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first entity (LLC, Trust, etc.) to map your structure
              </p>
              <Button size="sm" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Entity
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rootEntities.map((entity) => (
                <EntityNode
                  key={entity.id}
                  entity={entity}
                  allEntities={entities}
                  level={0}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Entity Types Legend */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...spring.default }}
      >
        <div className="agentic-card-header">
          <h2 className="text-section">Entity Types</h2>
        </div>
        <div className="agentic-card-content">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <EntityTypeLegend type="llc" label="LLC" description="Limited Liability Company" />
            <EntityTypeLegend type="corp" label="Corp" description="Corporation" />
            <EntityTypeLegend type="trust" label="Trust" description="Trust" />
            <EntityTypeLegend type="foundation" label="Foundation" description="Private Foundation" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EntityNode({
  entity,
  allEntities,
  level,
}: {
  entity: Entity;
  allEntities: Entity[];
  level: number;
}) {
  const shouldReduce = useReducedMotion();
  const [expanded, setExpanded] = useState(true);
  const children = allEntities.filter((e) => e.parentId === entity.id);
  const hasChildren = children.length > 0;

  const typeColors: Record<string, string> = {
    llc: "bg-blue-500",
    corp: "bg-emerald-500",
    trust: "bg-amber-500",
    foundation: "bg-violet-500",
    individual: "bg-slate-500",
    partnership: "bg-rose-500",
    spv: "bg-cyan-500",
    other: "bg-gray-500",
  };

  return (
    <motion.div
      initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ marginLeft: level * 24 }}
    >
      <div className="flex items-center gap-2 p-2 rounded-sm hover:bg-muted group">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <div className="w-5 h-5" />
        )}

        <div
          className={`w-2 h-2 rounded-full ${typeColors[entity.entityType] || typeColors.other}`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{entity.name}</span>
            <span className="text-xs text-muted-foreground uppercase">
              {entity.entityType}
            </span>
          </div>
          {entity.jurisdiction && (
            <div className="text-xs text-muted-foreground">{entity.jurisdiction}</div>
          )}
        </div>

        {entity.totalValue !== undefined && (
          <div className="text-sm tabular-nums text-muted-foreground">
            ${entity.totalValue.toLocaleString()}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-border ml-2.5">
          {children.map((child) => (
            <EntityNode
              key={child.id}
              entity={child}
              allEntities={allEntities}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EntityTypeLegend({
  type,
  label,
  description,
}: {
  type: string;
  label: string;
  description: string;
}) {
  const typeColors: Record<string, string> = {
    llc: "bg-blue-500",
    corp: "bg-emerald-500",
    trust: "bg-amber-500",
    foundation: "bg-violet-500",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${typeColors[type]}`} />
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
