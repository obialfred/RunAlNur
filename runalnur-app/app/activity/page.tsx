"use client";

import { useActivities } from "@/lib/hooks/useActivities";
import { FadeIn } from "@/components/motion/FadeIn";
import { EmptyState } from "@/components/rive/EmptyState";
import { Stagger } from "@/components/motion/Stagger";
import { SlideIn } from "@/components/motion/SlideIn";
import { formatDistanceToNow } from "@/lib/utils";
import type { Activity } from "@/lib/types";

export default function ActivityPage() {
  const { data: activities } = useActivities();

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full audit timeline across all arms
        </p>
      </FadeIn>

      {activities.length === 0 ? (
        <FadeIn className="agentic-card">
          <EmptyState
            title="No activity yet"
            description="All operations will appear here in real time."
            riveSrc="/rive/empty-activity.riv"
          />
        </FadeIn>
      ) : (
        <Stagger className="agentic-card divide-y divide-border">
          {activities.map((activity: Activity) => (
            <SlideIn key={activity.id} className="px-5 py-4">
              <div className="text-sm">{activity.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(activity.created_at)}
              </div>
            </SlideIn>
          ))}
        </Stagger>
      )}
    </div>
  );
}
