"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, Clock, Flag, Rocket, CheckCircle2, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// Mock milestones data
const mockMilestones: Milestone[] = [];

interface Milestone {
  id: string;
  title: string;
  description?: string;
  milestoneType: "founding" | "acquisition" | "expansion" | "partnership" | "achievement" | "goal" | "other";
  date?: string;
  horizon: "past" | "present" | "10_year" | "50_year" | "100_year";
  status: "completed" | "in_progress" | "planned" | "aspirational";
  relatedArm?: string;
}

export default function TimelinePage() {
  const shouldReduce = useReducedMotion();
  const [milestones] = useState<Milestone[]>(mockMilestones);
  const [activeHorizon, setActiveHorizon] = useState<string>("all");

  const horizons = [
    { id: "all", label: "All" },
    { id: "past", label: "History" },
    { id: "present", label: "Now" },
    { id: "10_year", label: "10 Year" },
    { id: "50_year", label: "50 Year" },
    { id: "100_year", label: "100 Year" },
  ];

  const filteredMilestones =
    activeHorizon === "all"
      ? milestones
      : milestones.filter((m) => m.horizon === activeHorizon);

  // Group by horizon for display
  const groupedMilestones = filteredMilestones.reduce((acc, milestone) => {
    if (!acc[milestone.horizon]) {
      acc[milestone.horizon] = [];
    }
    acc[milestone.horizon].push(milestone);
    return acc;
  }, {} as Record<string, Milestone[]>);

  const horizonLabels: Record<string, string> = {
    past: "History",
    present: "Current",
    "10_year": "10 Year Vision",
    "50_year": "50 Year Vision",
    "100_year": "100 Year Vision",
  };

  const horizonOrder = ["past", "present", "10_year", "50_year", "100_year"];

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
            Dynasty Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Past achievements and multi-generational vision
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Milestone
        </Button>
      </div>

      {/* Horizon Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {horizons.map((horizon) => (
          <button
            key={horizon.id}
            onClick={() => setActiveHorizon(horizon.id)}
            className={cn(
              "px-4 py-2 rounded-sm text-xs font-medium whitespace-nowrap transition-colors",
              activeHorizon === horizon.id
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {horizon.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {milestones.length === 0 ? (
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-content text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No milestones yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Document your journey and vision across time
            </p>
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Add Milestone
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <motion.div
            className="space-y-8"
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
            {horizonOrder.map((horizon) => {
              const horizonMilestones = groupedMilestones[horizon];
              if (!horizonMilestones || horizonMilestones.length === 0) return null;

              return (
                <motion.div
                  key={horizon}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  {/* Horizon Label */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center z-10">
                      <HorizonIcon horizon={horizon} />
                    </div>
                    <h2 className="text-lg font-semibold">{horizonLabels[horizon]}</h2>
                  </div>

                  {/* Milestones in this horizon */}
                  <div className="space-y-4 pl-12">
                    {horizonMilestones.map((milestone) => (
                      <MilestoneCard key={milestone.id} milestone={milestone} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function HorizonIcon({ horizon }: { horizon: string }) {
  const icons: Record<string, typeof Clock> = {
    past: Clock,
    present: Flag,
    "10_year": Target,
    "50_year": Rocket,
    "100_year": Calendar,
  };
  const Icon = icons[horizon] || Clock;
  return <Icon className="w-4 h-4 text-background" />;
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const shouldReduce = useReducedMotion();

  const statusColors: Record<string, string> = {
    completed: "text-[var(--live)]",
    in_progress: "text-[var(--warning)]",
    planned: "text-blue-500",
    aspirational: "text-violet-500",
  };

  const statusLabels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    planned: "Planned",
    aspirational: "Aspirational",
  };

  return (
    <motion.div
      className="agentic-card"
      whileHover={shouldReduce ? {} : { x: 4 }}
      transition={spring.snappy}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("mt-1", statusColors[milestone.status])}>
            {milestone.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Target className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{milestone.title}</h3>
                {milestone.date && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(milestone.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider",
                  statusColors[milestone.status],
                  "bg-current/10"
                )}
              >
                {statusLabels[milestone.status]}
              </span>
            </div>
            {milestone.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {milestone.description}
              </p>
            )}
            {milestone.relatedArm && (
              <div className="mt-2 text-xs text-muted-foreground">
                Related: {milestone.relatedArm}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
