"use client";

import Link from "next/link";
import { motion, useReducedMotion, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { spring, duration } from "@/lib/motion/tokens";
import type { Arm, ArmMetrics } from "@/lib/types";

interface ArmCardProps {
  arm: Arm;
  metrics: ArmMetrics;
  index: number;
}

// Animated counter component
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const shouldReduce = useReducedMotion();
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (shouldReduce) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(displayValue, value, {
      duration: duration.slow,
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });

    return () => controls.stop();
  }, [value, shouldReduce]);

  return <span ref={nodeRef} className={className}>{displayValue}</span>;
}

export function ArmCard({ arm, metrics, index }: ArmCardProps) {
  const hasActivity = metrics.active_projects > 0;
  const shouldReduce = useReducedMotion();
  
  return (
    <Link href={`/arms/${arm.slug}`}>
      <motion.div
        className={cn(
          "agentic-card p-4 cursor-pointer relative overflow-hidden group",
          hasActivity && "border-l-2 border-l-[var(--live)]"
        )}
        initial={shouldReduce ? {} : { opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={shouldReduce ? {} : { 
          y: -4, 
          boxShadow: "var(--shadow-hover)",
        }}
        whileTap={shouldReduce ? {} : { scale: 0.98 }}
        transition={{ ...spring.default, delay: index * 0.05 }}
      >
        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent opacity-0 group-hover:opacity-100"
          initial={false}
          transition={{ duration: duration.normal }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <motion.h3
                className="font-medium text-sm"
                whileHover={shouldReduce ? {} : { x: 2 }}
                transition={spring.snappy}
              >
                {arm.name}
              </motion.h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{arm.description}</p>
            </div>
            {hasActivity && (
              <motion.span
                className="w-2 h-2 rounded-full bg-[var(--live)]"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.1, ...spring.default }}
            >
              <div className="text-lg font-semibold tabular-nums">
                <AnimatedNumber value={metrics.projects_count} />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Projects</div>
            </motion.div>
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.15, ...spring.default }}
            >
              <div className={cn(
                "text-lg font-semibold tabular-nums",
                metrics.active_projects > 0 && "text-[var(--live)]"
              )}>
                <AnimatedNumber value={metrics.active_projects} />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</div>
            </motion.div>
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.2, ...spring.default }}
            >
              <div className="text-lg font-semibold tabular-nums">
                <AnimatedNumber value={metrics.contacts_count} />
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Contacts</div>
            </motion.div>
          </div>
        </div>

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none border border-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: duration.fast }}
        />
      </motion.div>
    </Link>
  );
}
