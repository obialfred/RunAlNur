"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring, duration } from "@/lib/motion/tokens";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from "@/lib/types";
import { ARMS, PROJECT_STATUSES, PRIORITIES } from "@/lib/constants";

interface ProjectsOverviewProps {
  projects: Project[];
}

export function ProjectsOverview({ projects }: ProjectsOverviewProps) {
  // Sort by priority and status
  const sortedProjects = [...projects].sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { in_progress: 0, planning: 1, review: 2, on_hold: 3, completed: 4 };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="agentic-card h-full flex flex-col">
      <div className="agentic-card-header flex items-center justify-between">
        <h2 className="text-section">Active Projects</h2>
        <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          VIEW ALL →
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="table-responsive">
          <table className="agentic-table min-w-[500px]">
            <thead>
              <tr>
                <th>Project</th>
                <th className="hidden sm:table-cell">Arm</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Progress</th>
                <th className="hidden sm:table-cell">Priority</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.slice(0, 8).map((project, index) => (
                <ProjectRow 
                  key={project.id} 
                  project={project} 
                  index={index} 
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedProjects.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No projects yet. Create your first project to get started.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ProjectRowProps {
  project: Project;
  index: number;
}

function ProjectRow({ project, index }: ProjectRowProps) {
  const shouldReduce = useReducedMotion();
  const arm = ARMS.find(a => a.id === project.arm_id);
  const status = PROJECT_STATUSES.find(s => s.id === project.status);
  const priority = PRIORITIES.find(p => p.id === project.priority);

  return (
    <motion.tr
      initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, ...spring.default }}
      whileHover={shouldReduce ? {} : { backgroundColor: "hsl(var(--muted) / 0.5)" }}
      className="group cursor-pointer"
    >
      <td>
        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
          {project.name}
        </Link>
        {/* Show arm on mobile */}
        <span className="sm:hidden text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mt-0.5">
          {arm?.name}
        </span>
      </td>
      <td className="hidden sm:table-cell">
        <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
          {arm?.name}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              project.status === 'in_progress' && "bg-[var(--live)] animate-pulse",
              project.status === 'on_hold' && "bg-[var(--warning)]",
              project.status === 'completed' && "bg-[var(--success)]",
              !['in_progress', 'on_hold', 'completed'].includes(project.status) && "bg-muted-foreground"
            )}
          />
          <span className="text-sm truncate">{status?.name}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex items-center gap-3">
          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                project.status === 'in_progress' ? "bg-[var(--live)]" : "bg-foreground/70"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${project.progress || 0}%` }}
              transition={{
                delay: 0.1 + index * 0.04,
                duration: duration.slow,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-8">
            {project.progress || 0}%
          </span>
        </div>
      </td>
      <td className="hidden sm:table-cell">
        <span
          className={cn(
            "variant-badge",
            priority?.id === 'critical' && "!bg-[var(--error)] text-white",
            priority?.id === 'high' && "!bg-[var(--warning)] text-white",
            priority?.id === 'medium' && "draft",
            priority?.id === 'low' && "draft"
          )}
        >
          {priority?.name}
        </span>
      </td>
    </motion.tr>
  );
}
