"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Film,
  FileText,
} from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay,
  isToday,
} from "date-fns";

export default function ContentCalendarPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const days = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
  });

  const goToPreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  // Mock scheduled posts
  const mockPosts: Record<string, Array<{ id: string; platform: string; caption: string; time: string }>> = {
    [format(new Date(), "yyyy-MM-dd")]: [
      { id: "1", platform: "instagram", caption: "Dubai skyline...", time: "18:00" },
    ],
    [format(addDays(new Date(), 1), "yyyy-MM-dd")]: [
      { id: "2", platform: "x", caption: "Announcement...", time: "09:00" },
      { id: "3", platform: "linkedin", caption: "Reflecting...", time: "12:00" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              Content Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Plan and schedule your content
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center border border-border rounded-md">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium min-w-[160px] text-center">
                {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), "MMM d, yyyy")}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Calendar grid */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center border-r border-border last:border-r-0",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p className={cn(
                    "text-lg font-semibold mt-1",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            {/* Day content */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const posts = mockPosts[dateKey] || [];

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 border-r border-border last:border-r-0 min-h-[100px]",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="mb-2 p-2 rounded bg-muted text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] text-muted-foreground">{post.time}</span>
                          <span className="text-[10px] font-medium uppercase">{post.platform}</span>
                        </div>
                        <p className="truncate">{post.caption}</p>
                      </div>
                    ))}
                    {posts.length === 0 && (
                      <button className="w-full h-full min-h-[80px] flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 rounded transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Upcoming posts list */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Week&apos;s Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Connect social accounts to start scheduling posts
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
