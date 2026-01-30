"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { useWorkflows } from "@/lib/hooks/useProcessStreet";
import { SOPRunner } from "@/components/sops/SOPRunner";
import { FadeIn } from "@/components/motion/FadeIn";
import { motion } from "framer-motion";
import { duration, easing } from "@/lib/motion/tokens";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SOPsPage() {
  const { data: workflows, error } = useWorkflows();
  const [newSopDialogOpen, setNewSopDialogOpen] = useState(false);

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
          <h1 className="text-2xl font-semibold tracking-tight">SOPs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {workflows.length} standard operating procedures
          </p>
        </div>
        <Button 
          size="sm" 
          className="gap-1.5 text-xs"
          onClick={() => setNewSopDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          NEW SOP
        </Button>
      </FadeIn>

      {/* Info */}
      {!workflows.length && (
        <FadeIn className="agentic-card p-4 border-l-2 border-l-[var(--warning)]">
          <p className="text-sm">
            <span className="font-medium">Process Street integration pending.</span>
            <span className="text-muted-foreground"> Add your API key in Settings to sync SOPs.</span>
          </p>
        </FadeIn>
      )}

      {error && (
        <div className="text-xs text-[var(--error)]">
          {error}
        </div>
      )}

      {/* SOPs Table */}
      <FadeIn className="agentic-card">
        <table className="agentic-table">
          <thead>
            <tr>
              <th>SOP</th>
              <th>Steps</th>
              <th>Actions</th>
            </tr>
          </thead>
          <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
            {workflows.map((workflow: { id: string; name: string; description?: string; tasks?: unknown[] }) => (
              <motion.tr key={workflow.id} variants={rowVariants}>
                <td>
                  <div className="font-medium">{workflow.name}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {workflow.description || "—"}
                  </p>
                </td>
                <td>
                  <span className="font-mono">{workflow?.tasks?.length || "—"}</span>
                </td>
                <td>
                  <SOPRunner workflowId={workflow.id} workflowName={workflow.name} />
                </td>
              </motion.tr>
            ))}
            {workflows.length === 0 && (
              <motion.tr variants={rowVariants}>
                <td colSpan={3} className="text-sm text-muted-foreground">
                  No workflows available
                </td>
              </motion.tr>
            )}
          </motion.tbody>
        </table>
      </FadeIn>

      {/* New SOP Dialog */}
      <Dialog open={newSopDialogOpen} onOpenChange={setNewSopDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-section">Create New SOP</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              SOPs are managed in Process Street. Create your workflow there and it will sync automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="agentic-card p-4 space-y-3">
              <p className="text-sm">
                To create a new SOP:
              </p>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>Open Process Street</li>
                <li>Create a new workflow template</li>
                <li>Add your steps and tasks</li>
                <li>Publish the workflow</li>
                <li>Return here to run the SOP</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setNewSopDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={() => {
                  window.open("https://app.process.st/templates", "_blank");
                  setNewSopDialogOpen(false);
                }}
              >
                Open Process Street
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
