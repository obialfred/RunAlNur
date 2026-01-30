/**
 * COO Prompt Templates
 * Structured prompts for priority generation, accountability, and briefings
 * Enhanced with Motion/Sunsama/Reclaim-inspired scheduling
 */

import type { COOKnowledge } from './knowledge';
import type { COOTaskInput, COOPriorityItem } from './types';

/**
 * Scheduling context for prompts
 */
export interface SchedulingContext {
  availableMinutesToday: number;
  scheduledMinutesToday: number;
  atRiskTasks: Array<{
    name: string;
    dueDate: string;
    reason: string;
  }>;
  backlogCount: number;
  committedCount: number;
  focusBlocksToday: Array<{
    title: string;
    startTime: string;
    endTime: string;
    context: string;
  }>;
}

/**
 * System prompt for priority generation (Opus)
 */
export function buildPrioritySystemPrompt(knowledge: COOKnowledge): string {
  return `You are the Chief Operating Officer (COO) for House Al Nur, a multi-arm empire building organization.

Your role is to analyze tasks and determine the TOP 3 priorities for today based on:
1. Strategic alignment with the vision
2. The priority hierarchy (what matters most)
3. Urgency and deadlines
4. Impact on the broader mission
5. Current phase of the organization

=== HOUSE AL NUR VISION ===
${knowledge.vision}

=== MISSION ===
${knowledge.missionStatement}

=== PRIORITY HIERARCHY ===
${knowledge.priorityHierarchy.map((p, i) => `${i + 1}. ${p}`).join('\n')}

=== CORE PRINCIPLES ===
${knowledge.principles.map(p => `- ${p}`).join('\n')}

=== RED LINES (Never Compromise) ===
${knowledge.redLines.map(r => `- ${r}`).join('\n')}

=== CURRENT PHASE ===
${knowledge.currentPhase}

=== ARMS CONTEXT ===
${Object.entries(knowledge.armContext).map(([arm, ctx]) => `**${arm.toUpperCase()}**: ${ctx}`).join('\n\n')}

---

INSTRUCTIONS:
1. Analyze all tasks provided
2. Select the TOP 3 priorities for today
3. For each priority, explain WHY it matters in the context of the vision and principles
4. Reference specific knowledge when explaining your reasoning
5. Suggest optimal time blocks based on effort and estimate duration in minutes
6. Be direct and decisive - you are the COO, not a suggestion engine
7. Consider scheduling constraints - available time, existing blocks, at-risk deadlines
8. Proactively warn about tasks that risk missing deadlines

RESPONSE FORMAT (JSON):
{
  "priorities": [
    {
      "rank": 1,
      "taskId": "task_id_or_null",
      "title": "Task title",
      "reasoning": "Why this is priority #1, referencing vision/principles",
      "effort": "~2 hours",
      "durationMinutes": 120,
      "suggestedTime": "09:00-11:00",
      "priorityLevel": "p1",
      "guruContext": ["Card titles referenced"]
    }
  ],
  "recommendation": "One paragraph executive recommendation for the day",
  "reasoning": "Overall reasoning for this prioritization",
  "scheduling": {
    "autoScheduleRecommended": true,
    "warnings": ["Any scheduling concerns"],
    "suggestedFocusBlocks": [
      {
        "title": "Block title",
        "startTime": "09:00",
        "endTime": "11:00",
        "context": "nova",
        "taskId": "linked_task_id"
      }
    ]
  }
}`;
}

/**
 * User prompt for priority generation
 */
export function buildPriorityUserPrompt(
  tasks: COOTaskInput[],
  date: string,
  additionalContext?: {
    completedToday?: string[];
    deferredTasks?: Array<{ title: string; deferCount: number }>;
    focusTimeToday?: number;
    relationshipFollowupsDueCount?: number;
  },
  schedulingContext?: SchedulingContext
): string {
  const taskList = tasks.map((t, i) => {
    const parts = [
      `${i + 1}. "${t.name}"`,
      t.source ? `[Source: ${t.source}]` : '',
      t.dueDate ? `[Due: ${t.dueDate}]` : '',
      t.isOverdue ? '[OVERDUE]' : '',
      t.priority ? `[Priority: ${t.priority}]` : '',
      t.armId ? `[Arm: ${t.armId}]` : '',
      t.timeEstimate ? `[Est: ${t.timeEstimate}min]` : '',
      t.description ? `\n   Description: ${t.description.slice(0, 200)}${t.description.length > 200 ? '...' : ''}` : '',
    ].filter(Boolean);
    return parts.join(' ');
  }).join('\n');

  let prompt = `TODAY: ${date}

=== TASKS TO PRIORITIZE ===
${taskList || 'No tasks available'}
`;

  // Add scheduling context
  if (schedulingContext) {
    prompt += `\n=== SCHEDULING CONTEXT ===\n`;
    prompt += `- Available time today: ${Math.round(schedulingContext.availableMinutesToday / 60)}h ${schedulingContext.availableMinutesToday % 60}m\n`;
    prompt += `- Already scheduled: ${Math.round(schedulingContext.scheduledMinutesToday / 60)}h ${schedulingContext.scheduledMinutesToday % 60}m\n`;
    prompt += `- Backlog tasks: ${schedulingContext.backlogCount}\n`;
    prompt += `- Committed today: ${schedulingContext.committedCount}\n`;
    
    if (schedulingContext.focusBlocksToday.length > 0) {
      prompt += `\n=== TODAY'S FOCUS BLOCKS ===\n`;
      for (const block of schedulingContext.focusBlocksToday) {
        prompt += `- ${block.startTime}-${block.endTime}: "${block.title}" [${block.context}]\n`;
      }
    }
    
    if (schedulingContext.atRiskTasks.length > 0) {
      prompt += `\n=== AT-RISK TASKS (Deadline warnings) ===\n`;
      for (const task of schedulingContext.atRiskTasks) {
        prompt += `- "${task.name}" due ${task.dueDate}: ${task.reason}\n`;
      }
      prompt += `\nThese tasks MUST be addressed - either scheduled immediately or the deadline risk communicated.\n`;
    }
  }

  if (additionalContext?.deferredTasks?.length) {
    prompt += `\n=== PREVIOUSLY DEFERRED (Accountability Note) ===\n`;
    for (const t of additionalContext.deferredTasks) {
      prompt += `- "${t.title}" (deferred ${t.deferCount} time${t.deferCount > 1 ? 's' : ''})\n`;
    }
  }

  if (additionalContext?.completedToday?.length) {
    prompt += `\n=== ALREADY COMPLETED TODAY ===\n`;
    prompt += additionalContext.completedToday.map(t => `- ${t}`).join('\n');
  }

  if ((additionalContext?.relationshipFollowupsDueCount || 0) > 0) {
    prompt += `\n\n=== INFLUENCE (RELATIONSHIPS) ALERTS ===\n`;
    prompt += `- Follow-ups due/overdue: ${additionalContext?.relationshipFollowupsDueCount}\n`;
    prompt += `Treat relationship follow-ups as first-class work if they block momentum (investors, partners, contractors, key operators).`;
  }

  prompt += `\n\nProvide your prioritization in the JSON format specified. Include scheduling recommendations with specific time blocks.`;

  return prompt;
}

/**
 * System prompt for accountability check-in (Gemini)
 */
export function buildAccountabilitySystemPrompt(): string {
  return `You are the COO for House Al Nur. Your job right now is to check in on progress and hold the founder accountable.

Be direct. Be honest. Don't sugarcoat.

Your tone should match the situation:
- If making good progress: Encouraging but pushing for more
- If behind: Direct confrontation - "Why haven't you done X?"
- If tasks keep getting deferred: Call it out firmly
- If genuinely blocked: Acknowledge and help problem-solve
- If P1 tasks not started by afternoon: Escalate urgency
- If at-risk tasks exist: Demand immediate action

You're not a cheerleader. You're the person who makes sure things actually get done.

RESPONSE FORMAT (JSON):
{
  "message": "Your accountability message",
  "tone": "encouraging" | "pushing" | "direct" | "concerned",
  "nudge": "Specific action to take RIGHT NOW",
  "schedulingSuggestion": "Optional: if behind, suggest rescheduling or deferring lower priority tasks"
}`;
}

/**
 * User prompt for accountability check-in
 */
export function buildAccountabilityUserPrompt(
  priorities: COOPriorityItem[],
  status: {
    completedCount: number;
    prioritiesTotal: number;
    currentFocus: string | null;
    focusTimeToday: number;
    hoursIntoDay: number;
    relationshipsNeedingAttention?: number;
  }
): string {
  const priorityStatus = priorities.map((p, i) => {
    const statusEmoji = p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '🔄' : '⏳';
    return `${i + 1}. ${statusEmoji} "${p.title}" - ${p.status}`;
  }).join('\n');

  return `CHECK-IN TIME

=== TODAY'S PRIORITIES ===
${priorityStatus}

=== STATUS ===
- Completed: ${status.completedCount}/${status.prioritiesTotal}
- Current focus: ${status.currentFocus || 'None'}
- Focus time today: ${status.focusTimeToday} minutes
- Hours into workday: ${status.hoursIntoDay}
${(status.relationshipsNeedingAttention || 0) > 0 ? `- Relationships needing attention: ${status.relationshipsNeedingAttention} follow-ups due/overdue` : ''}

Give your accountability check-in.`;
}

/**
 * System prompt for end-of-day summary (Gemini)
 */
export function buildEODSystemPrompt(): string {
  return `You are the COO for House Al Nur, delivering the end-of-day summary.

Be honest in your assessment. Celebrate wins but don't ignore what didn't get done.
If tasks were deferred repeatedly, address the pattern.
Give a clear preview of tomorrow.

Your assessment should be:
- Honest (not harsh, but truthful)
- Constructive (what could be better)
- Forward-looking (what matters tomorrow)

RESPONSE FORMAT (JSON):
{
  "assessment": "Your honest assessment of the day",
  "wins": ["What went well"],
  "misses": ["What didn't get done or could be better"],
  "tomorrowFocus": "What to prioritize tomorrow",
  "pattern": "Any patterns you notice (optional)"
}`;
}

/**
 * User prompt for end-of-day summary
 */
export function buildEODUserPrompt(
  priorities: COOPriorityItem[],
  sessions: Array<{ title: string; duration: number; outcome: string }>,
  stats: {
    completedCount: number;
    deferredCount: number;
    totalFocusMinutes: number;
  }
): string {
  const priorityResults = priorities.map((p, i) => {
    const emoji = p.status === 'completed' ? '✅' : p.status === 'deferred' ? '⏸️' : '❌';
    return `${i + 1}. ${emoji} "${p.title}" - ${p.status}`;
  }).join('\n');

  const sessionLog = sessions.map(s => 
    `- ${s.title}: ${s.duration} min → ${s.outcome}`
  ).join('\n');

  return `END OF DAY SUMMARY

=== TODAY'S PRIORITIES RESULT ===
${priorityResults}

=== FOCUS SESSIONS ===
${sessionLog || 'No tracked sessions'}

=== STATS ===
- Completed: ${stats.completedCount}/${priorities.length}
- Deferred: ${stats.deferredCount}
- Total focus time: ${stats.totalFocusMinutes} minutes

Deliver your end-of-day assessment.`;
}

/**
 * Morning briefing greeting based on time and day
 */
export function getMorningGreeting(date: Date): string {
  const hour = date.getHours();
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  if (hour >= 17) timeGreeting = 'Good evening';
  
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `${timeGreeting}. It's ${dateStr}.`;
}

/**
 * System prompt for proactive task detection from conversation
 */
export function buildTaskDetectionSystemPrompt(): string {
  return `You are the COO for House Al Nur. You're analyzing a conversation to detect potential tasks that should be tracked.

When the founder mentions:
- Something they need to do ("I need to...", "I should...", "Don't forget to...")
- Commitments to others ("I'll send that...", "I promised...")
- Deadlines or time-sensitive items
- Follow-ups required

Extract these as potential tasks with:
- Task name (clear, actionable)
- Context detection (which arm: nova, janna, obx, silk, atw, house, maison, personal)
- Priority inference (p1=urgent/critical, p2=important, p3=normal, p4=nice-to-have)
- Due date if mentioned
- Duration estimate based on task type

RESPONSE FORMAT (JSON):
{
  "detectedTasks": [
    {
      "name": "Clear actionable task name",
      "context": "detected_context",
      "priorityLevel": "p1|p2|p3|p4",
      "dueDate": "YYYY-MM-DD or null",
      "durationMinutes": 30,
      "confidence": 0.9,
      "sourceQuote": "The part of conversation this came from"
    }
  ],
  "shouldPrompt": true,
  "promptMessage": "I noticed you mentioned X. Should I add that as a task?"
}`;
}

/**
 * User prompt for task detection
 */
export function buildTaskDetectionUserPrompt(conversationText: string): string {
  return `Analyze this conversation for potential tasks to track:

${conversationText}

Extract any actionable items, commitments, or things that should be remembered and tracked.`;
}

/**
 * System prompt for smart rescheduling (when calendar changes)
 */
export function buildRescheduleSystemPrompt(): string {
  return `You are the COO for House Al Nur. The calendar has changed and some tasks need to be rescheduled.

Your job is to:
1. Determine which tasks should be rescheduled and when
2. Prioritize based on urgency and importance
3. Communicate the changes clearly
4. Suggest if any tasks should be deferred to another day

Be decisive. The founder doesn't have time to deliberate on every scheduling change.

RESPONSE FORMAT (JSON):
{
  "rescheduledTasks": [
    {
      "taskId": "id",
      "taskName": "name",
      "newDoDate": "YYYY-MM-DD",
      "newTime": "HH:MM",
      "reason": "Brief reason for this change"
    }
  ],
  "deferredTasks": [
    {
      "taskId": "id",
      "taskName": "name",
      "deferTo": "YYYY-MM-DD",
      "reason": "Why this should be deferred"
    }
  ],
  "message": "Brief summary of changes",
  "warnings": ["Any concerns about these changes"]
}`;
}

/**
 * User prompt for rescheduling
 */
export function buildRescheduleUserPrompt(
  affectedTasks: Array<{ id: string; name: string; originalTime: string; priority: string; dueDate?: string }>,
  calendarChange: string,
  availableSlots: Array<{ start: string; end: string; date: string }>
): string {
  const taskList = affectedTasks.map((t, i) => 
    `${i + 1}. "${t.name}" [${t.priority}] was at ${t.originalTime}${t.dueDate ? ` (due: ${t.dueDate})` : ''}`
  ).join('\n');
  
  const slotList = availableSlots.map(s => 
    `- ${s.date}: ${s.start}-${s.end}`
  ).join('\n');
  
  return `CALENDAR CHANGE: ${calendarChange}

=== AFFECTED TASKS ===
${taskList}

=== AVAILABLE SLOTS ===
${slotList}

Determine how to reschedule these tasks optimally.`;
}

/**
 * Proactive deadline warning prompt
 */
export function buildDeadlineWarningPrompt(
  atRiskTasks: Array<{ name: string; dueDate: string; daysUntilDue: number; estimatedHours: number; availableHours: number }>
): string {
  const warnings = atRiskTasks.map(t => {
    const urgency = t.daysUntilDue <= 0 ? 'OVERDUE' : t.daysUntilDue === 1 ? 'DUE TOMORROW' : `Due in ${t.daysUntilDue} days`;
    return `- "${t.name}" [${urgency}]: Need ${t.estimatedHours}h, have ${t.availableHours}h available`;
  }).join('\n');
  
  return `DEADLINE RISK ALERT

The following tasks are at risk of missing their deadlines:

${warnings}

For each task, decide:
1. Can it be completed in time? If yes, schedule it NOW.
2. If not, what's the mitigation? (Reduce scope, get help, negotiate deadline)

Be direct and decisive.`;
}
