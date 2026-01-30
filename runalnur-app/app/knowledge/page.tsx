"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, RefreshCw, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/motion/FadeIn";
import { KnowledgeCard, KnowledgeCardSkeleton } from "@/components/knowledge/KnowledgeCard";
import { CardDetail } from "@/components/knowledge/CardDetail";
import { useGuruCards, useGuruCollections, useGuruStatus, type GuruCard } from "@/lib/hooks/useGuru";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";

export default function KnowledgePage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<GuruCard | null>(null);

  // Data fetching
  const { connected, loading: statusLoading } = useGuruStatus();
  const { collections } = useGuruCollections();
  const { cards, loading, error, refresh } = useGuruCards({
    query: searchQuery || undefined,
    collectionId: selectedCollection || undefined,
  });

  // Filter to only House Al Nur collections
  const relevantCollections = useMemo(() => {
    return collections.filter((c) => c.name.includes("House Al Nur"));
  }, [collections]);

  // Get collection display name (strip "House Al Nur - " prefix)
  const getCollectionLabel = (name: string) => {
    return name.replace("House Al Nur - ", "");
  };

  // Skeleton count for loading state
  const skeletonCount = 8;

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${cards.length} knowledge cards`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open("https://app.getguru.com", "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Guru
          </Button>
        </div>
      </FadeIn>

      {/* Not Connected State */}
      {!statusLoading && !connected && (
        <FadeIn className="agentic-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium">Guru Not Connected</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Connect your Guru account in Settings to sync your knowledge base and institutional memory.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => (window.location.href = "/settings")}
          >
            Go to Settings
          </Button>
        </FadeIn>
      )}

      {/* Connected State */}
      {(connected || statusLoading) && (
        <>
          {/* Search & Filters */}
          <FadeIn className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </FadeIn>

          {/* Collection Tabs */}
          {relevantCollections.length > 0 && (
            <FadeIn>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                    selectedCollection === null
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  All
                </button>
                {relevantCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                      selectedCollection === collection.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {getCollectionLabel(collection.name)}
                  </button>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Error State */}
          {error && (
            <div className="agentic-card p-4 border-l-2 border-l-[var(--error)]">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                // Loading skeletons
                Array.from({ length: skeletonCount }).map((_, i) => (
                  <KnowledgeCardSkeleton key={`skeleton-${i}`} index={i} />
                ))
              ) : cards.length > 0 ? (
                // Cards
                cards.map((card, index) => (
                  <KnowledgeCard
                    key={card.id}
                    card={card}
                    index={index}
                    onClick={() => setSelectedCard(card)}
                  />
                ))
              ) : (
                // Empty state
                <motion.div
                  className="col-span-full agentic-card p-12 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">No knowledge cards found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? "Try a different search term"
                      : selectedCollection
                      ? "No cards in this collection"
                      : "Add knowledge cards in Guru to see them here"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Card Detail Panel */}
      <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
