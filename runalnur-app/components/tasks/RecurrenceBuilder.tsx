"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const DAY_OPTIONS = [
  { id: "MO", label: "M" },
  { id: "TU", label: "T" },
  { id: "WE", label: "W" },
  { id: "TH", label: "T" },
  { id: "FR", label: "F" },
  { id: "SA", label: "S" },
  { id: "SU", label: "S" },
];

const WEEKDAY_RULE = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";

interface RecurrenceBuilderProps {
  value?: string | null;
  onChange: (rule: string | null) => void;
  startDate?: string | null;
}

function formatUntil(dateValue: string): string {
  const date = new Date(dateValue);
  const iso = date.toISOString().replace(/[-:]/g, "").split(".")[0];
  return `${iso}Z`;
}

function parseUntil(rule: string): string | null {
  const match = rule.match(/UNTIL=([0-9TZ]+)/);
  if (!match) return null;
  const raw = match[1];
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function parseByDay(rule: string): string[] {
  const match = rule.match(/BYDAY=([A-Z,]+)/);
  if (!match) return [];
  return match[1].split(",");
}

function buildRule(
  frequency: string,
  days: string[],
  until: string | null,
  baseDate: Date
): string | null {
  if (frequency === "none") return null;
  let rule = "";
  if (frequency === "daily") rule = "FREQ=DAILY";
  if (frequency === "weekdays") rule = WEEKDAY_RULE;
  if (frequency === "weekly") {
    const byday = days.length ? `;BYDAY=${days.join(",")}` : "";
    rule = `FREQ=WEEKLY${byday}`;
  }
  if (frequency === "biweekly") {
    const byday = days.length ? `;BYDAY=${days.join(",")}` : "";
    rule = `FREQ=WEEKLY;INTERVAL=2${byday}`;
  }
  if (frequency === "monthly") {
    rule = `FREQ=MONTHLY;BYMONTHDAY=${baseDate.getDate()}`;
  }
  if (until) {
    rule += `;UNTIL=${formatUntil(until)}`;
  }
  return rule;
}

export function RecurrenceBuilder({ value, onChange, startDate }: RecurrenceBuilderProps) {
  const baseDate = useMemo(() => {
    if (startDate) {
      const [year, month, day] = startDate.split("T")[0].split("-").map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    return new Date();
  }, [startDate]);

  const [frequency, setFrequency] = useState("none");
  const [days, setDays] = useState<string[]>([]);
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setFrequency("none");
      setDays([]);
      setUntil(null);
      return;
    }
    if (value.includes("FREQ=DAILY")) {
      setFrequency("daily");
    } else if (value.includes("FREQ=MONTHLY")) {
      setFrequency("monthly");
    } else if (value.includes("FREQ=WEEKLY") && value.includes("INTERVAL=2")) {
      setFrequency("biweekly");
    } else if (value.includes(WEEKDAY_RULE)) {
      setFrequency("weekdays");
    } else if (value.includes("FREQ=WEEKLY")) {
      setFrequency("weekly");
    } else {
      setFrequency("none");
    }
    setDays(parseByDay(value));
    setUntil(parseUntil(value));
  }, [value]);

  useEffect(() => {
    const rule = buildRule(frequency, days, until, baseDate);
    onChange(rule);
  }, [frequency, days, until, baseDate, onChange]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
          Recurrence
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {(frequency === "weekly" || frequency === "biweekly") && (
        <div>
          <div className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-2">
            Repeat on
          </div>
          <div className="flex items-center gap-2">
            {DAY_OPTIONS.map((day) => {
              const active = days.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    setDays((prev) =>
                      active ? prev.filter((d) => d !== day.id) : [...prev, day.id]
                    );
                  }}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-medium border",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {frequency !== "none" && (
        <div>
          <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
            Ends (optional)
          </label>
          <input
            type="date"
            value={until || ""}
            onChange={(e) => setUntil(e.target.value || null)}
            className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
          />
        </div>
      )}
    </div>
  );
}
