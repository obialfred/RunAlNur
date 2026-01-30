/**
 * Standing System - Gamification Core
 * 
 * Manages points, levels, streaks, and achievements
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export type StandingDomain = "command" | "capital" | "influence" | "reliability" | "growth";

export interface StandingPoints {
  id: string;
  user_id: string;
  domain: StandingDomain;
  points: number;
  level: number;
  streak_days: number;
  longest_streak: number;
  streak_shields: number;
  last_activity_at: string | null;
  streak_broken_at: string | null;
  points_to_next_level: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  title: string;
  description: string;
  category: "streak" | "completion" | "domain" | "special" | "social";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  icon?: string;
  color?: string;
  progress: number;
  target: number;
  unlocked_at: string;
}

// ============================================================================
// LEVEL CONFIGURATION
// ============================================================================

export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, title: "Initiate" },
  { level: 2, points: 100, title: "Steward" },
  { level: 3, points: 500, title: "Chamberlain" },
  { level: 4, points: 1500, title: "Vizier" },
  { level: 5, points: 5000, title: "Regent" },
];

export const DOMAIN_INFO: Record<StandingDomain, { name: string; description: string; color: string }> = {
  command: {
    name: "Command",
    description: "Completing tasks, decisions made",
    color: "#3B82F6",
  },
  capital: {
    name: "Capital",
    description: "Financial tasks, investment reviews",
    color: "#10B981",
  },
  influence: {
    name: "Influence",
    description: "Relationship touchpoints, meetings",
    color: "#8B5CF6",
  },
  reliability: {
    name: "Reliability",
    description: "Shift completion, consistency",
    color: "#F59E0B",
  },
  growth: {
    name: "Growth",
    description: "Learning, training, skill development",
    color: "#EC4899",
  },
};

// ============================================================================
// LEVEL CALCULATIONS
// ============================================================================

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

export function getPointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  const nextLevelConfig = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
  if (!nextLevelConfig) return 0; // Max level
  return nextLevelConfig.points - points;
}

export function getLevelProgress(points: number): number {
  const currentLevel = calculateLevel(points);
  const currentLevelConfig = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel);
  const nextLevelConfig = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
  
  if (!currentLevelConfig || !nextLevelConfig) return 100;
  
  const levelPoints = points - currentLevelConfig.points;
  const levelRange = nextLevelConfig.points - currentLevelConfig.points;
  
  return Math.round((levelPoints / levelRange) * 100);
}

export function getLevelTitle(level: number): string {
  const config = LEVEL_THRESHOLDS.find((l) => l.level === level);
  return config?.title || "Unknown";
}

// ============================================================================
// STREAK CALCULATIONS
// ============================================================================

export function isStreakBroken(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false;
  
  const lastActivity = new Date(lastActivityAt);
  const now = new Date();
  
  // Reset at midnight local time
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  return lastActivity < yesterday;
}

export function getStreakMultiplier(streakDays: number): number {
  // Bonus multiplier based on streak
  if (streakDays >= 100) return 2.0;
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 7) return 1.25;
  return 1.0;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get user's standing across all domains
 */
export async function getUserStanding(tenantId: string, userId: string): Promise<StandingPoints[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("standing_points")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (error || !data) return [];

  // Cast data to the proper type
  const standings = data as unknown as StandingPoints[];

  // Check for broken streaks
  const updatedStandings = await Promise.all(
    standings.map(async (standing) => {
      if (standing.streak_days > 0 && isStreakBroken(standing.last_activity_at)) {
        // Check for streak shields
        if (standing.streak_shields > 0) {
          // Use a shield
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("standing_points")
            .update({
              streak_shields: standing.streak_shields - 1,
              last_activity_at: new Date().toISOString(),
            })
            .eq("id", standing.id);
          
          return { ...standing, streak_shields: standing.streak_shields - 1 };
        } else {
          // Break streak
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("standing_points")
            .update({
              streak_days: 0,
              streak_broken_at: new Date().toISOString(),
            })
            .eq("id", standing.id);
          
          return { ...standing, streak_days: 0 };
        }
      }
      return standing;
    })
  );

  return updatedStandings as StandingPoints[];
}

/**
 * Award points to a user in a specific domain
 */
export async function awardPoints(
  tenantId: string,
  userId: string,
  domain: StandingDomain,
  basePoints: number,
  reason?: string
): Promise<{ success: boolean; newTotal?: number; levelUp?: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false };

  // Get current standing for this domain
  const { data: standingData } = await supabase
    .from("standing_points")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("domain", domain)
    .single();

  let standing = standingData as unknown as StandingPoints | null;

  // Create if doesn't exist
  if (!standing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newStanding, error } = await (supabase as any)
      .from("standing_points")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        domain,
        points: 0,
        level: 1,
        streak_days: 0,
        longest_streak: 0,
        streak_shields: 0,
      })
      .select()
      .single();

    if (error) return { success: false };
    standing = newStanding as StandingPoints;
  }

  // Calculate points with streak multiplier
  const multiplier = getStreakMultiplier(standing.streak_days);
  const earnedPoints = Math.round(basePoints * multiplier);
  const newTotal = standing.points + earnedPoints;
  const newLevel = calculateLevel(newTotal);
  const levelUp = newLevel > standing.level;

  // Update standing
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = standing.last_activity_at 
    ? new Date(standing.last_activity_at) 
    : null;
  
  let newStreak = standing.streak_days;
  
  if (lastActivity) {
    const lastActivityDay = new Date(lastActivity);
    lastActivityDay.setHours(0, 0, 0, 0);
    
    if (lastActivityDay.getTime() < today.getTime()) {
      // New day, increment streak
      newStreak = standing.streak_days + 1;
    }
  } else {
    // First activity
    newStreak = 1;
  }

  const longestStreak = Math.max(standing.longest_streak, newStreak);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("standing_points")
    .update({
      points: newTotal,
      level: newLevel,
      streak_days: newStreak,
      longest_streak: longestStreak,
      points_to_next_level: getPointsToNextLevel(newTotal),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", standing.id)
    .eq("tenant_id", tenantId);

  // Check for achievements
  await checkAndAwardAchievements(tenantId, userId, domain, newTotal, newStreak);

  return { success: true, newTotal, levelUp };
}

/**
 * Award a streak shield (earned through consistency)
 */
export async function awardStreakShield(
  tenantId: string,
  userId: string,
  domain: StandingDomain
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("increment_streak_shield", {
    p_user_id: userId,
    p_domain: domain,
  });

  // If RPC doesn't exist, do it manually
  if (error) {
    const { data: standingData } = await supabase
      .from("standing_points")
      .select("streak_shields")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("domain", domain)
      .single();

    const standing = standingData as { streak_shields: number } | null;
    if (!standing) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("standing_points")
      .update({ streak_shields: standing.streak_shields + 1 })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("domain", domain);
  }

  return true;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

const ACHIEVEMENT_DEFINITIONS = [
  { key: "first_quest", title: "First Blood", description: "Complete your first quest", target: 1, category: "completion" as const, rarity: "common" as const },
  { key: "week_warrior", title: "Week Warrior", description: "7-day streak", target: 7, category: "streak" as const, rarity: "common" as const },
  { key: "month_focus", title: "Month of Focus", description: "30-day streak", target: 30, category: "streak" as const, rarity: "rare" as const },
  { key: "century", title: "Century", description: "100-day streak", target: 100, category: "streak" as const, rarity: "epic" as const },
  { key: "domain_master_command", title: "Master of Command", description: "Reach max level in Command", target: 5000, category: "domain" as const, rarity: "legendary" as const },
  { key: "domain_master_capital", title: "Master of Capital", description: "Reach max level in Capital", target: 5000, category: "domain" as const, rarity: "legendary" as const },
  { key: "domain_master_influence", title: "Master of Influence", description: "Reach max level in Influence", target: 5000, category: "domain" as const, rarity: "legendary" as const },
];

async function checkAndAwardAchievements(
  tenantId: string,
  userId: string,
  domain: StandingDomain,
  points: number,
  streak: number
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const achievementsToCheck = [
    { key: "first_quest", progress: points > 0 ? 1 : 0, target: 1 },
    { key: "week_warrior", progress: streak, target: 7 },
    { key: "month_focus", progress: streak, target: 30 },
    { key: "century", progress: streak, target: 100 },
    { key: `domain_master_${domain}`, progress: points, target: 5000 },
  ];

  for (const check of achievementsToCheck) {
    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.key === check.key);
    if (!def) continue;

    // Check if already unlocked
    const { data: existing } = await supabase
      .from("achievements")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("achievement_key", check.key)
      .single();

    if (existing) continue;

    // Check if achieved
    if (check.progress >= check.target) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("achievements")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          achievement_key: check.key,
          title: def.title,
          description: def.description,
          category: def.category,
          rarity: def.rarity,
          progress: check.progress,
          target: check.target,
        });
    }
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(tenantId: string, userId: string): Promise<Achievement[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  return (data || []) as Achievement[];
}
