import type { Mode } from "@/lib/mode/context";

export interface CrossModeAlert {
  id: string;
  source_mode: Mode;
  alert_type: string;
  title: string;
  description?: string;
  priority: "critical" | "high" | "medium" | "low";
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  read_at?: string;
  dismissed_at?: string;
  created_at: string;
}

export interface AlertsByMode {
  command: CrossModeAlert[];
  capital: CrossModeAlert[];
  influence: CrossModeAlert[];
}

// Alert types by mode
export const ALERT_TYPES = {
  command: {
    task_overdue: "Task Overdue",
    approval_needed: "Approval Needed",
    project_blocked: "Project Blocked",
    sop_action_required: "SOP Action Required",
  },
  capital: {
    capital_call_due: "Capital Call Due",
    low_cash: "Low Cash Warning",
    price_alert: "Price Alert",
    distribution_received: "Distribution Received",
  },
  influence: {
    relationship_decay: "Relationship Needs Attention",
    meeting_prep: "Meeting Prep Needed",
    birthday_reminder: "Birthday Reminder",
    intel_alert: "Intelligence Alert",
    media_mention: "Media Mention",
  },
} as const;

// Priority colors
export const PRIORITY_COLORS = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
} as const;

// Group alerts by mode
export function groupAlertsByMode(alerts: CrossModeAlert[]): AlertsByMode {
  return {
    command: alerts.filter((a) => a.source_mode === "command"),
    capital: alerts.filter((a) => a.source_mode === "capital"),
    influence: alerts.filter((a) => a.source_mode === "influence"),
  };
}

// Get unread count per mode
export function getUnreadCountByMode(alerts: CrossModeAlert[]): Record<Mode, number> {
  const unread = alerts.filter((a) => !a.read_at && !a.dismissed_at);
  return {
    command: unread.filter((a) => a.source_mode === "command").length,
    capital: unread.filter((a) => a.source_mode === "capital").length,
    influence: unread.filter((a) => a.source_mode === "influence").length,
  };
}

// Get total unread count
export function getTotalUnreadCount(alerts: CrossModeAlert[]): number {
  return alerts.filter((a) => !a.read_at && !a.dismissed_at).length;
}

// Sort alerts by priority and date
export function sortAlerts(alerts: CrossModeAlert[]): CrossModeAlert[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...alerts].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // Then by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// Get action URL for an alert
export function getAlertActionUrl(alert: CrossModeAlert): string {
  if (alert.action_url) return alert.action_url;
  
  // Default URLs based on mode
  const modeUrls: Record<Mode, string> = {
    command: "/",
    capital: "/capital",
    influence: "/influence",
  };
  
  return modeUrls[alert.source_mode];
}

// Create a relationship decay alert
export function createRelationshipDecayAlert(contact: {
  id: string;
  name: string;
  days_since: number;
  strength: number;
}): Omit<CrossModeAlert, "id" | "created_at"> {
  const priority = contact.strength < 30 ? "high" : contact.strength < 50 ? "medium" : "low";
  
  return {
    source_mode: "influence",
    alert_type: "relationship_decay",
    title: `${contact.name}: ${contact.days_since} days`,
    description: `Relationship strength at ${contact.strength}%. Consider reaching out.`,
    priority,
    entity_type: "contact",
    entity_id: contact.id,
    action_url: `/influence/contacts?id=${contact.id}`,
  };
}

// Create a capital call alert
export function createCapitalCallAlert(call: {
  id: string;
  fund_name: string;
  amount: number;
  due_date: string;
  days_until_due: number;
}): Omit<CrossModeAlert, "id" | "created_at"> {
  const priority = call.days_until_due <= 3 ? "critical" : call.days_until_due <= 7 ? "high" : "medium";
  
  return {
    source_mode: "capital",
    alert_type: "capital_call_due",
    title: `Capital call due in ${call.days_until_due} days`,
    description: `${call.fund_name}: $${call.amount.toLocaleString()} due ${call.due_date}`,
    priority,
    entity_type: "capital_call",
    entity_id: call.id,
    action_url: `/capital/calls?id=${call.id}`,
  };
}

// Create a task overdue alert
export function createTaskOverdueAlert(task: {
  id: string;
  name: string;
  project_name: string;
  days_overdue: number;
}): Omit<CrossModeAlert, "id" | "created_at"> {
  const priority = task.days_overdue > 7 ? "high" : "medium";
  
  return {
    source_mode: "command",
    alert_type: "task_overdue",
    title: `Task "${task.name}" overdue`,
    description: `${task.days_overdue} days overdue on ${task.project_name}`,
    priority,
    entity_type: "task",
    entity_id: task.id,
    action_url: `/projects?task=${task.id}`,
  };
}

// Format alert for display
export function formatAlertTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString();
}
