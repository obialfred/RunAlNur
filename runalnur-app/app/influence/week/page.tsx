"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Calendar, Clock, Mail, Phone, MessageSquare, MoreHorizontal, ChevronRight, Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";

// Mock data for weekly engagement
const mockEngagements: Engagement[] = [];

interface Engagement {
  id: string;
  contact: {
    id: string;
    name: string;
    company?: string;
    role?: string;
    tier: "inner_circle" | "strategic" | "general";
    avatarUrl?: string;
  };
  daysSinceContact: number;
  strength: number;
  suggestedAction: string;
  reason: string;
}

const mockUpcoming: UpcomingEvent[] = [];

interface UpcomingEvent {
  id: string;
  type: "meeting" | "call" | "event";
  title: string;
  contactName: string;
  date: string;
  time?: string;
}

const mockImportantDates: ImportantDate[] = [];

interface ImportantDate {
  id: string;
  type: "birthday" | "anniversary" | "holiday";
  contactName: string;
  date: string;
  note?: string;
}

export default function WeeklyEngagementPage() {
  const shouldReduce = useReducedMotion();
  const [engagements] = useState<Engagement[]>(mockEngagements);
  const [upcoming] = useState<UpcomingEvent[]>(mockUpcoming);
  const [importantDates] = useState<ImportantDate[]>(mockImportantDates);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekStart.toLocaleDateString("en-US", options)} - ${weekEnd.toLocaleDateString("en-US", options)}, ${weekEnd.getFullYear()}`;
  };

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
            This Week&apos;s Engagements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateRange()}
          </p>
        </div>
      </div>

      {/* Priority Outreach */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <div className="agentic-card-header">
          <h2 className="text-section">Priority Outreach</h2>
        </div>
        <div className="agentic-card-content">
          {engagements.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No priority outreach needed
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your relationships are in good standing!
              </p>
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: stagger.normal },
                },
              }}
            >
              {engagements.map((engagement, index) => (
                <EngagementCard
                  key={engagement.id}
                  engagement={engagement}
                  index={index + 1}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...spring.default }}
        >
          <div className="agentic-card-header">
            <h2 className="text-section">Scheduled This Week</h2>
          </div>
          <div className="agentic-card-content">
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                No meetings or calls scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <UpcomingEventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Important Dates */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...spring.default }}
        >
          <div className="agentic-card-header">
            <h2 className="text-section">Important Dates This Week</h2>
          </div>
          <div className="agentic-card-content">
            {importantDates.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-3 opacity-50" />
                No birthdays or anniversaries
              </div>
            ) : (
              <div className="space-y-3">
                {importantDates.map((date) => (
                  <ImportantDateRow key={date.id} date={date} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function EngagementCard({
  engagement,
  index,
}: {
  engagement: Engagement;
  index: number;
}) {
  const shouldReduce = useReducedMotion();
  const { contact } = engagement;

  const tierColors = {
    inner_circle: "bg-amber-500",
    strategic: "bg-blue-500",
    general: "bg-slate-500",
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 70) return "text-[var(--live)]";
    if (strength >= 50) return "text-[var(--warning)]";
    return "text-[var(--error)]";
  };

  return (
    <motion.div
      className="border border-border rounded-sm p-4"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
    >
      <div className="flex items-start gap-4">
        {/* Index */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
          {index}
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{contact.name}</span>
            <div className={`w-2 h-2 rounded-full ${tierColors[contact.tier]}`} />
          </div>
          {contact.company && (
            <div className="text-xs text-muted-foreground">
              {contact.role && `${contact.role} at `}
              {contact.company}
            </div>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              Last: <span className="text-foreground">{engagement.daysSinceContact} days ago</span>
            </span>
            <span>
              Strength:{" "}
              <span className={getStrengthColor(engagement.strength)}>
                {engagement.strength}/100
              </span>
            </span>
          </div>

          <div className="mt-3 p-2 bg-muted rounded-sm">
            <div className="text-xs font-medium mb-1">Suggested: {engagement.suggestedAction}</div>
            <div className="text-xs text-muted-foreground">{engagement.reason}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Mail className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function UpcomingEventRow({ event }: { event: UpcomingEvent }) {
  const typeIcons = {
    meeting: Calendar,
    call: Phone,
    event: Star,
  };
  const Icon = typeIcons[event.type];

  return (
    <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-muted transition-colors">
      <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{event.title}</div>
        <div className="text-xs text-muted-foreground">
          {event.contactName}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-medium">{event.date}</div>
        {event.time && (
          <div className="text-xs text-muted-foreground">{event.time}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

function ImportantDateRow({ date }: { date: ImportantDate }) {
  const typeIcons = {
    birthday: Gift,
    anniversary: Star,
    holiday: Calendar,
  };
  const Icon = typeIcons[date.type];

  return (
    <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-muted transition-colors">
      <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{date.contactName}</div>
        <div className="text-xs text-muted-foreground capitalize">
          {date.type.replace("_", " ")}
          {date.note && ` • ${date.note}`}
        </div>
      </div>
      <div className="text-xs font-medium">{date.date}</div>
    </div>
  );
}
