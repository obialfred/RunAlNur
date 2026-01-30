"use client";

import { motion, useReducedMotion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { spring, duration } from "@/lib/motion/tokens";
import type { DashboardMetrics } from "@/lib/types";

interface MetricsPanelProps {
  metrics: DashboardMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="agentic-card overflow-hidden">
      <div className="agentic-card-header">
        <h2 className="text-section">Report Card</h2>
      </div>
      <div className="agentic-card-content">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <MetricItem
            label="Projects"
            value={metrics.total_projects}
            total={10}
            index={0}
          />
          <MetricItem
            label="Active"
            value={metrics.active_projects}
            total={metrics.total_projects || 1}
            highlight
            index={1}
          />
          <MetricItem
            label="Completed"
            value={metrics.completed_projects}
            total={metrics.total_projects || 1}
            index={2}
          />
          <MetricItem
            label="Contacts"
            value={metrics.total_contacts}
            total={20}
            index={3}
          />
          <MetricItem
            label="Due Today"
            value={metrics.tasks_due_today}
            total={5}
            warning={metrics.tasks_due_today > 0}
            index={4}
          />
          <MetricItem
            label="Overdue"
            value={metrics.tasks_overdue}
            total={5}
            error={metrics.tasks_overdue > 0}
            index={5}
          />
          <MetricItem
            label="SOPs Active"
            value={metrics.sops_in_progress}
            total={3}
            index={6}
          />
        </div>
      </div>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
  total: number;
  highlight?: boolean;
  warning?: boolean;
  error?: boolean;
  index: number;
}

function MetricItem({ label, value, total, highlight, warning, error, index }: MetricItemProps) {
  const percentage = Math.min((value / total) * 100, 100);
  const shouldReduce = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (shouldReduce || hasAnimated) {
      setDisplayValue(value);
      return;
    }

    const timer = setTimeout(() => {
      const controls = animate(0, value, {
        duration: duration.slow,
        onUpdate: (v) => setDisplayValue(Math.round(v)),
        onComplete: () => setHasAnimated(true),
      });
      return () => controls.stop();
    }, index * 60);

    return () => clearTimeout(timer);
  }, [value, shouldReduce, index, hasAnimated]);

  return (
    <motion.div
      className="report-card-metric group"
      initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ...spring.default }}
      whileHover={shouldReduce ? {} : { scale: 1.02 }}
    >
      <span className="label">{label}</span>
      
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums transition-colors",
          warning && "text-[var(--warning)]",
          error && "text-[var(--error)]",
          highlight && "text-[var(--live)]"
        )}
      >
        {displayValue}
      </span>
      
      <div className="bar overflow-hidden relative">
        <motion.div
          className={cn(
            "bar-fill",
            warning && "!bg-[var(--warning)]",
            error && "!bg-[var(--error)]",
            highlight && "!bg-[var(--live)]"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            delay: 0.2 + index * 0.04,
            duration: duration.slow,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>
    </motion.div>
  );
}
