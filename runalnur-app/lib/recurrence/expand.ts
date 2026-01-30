import { RRule } from "rrule";
import type { Task } from "@/lib/types";

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const [datePart] = String(value).split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function getRecurrenceStart(task: Task): Date {
  const fromDo = parseDateOnly(task.do_date);
  const fromDue = parseDateOnly(task.due_date);
  if (fromDo) return fromDo;
  if (fromDue) return fromDue;
  return new Date(task.created_at);
}

export function expandRecurringDates(task: Task, from: Date, to: Date): Date[] {
  if (!task.recurrence_rule) return [];
  try {
    const options = RRule.parseString(task.recurrence_rule);
    const dtstart = getRecurrenceStart(task);
    const rule = new RRule({ ...options, dtstart });
    return rule.between(from, to, true);
  } catch (err) {
    console.error("Failed to parse recurrence rule:", err);
    return [];
  }
}
