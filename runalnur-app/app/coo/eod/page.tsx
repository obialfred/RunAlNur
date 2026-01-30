"use client";

import Link from "next/link";
import { useBriefing } from "@/lib/hooks/useCOO";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, Moon } from "lucide-react";
import type { COODaySummary } from "@/lib/coo/types";

export default function COOEndOfDayPage() {
  const { briefing, loading, error, refresh } = useBriefing("evening");
  const summary = briefing as unknown as COODaySummary | null;

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">End of Day</h1>
            <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              COO Summary
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Honest assessment, scorecard, and tomorrow preview.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm" variant="outline" className="h-8 px-3 text-[10px] font-medium tracking-wider uppercase">
            <Link href="/coo">
              <ArrowLeft className="w-3 h-3 mr-2" />
              Back
            </Link>
          </Button>
          <Button
            size="sm"
            className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </FadeIn>

      {error ? (
        <FadeIn className="agentic-card border-l-4 border-l-[var(--error)]">
          <div className="agentic-card-content">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        </FadeIn>
      ) : loading && !summary ? (
        <FadeIn className="agentic-card">
          <div className="agentic-card-content flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground mr-3" />
            <span className="text-sm text-muted-foreground">Generating end-of-day summary...</span>
          </div>
        </FadeIn>
      ) : !summary ? (
        <FadeIn className="agentic-card">
          <div className="agentic-card-content">
            <p className="text-sm text-muted-foreground">
              No summary yet. Click <strong>Generate</strong>.
            </p>
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-4">
          <FadeIn className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="agentic-card">
              <div className="agentic-card-content">
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-xl font-semibold tabular-nums">
                  {summary.scorecard.prioritiesCompleted}/{summary.scorecard.prioritiesTotal}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((summary.scorecard.completionRate || 0) * 100)}%
                </p>
              </div>
            </div>
            <div className="agentic-card">
              <div className="agentic-card-content">
                <p className="text-xs text-muted-foreground">Focus time</p>
                <p className="text-xl font-semibold tabular-nums">{summary.scorecard.focusTimeMinutes}m</p>
                <p className="text-xs text-muted-foreground mt-1">Tracked via focus sessions</p>
              </div>
            </div>
            <div className="agentic-card">
              <div className="agentic-card-content">
                <p className="text-xs text-muted-foreground">Deferred</p>
                <p className="text-xl font-semibold tabular-nums">{summary.scorecard.deferredTasks?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Titles carried forward</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn className="agentic-card">
            <div className="agentic-card-content space-y-3">
              <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                Assessment
              </p>
              <p className="text-sm leading-relaxed">{summary.assessment}</p>
            </div>
          </FadeIn>

          <FadeIn className="agentic-card">
            <div className="agentic-card-content space-y-3">
              <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                Tomorrow preview
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                {(summary.tomorrowPreview || []).map((t, idx) => (
                  <li key={idx}>• {t}</li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {(summary.scorecard.deferredTasks?.length || 0) > 0 && (
            <FadeIn className="agentic-card">
              <div className="agentic-card-content space-y-3">
                <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                  Deferred tasks
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {summary.scorecard.deferredTasks.map((t, idx) => (
                    <li key={idx}>• {t}</li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          )}
        </div>
      )}
    </div>
  );
}

