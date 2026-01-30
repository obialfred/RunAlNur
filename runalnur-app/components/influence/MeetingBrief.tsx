"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { 
  User, Calendar, Clock, TrendingUp, TrendingDown, 
  MessageSquare, Link, ChevronDown, ChevronUp, 
  FileText, Sparkles, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface MeetingBriefProps {
  contact: {
    id: string;
    name: string;
    company?: string;
    role?: string;
    relationshipStrength: number;
    lastContactedAt?: string;
    notes?: string;
    tags?: string[];
  };
  meeting: {
    title: string;
    datetime: string;
    location?: string;
  };
  recentNews?: {
    title: string;
    source: string;
    date: string;
    url?: string;
  }[];
  talkingPoints?: string[];
  history?: {
    date: string;
    type: string;
    summary: string;
  }[];
  isGenerating?: boolean;
  onGenerateTalkingPoints?: () => void;
}

export function MeetingBrief({
  contact,
  meeting,
  recentNews = [],
  talkingPoints = [],
  history = [],
  isGenerating = false,
  onGenerateTalkingPoints,
}: MeetingBriefProps) {
  const shouldReduce = useReducedMotion();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["relationship", "talking_points"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 70) return "text-[var(--live)]";
    if (strength >= 50) return "text-[var(--warning)]";
    return "text-[var(--error)]";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDaysSince = (dateStr?: string) => {
    if (!dateStr) return null;
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const daysSince = getDaysSince(contact.lastContactedAt);

  return (
    <motion.div
      className="agentic-card"
      initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
    >
      {/* Header */}
      <div className="agentic-card-header">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-section">Meeting Brief</h2>
        </div>
      </div>

      <div className="agentic-card-content space-y-6">
        {/* Meeting Info */}
        <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-sm">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-lg font-medium">
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{contact.name}</h3>
            {contact.company && (
              <p className="text-sm text-muted-foreground">
                {contact.role && `${contact.role} at `}
                {contact.company}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(meeting.datetime)}</span>
              </div>
              {meeting.location && (
                <div className="flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  <span>{meeting.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relationship Section */}
        <BriefSection
          title="Relationship"
          icon={User}
          expanded={expandedSections.has("relationship")}
          onToggle={() => toggleSection("relationship")}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Strength</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-lg font-semibold tabular-nums",
                    getStrengthColor(contact.relationshipStrength)
                  )}
                >
                  {contact.relationshipStrength}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
                {contact.relationshipStrength < 70 && (
                  <TrendingDown className="w-4 h-4 text-[var(--warning)]" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Contact</span>
              <span className="text-sm">
                {daysSince !== null
                  ? `${daysSince} days ago`
                  : "No record"}
              </span>
            </div>
            {contact.notes && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Your Notes
                </span>
                <p className="text-sm mt-1">{contact.notes}</p>
              </div>
            )}
          </div>
        </BriefSection>

        {/* Recent News Section */}
        {recentNews.length > 0 && (
          <BriefSection
            title="Recent News"
            icon={TrendingUp}
            expanded={expandedSections.has("news")}
            onToggle={() => toggleSection("news")}
          >
            <div className="space-y-2">
              {recentNews.map((news, i) => (
                <div
                  key={i}
                  className="p-2 bg-muted/30 rounded-sm hover:bg-muted/50 transition-colors"
                >
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    {news.title}
                  </a>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {news.source} • {news.date}
                  </div>
                </div>
              ))}
            </div>
          </BriefSection>
        )}

        {/* Talking Points Section */}
        <BriefSection
          title="Talking Points"
          icon={MessageSquare}
          expanded={expandedSections.has("talking_points")}
          onToggle={() => toggleSection("talking_points")}
          action={
            onGenerateTalkingPoints && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateTalkingPoints();
                }}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            )
          }
        >
          {talkingPoints.length > 0 ? (
            <ul className="space-y-2">
              {talkingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No talking points yet. Click generate to create AI-powered suggestions.
            </p>
          )}
        </BriefSection>

        {/* History Section */}
        {history.length > 0 && (
          <BriefSection
            title="Interaction History"
            icon={Clock}
            expanded={expandedSections.has("history")}
            onToggle={() => toggleSection("history")}
          >
            <div className="space-y-2">
              {history.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="text-xs text-muted-foreground w-20 flex-shrink-0">
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded mr-2">
                      {item.type}
                    </span>
                    {item.summary}
                  </div>
                </div>
              ))}
            </div>
          </BriefSection>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1">
            Add Notes
          </Button>
          <Button size="sm" className="flex-1">
            Log Interaction
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function BriefSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  action,
  children,
}: {
  title: string;
  icon: typeof User;
  expanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={shouldReduce ? { duration: 0 } : spring.default}
        className="overflow-hidden"
      >
        <div className="p-3 pt-0 border-t border-border">{children}</div>
      </motion.div>
    </div>
  );
}

// Standalone component to generate a meeting brief
export function generateMeetingBrief(contact: {
  id: string;
  name: string;
  company?: string;
}): Promise<{
  talkingPoints: string[];
  news: { title: string; source: string; date: string }[];
}> {
  // This would call the AI to generate talking points
  return Promise.resolve({
    talkingPoints: [
      `Congratulate ${contact.name} on any recent achievements`,
      `Discuss progress on shared initiatives`,
      `Explore collaboration opportunities`,
    ],
    news: [],
  });
}
