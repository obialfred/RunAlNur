"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ARMS, PROJECT_STATUSES, PRIORITIES } from "@/lib/constants";
import type { Project } from "@/lib/types";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  defaultArmId?: string;
  onSaved?: () => void;
}

export function ProjectModal({ open, onOpenChange, project, defaultArmId, onSaved }: ProjectModalProps) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [armId, setArmId] = useState<string>(project?.arm_id || defaultArmId || ARMS[0].id);
  const [status, setStatus] = useState<string>(project?.status || "planning");
  const [priority, setPriority] = useState<string>(project?.priority || "medium");
  const [dueDate, setDueDate] = useState(project?.due_date || "");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = Boolean(project?.id);

  useEffect(() => {
    setName(project?.name || "");
    setDescription(project?.description || "");
    setArmId(project?.arm_id || defaultArmId || ARMS[0].id);
    setStatus(project?.status || "planning");
    setPriority(project?.priority || "medium");
    setDueDate(project?.due_date || "");
    setSubmitError(null);
  }, [project, defaultArmId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current form values directly from the form elements as a fallback
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const formName = formData.get("name") as string || "";
    
    // Use state value if available, fallback to form data
    const finalName = name.trim() || formName.trim();
    
    // Client-side validation
    if (!finalName) {
      setSubmitError("Please enter a project name");
      return;
    }
    
    setLoading(true);
    setSubmitError(null);

    const payload = {
      name: finalName,
      description,
      arm_id: armId,
      status,
      priority,
      due_date: dueDate || null,
    };

    const url = isEdit ? `/api/projects/${project?.id}` : "/api/projects";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const json = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

      if (!res.ok || !json?.success) {
        const debugText = json?.debug ? `\n\nDEBUG:\n${JSON.stringify(json.debug, null, 2)}` : "";
        setSubmitError((json?.error || `Save failed (${res.status})`) + debugText);
        return;
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-section">
            {isEdit ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Name
            </label>
            <Input 
              name="name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
              Description
            </label>
            <Input 
              name="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Arm
              </label>
              <select
                value={armId}
                onChange={(e) => setArmId(e.target.value)}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                {ARMS.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate || ""}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
          {submitError && (
            <div
              role="alert"
              aria-live="polite"
              aria-label={submitError}
              className="text-xs text-[var(--error)] whitespace-pre-wrap"
            >
              {submitError}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
