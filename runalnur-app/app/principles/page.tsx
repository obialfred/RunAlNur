"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, Search, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// Mock principles data
const mockPrinciples: Principle[] = [];

interface Principle {
  id: string;
  category: "investment" | "operational" | "cultural" | "governance" | "personal" | "other";
  title: string;
  statement: string;
  rationale?: string;
  examples?: string;
  exceptions?: string;
}

export default function PrinciplesPage() {
  const shouldReduce = useReducedMotion();
  const [principles] = useState<Principle[]>(mockPrinciples);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredPrinciples = principles.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.statement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedPrinciples = filteredPrinciples.reduce((acc, principle) => {
    if (!acc[principle.category]) {
      acc[principle.category] = [];
    }
    acc[principle.category].push(principle);
    return acc;
  }, {} as Record<string, Principle[]>);

  const categoryLabels: Record<string, string> = {
    investment: "Investment Principles",
    operational: "Operational Principles",
    cultural: "Cultural Principles",
    governance: "Governance Principles",
    personal: "Personal Principles",
    other: "Other",
  };

  const categoryColors: Record<string, string> = {
    investment: "bg-emerald-500",
    operational: "bg-blue-500",
    cultural: "bg-amber-500",
    governance: "bg-violet-500",
    personal: "bg-rose-500",
    other: "bg-slate-500",
  };

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
            Principles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Core principles that guide House Al Nur decisions
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Principle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search principles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Principles */}
      {principles.length === 0 ? (
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-content text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No principles defined yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Document the principles that guide your decisions
            </p>
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Add Principle
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: stagger.normal },
            },
          }}
        >
          {Object.entries(groupedPrinciples).map(([category, categoryPrinciples]) => (
            <motion.div
              key={category}
              className="agentic-card"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="agentic-card-header flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", categoryColors[category])} />
                <h2 className="text-section">{categoryLabels[category]}</h2>
                <span className="text-xs text-muted-foreground">
                  ({categoryPrinciples.length})
                </span>
              </div>
              <div className="divide-y divide-border">
                {categoryPrinciples.map((principle) => (
                  <PrincipleItem
                    key={principle.id}
                    principle={principle}
                    expanded={expandedId === principle.id}
                    onToggle={() =>
                      setExpandedId(expandedId === principle.id ? null : principle.id)
                    }
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function PrincipleItem({
  principle,
  expanded,
  onToggle,
}: {
  principle: Principle;
  expanded: boolean;
  onToggle: () => void;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-left"
      >
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={spring.snappy}
          className="mt-1"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-medium">{principle.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{principle.statement}</p>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={spring.default}
        className="overflow-hidden"
      >
        <div className="pt-4 pl-7 space-y-4">
          {principle.rationale && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Rationale
              </h4>
              <p className="text-sm">{principle.rationale}</p>
            </div>
          )}
          {principle.examples && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Examples
              </h4>
              <p className="text-sm">{principle.examples}</p>
            </div>
          )}
          {principle.exceptions && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Exceptions
              </h4>
              <p className="text-sm">{principle.exceptions}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
