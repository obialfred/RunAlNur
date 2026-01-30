"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Calendar, Gift, Star, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// Mock calendar events
const mockEvents: CalendarEvent[] = [];

interface CalendarEvent {
  id: string;
  type: "birthday" | "anniversary" | "meeting" | "event";
  title: string;
  contactId?: string;
  contactName?: string;
  date: string;
  note?: string;
  recurring?: boolean;
}

export default function DiplomaticCalendarPage() {
  const shouldReduce = useReducedMotion();
  const [events] = useState<CalendarEvent[]>(mockEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get events for current month
  const monthEvents = events.filter((e) => {
    const eventDate = new Date(e.date);
    return (
      eventDate.getMonth() === currentMonth.getMonth() &&
      eventDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  // Get upcoming events (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Diplomatic Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Birthdays, anniversaries, and important dates
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Date
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <motion.div
          className="lg:col-span-2 agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...spring.default }}
        >
          {/* Month Navigation */}
          <div className="agentic-card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-section min-w-[150px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="agentic-card-content">
            <CalendarGrid currentMonth={currentMonth} events={monthEvents} />
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...spring.default }}
        >
          <div className="agentic-card-header">
            <h2 className="text-section">Next 30 Days</h2>
          </div>
          <div className="agentic-card-content">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No upcoming dates</p>
                <p className="text-xs mt-1">Add birthdays and anniversaries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CalendarGrid({
  currentMonth,
  events,
}: {
  currentMonth: Date;
  events: CalendarEvent[];
}) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  // Get first day of month and total days
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  // Create calendar cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    cells.push(i);
  }

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === day;
    });
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div>
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-muted-foreground uppercase py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={day}
              className={cn(
                "aspect-square p-1 rounded-sm transition-colors",
                isToday(day) && "bg-foreground text-background",
                !isToday(day) && hasEvents && "bg-muted",
                !isToday(day) && !hasEvents && "hover:bg-muted/50"
              )}
            >
              <div className="text-xs font-medium text-center">{day}</div>
              {hasEvents && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        event.type === "birthday" && "bg-rose-500",
                        event.type === "anniversary" && "bg-amber-500",
                        event.type === "meeting" && "bg-blue-500",
                        event.type === "event" && "bg-emerald-500"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-border">
        <LegendItem color="bg-rose-500" label="Birthday" />
        <LegendItem color="bg-amber-500" label="Anniversary" />
        <LegendItem color="bg-blue-500" label="Meeting" />
        <LegendItem color="bg-emerald-500" label="Event" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const typeIcons = {
    birthday: Gift,
    anniversary: Star,
    meeting: Calendar,
    event: Calendar,
  };
  const Icon = typeIcons[event.type];

  const typeColors = {
    birthday: "text-rose-500",
    anniversary: "text-amber-500",
    meeting: "text-blue-500",
    event: "text-emerald-500",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-muted transition-colors">
      <div className={cn("w-8 h-8 rounded-sm bg-muted flex items-center justify-center", typeColors[event.type])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{event.title}</div>
        {event.contactName && (
          <div className="text-xs text-muted-foreground">{event.contactName}</div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{formatDate(event.date)}</div>
    </div>
  );
}
