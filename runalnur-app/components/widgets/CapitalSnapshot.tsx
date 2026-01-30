"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Landmark, TrendingUp, TrendingDown, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface CapitalSnapshotProps {
  nav: number;
  navChange: number;
  navChangePercent: number;
  liquidity: number;
  upcomingCalls: number;
  compact?: boolean;
}

export function CapitalSnapshot({
  nav,
  navChange,
  navChangePercent,
  liquidity,
  upcomingCalls,
  compact = false,
}: CapitalSnapshotProps) {
  const shouldReduce = useReducedMotion();
  const isPositive = navChange >= 0;

  if (compact) {
    return (
      <Link href="/capital">
        <motion.div
          className="agentic-card p-4 hover:border-foreground/20 transition-colors cursor-pointer"
          whileHover={shouldReduce ? {} : { y: -2 }}
          whileTap={shouldReduce ? {} : { scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                <Landmark className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Capital Snapshot
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums">
                    ${nav.toLocaleString()}
                  </span>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-[var(--live)]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-[var(--error)]" />
                  )}
                </div>
              </div>
            </div>
            {upcomingCalls > 0 && (
              <div className="flex items-center gap-1 text-[var(--warning)]">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{upcomingCalls}</span>
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
          <Landmark className="w-4 h-4 text-amber-500" />
          <h2 className="text-section">Capital Snapshot</h2>
        </div>
        <Link
          href="/capital"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="agentic-card-content">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Net Asset Value
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold tabular-nums">
                ${nav.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-[var(--live)]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                )}
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    isPositive ? "text-[var(--live)]" : "text-[var(--error)]"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {navChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Liquidity
            </div>
            <div className="text-lg font-semibold tabular-nums">
              ${liquidity.toLocaleString()}
            </div>
          </div>
        </div>

        {upcomingCalls > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/capital/calls"
              className="flex items-center gap-2 text-[var(--warning)] hover:underline"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {upcomingCalls} capital call{upcomingCalls > 1 ? "s" : ""} due this week
              </span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Default widget for Command mode dashboard
export function CapitalSnapshotWidget() {
  // This would fetch real data in production
  const mockData = {
    nav: 0,
    navChange: 0,
    navChangePercent: 0,
    liquidity: 0,
    upcomingCalls: 0,
  };

  return <CapitalSnapshot {...mockData} compact />;
}
