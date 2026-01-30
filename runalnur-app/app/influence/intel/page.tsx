"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Newspaper, 
  ExternalLink, 
  Tag, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Filter, 
  RefreshCw,
  Globe,
  Twitter,
  Rss,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useIntelligence, useIntelligenceByRegion } from "@/lib/hooks/useIntelligence";
import { INTEL_REGIONS } from "@/lib/constants";
import type { IntelligenceItem, IntelRegion, IntelSentiment } from "@/lib/types";

export default function IntelligencePage() {
  const shouldReduce = useReducedMotion();
  const [selectedRegion, setSelectedRegion] = useState<IntelRegion | "all">("all");
  const [selectedSource, setSelectedSource] = useState<"all" | "x" | "news" | "rss">("all");
  
  const { 
    data: allItems, 
    loading, 
    error, 
    refresh, 
    lastUpdated,
    availableSources 
  } = useIntelligence({ limit: 50, pollInterval: 5 * 60 * 1000 });

  // Filter by region
  const regionFiltered = useIntelligenceByRegion(allItems, selectedRegion);
  
  // Filter by source
  const filteredItems = useMemo(() => {
    if (selectedSource === "all") return regionFiltered;
    return regionFiltered.filter(item => item.source === selectedSource);
  }, [regionFiltered, selectedSource]);

  // Count items per region for badges
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    for (const item of allItems) {
      counts[item.region] = (counts[item.region] || 0) + 1;
    }
    return counts;
  }, [allItems]);

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
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/influence" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Influence / Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Global Intelligence Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time news and social signals across key regions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Source Status */}
      {availableSources && (
        <div className="flex flex-wrap gap-2">
          <SourceBadge 
            name="X/Twitter" 
            icon={Twitter} 
            available={availableSources.x} 
          />
          <SourceBadge 
            name="News APIs" 
            icon={Newspaper} 
            available={availableSources.newsapi || availableSources.gnews} 
          />
          <SourceBadge 
            name="RSS Feeds" 
            icon={Rss} 
            available={availableSources.rss} 
          />
        </div>
      )}

      {/* Region Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <RegionTab
          region="all"
          label="All Regions"
          active={selectedRegion === "all"}
          count={regionCounts.all || 0}
          onClick={() => setSelectedRegion("all")}
        />
        {INTEL_REGIONS.map(region => (
          <RegionTab
            key={region.id}
            region={region.id as IntelRegion}
            label={region.name}
            active={selectedRegion === region.id}
            count={regionCounts[region.id] || 0}
            onClick={() => setSelectedRegion(region.id as IntelRegion)}
            color={region.color}
          />
        ))}
      </div>

      {/* Source Filter */}
      <div className="flex gap-2 border-b border-border">
        {(["all", "x", "news", "rss"] as const).map(source => (
          <button
            key={source}
            onClick={() => setSelectedSource(source)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2",
              selectedSource === source
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {source === "all" && "All Sources"}
            {source === "x" && <><Twitter className="w-3 h-3" /> X</>}
            {source === "news" && <><Newspaper className="w-3 h-3" /> News</>}
            {source === "rss" && <><Rss className="w-3 h-3" /> RSS</>}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          className="agentic-card border-[var(--error)]/20 bg-[var(--error)]/5"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-content flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--error)]" />
            <div>
              <p className="text-sm font-medium">Failed to load intelligence</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && filteredItems.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="agentic-card animate-pulse">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Intel Feed */}
      {!loading && filteredItems.length === 0 ? (
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-content text-center py-12">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No intelligence items</p>
            <p className="text-xs text-muted-foreground mt-1">
              {!availableSources?.x && !availableSources?.newsapi && !availableSources?.gnews
                ? "Configure API keys in environment variables to enable data sources"
                : "Try adjusting your filters or check back later"}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
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
          {filteredItems.map((item) => (
            <IntelCard key={item.id} item={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Components
// ============================================================================

function SourceBadge({ 
  name, 
  icon: Icon, 
  available 
}: { 
  name: string; 
  icon: typeof Twitter; 
  available: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs",
      available 
        ? "bg-[var(--live)]/10 text-[var(--live)]" 
        : "bg-muted text-muted-foreground"
    )}>
      {available ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      <Icon className="w-3 h-3" />
      <span>{name}</span>
    </div>
  );
}

function RegionTab({
  region,
  label,
  active,
  count,
  onClick,
  color,
}: {
  region: IntelRegion | "all";
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
      )}
    >
      {color && !active && (
        <span className={cn("w-2 h-2 rounded-full", color)} />
      )}
      {label}
      <span className={cn(
        "text-xs px-1.5 py-0.5 rounded-full",
        active ? "bg-background/20 text-background" : "bg-background text-muted-foreground"
      )}>
        {count}
      </span>
    </button>
  );
}

function IntelCard({ item }: { item: IntelligenceItem }) {
  const shouldReduce = useReducedMotion();
  const region = INTEL_REGIONS.find(r => r.id === item.region);

  const sourceIcon = {
    x: <Twitter className="w-4 h-4" />,
    news: <Newspaper className="w-4 h-4" />,
    rss: <Rss className="w-4 h-4" />,
  };

  const sentimentIcon = {
    positive: <TrendingUp className="w-4 h-4 text-[var(--live)]" />,
    negative: <TrendingDown className="w-4 h-4 text-[var(--error)]" />,
    neutral: <Minus className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <motion.div
      className="agentic-card overflow-hidden hover:border-foreground/20 transition-colors"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Source Icon */}
          <div className="mt-1 text-muted-foreground">
            {sourceIcon[item.source]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-medium leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium">{item.source_name}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(new Date(item.published_at))}</span>
                  </div>
                  {region && (
                    <>
                      <span>•</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-wider",
                        region.color.replace('bg-', 'bg-').replace('500', '500/20'),
                        region.textColor
                      )}>
                        {region.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.sentiment && sentimentIcon[item.sentiment]}
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-muted rounded-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>

            {item.summary && item.summary !== item.title && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {item.summary}
              </p>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {item.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{item.tags.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Engagement metrics for X posts */}
            {item.source === 'x' && item.metadata && (
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {typeof item.metadata.likes === 'number' && (
                  <span>❤️ {item.metadata.likes}</span>
                )}
                {typeof item.metadata.retweets === 'number' && (
                  <span>🔁 {item.metadata.retweets}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
