"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ARMS } from "@/lib/constants";
import { ArmCard } from "@/components/dashboard/ArmCard";
import { MetricsPanel } from "@/components/dashboard/MetricsPanel";
import { TodayPanel } from "@/components/dashboard/TodayPanel";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";
import { IntelligenceStrip } from "@/components/dashboard/IntelligenceStrip";
import { useProjects } from "@/lib/hooks/useProjects";
import { useActivities } from "@/lib/hooks/useActivities";
import { useContacts } from "@/lib/hooks/useContacts";
import { useTasks } from "@/lib/hooks/useTasks";
import { useClickUpStatus } from "@/lib/hooks/useClickUp";
import { useHubSpotStatus } from "@/lib/hooks/useHubSpot";
import { useProcessStreetStatus } from "@/lib/hooks/useProcessStreet";
import { useClickUpHierarchy } from "@/lib/hooks/useClickUpHierarchy";
import { Button } from "@/components/ui/button";
import type { Arm, DashboardMetrics } from "@/lib/types";
import { useMemo } from "react";
import { spring } from "@/lib/motion/tokens";
import { ArrowRight, Sparkles, X, FolderTree, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function CommandCenter() {
  const shouldReduce = useReducedMotion();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: activities } = useActivities({ limit: 10 });
  const { data: contacts } = useContacts();
  const { data: tasks } = useTasks();
  
  // Integration statuses
  const { data: clickupStatus } = useClickUpStatus();
  const { data: hubspotStatus } = useHubSpotStatus();
  const { data: processStreetStatus } = useProcessStreetStatus();
  
  // ClickUp hierarchy data
  const { data: clickupHierarchy, loading: clickupLoading } = useClickUpHierarchy();
  
  // Setup banner state
  const [showSetupBanner, setShowSetupBanner] = useState(true);
  
  // Check if any integrations are connected
  const hasIntegrations = Boolean(
    (clickupStatus as { connected?: boolean } | null)?.connected ||
      (hubspotStatus as { connected?: boolean } | null)?.connected ||
      (processStreetStatus as { connected?: boolean } | null)?.connected
  );

  const metrics: DashboardMetrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const dueToday = tasks.filter(task => task.due_date?.split("T")[0] === today).length;
    const overdue = tasks.filter(task => {
      if (!task.due_date) return false;
      const due = task.due_date.split("T")[0];
      return due < today && task.status !== "done";
    }).length;

    return {
      total_projects: projects.length,
      active_projects: projects.filter(p => p.status === "in_progress").length,
      completed_projects: projects.filter(p => p.status === "completed").length,
      total_contacts: contacts.length,
      tasks_due_today: dueToday,
      tasks_overdue: overdue,
      sops_in_progress: 0,
    };
  }, [projects, contacts, tasks]);

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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            House Al Nur Empire Operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-[var(--live)]"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-xs text-muted-foreground">All systems operational</span>
        </div>
      </div>

      {/* Setup Banner - shows when integrations aren't configured */}
      {showSetupBanner && !hasIntegrations && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={spring.default}
          className="relative bg-gradient-to-r from-foreground/5 via-foreground/10 to-foreground/5 border border-border rounded-lg p-3 sm:p-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Complete Your Setup</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Connect ClickUp, HubSpot, and other services to unlock full functionality.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/onboarding">
              <Button size="sm" className="gap-2 text-xs h-10 px-3">
                SETUP WIZARD
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
            <button
              onClick={() => setShowSetupBanner(false)}
              className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted rounded-sm transition-colors active:scale-95"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Today cockpit */}
      <TodayPanel />

      {/* Metrics Panel - Report Card Style */}
      <div>
        <MetricsPanel metrics={metrics} />
        {projectsLoading && (
          <div className="text-xs text-muted-foreground mt-2">Loading live data...</div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '400px' }}>
        {/* Projects Overview - Table */}
        <div className="lg:col-span-2">
          <ProjectsOverview projects={projects} />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* Intelligence Strip */}
      <IntelligenceStrip maxItems={6} />

      {/* ClickUp Structure Overview - Shows when connected */}
      {Boolean((clickupStatus as { connected?: boolean } | null)?.connected) && clickupHierarchy && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-section">ClickUp Workspace</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {clickupHierarchy.workspaceName}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {clickupLoading ? (
              <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading ClickUp structure...
              </div>
            ) : (
              clickupHierarchy.spaces.map(space => {
                const totalLists = space.folders.reduce((acc, f) => acc + f.lists.length, 0);
                return (
                  <div 
                    key={space.id}
                    className="agentic-card p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-[var(--live)]" />
                      <span className="text-sm font-medium truncate">{space.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {space.folders.length} folders · {totalLists} lists
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {space.folders.slice(0, 3).map(folder => (
                        <span 
                          key={folder.id}
                          className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
                        >
                          {folder.name.length > 15 ? folder.name.slice(0, 15) + '...' : folder.name}
                        </span>
                      ))}
                      {space.folders.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{space.folders.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Arms Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-section">Orchestrate</h2>
          <span className="text-xs text-muted-foreground">
            {ARMS.length} arms
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARMS.map((arm, index) => {
            const armProjects = projects.filter(p => p.arm_id === arm.id);
            const armContacts = contacts.filter(c => c.arm_id === arm.id);
            const armTasks = tasks.filter(t => armProjects.some(p => p.id === t.project_id));
            const armMetrics = {
              arm_id: arm.id,
              projects_count: armProjects.length,
              active_projects: armProjects.filter(p => p.status === "in_progress").length,
              contacts_count: armContacts.length,
              tasks_pending: armTasks.filter(t => t.status !== "done").length,
            };
            return (
              <ArmCard 
                key={arm.id} 
                arm={arm as Arm} 
                metrics={armMetrics} 
                index={index} 
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
