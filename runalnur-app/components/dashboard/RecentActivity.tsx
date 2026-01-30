"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatDistanceToNow } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Activity as ActivityType } from "@/lib/types";
import { ARMS } from "@/lib/constants";

interface RecentActivityProps {
  activities: ActivityType[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="agentic-card h-full flex flex-col">
      <div className="agentic-card-header flex items-center justify-between">
        <h2 className="text-section">Activity</h2>
        <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse" />
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} index={index} />
          ))}
          
          {activities.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ActivityItemProps {
  activity: ActivityType;
  index: number;
}

function ActivityItem({ activity, index }: ActivityItemProps) {
  const shouldReduce = useReducedMotion();
  const arm = ARMS.find(a => a.id === activity.arm_id);

  // Icon based on activity type
  const getActivityIcon = () => {
    if (activity.type.includes('project')) return '📁';
    if (activity.type.includes('task')) return '✓';
    if (activity.type.includes('contact')) return '👤';
    if (activity.type.includes('sop')) return '📋';
    return '•';
  };

  return (
    <motion.div
      className="px-5 py-4 group cursor-pointer hover:bg-muted/30 transition-colors"
      initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, ...spring.default }}
    >
      <div className="flex items-start gap-3">
        <span className="text-base opacity-50 mt-0.5">
          {getActivityIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">
            {activity.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {arm && (
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground px-1.5 py-0.5 bg-muted rounded-sm">
                {arm.name}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(activity.created_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
