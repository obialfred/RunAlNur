"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ARMS, PROJECT_STATUSES, PRIORITIES, ArmId } from "@/lib/constants";
import { useProjects } from "@/lib/hooks/useProjects";
import { useContacts } from "@/lib/hooks/useContacts";
import { useActivities } from "@/lib/hooks/useActivities";
import { useTasks } from "@/lib/hooks/useTasks";
import { useClickUpArm, useClickUpTasks } from "@/lib/hooks/useClickUpHierarchy";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Folder, Users, FolderTree, List, ChevronRight, Loader2 } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { EmptyState } from "@/components/rive/EmptyState";
import { FadeIn } from "@/components/motion/FadeIn";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { motion } from "framer-motion";
import { duration, easing, spring } from "@/lib/motion/tokens";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { ContactModal } from "@/components/modals/ContactModal";

interface PageProps {
  params: Promise<{ arm: string }>;
}

export default function ArmPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const arm = ARMS.find(a => a.slug === resolvedParams.arm);
  
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  if (!arm) {
    notFound();
  }

  const { data: projects, refresh: refreshProjects } = useProjects({ armId: arm.id });
  const { data: contacts, refresh: refreshContacts } = useContacts({ armId: arm.id });
  const { data: activities } = useActivities({ armId: arm.id });
  const { data: tasks } = useTasks();
  
  // ClickUp data for this arm
  const { data: clickupData, loading: clickupLoading } = useClickUpArm(arm.id as ArmId);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { data: clickupTasks, loading: tasksLoading } = useClickUpTasks(selectedListId);

  const metrics = {
    projects_count: projects.length,
    active_projects: projects.filter(p => p.status === "in_progress").length,
    contacts_count: contacts.length,
    tasks_pending: tasks.filter(t => projects.some(p => p.id === t.project_id) && t.status !== "done").length,
  };

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.fast, ease: easing.standard },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link 
              href="/" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← COMMAND CENTER
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{arm.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{arm.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              NEW
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setProjectModalOpen(true)}>
              <Folder className="w-4 h-4 mr-2" />
              New Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setContactModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              New Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </FadeIn>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        defaultArmId={arm.id}
        onSaved={refreshProjects}
      />
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        defaultArmId={arm.id}
        onSaved={refreshContacts}
      />

      {/* Stats Row */}
      <FadeIn className="grid grid-cols-4 gap-4">
        <StatCard label="Projects" value={metrics.projects_count} />
        <StatCard label="Active" value={metrics.active_projects} live={metrics.active_projects > 0} />
        <StatCard label="Contacts" value={metrics.contacts_count} />
        <StatCard label="Pending Tasks" value={metrics.tasks_pending} warning={metrics.tasks_pending > 0} />
      </FadeIn>

      {/* Content Tabs */}
      <FadeIn>
        <Tabs defaultValue="projects" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 p-0 h-auto">
          <TabsTrigger 
            value="projects" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3"
          >
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="contacts" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3"
          >
            Contacts
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3"
          >
            Activity
          </TabsTrigger>
          {clickupData && (
            <TabsTrigger 
              value="clickup" 
              className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3"
            >
              ClickUp
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {projects.length === 0 ? (
            <div className="agentic-card">
              <EmptyState
                title="No projects yet"
                description="Create your first project for this arm."
                riveSrc="/rive/empty-projects.riv"
              />
            </div>
          ) : (
            <div className="agentic-card">
              <table className="agentic-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Priority</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
                  {projects.map((project) => {
                    const status = PROJECT_STATUSES.find(s => s.id === project.status);
                    const priority = PRIORITIES.find(p => p.id === project.priority);

                    return (
                      <motion.tr key={project.id} variants={rowVariants}>
                        <td>
                          <Link 
                            href={`/projects/${project.id}`}
                            className="font-medium hover:underline"
                          >
                            {project.name}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {project.description}
                          </p>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "status-dot",
                              project.status === 'in_progress' && "live",
                              project.status === 'on_hold' && "warning"
                            )} />
                            <span className="text-sm">{status?.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-1 bg-border overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full bg-foreground",
                                  project.status === 'in_progress' && "bg-[var(--live)]"
                                )}
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {project.progress || 0}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={cn(
                            "variant-badge",
                            priority?.id === 'critical' && "!bg-[var(--error)] text-white",
                            priority?.id === 'high' && "!bg-[var(--warning)] text-white",
                            (priority?.id === 'medium' || priority?.id === 'low') && "draft"
                          )}>
                            {priority?.name}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-muted-foreground">
                            {project.due_date 
                              ? new Date(project.due_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              : '—'
                            }
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          {contacts.length === 0 ? (
            <div className="agentic-card">
              <EmptyState
                title="No contacts yet"
                description="Add contacts for this arm."
                riveSrc="/rive/empty-contacts.riv"
              />
            </div>
          ) : (
            <div className="agentic-card">
              <table className="agentic-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
                  {contacts.map((contact) => (
                    <motion.tr key={contact.id} variants={rowVariants}>
                      <td className="font-medium">{contact.name}</td>
                      <td className="text-muted-foreground">{contact.role || '—'}</td>
                      <td className="text-muted-foreground">{contact.company || '—'}</td>
                      <td>
                        <span className="text-sm font-mono text-muted-foreground">
                          {contact.email || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {contact.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="variant-badge draft">
                              {tag}
                            </span>
                          ))}
                          {contact.tags && contact.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{contact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {activities.length === 0 ? (
            <div className="agentic-card">
              <EmptyState
                title="No activity yet"
                description="Activity will appear here as actions are taken."
                riveSrc="/rive/empty-activity.riv"
              />
            </div>
          ) : (
            <div className="agentic-card">
              <ScrollArea className="h-[400px]">
                <motion.div
                  className="divide-y divide-border"
                  initial="hidden"
                  animate="visible"
                  variants={listVariants}
                >
                  {activities.map((activity) => (
                    <motion.div key={activity.id} variants={rowVariants} className="px-5 py-4">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(activity.created_at)}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>

        {/* ClickUp Tab */}
        {clickupData && (
          <TabsContent value="clickup" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Folders & Lists */}
              <div className="lg:col-span-1">
                <div className="agentic-card">
                  <div className="agentic-card-header">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-section">ClickUp Structure</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {clickupLoading ? (
                      <div className="p-4 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : clickupData.folders.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No folders in ClickUp yet
                      </div>
                    ) : (
                      clickupData.folders.map(folder => (
                        <div key={folder.id} className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{folder.name}</span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {folder.lists.map(list => (
                              <button
                                key={list.id}
                                onClick={() => setSelectedListId(list.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 text-left px-2 py-1.5 rounded text-sm transition-colors",
                                  selectedListId === list.id 
                                    ? "bg-foreground/10 text-foreground" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <List className="w-3 h-3" />
                                <span className="truncate">{list.name}</span>
                                <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks from selected list */}
              <div className="lg:col-span-2">
                <div className="agentic-card">
                  <div className="agentic-card-header">
                    <h3 className="text-section">
                      {selectedListId 
                        ? `Tasks` 
                        : 'Select a list to view tasks'
                      }
                    </h3>
                  </div>
                  <div className="agentic-card-content">
                    {!selectedListId ? (
                      <div className="text-sm text-muted-foreground py-8 text-center">
                        Click a list on the left to view its tasks
                      </div>
                    ) : tasksLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading tasks...</span>
                      </div>
                    ) : clickupTasks.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-8 text-center">
                        No tasks in this list
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clickupTasks.map((task) => {
                          const statusStr = typeof task.status === 'string' ? task.status : task.status?.status || '';
                          const priorityStr = typeof task.priority === 'string' ? task.priority : task.priority?.priority;
                          return (
                            <div 
                              key={task.id}
                              className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                statusStr === 'done' ? "bg-[var(--live)]" : 
                                statusStr === 'in progress' ? "bg-blue-500" :
                                statusStr === 'blocked' ? "bg-[var(--error)]" :
                                "bg-muted-foreground"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{statusStr}</p>
                              </div>
                              {priorityStr && (
                                <span className={cn(
                                  "variant-badge text-[10px]",
                                  priorityStr === 'critical' ? "!bg-[var(--error)] text-white" :
                                  priorityStr === 'high' ? "!bg-[var(--warning)] text-white" :
                                  "draft"
                                )}>
                                  {priorityStr}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
        </Tabs>
      </FadeIn>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  live?: boolean;
  warning?: boolean;
}

function StatCard({ label, value, live, warning }: StatCardProps) {
  return (
    <div className="agentic-card p-4">
      <div className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-1">
        {label}
      </div>
      <AnimatedNumber
        value={value}
        className={cn(
          "text-2xl font-semibold tabular-nums",
          live && "text-[var(--live)]",
          warning && "text-[var(--warning)]"
        )}
      />
    </div>
  );
}
