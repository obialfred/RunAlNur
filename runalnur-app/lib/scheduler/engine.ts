/**
 * Auto-Scheduler Engine
 * Motion/Sunsama/Reclaim-inspired intelligent task scheduling
 * 
 * Features:
 * - Auto-schedules tasks into Focus Blocks
 * - Priority-based scheduling (P1 > P2 > P3 > P4)
 * - Deadline risk detection
 * - Continuous rescheduling on calendar changes
 */

import type { Task, TaskPriorityLevel } from '@/lib/types';
import type { FocusBlock, FocusContext } from '@/lib/calendar/types';
import {
  type SchedulerInput,
  type SchedulerResult,
  type ScheduledTask,
  type AtRiskTask,
  type TimeSlot,
  type SchedulerPreferences,
  DEFAULT_SCHEDULER_PREFERENCES,
  DURATION_ESTIMATES,
  CONTEXT_PRIORITY_HINTS,
} from './types';
import {
  findAvailableSlots,
  sortTasksForScheduling,
  calculateDeadlineRisk,
  findBestSlot,
} from './conflicts';

/**
 * Main auto-scheduling function
 * Takes tasks and existing calendar, produces optimal schedule
 */
export async function autoSchedule(input: SchedulerInput): Promise<SchedulerResult> {
  const {
    tasks,
    existingBlocks,
    preferences = DEFAULT_SCHEDULER_PREFERENCES,
    targetDate = new Date(),
  } = input;

  const scheduledTasks: ScheduledTask[] = [];
  const unscheduledTasks: Task[] = [];
  const atRiskTasks: AtRiskTask[] = [];
  const createdBlocks: Partial<FocusBlock>[] = [];
  
  // Filter to only auto-schedulable tasks that aren't done
  const schedulableTasks = tasks.filter(t => 
    t.auto_schedule !== false && 
    t.status !== 'done' &&
    !t.scheduled_block_id // Not already scheduled
  );
  
  // Sort by priority and due date
  const sortedTasks = sortTasksForScheduling(schedulableTasks);
  
  // Get available slots for the scheduling horizon
  const allSlots = getAvailableSlotsForHorizon(
    targetDate,
    preferences.schedulingHorizon,
    existingBlocks,
    preferences
  );
  
  // Track slots as we fill them
  let remainingSlots = [...allSlots];
  
  for (const task of sortedTasks) {
    // Check deadline risk
    const riskCheck = calculateDeadlineRisk(task, remainingSlots, targetDate);
    
    if (riskCheck.atRisk) {
      atRiskTasks.push({
        task,
        dueDate: task.due_date ? new Date(task.due_date) : new Date(),
        reason: riskCheck.reason,
        suggestedAction: generateRiskSuggestion(task, riskCheck),
        requiredHours: (task.duration_minutes || 30) / 60,
        availableHours: riskCheck.availableMinutes / 60,
      });
    }
    
    // Find best slot for this task
    const doDate = task.do_date ? new Date(task.do_date) : 
                   task.committed_date ? new Date(task.committed_date) : 
                   undefined;
    
    const bestSlot = findBestSlot(task, remainingSlots, doDate);
    
    if (!bestSlot) {
      unscheduledTasks.push(task);
      continue;
    }
    
    // Schedule the task
    const duration = task.duration_minutes || 30;
    const scheduledStart = bestSlot.start;
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60000);
    
    // Create Focus Block for this task
    const focusBlock = createFocusBlockForTask(task, scheduledStart, scheduledEnd);
    createdBlocks.push(focusBlock);
    
    scheduledTasks.push({
      task,
      scheduledStart,
      scheduledEnd,
      focusBlockId: focusBlock.id,
    });
    
    // Update remaining slots
    remainingSlots = updateSlotsAfterScheduling(remainingSlots, bestSlot, scheduledStart, scheduledEnd);
  }
  
  // Calculate summary
  const totalMinutesScheduled = scheduledTasks.reduce(
    (sum, st) => sum + ((st.task.duration_minutes || 30)),
    0
  );
  
  return {
    scheduledTasks,
    unscheduledTasks,
    atRiskTasks,
    createdBlocks,
    summary: {
      totalScheduled: scheduledTasks.length,
      totalUnscheduled: unscheduledTasks.length,
      totalAtRisk: atRiskTasks.length,
      totalMinutesScheduled,
      focusTimeProtected: preferences.focusTimeGoal,
    },
  };
}

/**
 * Get all available slots for the scheduling horizon
 */
function getAvailableSlotsForHorizon(
  startDate: Date,
  horizonDays: number,
  existingBlocks: FocusBlock[],
  preferences: SchedulerPreferences
): TimeSlot[] {
  const allSlots: TimeSlot[] = [];
  
  for (let i = 0; i < horizonDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip if date is in the past
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      // For today, start from now
      const todaySlots = findAvailableSlots(
        date,
        existingBlocks,
        preferences.workingHours,
        preferences.bufferMinutes
      ).filter(slot => slot.start >= now);
      allSlots.push(...todaySlots);
    } else if (date > now) {
      const daySlots = findAvailableSlots(
        date,
        existingBlocks,
        preferences.workingHours,
        preferences.bufferMinutes
      );
      allSlots.push(...daySlots);
    }
  }
  
  return allSlots;
}

/**
 * Create a Focus Block for a scheduled task
 */
function createFocusBlockForTask(
  task: Task,
  start: Date,
  end: Date
): Partial<FocusBlock> {
  const context = (task.context || 'house') as FocusContext;
  
  return {
    id: `scheduled-${task.id}-${Date.now()}`,
    title: task.name,
    description: task.description,
    context,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    completed: false,
    sync_status: 'pending',
    metadata: {
      source: 'auto-scheduler',
      task_id: task.id,
      priority_level: task.priority_level,
    },
  };
}

/**
 * Update available slots after scheduling a task
 */
function updateSlotsAfterScheduling(
  slots: TimeSlot[],
  usedSlot: TimeSlot,
  scheduledStart: Date,
  scheduledEnd: Date
): TimeSlot[] {
  const updated: TimeSlot[] = [];
  
  for (const slot of slots) {
    if (slot === usedSlot) {
      // Split the used slot
      
      // Time before scheduled task
      if (scheduledStart > slot.start) {
        const beforeDuration = Math.floor((scheduledStart.getTime() - slot.start.getTime()) / 60000);
        if (beforeDuration >= 15) {
          updated.push({
            start: slot.start,
            end: scheduledStart,
            durationMinutes: beforeDuration,
          });
        }
      }
      
      // Time after scheduled task
      if (scheduledEnd < slot.end) {
        const afterDuration = Math.floor((slot.end.getTime() - scheduledEnd.getTime()) / 60000);
        if (afterDuration >= 15) {
          updated.push({
            start: scheduledEnd,
            end: slot.end,
            durationMinutes: afterDuration,
          });
        }
      }
    } else {
      updated.push(slot);
    }
  }
  
  return updated;
}

/**
 * Generate suggestion for at-risk task
 */
function generateRiskSuggestion(
  task: Task,
  riskCheck: { atRisk: boolean; reason: string; availableMinutes: number }
): string {
  const duration = task.duration_minutes || 30;
  const shortfall = duration - riskCheck.availableMinutes;
  
  if (shortfall > 0) {
    return `Need to free up ${Math.ceil(shortfall / 60)} hour(s) or reduce scope. Consider rescheduling lower priority tasks.`;
  }
  
  return `Schedule this task soon to ensure completion before deadline.`;
}

/**
 * Estimate task duration based on name/description
 */
export function estimateDuration(taskName: string, taskDescription?: string): number {
  const text = `${taskName} ${taskDescription || ''}`.toLowerCase();
  
  for (const [keyword, duration] of Object.entries(DURATION_ESTIMATES)) {
    if (text.includes(keyword)) {
      return duration;
    }
  }
  
  // Longer descriptions = longer tasks
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 20) return 60;
  if (wordCount > 10) return 45;
  
  return DURATION_ESTIMATES.default;
}

/**
 * Infer priority level based on context and keywords
 */
export function inferPriorityLevel(
  taskName: string,
  context: string,
  dueDate?: string
): TaskPriorityLevel {
  const name = taskName.toLowerCase();
  
  // Critical keywords = P1
  if (name.includes('urgent') || name.includes('asap') || name.includes('critical') || name.includes('emergency')) {
    return 'p1';
  }
  
  // Investor/money related = P1
  if (name.includes('investor') || name.includes('funding') || name.includes('contract') || name.includes('deadline')) {
    return 'p1';
  }
  
  // Due today or overdue = bump priority
  if (dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (due <= today) {
      return 'p1'; // Overdue or due today
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (due <= tomorrow) {
      return 'p2'; // Due tomorrow
    }
  }
  
  // Use context hint
  return CONTEXT_PRIORITY_HINTS[context] || 'p3';
}

/**
 * Detect context from task name
 */
export function detectContext(taskName: string, taskDescription?: string): string {
  const text = `${taskName} ${taskDescription || ''}`.toLowerCase();
  
  // Check for arm mentions
  const armKeywords: Record<string, string[]> = {
    nova: ['nova', 'tech', 'ai', 'hardware', 'software', 'app', 'product'],
    janna: ['janna', 'property', 'real estate', 'lease', 'tenant', 'renovation', 'construction'],
    obx: ['obx', 'music', 'beat', 'song', 'album', 'artist', 'studio'],
    silk: ['silk', 'ecommerce', 'shop', 'store', 'inventory', 'shipping'],
    atw: ['atw', 'media', 'video', 'content', 'production', 'film'],
    house: ['house al nur', 'holding', 'empire', 'strategy'],
    maison: ['maison', 'family', 'office', 'wealth'],
    personal: ['gym', 'workout', 'health', 'doctor', 'personal', 'family', 'kids', 'wife'],
    admin: ['admin', 'paperwork', 'tax', 'legal', 'compliance', 'insurance'],
    training: ['training', 'broker', 'license', 'certification', 'course'],
  };
  
  for (const [context, keywords] of Object.entries(armKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return context;
      }
    }
  }
  
  return 'house'; // Default
}

/**
 * Reschedule tasks when calendar changes
 */
export async function rescheduleOnCalendarChange(
  affectedTasks: Task[],
  newBlocks: FocusBlock[],
  removedBlockIds: string[],
  preferences: SchedulerPreferences = DEFAULT_SCHEDULER_PREFERENCES
): Promise<SchedulerResult> {
  // Tasks that were scheduled to removed blocks need rescheduling
  const tasksToReschedule = affectedTasks.filter(t => 
    t.scheduled_block_id && removedBlockIds.includes(t.scheduled_block_id)
  );
  
  // Clear their scheduled_block_id
  const clearedTasks = tasksToReschedule.map(t => ({
    ...t,
    scheduled_block_id: null,
  }));
  
  // Re-run scheduler
  return autoSchedule({
    tasks: clearedTasks,
    existingBlocks: newBlocks,
    preferences,
  });
}

/**
 * Calculate do_date (when to work on task) based on due_date
 */
export function calculateDoDate(
  dueDate: string,
  durationMinutes: number,
  bufferDays: number = 1
): string {
  const due = new Date(dueDate);
  
  // Work backwards from due date
  // If task takes >2 hours, start 2 days before
  // If task takes 1-2 hours, start 1 day before
  // Short tasks can be done same day
  
  let daysBeforeDue = bufferDays;
  if (durationMinutes >= 120) {
    daysBeforeDue = Math.max(2, bufferDays);
  } else if (durationMinutes >= 60) {
    daysBeforeDue = Math.max(1, bufferDays);
  } else {
    daysBeforeDue = 0;
  }
  
  const doDate = new Date(due);
  doDate.setDate(doDate.getDate() - daysBeforeDue);
  
  // Don't schedule in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (doDate < today) {
    return today.toISOString().split('T')[0];
  }
  
  return doDate.toISOString().split('T')[0];
}

// Export index
export { DEFAULT_SCHEDULER_PREFERENCES } from './types';
