"use client";

import { motion } from "framer-motion";
import { Shield, Flame, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import {
  StandingPoints,
  StandingDomain,
  DOMAIN_INFO,
  getLevelTitle,
  getLevelProgress,
} from "@/lib/gamification/standing";

// ============================================================================
// STANDING CARD
// ============================================================================

interface StandingCardProps {
  standing: StandingPoints;
  className?: string;
}

export function StandingCard({ standing, className }: StandingCardProps) {
  const domainInfo = DOMAIN_INFO[standing.domain];
  const progress = getLevelProgress(standing.points);
  const title = getLevelTitle(standing.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
      className={cn(
        "bg-card border border-border rounded-lg p-4 overflow-hidden relative",
        className
      )}
    >
      {/* Background accent */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${domainInfo.color} 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${domainInfo.color}20` }}
            >
              <span className="text-lg font-bold" style={{ color: domainInfo.color }}>
                {standing.level}
              </span>
            </div>
            <div>
              <h3 className="font-medium">{domainInfo.name}</h3>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
        </div>

        {/* Streak */}
        {standing.streak_days > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-medium">{standing.streak_days}</span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="mb-3 relative">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{standing.points.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">points</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {standing.points_to_next_level > 0
            ? `${standing.points_to_next_level.toLocaleString()} to next level`
            : "Max level reached!"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-3">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: domainInfo.color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            Level {standing.level}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Level {standing.level + 1}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs relative">
        {standing.streak_shields > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Shield className="w-3 h-3 text-blue-500" />
            <span>{standing.streak_shields} shields</span>
          </div>
        )}
        {standing.longest_streak > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Best: {standing.longest_streak}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// STANDING OVERVIEW (All domains)
// ============================================================================

interface StandingOverviewProps {
  standings: StandingPoints[];
  className?: string;
}

export function StandingOverview({ standings, className }: StandingOverviewProps) {
  // Sort by points descending
  const sortedStandings = [...standings].sort((a, b) => b.points - a.points);

  // Calculate total points
  const totalPoints = standings.reduce((acc, s) => acc + s.points, 0);

  // Find current streak (from Reliability domain or highest)
  const reliabilityStanding = standings.find((s) => s.domain === "reliability");
  const currentStreak = reliabilityStanding?.streak_days || 
    Math.max(...standings.map((s) => s.streak_days), 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{totalPoints.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Total Standing
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <p className="text-lg font-bold">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Day Streak
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold">
            {Math.max(...standings.map((s) => s.level), 1)}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Highest Lvl
          </p>
        </div>
      </div>

      {/* Domain Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sortedStandings.map((standing) => (
          <StandingCard key={standing.domain} standing={standing} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT STANDING BADGE
// ============================================================================

interface StandingBadgeProps {
  domain: StandingDomain;
  level: number;
  points: number;
  streak?: number;
  className?: string;
}

export function StandingBadge({
  domain,
  level,
  points,
  streak,
  className,
}: StandingBadgeProps) {
  const domainInfo = DOMAIN_INFO[domain];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs",
        className
      )}
      style={{
        backgroundColor: `${domainInfo.color}15`,
        color: domainInfo.color,
      }}
    >
      <span className="font-bold">L{level}</span>
      <span>{points.toLocaleString()} pts</span>
      {streak && streak > 0 && (
        <span className="flex items-center gap-0.5">
          <Flame className="w-3 h-3" />
          {streak}
        </span>
      )}
    </div>
  );
}
