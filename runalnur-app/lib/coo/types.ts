// COO (Chief Operating Officer) Type Definitions

/**
 * Priority item within a daily priority list
 */
export interface COOPriorityItem {
  rank: number;
  taskId: string | null; // ClickUp task ID or internal task ID
  source: 'clickup' | 'internal' | 'manual';
  title: string;
  reasoning: string; // Why this is a priority (Guru-backed)
  effort: string; // e.g., "~2 hours", "30 min"
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  guruContext?: string[]; // Relevant Guru card titles used
  dueDate?: string;
  armId?: string;
}

/**
 * Daily priorities record from database
 */
export interface COOPriorities {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  priorities: COOPriorityItem[];
  model_used: 'opus' | 'gemini' | null;
  knowledge_context: {
    vision?: string;
    principles?: string[];
    currentPhase?: string;
    armsUsed?: string[];
  } | null;
  generated_at: string;
  accepted_at: string | null;
  modified_at: string | null;
  created_at: string;
}

/**
 * Focus session tracking
 */
export interface COOFocusSession {
  id: string;
  user_id: string;
  priority_id: string | null;
  priority_rank: number | null;
  task_id: string | null;
  task_title: string;
  started_at: string;
  paused_at: string | null;
  ended_at: string | null;
  total_duration_minutes: number;
  outcome: 'completed' | 'paused' | 'deferred' | 'abandoned' | null;
  notes: string | null;
  created_at: string;
}

/**
 * User preferences for COO
 */
export interface COOPreferences {
  id: string;
  user_id: string;
  morning_briefing_time: string; // HH:MM
  evening_summary_time: string; // HH:MM
  max_priorities: number;
  push_intensity: 'gentle' | 'medium' | 'aggressive';
  preferred_model: 'opus' | 'gemini' | 'both';
  timezone: string;
  briefing_enabled: boolean;
  accountability_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Accountability log entry
 */
export interface COOAccountabilityEntry {
  id: string;
  user_id: string;
  event_type:
    | 'priority_accepted'
    | 'priority_modified'
    | 'priority_completed'
    | 'priority_deferred'
    | 'focus_started'
    | 'focus_paused'
    | 'focus_completed'
    | 'checkin_sent'
    | 'checkin_acknowledged';
  priority_id: string | null;
  session_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Morning briefing output
 */
export interface COOBriefing {
  date: string;
  greeting: string;
  priorities: COOPriorityItem[];
  onRadar: {
    tasksDueThisWeek: number;
    tasksAtRisk: number;
    relationshipsNeedingAttention: number;
    cashRunwayMonths?: number;
  };
  recommendation: string;
  generatedAt: string;
  modelUsed: 'opus' | 'gemini';
}

/**
 * End of day summary
 */
export interface COODaySummary {
  date: string;
  scorecard: {
    prioritiesCompleted: number;
    prioritiesTotal: number;
    completionRate: number;
    focusTimeMinutes: number;
    deferredTasks: string[];
  };
  assessment: string; // Gemini's honest assessment
  tomorrowPreview: string[];
  generatedAt: string;
}

/**
 * Accountability check-in response
 */
export interface COOCheckin {
  message: string;
  tone: 'encouraging' | 'pushing' | 'direct' | 'concerned';
  currentStatus: {
    completedCount: number;
    prioritiesTotal: number;
    currentFocus: string | null;
    focusTimeToday: number;
    hoursIntoDay: number;
    relationshipsNeedingAttention?: number;
  };
  nudge?: string;
  generatedAt: string;
}

/**
 * Context passed to LLM for priority generation
 */
export interface COOContext {
  date: string;
  tasks: COOTaskInput[];
  knowledge: {
    vision: string;
    principles: string[];
    priorityHierarchy: string[];
    currentPhase: string;
    armContext: Record<string, string>;
  };
  calendar: COOCalendarEvent[];
  history: {
    completedToday: string[];
    deferredTasks: Array<{ title: string; deferCount: number }>;
    focusTimeToday: number;
    recentCompletionRate: number; // Last 7 days
  };
  preferences: {
    maxPriorities: number;
    pushIntensity: 'gentle' | 'medium' | 'aggressive';
  };
}

/**
 * Task input for priority generation
 */
export interface COOTaskInput {
  id: string;
  source: 'clickup' | 'internal';
  name: string;
  description?: string;
  dueDate?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  status?: string;
  project?: string;
  armId?: string;
  tags?: string[];
  timeEstimate?: number; // minutes
  isOverdue?: boolean;
  daysUntilDue?: number;
}

/**
 * Calendar event for context
 */
export interface COOCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees?: string[];
  isAllDay?: boolean;
}

/**
 * Default preferences
 */
export const DEFAULT_COO_PREFERENCES: Omit<COOPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  morning_briefing_time: '08:00',
  evening_summary_time: '18:00',
  max_priorities: 3,
  push_intensity: 'medium',
  preferred_model: 'opus',
  timezone: 'America/Chicago',
  briefing_enabled: true,
  accountability_enabled: true,
};
