"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRIORITIES } from "@/lib/constants";
import { CONTEXT_CONFIGS } from "@/lib/calendar/types";
import { DeleteConfirmDialog } from "@/components/modals/DeleteConfirmDialog";
import { RecurrenceBuilder } from "@/components/tasks/RecurrenceBuilder";
import type { Task } from "@/lib/types";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  onSaved?: () => void;
}

export function TaskModal({ open, onOpenChange, projectId, task, onSaved }: TaskModalProps) {
  const [name, setName] = useState(task?.name || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<string>(task?.status || "todo");
  const [priority, setPriority] = useState<string>(task?.priority || "medium");
  const [priorityLevel, setPriorityLevel] = useState<string>(task?.priority_level || "p3");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [doDate, setDoDate] = useState(task?.do_date || "");
  const [durationMinutes, setDurationMinutes] = useState<number>(task?.duration_minutes || 30);
  const [context, setContext] = useState<string>(task?.context || "house");
  const [autoSchedule, setAutoSchedule] = useState<boolean>(task?.auto_schedule ?? true);
  const [scheduledBlockId, setScheduledBlockId] = useState<string | null>(
    task?.scheduled_block_id || null
  );
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(
    task?.recurrence_rule || null
  );
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isEdit = Boolean(task?.id);

  const PRIORITY_LEVEL_FROM_PRIORITY: Record<string, string> = {
    critical: "p1",
    high: "p2",
    medium: "p3",
    low: "p4",
  };
  const PRIORITY_FROM_LEVEL: Record<string, string> = {
    p1: "critical",
    p2: "high",
    p3: "medium",
    p4: "low",
  };

  useEffect(() => {
    setName(task?.name || "");
    setDescription(task?.description || "");
    setStatus(task?.status || "todo");
    setPriority(task?.priority || "medium");
    setPriorityLevel(task?.priority_level || PRIORITY_LEVEL_FROM_PRIORITY[task?.priority || "medium"] || "p3");
    setDueDate(task?.due_date || "");
    setDoDate(task?.do_date || "");
    setDurationMinutes(task?.duration_minutes || 30);
    setContext(task?.context || "house");
    setAutoSchedule(task?.auto_schedule ?? true);
    setScheduledBlockId(task?.scheduled_block_id || null);
    setRecurrenceRule(task?.recurrence_rule || null);
    setSubmitError(null);
  }, [task, open]);

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
      setSubmitError("Please enter a task name");
      return;
    }
    
    setLoading(true);
    setSubmitError(null);

    const payload = {
      project_id: projectId,
      name: finalName,
      description,
      status,
      priority,
      priority_level: priorityLevel,
      due_date: dueDate || null,
      do_date: doDate || null,
      duration_minutes: durationMinutes || 30,
      context,
      auto_schedule: autoSchedule,
      scheduled_block_id: scheduledBlockId,
      recurrence_rule: recurrenceRule,
    };

    const url = isEdit ? `/api/tasks/${task?.id}` : "/api/tasks";
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

  const handleDeleteConfirm = async () => {
    if (!task?.id) return;
    setDeleteLoading(true);
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-section">
            {isEdit ? "Edit Task" : "New Task"}
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const next = e.target.value;
                  setPriority(next);
                  setPriorityLevel(PRIORITY_LEVEL_FROM_PRIORITY[next] || "p3");
                }}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Priority Level
              </label>
              <select
                value={priorityLevel}
                onChange={(e) => {
                  const next = e.target.value;
                  setPriorityLevel(next);
                  setPriority(PRIORITY_FROM_LEVEL[next] || "medium");
                }}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                <option value="p1">P1 (Critical)</option>
                <option value="p2">P2 (High)</option>
                <option value="p3">P3 (Medium)</option>
                <option value="p4">P4 (Low)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Context
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full h-9 text-sm bg-muted border border-border rounded-sm px-3"
              >
                {CONTEXT_CONFIGS.map((cfg) => (
                  <option key={cfg.id} value={cfg.id}>
                    {cfg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Do Date
              </label>
              <Input
                type="date"
                value={doDate || ""}
                onChange={(e) => setDoDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={15}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoSchedule}
                  onChange={(e) => setAutoSchedule(e.target.checked)}
                />
                Auto-schedule
              </label>
            </div>
          </div>

          {scheduledBlockId && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <div>
                  Scheduled block: <span className="font-mono">{scheduledBlockId}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setScheduledBlockId(null)}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          <RecurrenceBuilder
            value={recurrenceRule}
            onChange={setRecurrenceRule}
            startDate={doDate || dueDate || undefined}
          />

          <div className="flex justify-between gap-2 pt-2">
            {isEdit ? (
              <Button
                type="button"
                variant="outline"
                className="text-[var(--error)]"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
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

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
