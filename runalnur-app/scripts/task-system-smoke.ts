import { autoSchedule, calculateDoDate, DEFAULT_SCHEDULER_PREFERENCES } from "../lib/scheduler";
import type { Task } from "../lib/types";
import type { FocusBlock } from "../lib/calendar/types";

const toDateString = (date: Date) => date.toISOString().split("T")[0];

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const tasks: Task[] = [
  {
    id: "t1",
    name: "P1 investor deck (120m)",
    status: "todo",
    priority: "critical",
    priority_level: "p1",
    due_date: toDateString(tomorrow),
    duration_minutes: 120,
    auto_schedule: true,
    context: "nova",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t2",
    name: "P2 review lease (60m)",
    status: "todo",
    priority: "high",
    priority_level: "p2",
    due_date: toDateString(nextWeek),
    duration_minutes: 60,
    auto_schedule: true,
    context: "janna",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t3",
    name: "P4 inbox cleanup (30m)",
    status: "todo",
    priority: "low",
    priority_level: "p4",
    duration_minutes: 30,
    auto_schedule: true,
    context: "house",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const existingBlocks: FocusBlock[] = [
  {
    id: "block-1",
    user_id: "user-1",
    title: "Morning Meeting",
    context: "house",
    start_time: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(),
    timezone: "America/Chicago",
    completed: false,
    sync_status: "synced",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function run() {
  const doDate = calculateDoDate(toDateString(tomorrow), 120);
  console.log("Calculated do_date for 120m task due tomorrow:", doDate);

  const result = await autoSchedule({
    tasks,
    existingBlocks,
    preferences: {
      ...DEFAULT_SCHEDULER_PREFERENCES,
      workingHours: { start: "09:00", end: "17:00" },
      bufferMinutes: 10,
    },
    targetDate: today,
  });

  console.log("Scheduler summary:", result.summary);
  console.log(
    "Scheduled tasks:",
    result.scheduledTasks.map((t) => ({
      id: t.task.id,
      start: t.scheduledStart.toISOString(),
      end: t.scheduledEnd.toISOString(),
    }))
  );
  console.log(
    "At-risk tasks:",
    result.atRiskTasks.map((t) => ({
      id: t.task.id,
      reason: t.reason,
    }))
  );
}

run().catch((err) => {
  console.error("Task system smoke test failed:", err);
  process.exit(1);
});
