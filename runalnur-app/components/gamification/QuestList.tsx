"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Circle, 
  Clock, 
  Star, 
  Target, 
  Calendar, 
  ChevronRight,
  Zap,
  Trophy,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { Button } from "@/components/ui/button";
import { DOMAIN_INFO, StandingDomain, getStreakMultiplier } from "@/lib/gamification/standing";
import { CONTEXT_CONFIGS, FocusContext, getContextConfig } from "@/lib/calendar/types";

// ============================================================================
// TYPES
// ============================================================================

export interface Quest {
  id: string;
  title: string;
  description?: string;
  context?: FocusContext;
  quest_type: "task" | "daily" | "weekly" | "milestone" | "side" | "challenge";
  points_reward: number;
  domain: StandingDomain;
  due_date?: string;
  status: "available" | "in_progress" | "completed" | "failed" | "expired";
  completed_at?: string;
  progress?: number;
  target?: number;
}

interface QuestListProps {
  quests: Quest[];
  onComplete: (questId: string) => void;
  onStart?: (questId: string) => void;
  streakDays?: number;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getQuestTypeIcon(type: Quest["quest_type"]) {
  switch (type) {
    case "daily": return Zap;
    case "weekly": return Calendar;
    case "milestone": return Trophy;
    case "challenge": return Target;
    case "side": return Star;
    default: return Circle;
  }
}

function getQuestTypeBadge(type: Quest["quest_type"]) {
  switch (type) {
    case "daily": return { text: "DAILY", color: "text-blue-500 bg-blue-500/10" };
    case "weekly": return { text: "WEEKLY", color: "text-purple-500 bg-purple-500/10" };
    case "milestone": return { text: "MILESTONE", color: "text-amber-500 bg-amber-500/10" };
    case "challenge": return { text: "CHALLENGE", color: "text-red-500 bg-red-500/10" };
    case "side": return { text: "SIDE", color: "text-gray-500 bg-gray-500/10" };
    default: return { text: "TASK", color: "text-muted-foreground bg-muted" };
  }
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays} days`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================================================
// QUEST ITEM COMPONENT
// ============================================================================

interface QuestItemProps {
  quest: Quest;
  onComplete: () => void;
  onStart?: () => void;
  streakMultiplier?: number;
}

function QuestItem({ quest, onComplete, onStart, streakMultiplier = 1 }: QuestItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const TypeIcon = getQuestTypeIcon(quest.quest_type);
  const typeBadge = getQuestTypeBadge(quest.quest_type);
  const domainInfo = DOMAIN_INFO[quest.domain];
  const contextConfig = quest.context ? getContextConfig(quest.context) : null;
  const bonusPoints = streakMultiplier > 1 ? Math.round(quest.points_reward * (streakMultiplier - 1)) : 0;

  const handleComplete = async () => {
    setIsCompleting(true);
    // Simulate completion animation
    await new Promise((r) => setTimeout(r, 500));
    onComplete();
    setIsCompleting(false);
  };

  const isCompleted = quest.status === "completed";
  const isInProgress = quest.status === "in_progress";
  const hasProgress = quest.progress !== undefined && quest.target !== undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={spring.snappy}
      className={cn(
        "border border-border rounded-lg overflow-hidden transition-colors",
        isCompleted ? "bg-muted/30 border-green-500/30" : "bg-card hover:border-muted-foreground/30"
      )}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleComplete}
            disabled={isCompleted || isCompleting}
            className={cn(
              "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all mt-0.5",
              isCompleted
                ? "bg-green-500 border-green-500"
                : isCompleting
                ? "border-green-500 animate-pulse"
                : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            <AnimatePresence mode="wait">
              {(isCompleted || isCompleting) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={cn("text-[9px] font-medium tracking-wider px-1.5 py-0.5 rounded", typeBadge.color)}
              >
                {typeBadge.text}
              </span>
              {contextConfig && (
                <span
                  className="text-[9px] font-medium tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${contextConfig.color}15`,
                    color: contextConfig.color,
                  }}
                >
                  {contextConfig.name.toUpperCase()}
                </span>
              )}
              {quest.due_date && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDueDate(quest.due_date)}
                </span>
              )}
            </div>

            <h3
              className={cn(
                "font-medium text-sm",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {quest.title}
            </h3>

            {quest.description && isExpanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-muted-foreground mt-1"
              >
                {quest.description}
              </motion.p>
            )}

            {/* Progress bar for quests with progress */}
            {hasProgress && !isCompleted && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{quest.progress}/{quest.target}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(quest.progress! / quest.target!) * 100}%`,
                      backgroundColor: domainInfo.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Points */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1">
              <span
                className="text-sm font-bold"
                style={{ color: domainInfo.color }}
              >
                +{quest.points_reward}
              </span>
              {bonusPoints > 0 && (
                <span className="text-[10px] text-orange-500 flex items-center">
                  <Flame className="w-3 h-3" />
                  +{bonusPoints}
                </span>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {domainInfo.name}
            </span>
          </div>

          {/* Expand */}
          {quest.description && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded transition-colors shrink-0"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// QUEST LIST COMPONENT
// ============================================================================

export function QuestList({
  quests,
  onComplete,
  onStart,
  streakDays = 0,
  className,
}: QuestListProps) {
  const [filter, setFilter] = useState<"all" | "daily" | "weekly" | "tasks">("all");

  const streakMultiplier = getStreakMultiplier(streakDays);

  // Filter and sort quests
  const filteredQuests = quests.filter((q) => {
    if (filter === "all") return q.status !== "completed";
    if (filter === "daily") return q.quest_type === "daily" && q.status !== "completed";
    if (filter === "weekly") return q.quest_type === "weekly" && q.status !== "completed";
    if (filter === "tasks") return q.quest_type === "task" && q.status !== "completed";
    return true;
  });

  const completedQuests = quests.filter((q) => q.status === "completed");

  // Calculate potential points
  const potentialPoints = filteredQuests.reduce(
    (acc, q) => acc + Math.round(q.points_reward * streakMultiplier),
    0
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quests</h2>
          <p className="text-xs text-muted-foreground">
            {potentialPoints.toLocaleString()} potential points
            {streakMultiplier > 1 && (
              <span className="text-orange-500 ml-1">
                (×{streakMultiplier} streak bonus!)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {([
          { key: "all", label: "All" },
          { key: "daily", label: "Daily" },
          { key: "weekly", label: "Weekly" },
          { key: "tasks", label: "Tasks" },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quest Items */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredQuests.map((quest) => (
            <QuestItem
              key={quest.id}
              quest={quest}
              onComplete={() => onComplete(quest.id)}
              onStart={onStart ? () => onStart(quest.id) : undefined}
              streakMultiplier={streakMultiplier}
            />
          ))}
        </AnimatePresence>

        {filteredQuests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs">No quests matching this filter</p>
          </div>
        )}
      </div>

      {/* Completed Section */}
      {completedQuests.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">
            Completed ({completedQuests.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedQuests.slice(0, 3).map((quest) => (
              <QuestItem
                key={quest.id}
                quest={quest}
                onComplete={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
