"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Users, AlertCircle, Calendar, Newspaper, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { spring, stagger } from "@/lib/motion/tokens";

// Mock data - will be replaced with real data
const mockData = {
  relationshipHealth: 72,
  contactsNeedingAttention: 3,
  innerCircleHealth: 82,
  strategicHealth: 65,
  generalHealth: 58,
  upcomingEngagements: [],
  recentIntel: [],
  importantDates: [],
};

export default function InfluenceDashboard() {
  const shouldReduce = useReducedMotion();
  const data = mockData;

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-blue-500 font-medium uppercase tracking-wider">
              Influence Mode
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Influence Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Relationships, intelligence, and legitimacy
          </p>
        </div>
      </div>

      {/* Relationship Health Card */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <div className="agentic-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <h2 className="text-section">Relationship Health</h2>
          </div>
          <Link
            href="/influence/contacts"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="agentic-card-content">
          <div className="flex items-center gap-8">
            {/* Overall Score */}
            <div className="text-center">
              <div className="text-5xl font-semibold tabular-nums">
                {data.relationshipHealth}
              </div>
              <div className="text-xs text-muted-foreground mt-1">/ 100</div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-3">
              <HealthBar
                label="Inner Circle"
                value={data.innerCircleHealth}
                count={5}
              />
              <HealthBar
                label="Strategic"
                value={data.strategicHealth}
                count={12}
              />
              <HealthBar label="General" value={data.generalHealth} count={34} />
            </div>
          </div>

          {data.contactsNeedingAttention > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-[var(--warning)]">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  {data.contactsNeedingAttention} relationships need attention
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.fast, delayChildren: 0.2 },
          },
        }}
      >
        <QuickActionCard
          icon={Calendar}
          label="This Week"
          description="View engagement priorities"
          href="/influence/week"
          count={data.contactsNeedingAttention}
        />
        <QuickActionCard
          icon={Newspaper}
          label="Intelligence"
          description="News and alerts"
          href="/influence/intel"
        />
        <QuickActionCard
          icon={Users}
          label="Network Graph"
          description="Visualize connections"
          href="/influence/graph"
        />
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week's Engagements */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...spring.default }}
        >
          <div className="agentic-card-header flex items-center justify-between">
            <h2 className="text-section">Priority Outreach</h2>
            <Link
              href="/influence/week"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="agentic-card-content">
            {data.upcomingEngagements.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No priority outreach this week</p>
                <p className="text-xs mt-1">Add contacts to start tracking relationships</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Engagement items would be listed here */}
              </div>
            )}
          </div>
        </motion.div>

        {/* Important Dates */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...spring.default }}
        >
          <div className="agentic-card-header flex items-center justify-between">
            <h2 className="text-section">Important Dates</h2>
            <Link
              href="/influence/calendar"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="agentic-card-content">
            {data.importantDates.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming dates</p>
                <p className="text-xs mt-1">Birthdays and anniversaries will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Important dates would be listed here */}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Intelligence */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...spring.default }}
      >
        <div className="agentic-card-header flex items-center justify-between">
          <h2 className="text-section">Recent Intelligence</h2>
          <Link
            href="/influence/intel"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="agentic-card-content">
          {data.recentIntel.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No recent intelligence
            </div>
          ) : (
            <div className="space-y-3">
              {/* Intel items would be listed here */}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function HealthBar({
  label,
  value,
  count,
}: {
  label: string;
  value: number;
  count: number;
}) {
  const getColor = (v: number) => {
    if (v >= 80) return "bg-[var(--live)]";
    if (v >= 60) return "bg-[var(--warning)]";
    return "bg-[var(--error)]";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-medium tabular-nums">{value}%</span>
        <span className="text-xs text-muted-foreground ml-1">({count})</span>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  label,
  description,
  href,
  count,
}: {
  icon: typeof Calendar;
  label: string;
  description: string;
  href: string;
  count?: number;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
    >
      <Link href={href}>
        <motion.div
          className="agentic-card p-4 hover:border-foreground/20 transition-colors cursor-pointer relative"
          whileHover={shouldReduce ? {} : { y: -2 }}
          whileTap={shouldReduce ? {} : { scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </div>
          {count !== undefined && count > 0 && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--warning)] text-white text-xs flex items-center justify-center font-medium">
              {count}
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}
