"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useProject } from "@/lib/hooks/useProjects";
import { useTasks } from "@/lib/hooks/useTasks";
import { TaskModal } from "@/components/modals/TaskModal";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { ARMS, PROJECT_STATUSES, PRIORITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { data: project, loading: projectLoading } = useProject(resolvedParams.id);
  const { data: tasks, refresh: refreshTasks } = useTasks({ projectId: resolvedParams.id });
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<typeof tasks[number] | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  if (!project && !projectLoading) {
    notFound();
  }

  if (!project) {
    return (
      <div className="agentic-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  const arm = ARMS.find(a => a.id === project.arm_id);
  const status = PROJECT_STATUSES.find(s => s.id === project.status);
  const priority = PRIORITIES.find(p => p.id === project.priority);
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Link 
            href="/projects" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← PROJECTS
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <Link 
            href={`/arms/${arm?.slug}`} 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            {arm?.name}
          </Link>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <span className={cn(
                "variant-badge",
                project.status === 'in_progress' && "deployed"
              )}>
                {status?.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setProjectModalOpen(true)}
            >
              EDIT
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              TASK
            </Button>
          </div>
        </div>
      </div>

      {/* Report Card + Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Card */}
        <div className="lg:col-span-1">
          <div className="agentic-card">
            <div className="agentic-card-header">
              <h2 className="text-section">Report Card</h2>
            </div>
            <div className="agentic-card-content space-y-6">
              {/* Progress */}
              <div className="report-card-metric">
                <span className="label">Progress</span>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-3xl font-semibold tabular-nums",
                    (project.progress || 0) >= 50 && "text-[var(--live)]"
                  )}>
                    {project.progress || 0}%
                  </span>
                </div>
                <div className="bar mt-2">
                  <div 
                    className={cn(
                      "bar-fill",
                      (project.progress || 0) >= 50 && "!bg-[var(--live)]"
                    )}
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="report-card-metric">
                <span className="label">Tasks</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tabular-nums">
                    {project.tasks_completed || 0}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    / {project.tasks_total || 0}
                  </span>
                </div>
                <div className="bar mt-2">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${project.tasks_total ? ((project.tasks_completed || 0) / project.tasks_total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="report-card-metric">
                <span className="label">Priority</span>
                <span className={cn(
                  "variant-badge mt-1",
                  priority?.id === 'critical' && "!bg-[var(--error)] text-white",
                  priority?.id === 'high' && "!bg-[var(--warning)] text-white",
                  (priority?.id === 'medium' || priority?.id === 'low') && "draft"
                )}>
                  {priority?.name}
                </span>
              </div>

              {/* Due Date */}
              {project.due_date && (
                <div className="report-card-metric">
                  <span className="label">Due Date</span>
                  <span className="value font-mono">
                    {formatDate(project.due_date, { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {/* Created */}
              <div className="report-card-metric">
                <span className="label">Created</span>
                <span className="value font-mono text-muted-foreground">
                  {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Board */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="board" className="w-full">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 p-0 h-auto mb-6">
              <TabsTrigger 
                value="board" 
                className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3"
              >
                Task Board
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="text-xs font-medium tracking-wider uppercase data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3"
              >
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board">
              <div className="grid grid-cols-3 gap-4">
                <TaskColumn
                  title="TO DO"
                  tasks={todoTasks}
                  onTaskClick={(task) => {
                    const fullTask = tasks.find(t => t.id === task.id);
                    if (fullTask) setEditingTask(fullTask);
                    setTaskModalOpen(true);
                  }}
                />
                <TaskColumn
                  title="IN PROGRESS"
                  tasks={inProgressTasks}
                  active
                  onTaskClick={(task) => {
                    const fullTask = tasks.find(t => t.id === task.id);
                    if (fullTask) setEditingTask(fullTask);
                    setTaskModalOpen(true);
                  }}
                />
                <TaskColumn
                  title="DONE"
                  tasks={doneTasks}
                  done
                  onTaskClick={(task) => {
                    const fullTask = tasks.find(t => t.id === task.id);
                    if (fullTask) setEditingTask(fullTask);
                    setTaskModalOpen(true);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="agentic-card p-12 text-center">
                <p className="text-sm text-muted-foreground">No notes yet</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        projectId={project.id}
        task={editingTask || undefined}
        onSaved={refreshTasks}
      />
      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        project={project}
        onSaved={() => window.location.reload()}
      />
    </div>
  );
}

interface TaskColumnProps {
  title: string;
  tasks: Array<{ 
    id: string; 
    name: string; 
    description?: string; 
    priority: string; 
    due_date?: string 
  }>;
  active?: boolean;
  done?: boolean;
  onTaskClick?: (task: { id: string; name: string; description?: string; priority: string; due_date?: string }) => void;
}

function TaskColumn({ title, tasks, active, done, onTaskClick }: TaskColumnProps) {
  return (
    <div className={cn(
      "agentic-card",
      active && "border-l-2 border-l-[var(--live)]"
    )}>
      <div className="agentic-card-header flex items-center justify-between">
        <h3 className="text-section">{title}</h3>
        <span className="text-xs font-mono text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
        ) : (
          tasks.map((task) => {
            const priority = PRIORITIES.find(p => p.id === task.priority);
            return (
              <div 
                key={task.id} 
                className={cn(
                  "p-3 border border-border rounded-sm hover:border-foreground/30 transition-colors cursor-pointer",
                  done && "opacity-60"
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <p className={cn(
                  "text-sm font-medium",
                  done && "line-through"
                )}>
                  {task.name}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {priority && priority.id !== 'medium' && priority.id !== 'low' && (
                    <span className={cn(
                      "variant-badge",
                      priority.id === 'critical' && "!bg-[var(--error)] text-white",
                      priority.id === 'high' && "!bg-[var(--warning)] text-white"
                    )}>
                      {priority.name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
