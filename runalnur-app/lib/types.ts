import type { ArmId, ProjectStatus, Priority, ActivityType } from './constants';

export interface Arm {
  id: ArmId;
  name: string;
  slug: string;
  description: string;
  head: string;
  color: string;
  colorClass: string;
  textColorClass: string;
  borderColorClass: string;
  icon: string;
}

export interface Project {
  id: string;
  arm_id: ArmId;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  clickup_id?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  progress?: number;
  tasks_total?: number;
  tasks_completed?: number;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  arm_id: ArmId;
  hubspot_id?: string;
  external_refs?: Record<string, string>;
  socials?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

// Priority levels for Reclaim-style auto-scheduling
export type TaskPriorityLevel = 'p1' | 'p2' | 'p3' | 'p4';

export interface Task {
  id: string;
  project_id?: string | null;
  name: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: Priority;
  assignee?: string;
  due_date?: string;
  clickup_id?: string;
  context: string; // 'personal' | 'house' | arm slugs
  focus_block_id?: string | null;
  created_at: string;
  updated_at: string;
  
  // NEW: Motion-inspired scheduling
  do_date?: string;              // When to WORK on it (AI-calculated)
  duration_minutes?: number;     // Time estimate (30, 60, 90, 120)
  scheduled_block_id?: string | null; // Auto-scheduled Focus Block
  
  // NEW: Reclaim-style priority
  priority_level?: TaskPriorityLevel; // p1=critical, p2=high, p3=medium, p4=low
  
  // NEW: Sunsama backlog concept
  committed_date?: string;       // If set, task is "committed" to this day
  auto_schedule?: boolean;       // Let AI schedule this?
  
  // NEW: Recurrence for habits
  recurrence_rule?: string;      // RRULE format
  parent_task_id?: string | null; // For recurring instances
  
  // NEW: Scheduling metadata
  scheduling_metadata?: {
    last_scheduled_at?: string;
    schedule_attempts?: number;
    at_risk?: boolean;           // Will miss deadline
    at_risk_reason?: string;
  };
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  arm_id?: ArmId;
  project_id?: string;
  contact_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Attachment {
  id: string;
  entity_type: 'project' | 'contact' | 'sop' | 'task' | 'property';
  entity_id: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface SOP {
  id: string;
  name: string;
  description: string;
  arm_id: ArmId;
  process_street_id?: string;
  steps: SOPStep[];
  created_at: string;
  updated_at: string;
}

export interface SOPStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  is_completed: boolean;
}

export interface SOPRun {
  id: string;
  sop_id: string;
  project_id?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  current_step: number;
}

export interface Property {
  id: string;
  arm_id?: ArmId;
  name: string;
  address?: string;
  units?: number;
  sqft?: number;
  acquisition_date?: string;
  purchase_price?: number;
  renovation_budget?: number;
  target_rent?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface RenovationPhase {
  id: string;
  property_id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  created_at: string;
}

export interface Vendor {
  id: string;
  arm_id?: ArmId;
  name: string;
  vendor_type?: string;
  contact_id?: string;
  notes?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  arm_id?: ArmId;
  hubspot_id?: string;
  name: string;
  stage: string;
  score: number;
  amount?: number;
  status: string;
  created_at: string;
}

// API Response types
export interface APIResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Dashboard metrics
export interface DashboardMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_contacts: number;
  tasks_due_today: number;
  tasks_overdue: number;
  sops_in_progress: number;
}

export interface ArmMetrics {
  arm_id: ArmId;
  projects_count: number;
  active_projects: number;
  contacts_count: number;
  tasks_pending: number;
}

// Chat/AI types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    action?: string;
    tool_calls?: ToolCall[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

// Intelligence/News types
export type IntelRegion = 'gulf' | 'mena' | 'america' | 'global' | 'china' | 'russia';
export type IntelSource = 'x' | 'news' | 'rss';
export type IntelSentiment = 'positive' | 'negative' | 'neutral';

export interface IntelligenceItem {
  id: string;
  source: IntelSource;
  source_name: string; // e.g., "Reuters", "Al Jazeera", "@UAE_BARQ"
  source_url?: string;
  title: string;
  summary?: string;
  content?: string;
  image_url?: string;
  region: IntelRegion;
  tags: string[];
  sentiment?: IntelSentiment;
  relevance_score?: number;
  published_at: string;
  fetched_at: string;
  is_breaking?: boolean;
  related_contacts?: string[];
  metadata?: Record<string, unknown>;
}
