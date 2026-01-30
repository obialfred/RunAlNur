/**
 * Calendar Types
 */

export interface FocusBlock {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  context: FocusContext;
  start_time: string;
  end_time: string;
  timezone: string;
  recurrence_rule?: string;
  recurrence_end_date?: string;
  parent_block_id?: string;
  color?: string;
  google_event_id?: string;
  google_calendar_id?: string;
  last_synced_at?: string;
  sync_status: "pending" | "synced" | "error" | "local_only";
  completed: boolean;
  completed_at?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type FocusContext = 
  | "nova" 
  | "janna" 
  | "obx" 
  | "silk" 
  | "atw" 
  | "house" 
  | "maison"
  | "personal" 
  | "admin" 
  | "training" 
  | "other";

export interface ContextConfig {
  id: FocusContext;
  name: string;
  color: string;
  description: string;
  icon?: string;
}

export const CONTEXT_CONFIGS: ContextConfig[] = [
  { id: "nova", name: "Nova", color: "#3B82F6", description: "Technology, AI, hardware" },
  { id: "janna", name: "Janna", color: "#10B981", description: "Real estate development" },
  { id: "obx", name: "OBX", color: "#8B5CF6", description: "Music, creative" },
  { id: "silk", name: "Silk", color: "#F59E0B", description: "E-commerce" },
  { id: "atw", name: "ATW", color: "#EF4444", description: "Media production" },
  { id: "house", name: "House", color: "#F59E0B", description: "Holding company" },
  { id: "maison", name: "Maison", color: "#6B7280", description: "Family office" },
  { id: "personal", name: "Personal", color: "#EC4899", description: "Health, relationships" },
  { id: "admin", name: "Admin", color: "#6B7280", description: "Operations, paperwork" },
  { id: "training", name: "Training", color: "#EF4444", description: "Real estate broker" },
  { id: "other", name: "Other", color: "#94A3B8", description: "Miscellaneous" },
];

export function getContextConfig(context: FocusContext): ContextConfig {
  return CONTEXT_CONFIGS.find((c) => c.id === context) || CONTEXT_CONFIGS[CONTEXT_CONFIGS.length - 1];
}

export function getContextColor(context: FocusContext): string {
  return getContextConfig(context).color;
}

// Time utilities
export interface TimeSlot {
  hour: number;
  minute: number;
}

export interface DayColumn {
  date: Date;
  isToday: boolean;
  blocks: FocusBlock[];
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTimeShort(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day); // Go to Sunday
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getBlockPosition(
  block: FocusBlock,
  dayStart: Date,
  hourHeight: number
): { top: number; height: number } {
  const start = new Date(block.start_time);
  const end = new Date(block.end_time);
  
  const startMinutes = (start.getHours() * 60 + start.getMinutes());
  const endMinutes = (end.getHours() * 60 + end.getMinutes());
  
  const top = (startMinutes / 60) * hourHeight;
  const height = ((endMinutes - startMinutes) / 60) * hourHeight;
  
  return { top, height: Math.max(height, hourHeight / 2) };
}
