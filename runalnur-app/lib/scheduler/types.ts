/**
 * Scheduler Types
 * Types for the Motion/Sunsama/Reclaim-inspired auto-scheduling engine
 */

import type { Task, TaskPriorityLevel } from '@/lib/types';
import type { FocusBlock, FocusContext } from '@/lib/calendar/types';

/**
 * User scheduling preferences
 */
export interface SchedulerPreferences {
  // Working hours
  workingHours: {
    start: string; // HH:MM format, e.g., "09:00"
    end: string;   // HH:MM format, e.g., "18:00"
  };
  
  // Focus time protection (Reclaim-style)
  focusTimeGoal: number; // minutes/day to protect for deep work
  
  // Buffer between blocks
  bufferMinutes: number;
  
  // Preferred task durations
  defaultDuration: number; // minutes
  
  // Days to look ahead for scheduling
  schedulingHorizon: number; // days
  
  // Timezone
  timezone: string;
}

/**
 * Default preferences
 */
export const DEFAULT_SCHEDULER_PREFERENCES: SchedulerPreferences = {
  workingHours: { start: '09:00', end: '18:00' },
  focusTimeGoal: 120, // 2 hours deep work
  bufferMinutes: 15,
  defaultDuration: 30,
  schedulingHorizon: 14, // 2 weeks
  timezone: 'America/Chicago',
};

/**
 * Time slot representing available time
 */
export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

/**
 * Scheduled task result
 */
export interface ScheduledTask {
  task: Task;
  scheduledStart: Date;
  scheduledEnd: Date;
  focusBlockId?: string; // If a Focus Block was created
  conflictResolution?: {
    bumpedTaskIds: string[];
    reason: string;
  };
}

/**
 * At-risk task (will miss deadline)
 */
export interface AtRiskTask {
  task: Task;
  dueDate: Date;
  reason: string;
  suggestedAction: string;
  requiredHours: number;
  availableHours: number;
}

/**
 * Scheduler input
 */
export interface SchedulerInput {
  tasks: Task[];
  existingBlocks: FocusBlock[];
  preferences: SchedulerPreferences;
  targetDate?: Date; // Specific date to schedule for (default: today)
}

/**
 * Scheduler output
 */
export interface SchedulerResult {
  scheduledTasks: ScheduledTask[];
  unscheduledTasks: Task[]; // Tasks that couldn't be scheduled
  atRiskTasks: AtRiskTask[];
  createdBlocks: Partial<FocusBlock>[];
  summary: {
    totalScheduled: number;
    totalUnscheduled: number;
    totalAtRisk: number;
    totalMinutesScheduled: number;
    focusTimeProtected: number;
  };
}

/**
 * Conflict detection result
 */
export interface ConflictResult {
  hasConflict: boolean;
  conflictingBlocks: FocusBlock[];
  suggestion?: {
    action: 'bump' | 'reschedule' | 'split';
    details: string;
  };
}

/**
 * Priority weight for sorting
 */
export const PRIORITY_WEIGHTS: Record<TaskPriorityLevel, number> = {
  p1: 100, // Critical - must happen today
  p2: 75,  // High - important, schedule soon
  p3: 50,  // Medium - normal work
  p4: 25,  // Low - nice to have
};

/**
 * Duration estimates by task type/keywords
 */
export const DURATION_ESTIMATES: Record<string, number> = {
  call: 30,
  meeting: 60,
  review: 45,
  write: 90,
  email: 15,
  research: 120,
  planning: 60,
  default: 30,
};

/**
 * Context to priority mapping hints
 */
export const CONTEXT_PRIORITY_HINTS: Record<string, TaskPriorityLevel> = {
  // High-value contexts default to higher priority
  nova: 'p2',
  janna: 'p2',
  silk: 'p2',
  atw: 'p2',
  obx: 'p3',
  house: 'p2',
  maison: 'p3',
  personal: 'p3',
  admin: 'p4',
  training: 'p3',
  other: 'p4',
};
