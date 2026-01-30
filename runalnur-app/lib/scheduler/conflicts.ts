/**
 * Conflict Detection & Resolution
 * Handles scheduling conflicts and priority-based bumping
 */

import type { Task, TaskPriorityLevel } from '@/lib/types';
import type { FocusBlock } from '@/lib/calendar/types';
import type { TimeSlot, ConflictResult, ScheduledTask } from './types';
import { PRIORITY_WEIGHTS } from './types';

/**
 * Check if two time ranges overlap
 */
export function doTimesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Find conflicts between a proposed time slot and existing blocks
 */
export function findConflicts(
  proposedStart: Date,
  proposedEnd: Date,
  existingBlocks: FocusBlock[]
): ConflictResult {
  const conflictingBlocks = existingBlocks.filter(block => {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    return doTimesOverlap(proposedStart, proposedEnd, blockStart, blockEnd);
  });

  if (conflictingBlocks.length === 0) {
    return { hasConflict: false, conflictingBlocks: [] };
  }

  return {
    hasConflict: true,
    conflictingBlocks,
    suggestion: {
      action: 'reschedule',
      details: `${conflictingBlocks.length} block(s) conflict with this time slot`,
    },
  };
}

/**
 * Find available slots in a day given existing blocks
 */
export function findAvailableSlots(
  date: Date,
  existingBlocks: FocusBlock[],
  workingHours: { start: string; end: string },
  bufferMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Parse working hours
  const [startHour, startMin] = workingHours.start.split(':').map(Number);
  const [endHour, endMin] = workingHours.end.split(':').map(Number);
  
  const dayStart = new Date(date);
  dayStart.setHours(startHour, startMin, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMin, 0, 0);
  
  // Get blocks for this day, sorted by start time
  const dayBlocks = existingBlocks
    .filter(block => {
      const blockDate = new Date(block.start_time);
      return blockDate.toDateString() === date.toDateString();
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  
  if (dayBlocks.length === 0) {
    // Entire day is available
    const durationMinutes = Math.floor((dayEnd.getTime() - dayStart.getTime()) / 60000);
    slots.push({ start: dayStart, end: dayEnd, durationMinutes });
    return slots;
  }
  
  // Find gaps between blocks
  let currentTime = dayStart;
  
  for (const block of dayBlocks) {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    
    // Slot before this block
    if (blockStart > currentTime) {
      const slotEnd = new Date(blockStart.getTime() - bufferMinutes * 60000);
      if (slotEnd > currentTime) {
        const durationMinutes = Math.floor((slotEnd.getTime() - currentTime.getTime()) / 60000);
        if (durationMinutes >= 15) { // Minimum useful slot
          slots.push({ start: new Date(currentTime), end: slotEnd, durationMinutes });
        }
      }
    }
    
    // Move current time past this block plus buffer
    currentTime = new Date(blockEnd.getTime() + bufferMinutes * 60000);
  }
  
  // Slot after last block
  if (currentTime < dayEnd) {
    const durationMinutes = Math.floor((dayEnd.getTime() - currentTime.getTime()) / 60000);
    if (durationMinutes >= 15) {
      slots.push({ start: currentTime, end: dayEnd, durationMinutes });
    }
  }
  
  return slots;
}

/**
 * Determine if a higher priority task should bump a lower priority task
 */
export function shouldBump(
  newTask: Task,
  existingTask: Task
): boolean {
  const newPriority = newTask.priority_level || 'p3';
  const existingPriority = existingTask.priority_level || 'p3';
  
  const newWeight = PRIORITY_WEIGHTS[newPriority];
  const existingWeight = PRIORITY_WEIGHTS[existingPriority];
  
  // P1 can bump P2-P4, P2 can bump P3-P4, etc.
  return newWeight > existingWeight;
}

/**
 * Sort tasks by scheduling priority
 * 1. Priority level (P1 first)
 * 2. Due date (earliest first)
 * 3. Duration (shorter first for better slot fitting)
 */
export function sortTasksForScheduling(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority level
    const aPriority = PRIORITY_WEIGHTS[a.priority_level || 'p3'];
    const bPriority = PRIORITY_WEIGHTS[b.priority_level || 'p3'];
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Due date (earlier = higher priority)
    const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    if (aDue !== bDue) return aDue - bDue;
    
    // Duration (shorter first)
    const aDuration = a.duration_minutes || 30;
    const bDuration = b.duration_minutes || 30;
    return aDuration - bDuration;
  });
}

/**
 * Calculate if a task is at risk of missing its deadline
 */
export function calculateDeadlineRisk(
  task: Task,
  availableSlots: TimeSlot[],
  now: Date
): { atRisk: boolean; reason: string; availableMinutes: number } {
  if (!task.due_date) {
    return { atRisk: false, reason: '', availableMinutes: Infinity };
  }
  
  const dueDate = new Date(task.due_date);
  const taskDuration = task.duration_minutes || 30;
  
  // Calculate total available minutes before deadline
  const availableMinutes = availableSlots
    .filter(slot => slot.end <= dueDate)
    .reduce((sum, slot) => sum + slot.durationMinutes, 0);
  
  if (availableMinutes < taskDuration) {
    const hoursShort = Math.ceil((taskDuration - availableMinutes) / 60);
    return {
      atRisk: true,
      reason: `Need ${taskDuration} minutes but only ${availableMinutes} available before deadline. ${hoursShort} hour(s) short.`,
      availableMinutes,
    };
  }
  
  // Warning if less than 2x the needed time available
  if (availableMinutes < taskDuration * 2) {
    return {
      atRisk: true,
      reason: `Tight timeline: only ${Math.round(availableMinutes / taskDuration)}x buffer before deadline.`,
      availableMinutes,
    };
  }
  
  return { atRisk: false, reason: '', availableMinutes };
}

/**
 * Find the best slot for a task
 */
export function findBestSlot(
  task: Task,
  availableSlots: TimeSlot[],
  preferredDate?: Date
): TimeSlot | null {
  const duration = task.duration_minutes || 30;
  
  // Filter slots that can fit the task
  const viableSlots = availableSlots.filter(slot => slot.durationMinutes >= duration);
  
  if (viableSlots.length === 0) return null;
  
  // Prefer slots on the preferred date
  if (preferredDate) {
    const preferredDateStr = preferredDate.toDateString();
    const preferredSlots = viableSlots.filter(
      slot => slot.start.toDateString() === preferredDateStr
    );
    if (preferredSlots.length > 0) {
      // Return smallest viable slot on preferred date (best fit)
      return preferredSlots.sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
    }
  }
  
  // Otherwise return earliest viable slot
  return viableSlots.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
}
