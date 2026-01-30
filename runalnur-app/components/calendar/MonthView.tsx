"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FocusBlock, getContextColor, isSameDay, addDays } from "@/lib/calendar/types";

interface MonthViewProps {
  blocks: FocusBlock[];
  selectedDate: Date;
  onDaySelect: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  onBlockClick?: (block: FocusBlock) => void;
  className?: string;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function MonthView({
  blocks,
  selectedDate,
  onDaySelect,
  onMonthChange,
  onBlockClick,
  className,
}: MonthViewProps) {
  const [viewDate, setViewDate] = useState(selectedDate);

  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const gridDates = useMemo(() => {
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = startOfMonth.getDay();
    const gridStart = new Date(startOfMonth);
    gridStart.setDate(startOfMonth.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [viewDate]);

  const today = new Date();

  const handleMonthChange = (delta: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(next);
    onMonthChange?.(next);
  };

  const getBlocksForDay = (date: Date) =>
    blocks.filter((block) => isSameDay(new Date(block.start_time), date));

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">{monthLabel}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMonthChange?.(new Date())}
            className="text-xs h-8 px-2 shrink-0"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMonthChange(-1)}
            className="h-10 w-10 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMonthChange(1)}
            className="h-10 w-10 sm:h-8 sm:w-8"
          >
            <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border text-[10px] sm:text-xs font-medium text-muted-foreground">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 min-h-0">
        {gridDates.map((date) => {
          const inMonth = date.getMonth() === viewDate.getMonth();
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dayBlocks = getBlocksForDay(date);
          const totalHours = dayBlocks.reduce((acc, block) => {
            const start = new Date(block.start_time);
            const end = new Date(block.end_time);
            return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }, 0);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDaySelect(date)}
              className={cn(
                "border-r border-b border-border p-2 text-left flex flex-col gap-1 min-h-[96px]",
                !inMonth && "bg-muted/30 text-muted-foreground",
                isSelected && "bg-primary/10",
                isToday && "ring-1 ring-primary/40"
              )}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={cn(isToday && "text-primary")}>{date.getDate()}</span>
                {totalHours > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(totalHours)}h
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-[10px]">
                {dayBlocks.slice(0, 2).map((block) => {
                  const color = block.color || getContextColor(block.context);
                  return (
                    <span
                      key={block.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onBlockClick?.(block);
                      }}
                      className="flex items-center gap-1 truncate"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{block.title}</span>
                    </span>
                  );
                })}
                {dayBlocks.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayBlocks.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
