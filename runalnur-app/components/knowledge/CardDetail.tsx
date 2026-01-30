"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ExternalLink, Clock, User, Folder, Tag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { GuruCard } from "@/lib/hooks/useGuru";

interface CardDetailProps {
  card: GuruCard | null;
  onClose: () => void;
}

export function CardDetail({ card, onClose }: CardDetailProps) {
  const shouldReduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (card) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [card, onClose]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (card) {
      // Delay to prevent immediate close on open click
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [card, onClose]);

  const formattedDate = card?.updatedAt
    ? new Date(card.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <AnimatePresence>
      {card && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            className={cn(
              "fixed right-0 top-0 bottom-0 w-full sm:w-[500px] lg:w-[600px]",
              "bg-card border-l border-border shadow-2xl z-50",
              "flex flex-col"
            )}
            initial={shouldReduce ? { opacity: 0 } : { x: "100%" }}
            animate={shouldReduce ? { opacity: 1 } : { x: 0 }}
            exit={shouldReduce ? { opacity: 0 } : { x: "100%" }}
            transition={spring.snappy}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg font-semibold leading-tight">
                  {card.title}
                </h2>
                {card.collection && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Folder className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {card.collection.name}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-md transition-colors -mr-2 -mt-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata bar */}
            <div className="px-6 py-3 bg-muted/30 border-b border-border flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
              {formattedDate && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              )}
              {card.owner && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span>
                    {card.owner.firstName || card.owner.email?.split("@")[0]}
                  </span>
                </div>
              )}
              {card.verificationState && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={cn(
                      "w-3 h-3",
                      card.verificationState === "TRUSTED"
                        ? "text-[var(--success)]"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="capitalize">
                    {card.verificationState.toLowerCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    {card.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-0.5 bg-muted rounded"
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* HTML Content */}
                <div
                  className="prose prose-sm max-w-none
                    prose-headings:font-semibold prose-headings:tracking-tight
                    prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
                    prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground/90
                    prose-ul:text-sm prose-li:text-foreground/90
                    prose-strong:text-foreground prose-strong:font-medium
                    prose-blockquote:border-l-foreground/20 prose-blockquote:text-muted-foreground prose-blockquote:italic
                    dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: card.content || "" }}
                />
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  window.open(
                    `https://app.getguru.com/card/${card.id}`,
                    "_blank"
                  );
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Guru
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
