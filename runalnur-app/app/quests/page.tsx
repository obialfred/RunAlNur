"use client";

import { useState, useCallback } from "react";
import { FadeIn, Stagger } from "@/components/motion";
import { QuestList, Quest } from "@/components/gamification/QuestList";
import { StreakDisplay, ContributionGrid } from "@/components/gamification/StreakDisplay";
import { StandingOverview } from "@/components/gamification/StandingCard";
import { StandingPoints, StandingDomain, DOMAIN_INFO } from "@/lib/gamification/standing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for demonstration
const MOCK_QUESTS: Quest[] = [
  {
    id: "1",
    title: "Complete daily inbox review",
    description: "Review and process all items in your inbox",
    quest_type: "daily",
    points_reward: 15,
    domain: "command",
    status: "available",
  },
  {
    id: "2",
    title: "Review property pipeline",
    description: "Check status of all properties in the pipeline",
    context: "janna",
    quest_type: "daily",
    points_reward: 20,
    domain: "command",
    status: "available",
  },
  {
    id: "3",
    title: "Complete RunAlNur AI features",
    description: "Implement the agentic COO system",
    context: "nova",
    quest_type: "milestone",
    points_reward: 100,
    domain: "command",
    status: "in_progress",
    progress: 6,
    target: 7,
  },
  {
    id: "4",
    title: "Weekly financial review",
    description: "Review all financial accounts and transactions",
    quest_type: "weekly",
    points_reward: 50,
    domain: "capital",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "available",
  },
  {
    id: "5",
    title: "Connect with 3 contacts",
    description: "Reach out to maintain key relationships",
    quest_type: "weekly",
    points_reward: 30,
    domain: "influence",
    status: "available",
  },
  {
    id: "6",
    title: "Music production session",
    description: "2 hours of focused creative work",
    context: "obx",
    quest_type: "task",
    points_reward: 25,
    domain: "growth",
    status: "available",
  },
  {
    id: "7",
    title: "Morning workout completed",
    quest_type: "daily",
    points_reward: 10,
    domain: "reliability",
    status: "completed",
    completed_at: new Date().toISOString(),
  },
];

const MOCK_STANDING: StandingPoints[] = [
  {
    id: "1",
    user_id: "user-1",
    domain: "command",
    points: 450,
    level: 2,
    streak_days: 12,
    longest_streak: 15,
    streak_shields: 2,
    last_activity_at: new Date().toISOString(),
    streak_broken_at: null,
    points_to_next_level: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user-1",
    domain: "capital",
    points: 280,
    level: 2,
    streak_days: 8,
    longest_streak: 10,
    streak_shields: 1,
    last_activity_at: new Date().toISOString(),
    streak_broken_at: null,
    points_to_next_level: 220,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    user_id: "user-1",
    domain: "influence",
    points: 150,
    level: 2,
    streak_days: 5,
    longest_streak: 7,
    streak_shields: 0,
    last_activity_at: new Date().toISOString(),
    streak_broken_at: null,
    points_to_next_level: 350,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    user_id: "user-1",
    domain: "reliability",
    points: 520,
    level: 3,
    streak_days: 12,
    longest_streak: 15,
    streak_shields: 3,
    last_activity_at: new Date().toISOString(),
    streak_broken_at: null,
    points_to_next_level: 980,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    user_id: "user-1",
    domain: "growth",
    points: 85,
    level: 1,
    streak_days: 3,
    longest_streak: 5,
    streak_shields: 0,
    last_activity_at: new Date().toISOString(),
    streak_broken_at: null,
    points_to_next_level: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate mock contributions
const generateMockContributions = () => {
  const contributions: Array<{ date: string; count: number }> = [];
  const today = new Date();
  
  for (let i = 84; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    // Random activity with some patterns
    const dayOfWeek = date.getDay();
    const baseCount = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 3;
    const count = Math.floor(Math.random() * baseCount) + (i < 14 ? 1 : 0);
    
    contributions.push({ date: dateStr, count });
  }
  
  return contributions;
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);
  const [standing, setStanding] = useState<StandingPoints[]>(MOCK_STANDING);
  const contributions = generateMockContributions();

  const currentStreak = Math.max(...standing.map((s) => s.streak_days));
  const longestStreak = Math.max(...standing.map((s) => s.longest_streak));
  const totalShields = standing.reduce((acc, s) => acc + s.streak_shields, 0);

  const handleQuestComplete = useCallback((questId: string) => {
    setQuests((prev) =>
      prev.map((q) =>
        q.id === questId
          ? { ...q, status: "completed" as const, completed_at: new Date().toISOString() }
          : q
      )
    );
    
    // In real app, this would award points and update standing
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quests</h1>
          <p className="text-muted-foreground">
            Complete quests to earn Standing and level up
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Quest List */}
        <div className="lg:col-span-2 space-y-6">
          <FadeIn delay={0.05}>
            <QuestList
              quests={quests}
              onComplete={handleQuestComplete}
              streakDays={currentStreak}
            />
          </FadeIn>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Streak Display */}
          <FadeIn delay={0.1}>
            <StreakDisplay
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              shields={totalShields}
              lastActivityDate={new Date().toISOString()}
            />
          </FadeIn>

          {/* Activity Grid */}
          <FadeIn delay={0.15}>
            <div className="bg-card border border-border rounded-lg p-4">
              <ContributionGrid contributions={contributions} weeks={12} />
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Standing Overview */}
      <FadeIn delay={0.2}>
        <div className="pt-6 border-t border-border">
          <h2 className="text-lg font-semibold mb-4">Your Standing</h2>
          <StandingOverview standings={standing} />
        </div>
      </FadeIn>
    </div>
  );
}
