"use client";

import { useMemo, useState } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { type FocusContext } from "@/lib/calendar/types";
import { ContextChip } from "@/components/ui/ContextChip";

const DEFAULT_CONTEXTS: FocusContext[] = ["personal", "house", "nova", "janna", "obx", "silk", "atw", "maison"];

export function QuickAddTask({
  defaultContext = "house",
  onCreated,
  className,
}: {
  defaultContext?: string;
  onCreated?: () => void;
  className?: string;
}) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState<string>(defaultContext);
  const [due, setDue] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priorityLevel, setPriorityLevel] = useState("p3");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [doDate, setDoDate] = useState<string>("");

  const dueOptions = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = new Date(now);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return { today, tomorrow };
  }, []);

  const dueString = due ? format(due, "yyyy-MM-dd") : null;
  const todayString = format(dueOptions.today, "yyyy-MM-dd");
  const tomorrowString = format(dueOptions.tomorrow, "yyyy-MM-dd");

  const isCustomDate = due && dueString !== todayString && dueString !== tomorrowString;

  const create = async () => {
    const name = title.trim();
    if (!name || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          context,
          due_date: dueString,
          do_date: doDate || null,
          status: "todo",
          priority: "medium",
          priority_level: priorityLevel,
          duration_minutes: durationMinutes,
          auto_schedule: autoSchedule,
          project_id: null, // inbox task
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        console.error("Task creation failed:", result.error || response.statusText);
        // Optionally show error to user via toast/alert
        return;
      }
      setTitle("");
      setDue(undefined);
      setDoDate("");
      onCreated?.();
    } catch (err) {
      console.error("Task creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="h-11 bg-muted border-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void create();
              }
            }}
          />
        </div>
        <Button
          type="button"
          onClick={() => void create()}
          className="h-11 w-11 min-w-[44px] p-0"
          disabled={loading || !title.trim()}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1" data-horizontal-scroll="true">
        {DEFAULT_CONTEXTS.map((c) => (
          <ContextChip key={c} context={c} active={context === c} onClick={() => setContext(c)} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDue(dueOptions.today)}
          className={cn(
            "min-h-[44px] px-3 rounded-sm border border-border text-xs font-medium transition-colors",
            dueString === todayString ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setDue(dueOptions.tomorrow)}
          className={cn(
            "min-h-[44px] px-3 rounded-sm border border-border text-xs font-medium transition-colors",
            dueString === tomorrowString ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => setDue(undefined)}
          className={cn(
            "min-h-[44px] px-3 rounded-sm border border-border text-xs font-medium transition-colors",
            !due ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          No due
        </button>

        {/* Calendar date picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "ml-auto min-h-[44px] min-w-[44px] px-3 rounded-sm border border-border text-xs font-medium transition-colors inline-flex items-center justify-center gap-2",
                isCustomDate ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Pick a due date"
            >
              <CalendarIcon className="w-4 h-4" />
              {isCustomDate && <span className="font-mono text-[10px]">{format(due, "MMM d")}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={due}
              onSelect={(date) => {
                setDue(date);
                setCalendarOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? "Hide options" : "More options"}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-1">
              Priority Level
            </label>
            <select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(e.target.value)}
              className="w-full h-9 text-xs bg-muted border border-border rounded-sm px-3"
            >
              <option value="p1">P1 (Critical)</option>
              <option value="p2">P2 (High)</option>
              <option value="p3">P3 (Medium)</option>
              <option value="p4">P4 (Low)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-1">
              Duration (min)
            </label>
            <Input
              type="number"
              min={15}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-1">
              Do Date
            </label>
            <Input
              type="date"
              value={doDate}
              onChange={(e) => setDoDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={autoSchedule}
                onChange={(e) => setAutoSchedule(e.target.checked)}
              />
              Auto-schedule
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
