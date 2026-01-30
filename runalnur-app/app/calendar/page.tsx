"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekView, MiniCalendar } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { BlockEditor } from "@/components/calendar/BlockEditor";
import { FadeIn } from "@/components/motion";
import { FocusBlock, CONTEXT_CONFIGS, isSameDay } from "@/lib/calendar/types";
import { useFocusBlocks } from "@/lib/hooks/useFocusBlocks";

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const viewParam = searchParams.get("view");
  const [activeView, setActiveView] = useState<"week" | "month">(
    viewParam === "month" ? "month" : "week"
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<FocusBlock | undefined>(undefined);
  const [newBlockDate, setNewBlockDate] = useState<Date | undefined>(undefined);
  const [newBlockHour, setNewBlockHour] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (viewParam === "month") {
      setActiveView("month");
    } else {
      setActiveView("week");
    }
  }, [viewParam]);

  const handleViewChange = useCallback(
    (nextView: "week" | "month") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", nextView);
      router.replace(`${pathname}?${params.toString()}`);
      setActiveView(nextView);
    },
    [pathname, router, searchParams]
  );

  const focusRange = useMemo(() => {
    const date = new Date(selectedDate);
    if (activeView === "month") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }

    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }, [activeView, selectedDate]);

  const { data: blocks, refresh: refreshBlocks } = useFocusBlocks(focusRange);

  // Calculate time stats
  const weeklyHours = blocks.reduce((acc, block) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const contextStats = CONTEXT_CONFIGS.slice(0, 8).map((cfg) => {
    const hours = blocks
      .filter((b) => b.context === cfg.id)
      .reduce((acc, block) => {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
    return { ...cfg, hours };
  }).filter((c) => c.hours > 0);

  // Handlers
  const handleBlockClick = useCallback((block: FocusBlock) => {
    setEditingBlock(block);
    setNewBlockDate(undefined);
    setNewBlockHour(undefined);
    setIsEditorOpen(true);
  }, []);

  const handleSlotClick = useCallback((date: Date, hour: number) => {
    setEditingBlock(undefined);
    setNewBlockDate(date);
    setNewBlockHour(hour);
    setIsEditorOpen(true);
  }, []);

  const handleBlockMove = useCallback(
    (block: FocusBlock, newStart: Date, newEnd: Date) => {
      const run = async () => {
        await fetch(`/api/focus-blocks/${block.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          }),
        });
        await refreshBlocks();
      };
      void run();
    },
    [refreshBlocks]
  );

  const handleSave = useCallback((blockData: Partial<FocusBlock>) => {
    const run = async () => {
      if (blockData.id) {
        await fetch(`/api/focus-blocks/${blockData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(blockData),
        });
      } else {
        await fetch(`/api/focus-blocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(blockData),
        });
      }
      await refreshBlocks();
      setIsEditorOpen(false);
    };
    void run();
  }, [refreshBlocks]);

  const handleDelete = useCallback((id: string) => {
    const run = async () => {
      await fetch(`/api/focus-blocks/${id}`, { method: "DELETE" });
      await refreshBlocks();
      setIsEditorOpen(false);
    };
    void run();
  }, [refreshBlocks]);

  const handleNewBlock = () => {
    setEditingBlock(undefined);
    setNewBlockDate(new Date());
    setNewBlockHour(9);
    setIsEditorOpen(true);
  };

  // Get dates that have blocks
  const blockedDates = blocks.map((b) => new Date(b.start_time));

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      {/* Mobile header - always visible on mobile */}
      <div className="lg:hidden shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold">Calendar</h1>
            <p className="text-xs text-muted-foreground truncate">
              {Math.round(weeklyHours)}h scheduled this week
            </p>
          </div>
          <Button size="sm" onClick={handleNewBlock} className="shrink-0 h-10 w-10 p-0 sm:w-auto sm:px-3">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">New</span>
          </Button>
        </div>

        <div className="px-3 py-2 border-b border-border flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeView === "week" ? "default" : "outline"}
              onClick={() => handleViewChange("week")}
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={activeView === "month" ? "default" : "outline"}
              onClick={() => handleViewChange("month")}
            >
              Month
            </Button>
          </div>
        </div>
        
        {/* Mobile context stats - horizontal scroll */}
        {contextStats.length > 0 && (
          <div className="px-3 py-2 border-b border-border overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              {contextStats.map((stat) => (
                <div key={stat.id} className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {stat.name}: {Math.round(stat.hours)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="w-64 border-r border-border p-4 space-y-6 hidden lg:block shrink-0">
        <FadeIn>
          <Button onClick={handleNewBlock} className="w-full gap-2 h-10">
            <Plus className="w-4 h-4" />
            New Focus Block
          </Button>
        </FadeIn>

        <FadeIn delay={0.05}>
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            blockedDates={blockedDates}
          />
        </FadeIn>

        {/* Time Allocation Stats */}
        <FadeIn delay={0.1}>
          <div className="bg-card border border-border rounded-lg p-3">
            <h3 className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-3">
              This Week
            </h3>
            <p className="text-2xl font-bold mb-3">
              {Math.round(weeklyHours)}h
              <span className="text-sm font-normal text-muted-foreground ml-1">
                scheduled
              </span>
            </p>

            {/* Context breakdown */}
            <div className="space-y-2">
              {contextStats.map((stat) => (
                <div key={stat.id} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="text-xs flex-1">{stat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(stat.hours)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Sync Status */}
        <FadeIn delay={0.15}>
          <div className="bg-card border border-border rounded-lg p-3">
            <h3 className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-2">
              Calendar Sync
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Not connected</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-9">
              Connect Google Calendar
            </Button>
          </div>
        </FadeIn>
      </div>

      {/* Main Calendar - takes remaining space */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <div className="hidden lg:flex items-center justify-end px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeView === "week" ? "default" : "outline"}
              onClick={() => handleViewChange("week")}
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={activeView === "month" ? "default" : "outline"}
              onClick={() => handleViewChange("month")}
            >
              Month
            </Button>
          </div>
        </div>

        {activeView === "week" ? (
          <WeekView
            blocks={blocks}
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
            onBlockClick={handleBlockClick}
            onSlotClick={handleSlotClick}
            onBlockMove={handleBlockMove}
            className="flex-1 min-h-0"
          />
        ) : (
          <MonthView
            blocks={blocks}
            selectedDate={selectedDate}
            onDaySelect={(date) => {
              setSelectedDate(date);
              handleViewChange("week");
            }}
            onMonthChange={(date) => setSelectedDate(date)}
            onBlockClick={handleBlockClick}
            className="flex-1 min-h-0"
          />
        )}
      </div>

      {/* Block Editor */}
      <BlockEditor
        block={editingBlock}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialDate={newBlockDate}
        initialHour={newBlockHour}
      />
    </div>
  );
}
