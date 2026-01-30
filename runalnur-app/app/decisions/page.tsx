"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, Search, Filter, Scale, ChevronRight, Star, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// Mock decisions data
const mockDecisions: Decision[] = [];

interface Decision {
  id: string;
  title: string;
  decisionType: "investment" | "strategic" | "operational" | "personnel" | "other";
  context: string;
  decisionMade: string;
  reasoning?: string;
  outcomeRating?: number;
  decidedAt: string;
  reviewedAt?: string;
}

export default function DecisionsPage() {
  const shouldReduce = useReducedMotion();
  const [decisions] = useState<Decision[]>(mockDecisions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.decisionMade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || d.decisionType === filterType;
    return matchesSearch && matchesType;
  });

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
            Decision Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record decisions for institutional memory and future learning
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Log Decision
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <TypeFilter value={filterType} onChange={setFilterType} />
      </div>

      {/* Decisions List */}
      {filteredDecisions.length === 0 ? (
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-content text-center py-12">
            <Scale className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No decisions logged yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Record important decisions to build institutional memory
            </p>
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Log Decision
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
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
          {filteredDecisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function TypeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: "all", label: "All" },
    { value: "investment", label: "Investment" },
    { value: "strategic", label: "Strategic" },
    { value: "operational", label: "Operational" },
    { value: "personnel", label: "Personnel" },
  ];

  return (
    <div className="flex border border-border rounded-sm overflow-hidden">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-foreground text-background"
              : "hover:bg-muted"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DecisionCard({ decision }: { decision: Decision }) {
  const shouldReduce = useReducedMotion();

  const typeColors: Record<string, string> = {
    investment: "bg-emerald-500",
    strategic: "bg-blue-500",
    operational: "bg-amber-500",
    personnel: "bg-violet-500",
    other: "bg-slate-500",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      className="agentic-card overflow-hidden cursor-pointer group"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
      whileHover={shouldReduce ? {} : { y: -2 }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Type indicator */}
          <div
            className={cn(
              "w-2 h-2 rounded-full mt-2",
              typeColors[decision.decisionType]
            )}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{decision.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">{decision.decisionType}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(decision.decidedAt)}</span>
                </div>
              </div>

              {decision.outcomeRating && (
                <div className="flex items-center gap-1">
                  <Star
                    className={cn(
                      "w-4 h-4",
                      decision.outcomeRating >= 7
                        ? "text-[var(--live)] fill-[var(--live)]"
                        : decision.outcomeRating >= 4
                        ? "text-[var(--warning)] fill-[var(--warning)]"
                        : "text-[var(--error)] fill-[var(--error)]"
                    )}
                  />
                  <span className="text-sm font-medium">{decision.outcomeRating}</span>
                </div>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {decision.decisionMade}
            </p>

            {decision.reviewedAt && (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                <CheckCircle2 className="w-3 h-3" />
                <span>Reviewed {formatDate(decision.reviewedAt)}</span>
              </div>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
}
