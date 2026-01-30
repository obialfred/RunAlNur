"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { FileText, Clock, User } from "lucide-react";
import type { GuruCard } from "@/lib/hooks/useGuru";

interface KnowledgeCardProps {
  card: GuruCard;
  index: number;
  onClick: () => void;
}

export function KnowledgeCard({ card, index, onClick }: KnowledgeCardProps) {
  const shouldReduce = useReducedMotion();

  // Strip HTML tags for preview
  const contentPreview = card.content
    ?.replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .slice(0, 120);

  const formattedDate = card.updatedAt
    ? formatRelativeDate(new Date(card.updatedAt))
    : null;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "agentic-card p-4 text-left w-full",
        "hover:border-foreground/20 hover:shadow-sm",
        "transition-colors cursor-pointer group"
      )}
      initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, ...spring.default }}
      whileHover={shouldReduce ? {} : { y: -2 }}
      whileTap={shouldReduce ? {} : { scale: 0.99 }}
    >
      {/* Title */}
      <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-foreground/90">
        {card.title}
      </h3>

      {/* Collection Badge */}
      {card.collection && (
        <span className="inline-block mt-2 text-[10px] font-medium tracking-wider uppercase text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
          {card.collection.name.replace("House Al Nur - ", "")}
        </span>
      )}

      {/* Content Preview */}
      {contentPreview && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {contentPreview}...
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formattedDate || "—"}</span>
        </div>
        {card.verificationState && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded",
              card.verificationState === "TRUSTED"
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-muted text-muted-foreground"
            )}
          >
            {card.verificationState.toLowerCase()}
          </span>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Loading skeleton for KnowledgeCard
 */
export function KnowledgeCardSkeleton({ index }: { index: number }) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className="agentic-card p-4"
      initial={shouldReduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Title skeleton */}
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      
      {/* Badge skeleton */}
      <div className="mt-2 h-4 bg-muted rounded w-16 animate-pulse" />
      
      {/* Content skeleton */}
      <div className="mt-2 space-y-1.5">
        <div className="h-3 bg-muted rounded w-full animate-pulse" />
        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
      </div>
      
      {/* Footer skeleton */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-20 animate-pulse" />
        <div className="h-3 bg-muted rounded w-12 animate-pulse" />
      </div>
    </motion.div>
  );
}

/**
 * Format date as relative time (today, yesterday, X days ago, etc.)
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
