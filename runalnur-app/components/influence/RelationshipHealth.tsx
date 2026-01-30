"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface RelationshipHealthProps {
  overall: number;
  byTier: {
    inner_circle: { score: number; count: number };
    strategic: { score: number; count: number };
    general: { score: number; count: number };
  };
  needsAttention: number;
  compact?: boolean;
}

export function RelationshipHealth({
  overall,
  byTier,
  needsAttention,
  compact = false,
}: RelationshipHealthProps) {
  const shouldReduce = useReducedMotion();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[var(--live)]";
    if (score >= 60) return "text-[var(--warning)]";
    return "text-[var(--error)]";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-[var(--live)]";
    if (score >= 60) return "bg-[var(--warning)]";
    return "bg-[var(--error)]";
  };

  if (compact) {
    return (
      <Link href="/influence">
        <motion.div
          className="agentic-card p-4 hover:border-foreground/20 transition-colors cursor-pointer"
          whileHover={shouldReduce ? {} : { y: -2 }}
          whileTap={shouldReduce ? {} : { scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                <Heart className={cn("w-5 h-5", getScoreColor(overall))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Relationship Health
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xl font-semibold tabular-nums", getScoreColor(overall))}>
                    {overall}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
            </div>
            {needsAttention > 0 && (
              <div className="flex items-center gap-1 text-[var(--warning)]">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{needsAttention}</span>
              </div>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      className="agentic-card"
      initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
    >
      <div className="agentic-card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <h2 className="text-section">Relationship Health</h2>
        </div>
        <Link
          href="/influence/contacts"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="agentic-card-content">
        <div className="flex items-center gap-8">
          {/* Overall Score */}
          <div className="text-center">
            <motion.div
              className={cn("text-5xl font-semibold tabular-nums", getScoreColor(overall))}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={spring.bouncy}
            >
              {overall}
            </motion.div>
            <div className="text-xs text-muted-foreground mt-1">/ 100</div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-3">
            <TierBar
              label="Inner Circle"
              score={byTier.inner_circle.score}
              count={byTier.inner_circle.count}
            />
            <TierBar
              label="Strategic"
              score={byTier.strategic.score}
              count={byTier.strategic.count}
            />
            <TierBar
              label="General"
              score={byTier.general.score}
              count={byTier.general.count}
            />
          </div>
        </div>

        {needsAttention > 0 && (
          <motion.div
            className="mt-4 pt-4 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/influence/week"
              className="flex items-center gap-2 text-[var(--warning)] hover:underline"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {needsAttention} relationship{needsAttention > 1 ? "s" : ""} need attention
              </span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TierBar({
  label,
  score,
  count,
}: {
  label: string;
  score: number;
  count: number;
}) {
  const shouldReduce = useReducedMotion();

  const getColor = (s: number) => {
    if (s >= 80) return "bg-[var(--live)]";
    if (s >= 60) return "bg-[var(--warning)]";
    return "bg-[var(--error)]";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getColor(score))}
          initial={shouldReduce ? { width: `${score}%` } : { width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      <div className="w-20 text-right">
        <span className="text-sm font-medium tabular-nums">{score}%</span>
        <span className="text-xs text-muted-foreground ml-1">({count})</span>
      </div>
    </div>
  );
}

// Widget version for other mode dashboards
export function RelationshipHealthWidget() {
  // This would fetch real data in production
  const mockData = {
    overall: 72,
    byTier: {
      inner_circle: { score: 82, count: 5 },
      strategic: { score: 65, count: 12 },
      general: { score: 58, count: 34 },
    },
    needsAttention: 3,
  };

  return <RelationshipHealth {...mockData} compact />;
}
