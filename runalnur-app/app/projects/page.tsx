"use client";

import Link from "next/link";
import { useState } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { Pagination } from "@/components/ui/pagination";
import { ARMS, PROJECT_STATUSES, PRIORITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/FadeIn";
import { motion } from "framer-motion";
import { duration, easing } from "@/lib/motion/tokens";
import { EmptyState } from "@/components/rive/EmptyState";

export default function ProjectsPage() {
  const { data: projects, refresh } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<typeof projects[number] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArm, setFilterArm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const listVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.04, delayChildren: 0.02 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.fast, ease: easing.standard },
    },
  };

  const handleCreate = () => {
    // Close any open delete dialog first
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEdit = (project: typeof projects[number]) => {
    // Close any open delete dialog first
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDeleteClick = (projectId: string) => {
    // Close any open edit modal first
    setModalOpen(false);
    setEditingProject(null);
    setDeletingId(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    await fetch(`/api/projects/${deletingId}`, { method: "DELETE" });
    await refresh();
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  // Filter and sort projects
  const filteredProjects = projects.filter((project) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = project.name.toLowerCase().includes(query);
      const matchesDescription = project.description?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) return false;
    }
    // Arm filter
    if (filterArm && project.arm_id !== filterArm) return false;
    // Status filter
    if (filterStatus && project.status !== filterStatus) return false;
    // Priority filter
    if (filterPriority && project.priority !== filterPriority) return false;
    return true;
  });

  // Sort by priority and status
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { in_progress: 0, planning: 1, review: 2, on_hold: 3, completed: 4 };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} projects across all arms
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs w-full sm:w-auto" onClick={handleCreate}>
          <Plus className="w-3.5 h-3.5" />
          NEW PROJECT
        </Button>
      </FadeIn>

      {/* Search & Filters */}
      <FadeIn className="space-y-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-11 sm:h-9 text-sm bg-muted border-0"
          />
        </div>
        {/* Filters - horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <select
            value={filterArm}
            onChange={(e) => { setFilterArm(e.target.value); setCurrentPage(1); }}
            className="h-11 sm:h-9 text-xs bg-muted border-0 rounded-sm px-3 min-w-[100px] flex-shrink-0"
          >
            <option value="">All Arms</option>
            {ARMS.map((arm) => (
              <option key={arm.id} value={arm.id}>{arm.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="h-11 sm:h-9 text-xs bg-muted border-0 rounded-sm px-3 min-w-[100px] flex-shrink-0"
          >
            <option value="">All Status</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
            className="h-11 sm:h-9 text-xs bg-muted border-0 rounded-sm px-3 min-w-[100px] flex-shrink-0"
          >
            <option value="">All Priority</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </FadeIn>

      {/* Projects Table */}
      <FadeIn>
        {sortedProjects.length === 0 && projects.length === 0 ? (
          <div className="agentic-card">
            <EmptyState
              title="No projects yet"
              description="Create your first project to get started."
              riveSrc="/rive/empty-projects.riv"
            />
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="agentic-card p-12 text-center">
            <p className="text-sm text-muted-foreground">No projects match your filters</p>
          </div>
        ) : (
          <div className="agentic-card overflow-hidden">
            <div className="table-responsive">
              <table className="agentic-table min-w-[800px]">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th className="hidden sm:table-cell">Arm</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Progress</th>
                    <th>Priority</th>
                    <th className="hidden lg:table-cell">Due</th>
                    <th></th>
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="visible"
                  variants={listVariants}
                >
                  {paginatedProjects.map((project) => {
                    const arm = ARMS.find(a => a.id === project.arm_id);
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
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px] sm:max-w-md">
                            {project.description}
                          </p>
                          {/* Show arm on mobile inline */}
                          <span className="sm:hidden text-[10px] font-medium tracking-wider uppercase text-muted-foreground mt-1 block">
                            {arm?.name}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell">
                          <Link 
                            href={`/arms/${arm?.slug}`}
                            className="text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {arm?.name}
                          </Link>
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
                        <td className="hidden md:table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1 bg-border overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full bg-foreground",
                                  project.status === 'in_progress' && "bg-[var(--live)]"
                                )}
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground w-8">
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
                        <td className="hidden lg:table-cell">
                          <span className="text-sm font-mono text-muted-foreground">
                            {project.due_date 
                              ? new Date(project.due_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'
                            }
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-9 sm:h-7 px-3 sm:px-2 active:scale-95"
                              onClick={() => handleEdit(project)}
                            >
                              EDIT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-9 sm:h-7 px-3 sm:px-2 text-[var(--error)] active:scale-95"
                              onClick={() => handleDeleteClick(project.id)}
                            >
                              DELETE
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={sortedProjects.length}
              itemsPerPage={itemsPerPage}
              className="px-4 pb-4"
            />
          </div>
        )}
      </FadeIn>

      <ProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={editingProject || undefined}
        onSaved={refresh}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? All associated tasks will also be deleted. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
