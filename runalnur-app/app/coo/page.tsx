"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { PriorityCard } from "@/components/coo/PriorityCard";
import { useFocusSession, usePriorities, useCheckin } from "@/lib/hooks/useCOO";
import Link from "next/link";
import { Sparkles, RefreshCw, MessageSquare, Clock, Target, Zap, Settings, Moon } from "lucide-react";
import { useState } from "react";
import type { COOPriorityItem } from "@/lib/coo/types";

export default function COOPage() {
  const { priorityRecordId, priorities, loading, error, generate, accept, updateStatus } = usePriorities();
  const { checkin, loading: checkinLoading, request: requestCheckin } = useCheckin();
  const {
    activeSession,
    todayMinutes,
    loading: sessionsLoading,
    error: sessionsError,
    start: startSession,
    pause: pauseSession,
    end: endSession,
  } = useFocusSession();
  const [generating, setGenerating] = useState(false);
  const [activePriority, setActivePriority] = useState<number | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    await generate();
    setGenerating(false);
  };

  const handleStartPriority = async (rank: number) => {
    const p = priorities?.find((x) => x.rank === rank);
    if (!p) return;
    updateStatus(rank, "in_progress");
    setActivePriority(rank);
    try {
      await startSession({
        priorityId: priorityRecordId,
        priorityRank: rank,
        taskId: p.taskId ?? null,
        taskTitle: p.title,
      });
    } catch {
      // error surfaced by hook; keep UI responsive
    }
  };

  const handlePausePriority = async (rank: number) => {
    updateStatus(rank, "pending");
    setActivePriority(null);
    try {
      if (activeSession?.id) {
        await pauseSession(activeSession.id);
      }
    } catch {
      // error surfaced by hook
    }
  };

  const handleCompletePriority = async (rank: number) => {
    updateStatus(rank, "completed");
    setActivePriority(null);
    try {
      if (activeSession?.id) {
        await endSession(activeSession.id, "completed");
      }
    } catch {
      // error surfaced by hook
    }
  };

  const handleDeferPriority = async (rank: number) => {
    updateStatus(rank, "deferred");
    if (activePriority === rank) {
      setActivePriority(null);
    }
    try {
      if (activeSession?.id) {
        await endSession(activeSession.id, "deferred");
      }
    } catch {
      // error surfaced by hook
    }
  };

  // Calculate stats
  const completedCount = priorities?.filter(p => p.status === 'completed').length || 0;
  const totalCount = priorities?.length || 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">COO</h1>
            <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              Chief Operating Officer
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getGreeting()}. It&apos;s {today}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot live" />
          <span className="text-xs text-muted-foreground font-mono">OPUS + GEMINI</span>
        </div>
      </FadeIn>

      {/* Action Bar */}
      <FadeIn className="flex items-center gap-4">
        <Button
          size="sm"
          className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
          onClick={handleGenerate}
          disabled={generating || loading}
        >
          {generating ? (
            <>
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-2" />
              {priorities ? 'Regenerate' : 'Generate'} Priorities
            </>
          )}
        </Button>

        {priorities && priorities.length > 0 && !priorities.some(p => p.status !== 'pending') && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
            onClick={accept}
          >
            <Target className="w-3 h-3 mr-2" />
            Accept Plan
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
          onClick={requestCheckin}
          disabled={checkinLoading || !priorities}
        >
          <MessageSquare className="w-3 h-3 mr-2" />
          Check-in
        </Button>

        <div className="flex-1" />

        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
        >
          <Link href="/coo/eod">
            <Moon className="w-3 h-3 mr-2" />
            EOD
          </Link>
        </Button>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
        >
          <Link href="/coo/settings">
            <Settings className="w-3 h-3 mr-2" />
            Settings
          </Link>
        </Button>
      </FadeIn>

      {/* Stats Row */}
      {priorities && priorities.length > 0 && (
        <FadeIn className="grid grid-cols-3 gap-4">
          <div className="agentic-card">
            <div className="agentic-card-content flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[var(--emerald)]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[var(--emerald)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold tabular-nums">{completedCount}/{totalCount}</p>
              </div>
            </div>
          </div>

          <div className="agentic-card">
            <div className="agentic-card-content flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[var(--sapphire)]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[var(--sapphire)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Focus</p>
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {activePriority 
                    ? priorities.find(p => p.rank === activePriority)?.title || 'None'
                    : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="agentic-card">
            <div className="agentic-card-content flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Focus Time</p>
                <p className="text-xl font-semibold tabular-nums">
                  {sessionsLoading ? "—" : `${todayMinutes}m`}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {sessionsError && (
        <FadeIn className="agentic-card border-l-4 border-l-[var(--warning)]">
          <div className="agentic-card-content">
            <p className="text-sm text-muted-foreground">{sessionsError}</p>
          </div>
        </FadeIn>
      )}

      {/* Check-in Message */}
      {checkin && (
        <FadeIn className="agentic-card border-l-4 border-l-[var(--sapphire)]">
          <div className="agentic-card-content">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-sm bg-foreground text-background flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-2">
                  {checkin.tone.toUpperCase()} CHECK-IN
                </p>
                <p className="text-sm leading-relaxed">{checkin.message}</p>
                {checkin.nudge && (
                  <p className="text-sm text-foreground font-medium mt-2">
                    → {checkin.nudge}
                  </p>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Priorities List */}
      {loading ? (
        <FadeIn className="agentic-card">
          <div className="agentic-card-content flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground mr-3" />
            <span className="text-sm text-muted-foreground">Loading priorities...</span>
          </div>
        </FadeIn>
      ) : error ? (
        <FadeIn className="agentic-card border-l-4 border-l-[var(--error)]">
          <div className="agentic-card-content">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        </FadeIn>
      ) : !priorities || priorities.length === 0 ? (
        <FadeIn className="agentic-card">
          <div className="agentic-card-content flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No priorities generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Click &quot;Generate Priorities&quot; to have your COO analyze your tasks and
              create today&apos;s focus plan based on House Al Nur priorities.
            </p>
          </div>
        </FadeIn>
      ) : (
        <FadeIn className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-section">Today&apos;s Priorities</h2>
            <span className="text-xs text-muted-foreground">
              Powered by Opus + Guru
            </span>
          </div>

          {priorities.map((priority) => (
            <PriorityCard
              key={priority.rank}
              priority={priority}
              isActive={activePriority === priority.rank}
              onStart={() => handleStartPriority(priority.rank)}
              onPause={() => handlePausePriority(priority.rank)}
              onComplete={() => handleCompletePriority(priority.rank)}
              onDefer={() => handleDeferPriority(priority.rank)}
            />
          ))}
        </FadeIn>
      )}

      {/* Quick Tips */}
      <FadeIn className="agentic-card bg-muted/50">
        <div className="agentic-card-content">
          <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-3">
            How it works
          </p>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>• <strong>Generate:</strong> COO analyzes your ClickUp tasks against House Al Nur priorities from Guru</li>
            <li>• <strong>Start:</strong> Begin a focus session on a priority (tracked for accountability)</li>
            <li>• <strong>Check-in:</strong> Get accountability feedback based on your progress</li>
            <li>• <strong>Defer:</strong> Move a task to tomorrow (pattern tracked)</li>
          </ul>
        </div>
      </FadeIn>
    </div>
  );
}
