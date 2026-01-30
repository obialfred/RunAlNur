"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Globe, 
  ArrowRight, 
  Twitter, 
  Newspaper, 
  Rss,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock
} from "lucide-react";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useIntelligence, useBreakingNews } from "@/lib/hooks/useIntelligence";
import { INTEL_REGIONS } from "@/lib/constants";
import type { IntelligenceItem, IntelRegion } from "@/lib/types";

interface IntelligenceStripProps {
  className?: string;
  maxItems?: number;
}

export function IntelligenceStrip({ className, maxItems = 6 }: IntelligenceStripProps) {
  const shouldReduce = useReducedMotion();
  const [selectedRegion, setSelectedRegion] = useState<IntelRegion | "all">("all");
  const [isHovered, setIsHovered] = useState(false);
  
  const { 
    data: allItems, 
    loading, 
    error, 
    refresh, 
    lastUpdated 
  } = useIntelligence({ 
    limit: 30, 
    pollInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Get breaking/recent news
  const breakingItems = useBreakingNews(allItems);

  // Filter by region
  const filteredItems = useMemo(() => {
    const items = selectedRegion === "all" 
      ? allItems 
      : allItems.filter(item => item.region === selectedRegion);
    return items.slice(0, maxItems);
  }, [allItems, selectedRegion, maxItems]);

  // Region counts
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    for (const item of allItems) {
      counts[item.region] = (counts[item.region] || 0) + 1;
    }
    return counts;
  }, [allItems]);

  return (
    <motion.div
      className={cn("agentic-card overflow-hidden", className)}
      initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ...spring.default }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="agentic-card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-section">Intelligence</h2>
          </div>
          {breakingItems.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--live)] font-medium">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[var(--live)]"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {breakingItems.length} BREAKING
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-1.5 hover:bg-muted rounded-sm transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", loading && "animate-spin")} />
          </button>
          <Link
            href="/influence/intel"
            className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Region Quick Filters */}
      <div className="px-4 py-2 border-b border-border flex gap-1 overflow-x-auto scrollbar-hide">
        <RegionPill 
          label="All" 
          active={selectedRegion === "all"} 
          count={regionCounts.all || 0}
          onClick={() => setSelectedRegion("all")} 
        />
        {INTEL_REGIONS.map(region => (
          <RegionPill
            key={region.id}
            label={region.name}
            active={selectedRegion === region.id}
            count={regionCounts[region.id] || 0}
            color={region.color}
            onClick={() => setSelectedRegion(region.id as IntelRegion)}
          />
        ))}
      </div>

      {/* Content */}
      <div className="agentic-card-content p-0">
        {error ? (
          <div className="px-4 py-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">Failed to load intelligence</p>
            <button 
              onClick={() => refresh()}
              className="text-xs text-foreground hover:underline mt-2"
            >
              Retry
            </button>
          </div>
        ) : loading && filteredItems.length === 0 ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-4 h-4 bg-muted rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-2 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Globe className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No intelligence items</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Configure API keys to enable data sources
            </p>
          </div>
        ) : (
          <motion.div
            className="divide-y divide-border"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: stagger.fast },
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <IntelItem key={item.id} item={item} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function RegionPill({
  label,
  active,
  count,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {color && !active && (
        <span className={cn("w-1.5 h-1.5 rounded-full", color)} />
      )}
      {label}
      {count > 0 && (
        <span className={cn(
          "px-1 rounded-sm",
          active ? "bg-background/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function IntelItem({ item, index }: { item: IntelligenceItem; index: number }) {
  const shouldReduce = useReducedMotion();
  const region = INTEL_REGIONS.find(r => r.id === item.region);
  
  const sourceIcon = {
    x: <Twitter className="w-3.5 h-3.5" />,
    news: <Newspaper className="w-3.5 h-3.5" />,
    rss: <Rss className="w-3.5 h-3.5" />,
  };

  const isRecent = Date.now() - new Date(item.published_at).getTime() < 60 * 60 * 1000;

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      exit={{ opacity: 0, x: 10 }}
      transition={spring.default}
      className="group"
    >
      <a
        href={item.source_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Source Icon */}
          <div className="text-muted-foreground mt-0.5 shrink-0">
            {sourceIcon[item.source]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">
                {item.title}
              </p>
              {isRecent && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--live)] mt-1.5" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span className="font-medium">{item.source_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatTimeAgo(new Date(item.published_at))}
              </span>
              {region && (
                <>
                  <span>•</span>
                  <span className={cn(
                    "px-1 py-0.5 rounded-sm uppercase tracking-wider font-medium",
                    region.textColor
                  )}>
                    {region.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* External Link Indicator */}
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        </div>
      </a>
    </motion.div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
