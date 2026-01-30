"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { Button } from "@/components/ui/button";
import {
  FocusBlock,
  getWeekDates,
  isSameDay,
  addDays,
  getBlockPosition,
  getContextColor,
  formatTimeShort,
} from "@/lib/calendar/types";

// ============================================================================
// TYPES
// ============================================================================

interface WeekViewProps {
  blocks: FocusBlock[];
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onBlockClick?: (block: FocusBlock) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onBlockMove?: (block: FocusBlock, newStart: Date, newEnd: Date) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HOUR_HEIGHT = 60; // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const SNAP_MINUTES = 15;

// ============================================================================
// COMPONENT
// ============================================================================

export function WeekView({
  blocks,
  currentDate,
  onDateChange,
  onBlockClick,
  onSlotClick,
  onBlockMove,
  className,
}: WeekViewProps) {
  const [internalDate, setInternalDate] = useState(new Date());
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewBlock, setPreviewBlock] = useState<{
    id: string;
    start: Date;
    end: Date;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [dragState, setDragState] = useState<{
    block: FocusBlock;
    dayIndex: number;
    originX: number;
    originY: number;
    start: Date;
    end: Date;
    columnWidth: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    block: FocusBlock;
    dayIndex: number;
    originY: number;
    start: Date;
    end: Date;
  } | null>(null);

  useEffect(() => {
    if (currentDate) {
      setInternalDate(currentDate);
    }
  }, [currentDate]);

  const activeDate = currentDate ?? internalDate;
  const setDate = useCallback(
    (nextDate: Date) => {
      onDateChange?.(nextDate);
      if (!currentDate || !onDateChange) {
        setInternalDate(nextDate);
      }
    },
    [currentDate, onDateChange]
  );

  // Calculate week dates
  const weekDates = useMemo(() => getWeekDates(activeDate), [activeDate]);
  const today = new Date();

  const effectiveBlocks = useMemo(() => {
    if (!previewBlock) return blocks;
    return blocks.map((block) =>
      block.id === previewBlock.id
        ? {
            ...block,
            start_time: previewBlock.start.toISOString(),
            end_time: previewBlock.end.toISOString(),
          }
        : block
    );
  }, [blocks, previewBlock]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = (currentHour - 1) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  // Get blocks for a specific day
  const getBlocksForDay = useCallback(
    (date: Date) => {
      return effectiveBlocks.filter((block) => {
        const blockDate = new Date(block.start_time);
        return isSameDay(blockDate, date);
      });
    },
    [effectiveBlocks]
  );

  // Navigation handlers
  const goToPrevWeek = () => setDate(addDays(activeDate, -7));
  const goToNextWeek = () => setDate(addDays(activeDate, 7));
  const goToToday = () => setDate(new Date());

  // Handle slot click (for creating new blocks)
  const handleSlotClick = (date: Date, hour: number) => {
    if (onSlotClick && !isDragging) {
      const clickDate = new Date(date);
      clickDate.setHours(hour, 0, 0, 0);
      onSlotClick(clickDate, hour);
    }
  };

  // Handle block click
  const handleBlockClick = (block: FocusBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClickRef.current) return;
    setSelectedBlock(block.id);
    onBlockClick?.(block);
  };

  const startDrag = useCallback(
    (event: React.PointerEvent, block: FocusBlock, dayIndex: number) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;

      const columnRect = (event.currentTarget.parentElement as HTMLElement | null)?.getBoundingClientRect();
      const columnWidth = columnRect?.width || 1;

      setDragState({
        block,
        dayIndex,
        originX: event.clientX,
        originY: event.clientY,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
        columnWidth,
      });
      setPreviewBlock({
        id: block.id,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
      });
      setIsDragging(true);
    },
    []
  );

  const startResize = useCallback(
    (event: React.PointerEvent, block: FocusBlock, dayIndex: number) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;

      setResizeState({
        block,
        dayIndex,
        originY: event.clientY,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
      });
      setPreviewBlock({
        id: block.id,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
      });
      setIsDragging(true);
    },
    []
  );

  useEffect(() => {
    if (!dragState && !resizeState) return;

    const minutesPerPixel = 60 / HOUR_HEIGHT;

    const handleMove = (event: PointerEvent) => {
      if (dragState) {
        const deltaX = event.clientX - dragState.originX;
        const deltaY = event.clientY - dragState.originY;
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          suppressClickRef.current = true;
        }
        const rawDayOffset = Math.round(deltaX / dragState.columnWidth);
        const dayOffset = Math.max(-dragState.dayIndex, Math.min(6 - dragState.dayIndex, rawDayOffset));

        const deltaMinutes = Math.round((deltaY * minutesPerPixel) / SNAP_MINUTES) * SNAP_MINUTES;
        const durationMinutes = (dragState.end.getTime() - dragState.start.getTime()) / 60000;

        const targetDate = addDays(weekDates[dragState.dayIndex], dayOffset);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const originalStartMinutes =
          dragState.start.getHours() * 60 + dragState.start.getMinutes();
        let newStartMinutes = originalStartMinutes + deltaMinutes;
        newStartMinutes = Math.max(0, Math.min(24 * 60 - durationMinutes, newStartMinutes));

        const newStart = new Date(startOfDay);
        newStart.setMinutes(newStartMinutes);
        const newEnd = new Date(newStart);
        newEnd.setMinutes(newStartMinutes + durationMinutes);

        setPreviewBlock({ id: dragState.block.id, start: newStart, end: newEnd });
      }

      if (resizeState) {
        const deltaY = event.clientY - resizeState.originY;
        if (Math.abs(deltaY) > 3) {
          suppressClickRef.current = true;
        }
        const deltaMinutes = Math.round((deltaY * minutesPerPixel) / SNAP_MINUTES) * SNAP_MINUTES;
        const minDuration = SNAP_MINUTES;
        const startMinutes =
          resizeState.start.getHours() * 60 + resizeState.start.getMinutes();
        let newEndMinutes =
          resizeState.end.getHours() * 60 + resizeState.end.getMinutes() + deltaMinutes;
        newEndMinutes = Math.max(startMinutes + minDuration, Math.min(24 * 60, newEndMinutes));

        const newEnd = new Date(resizeState.start);
        newEnd.setMinutes(newEndMinutes);

        setPreviewBlock({ id: resizeState.block.id, start: resizeState.start, end: newEnd });
      }
    };

    const handleUp = () => {
      if (dragState && previewBlock) {
        onBlockMove?.(dragState.block, previewBlock.start, previewBlock.end);
      }
      if (resizeState && previewBlock) {
        onBlockMove?.(resizeState.block, previewBlock.start, previewBlock.end);
      }
      setDragState(null);
      setResizeState(null);
      setPreviewBlock(null);
      setIsDragging(false);
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState, resizeState, previewBlock, onBlockMove, weekDates]);

  // Current time indicator position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / 60) * HOUR_HEIGHT;
  }, []);

  // Format date for header
  const formatHeaderDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">{formatHeaderDate(activeDate)}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-xs h-8 px-2 shrink-0"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevWeek}
            className="h-10 w-10 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextWeek}
            className="h-10 w-10 sm:h-8 sm:w-8"
          >
            <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers - horizontally scrollable on small screens */}
      <div className="flex border-b border-border shrink-0 overflow-x-auto scrollbar-hide">
        {/* Time column spacer */}
        <div className="w-10 sm:w-14 shrink-0" />

        {/* Day columns */}
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 min-w-[44px] py-2 text-center border-l border-border",
                isToday && "bg-primary/5"
              )}
            >
              <p className="text-[9px] sm:text-[10px] font-medium tracking-wider text-muted-foreground">
                {DAY_NAMES[i]}
              </p>
              <p
                className={cn(
                  "text-base sm:text-lg font-semibold mt-0.5",
                  isToday && "text-primary"
                )}
              >
                {date.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scrollable Grid */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex relative" style={{ minHeight: HOUR_HEIGHT * 24 }}>
          {/* Time Labels */}
          <div className="w-10 sm:w-14 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-1 sm:right-2 text-[9px] sm:text-[10px] text-muted-foreground font-medium"
                style={{ top: hour * HOUR_HEIGHT - 6 }}
              >
                {formatTimeShort(hour)}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDates.map((date, dayIndex) => {
            const dayBlocks = getBlocksForDay(date);
            const isToday = isSameDay(date, today);

            return (
              <div
                key={dayIndex}
                className={cn(
                  "flex-1 min-w-[44px] relative border-l border-border",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => handleSlotClick(date, hour)}
                  />
                ))}

                {/* Current time indicator */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: currentTimePosition }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Focus Blocks */}
                <AnimatePresence>
                  {dayBlocks.map((block) => {
                    const { top, height } = getBlockPosition(
                      block,
                      date,
                      HOUR_HEIGHT
                    );
                    const color = block.color || getContextColor(block.context);
                    const isSelected = selectedBlock === block.id;

                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={spring.snappy}
                        className={cn(
                          "absolute left-1 right-1 rounded-md px-2 py-1 cursor-grab active:cursor-grabbing overflow-hidden",
                          "border border-transparent hover:border-foreground/20",
                          isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                        style={{
                          top,
                          height,
                          backgroundColor: `${color}20`,
                          borderLeftWidth: 3,
                          borderLeftColor: color,
                        }}
                        onClick={(e) => handleBlockClick(block, e)}
                        onPointerDown={(e) => startDrag(e, block, dayIndex)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color }}
                        >
                          {block.title}
                        </p>
                        {height > 40 && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {new Date(block.start_time).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {block.completed && (
                          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize"
                          onPointerDown={(e) => startResize(e, block, dayIndex)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Footer - hidden on very small screens, shown on sm+ */}
      <div className="hidden sm:flex border-t border-border px-3 sm:px-4 py-2 items-center justify-between text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {blocks.filter((b) =>
              weekDates.some((d) => isSameDay(new Date(b.start_time), d))
            ).length}{" "}
            blocks
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {Math.round(
            blocks
              .filter((b) =>
                weekDates.some((d) => isSameDay(new Date(b.start_time), d))
              )
              .reduce((acc, b) => {
                const start = new Date(b.start_time);
                const end = new Date(b.end_time);
                return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              }, 0)
          )}h scheduled
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MINI CALENDAR (for sidebar)
// ============================================================================

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  blockedDates?: Date[];
}

export function MiniCalendar({
  selectedDate,
  onDateSelect,
  blockedDates = [],
}: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(selectedDate);

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const hasBlocks = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return blockedDates.some((d) => isSameDay(d, date));
  };

  const today = new Date();

  return (
    <div className="p-3 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() =>
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))
          }
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">
          {viewDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          onClick={() =>
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))
          }
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-[10px] font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) {
            return <div key={i} />;
          }

          const date = new Date(
            viewDate.getFullYear(),
            viewDate.getMonth(),
            day
          );
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasContent = hasBlocks(day);

          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className={cn(
                "relative w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors",
                isToday && "font-bold",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {day}
              {hasContent && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
