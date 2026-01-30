"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowLeft, Save } from "lucide-react";
import { usePreferences } from "@/lib/hooks/useCOO";
import type { COOPreferences } from "@/lib/coo/types";

type Draft = Pick<
  COOPreferences,
  | "morning_briefing_time"
  | "evening_summary_time"
  | "max_priorities"
  | "push_intensity"
  | "preferred_model"
  | "timezone"
  | "briefing_enabled"
  | "accountability_enabled"
>;

export default function COOSettingsPage() {
  const { preferences, loading, error, update, refresh } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [overrides, setOverrides] = useState<Partial<Draft>>({});

  const baseDraft: Draft | null = useMemo(() => {
    if (!preferences) return null;
    return {
      morning_briefing_time: preferences.morning_briefing_time,
      evening_summary_time: preferences.evening_summary_time,
      max_priorities: preferences.max_priorities,
      push_intensity: preferences.push_intensity,
      preferred_model: preferences.preferred_model,
      timezone: preferences.timezone,
      briefing_enabled: preferences.briefing_enabled,
      accountability_enabled: preferences.accountability_enabled,
    };
  }, [preferences]);

  const draft: Draft | null = useMemo(() => {
    if (!baseDraft) return null;
    return { ...baseDraft, ...overrides };
  }, [baseDraft, overrides]);

  const isDirty = useMemo(() => {
    if (!baseDraft || !draft) return false;
    return (
      draft.morning_briefing_time !== baseDraft.morning_briefing_time ||
      draft.evening_summary_time !== baseDraft.evening_summary_time ||
      draft.max_priorities !== baseDraft.max_priorities ||
      draft.push_intensity !== baseDraft.push_intensity ||
      draft.preferred_model !== baseDraft.preferred_model ||
      draft.timezone !== baseDraft.timezone ||
      draft.briefing_enabled !== baseDraft.briefing_enabled ||
      draft.accountability_enabled !== baseDraft.accountability_enabled
    );
  }, [baseDraft, draft]);

  const onSave = async () => {
    if (!draft) return;
    setSaving(true);
    const ok = await update(draft);
    if (ok) setOverrides({});
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">COO Settings</h1>
            <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              Preferences
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Tune how your COO briefs you and pushes you.</p>
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
            variant="outline"
            className="h-8 px-3 text-[10px] font-medium tracking-wider uppercase"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={loading ? "w-3 h-3 mr-2 animate-spin" : "w-3 h-3 mr-2"} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-8 px-4 text-[10px] font-medium tracking-wider uppercase"
            onClick={onSave}
            disabled={saving || !draft || !isDirty}
          >
            {saving ? (
              <>
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-2" />
                Save
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
      ) : null}

      <FadeIn className="agentic-card">
        <div className="agentic-card-content space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Morning briefing time</p>
              <Input
                type="time"
                value={draft?.morning_briefing_time ?? ""}
                onChange={(e) =>
                  setOverrides((o) => ({ ...o, morning_briefing_time: e.target.value }))
                }
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Evening summary time</p>
              <Input
                type="time"
                value={draft?.evening_summary_time ?? ""}
                onChange={(e) =>
                  setOverrides((o) => ({ ...o, evening_summary_time: e.target.value }))
                }
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Max priorities</p>
              <Input
                type="number"
                min={1}
                max={10}
                value={draft?.max_priorities ?? 3}
                onChange={(e) =>
                  setOverrides((o) => ({
                    ...o,
                    max_priorities: Math.max(1, Math.min(10, Number(e.target.value || 3))),
                  }))
                }
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Timezone</p>
              <Input
                value={draft?.timezone ?? ""}
                placeholder="e.g., America/Chicago"
                onChange={(e) => setOverrides((o) => ({ ...o, timezone: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Push intensity</p>
              <select
                className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
                value={draft?.push_intensity ?? "medium"}
                onChange={(e) =>
                  setOverrides((o) => ({ ...o, push_intensity: e.target.value as Draft["push_intensity"] }))
                }
              >
                <option value="gentle">gentle</option>
                <option value="medium">medium</option>
                <option value="aggressive">aggressive</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Preferred model</p>
              <select
                className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
                value={draft?.preferred_model ?? "opus"}
                onChange={(e) =>
                  setOverrides((o) => ({ ...o, preferred_model: e.target.value as Draft["preferred_model"] }))
                }
              >
                <option value="opus">opus</option>
                <option value="gemini">gemini</option>
                <option value="both">both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between gap-3 rounded-sm border border-border p-3">
              <div>
                <div className="text-sm font-medium">Briefings enabled</div>
                <div className="text-xs text-muted-foreground">Allow morning/evening briefings.</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(draft?.briefing_enabled)}
                onChange={(e) => setOverrides((o) => ({ ...o, briefing_enabled: e.target.checked }))}
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-sm border border-border p-3">
              <div>
                <div className="text-sm font-medium">Accountability enabled</div>
                <div className="text-xs text-muted-foreground">Enable check-ins and nudges.</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(draft?.accountability_enabled)}
                onChange={(e) => setOverrides((o) => ({ ...o, accountability_enabled: e.target.checked }))}
              />
            </label>
          </div>

          {draft && preferences && isDirty && (
            <div className="text-xs text-muted-foreground">
              You have unsaved changes.
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

