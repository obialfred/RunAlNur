"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Shield, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";

// ============================================================================
// TYPES
// ============================================================================

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  shields: number;
  lastActivityDate?: string;
  className?: string;
}

// ============================================================================
// STREAK FLAME COMPONENT
// ============================================================================

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakFlame({ streak, size = "md" }: StreakFlameProps) {
  // Determine flame intensity based on streak
  const intensity = useMemo(() => {
    if (streak >= 100) return "legendary";
    if (streak >= 30) return "epic";
    if (streak >= 7) return "rare";
    if (streak >= 3) return "common";
    return "none";
  }, [streak]);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const flameColors = {
    none: "text-muted-foreground",
    common: "text-orange-400",
    rare: "text-orange-500",
    epic: "text-amber-500",
    legendary: "text-yellow-400",
  };

  const glowColors = {
    none: "",
    common: "drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]",
    rare: "drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]",
    epic: "drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]",
    legendary: "drop-shadow-[0_0_24px_rgba(250,204,21,0.6)]",
  };

  if (streak === 0) {
    return (
      <div className={cn("flex items-center justify-center", sizeClasses[size])}>
        <Flame className="w-full h-full text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn("flex items-center justify-center relative", sizeClasses[size])}
      animate={intensity !== "none" ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Flame
        className={cn(
          "w-full h-full transition-all",
          flameColors[intensity],
          glowColors[intensity]
        )}
      />
      {intensity === "legendary" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Zap className="w-1/2 h-1/2 text-yellow-300" />
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// STREAK DISPLAY COMPONENT
// ============================================================================

export function StreakDisplay({
  currentStreak,
  longestStreak,
  shields,
  lastActivityDate,
  className,
}: StreakDisplayProps) {
  // Determine streak status message
  const streakStatus = useMemo(() => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak >= 100) return "🔥 LEGENDARY STREAK!";
    if (currentStreak >= 30) return "Epic consistency!";
    if (currentStreak >= 7) return "Keep it going!";
    return "Building momentum...";
  }, [currentStreak]);

  // Calculate milestone progress
  const nextMilestone = useMemo(() => {
    if (currentStreak < 7) return { target: 7, label: "Week Warrior" };
    if (currentStreak < 30) return { target: 30, label: "Month of Focus" };
    if (currentStreak < 100) return { target: 100, label: "Century" };
    return null;
  }, [currentStreak]);

  const milestoneProgress = nextMilestone
    ? (currentStreak / nextMilestone.target) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className={cn("bg-card border border-border rounded-lg p-4", className)}
    >
      {/* Main Streak Display */}
      <div className="flex items-center gap-4 mb-4">
        <StreakFlame streak={currentStreak} size="lg" />
        
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{currentStreak}</span>
            <span className="text-sm text-muted-foreground">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{streakStatus}</p>
        </div>

        {/* Shields */}
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Shield className={cn(
              "w-5 h-5",
              shields > 0 ? "text-blue-500" : "text-muted-foreground/30"
            )} />
            <span className={cn(
              "text-lg font-bold",
              shields > 0 ? "text-blue-500" : "text-muted-foreground"
            )}>
              {shields}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Streak Shields
          </p>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Next: {nextMilestone.label}</span>
            <span className="text-muted-foreground">
              {currentStreak} / {nextMilestone.target}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${milestoneProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm">
            Best: <span className="font-bold">{longestStreak}</span> days
          </span>
        </div>
        {lastActivityDate && (
          <span className="text-xs text-muted-foreground">
            Last active: {new Date(lastActivityDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CONTRIBUTION GRID (GitHub-style)
// ============================================================================

interface ContributionGridProps {
  contributions: Array<{ date: string; count: number }>;
  weeks?: number;
  className?: string;
}

export function ContributionGrid({
  contributions,
  weeks = 12,
  className,
}: ContributionGridProps) {
  // Build grid data
  const gridData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7);
    
    const data: Array<{ date: Date; count: number }> = [];
    const contributionMap = new Map(contributions.map((c) => [c.date, c.count]));
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      data.push({
        date: new Date(d),
        count: contributionMap.get(dateStr) || 0,
      });
    }
    
    return data;
  }, [contributions, weeks]);

  // Group by weeks
  const weeklyData = useMemo(() => {
    const result: Array<Array<{ date: Date; count: number }>> = [];
    let currentWeek: Array<{ date: Date; count: number }> = [];
    
    gridData.forEach((day, i) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || i === gridData.length - 1) {
        result.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return result;
  }, [gridData]);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-green-300 dark:bg-green-900";
    if (count <= 3) return "bg-green-400 dark:bg-green-700";
    if (count <= 5) return "bg-green-500 dark:bg-green-600";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
        Activity
      </h3>
      <div className="flex gap-0.5 overflow-auto">
        {weeklyData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  getIntensity(day.count)
                )}
                title={`${day.date.toLocaleDateString()}: ${day.count} ${day.count === 1 ? "quest" : "quests"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-muted" />
          <div className="w-2.5 h-2.5 rounded-sm bg-green-300 dark:bg-green-900" />
          <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500 dark:bg-green-600" />
          <div className="w-2.5 h-2.5 rounded-sm bg-green-600 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
