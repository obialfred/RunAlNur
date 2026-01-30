"use client";

import { motion, useReducedMotion } from "framer-motion";
import { duration, easing } from "@/lib/motion/tokens";

interface EmptyStateProps {
  title: string;
  description?: string;
  riveSrc?: string;
}

export function EmptyState({ title, description, riveSrc }: EmptyStateProps) {
  const shouldReduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-36 h-36 mb-4">
        {/* Rive disabled: keep a clean, dependency-free empty state */}
        <motion.div
          className="w-full h-full border border-border rounded-sm bg-muted"
          aria-label={riveSrc ? "Empty state illustration (disabled)" : "Empty state illustration"}
          animate={shouldReduce ? { opacity: 1 } : { opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: duration.slow,
            ease: easing.standard,
            repeat: shouldReduce ? 0 : Infinity,
          }}
        />
      </div>
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
    </div>
  );
}
