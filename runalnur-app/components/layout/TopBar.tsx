"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Plus, Sparkles, Menu, User, Contact, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";
import { createSupabaseClient } from "@/lib/supabase/auth-client";
import { spring } from "@/lib/motion/tokens";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { TaskModal } from "@/components/modals/TaskModal";
import { ContactModal } from "@/components/modals/ContactModal";
import { useProjects } from "@/lib/hooks/useProjects";
import { PriorityBar } from "@/components/coo/PriorityBar";
import { useMode } from "@/lib/mode/context";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const { mode } = useMode();
  // Avoid background API noise on Influence/Capital pages. We'll fetch on-demand when needed.
  const { data: projects, refresh: refreshProjects } = useProjects({ enabled: mode === "command" });
  
  // Modal states
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };
  
  const handleNewTask = () => {
    // If we have projects, show project picker first
    if (projects.length > 0) {
      setProjectPickerOpen(true);
    } else {
      // No projects - go to projects page
      router.push("/projects");
    }
  };
  
  const handleSelectProjectForTask = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectPickerOpen(false);
    setTaskModalOpen(true);
  };

  return (
    <motion.header
      className="border-b border-border bg-background"
      initial={shouldReduce ? {} : { y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring.default}
    >
      <div className="h-14 flex items-center justify-between px-4 md:px-6">
        {/* Left side - Hamburger + Search */}
        <motion.div
          className="flex items-center gap-3 flex-1"
          initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, ...spring.default }}
        >
          {/* Mobile hamburger menu - 44px touch target */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-11 w-11 p-0 -ml-2"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          {/* Search - hidden on mobile */}
          <div className="hidden sm:block relative flex-1 max-w-md group">
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              whileHover={shouldReduce ? {} : { scale: 1.1 }}
              transition={spring.snappy}
            >
              <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            </motion.div>
            <Input
              placeholder="Search... (⌘K)"
              className="pl-9 h-8 text-sm bg-muted border-0 focus-visible:ring-1 focus-visible:ring-foreground"
              onClick={() => {
                // Trigger command palette
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              readOnly
            />
          </div>

          {/* Mobile search button - 44px touch target */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden h-11 w-11 p-0"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
          >
            <Search className="w-5 h-5" />
            <span className="sr-only">Search</span>
          </Button>
        </motion.div>

        {/* Right side */}
        <motion.div
          className="flex items-center gap-2 md:gap-4"
          initial={shouldReduce ? {} : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, ...spring.default }}
        >
          {/* Date - hidden on small screens */}
          <motion.span
            className="hidden lg:block text-xs text-muted-foreground font-mono"
            initial={shouldReduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {today}
          </motion.span>

          <SyncStatusIndicator />
          <NotificationBell />

          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={shouldReduce ? {} : { scale: 1.02 }}
                whileTap={shouldReduce ? {} : { scale: 0.98 }}
                transition={spring.snappy}
              >
                <Button size="sm" variant="default" className="h-8 gap-1.5 text-xs">
                  <motion.div
                    animate={
                      !shouldReduce
                        ? {
                            rotate: [0, 90, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                    whileHover={{ rotate: 90 }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </motion.div>
                  <span className="hidden sm:inline">NEW</span>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs gap-2" onClick={() => setProjectModalOpen(true)}>
                <Sparkles className="w-3 h-3" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2" onClick={handleNewTask}>
                <FileText className="w-3 h-3" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2" onClick={() => setContactModalOpen(true)}>
                <Contact className="w-3 h-3" />
                New Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2" onClick={() => router.push("/sops")}>
                <FileText className="w-3 h-3" />
                Start SOP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="flex items-center gap-2 text-sm"
                whileHover={shouldReduce ? {} : { scale: 1.05 }}
                whileTap={shouldReduce ? {} : { scale: 0.95 }}
                transition={spring.snappy}
              >
                <motion.div
                  className="w-7 h-7 bg-foreground text-background rounded-sm flex items-center justify-center text-xs font-medium"
                  whileHover={
                    shouldReduce
                      ? {}
                      : {
                          rotate: [0, -5, 5, 0],
                          transition: { duration: 0.3 },
                        }
                  }
                >
                  N
                </motion.div>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs gap-2" onClick={() => router.push("/settings?tab=profile")}>
                <User className="w-3 h-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2" onClick={() => router.push("/settings")}>
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-muted-foreground" onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>

      {mode === "command" && <PriorityBar />}
      
      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        onSaved={() => refreshProjects()}
      />
      
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
      />
      
      {/* Project picker for new task */}
      <Dialog open={projectPickerOpen} onOpenChange={setProjectPickerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-section">Select Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No projects yet. Create a project first.
              </p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full text-left px-3 py-2 rounded-sm hover:bg-muted transition-colors text-sm"
                  onClick={() => handleSelectProjectForTask(project.id)}
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate">{project.description}</div>
                  )}
                </button>
              ))
            )}
          </div>
          {projects.length === 0 && (
            <Button onClick={() => { setProjectPickerOpen(false); setProjectModalOpen(true); }}>
              Create Project
            </Button>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Task modal */}
      {selectedProjectId && (
        <TaskModal
          open={taskModalOpen}
          onOpenChange={(open) => {
            setTaskModalOpen(open);
            if (!open) setSelectedProjectId(null);
          }}
          projectId={selectedProjectId}
        />
      )}
    </motion.header>
  );
}
