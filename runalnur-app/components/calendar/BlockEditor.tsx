"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Calendar, Tag, FileText, Repeat, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { 
  FocusBlock, 
  FocusContext, 
  CONTEXT_CONFIGS,
  getContextConfig 
} from "@/lib/calendar/types";
import type { Task } from "@/lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface BlockEditorProps {
  block?: Partial<FocusBlock>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Partial<FocusBlock>) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  initialHour?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BlockEditor({
  block,
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  initialHour,
}: BlockEditorProps) {
  const isEditing = !!block?.id;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState<FocusContext>("nova");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "custom">("weekly");
  const [notes, setNotes] = useState("");

  // Task linking state (optional, for calendar ↔ tasks)
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [attachCandidates, setAttachCandidates] = useState<Task[]>([]);
  const [attachTaskId, setAttachTaskId] = useState<string>("");

  // Initialize form when block changes
  useEffect(() => {
    if (block) {
      setTitle(block.title || "");
      setDescription(block.description || "");
      setContext(block.context || "nova");
      setNotes(block.notes || "");
      
      if (block.start_time) {
        const start = new Date(block.start_time);
        setDate(start.toISOString().split("T")[0]);
        setStartTime(start.toTimeString().slice(0, 5));
      }
      
      if (block.end_time) {
        const end = new Date(block.end_time);
        setEndTime(end.toTimeString().slice(0, 5));
      }
      
      setIsRecurring(!!block.recurrence_rule);
    } else if (initialDate) {
      setDate(initialDate.toISOString().split("T")[0]);
      if (initialHour !== undefined) {
        setStartTime(`${initialHour.toString().padStart(2, "0")}:00`);
        setEndTime(`${(initialHour + 1).toString().padStart(2, "0")}:00`);
      }
    } else {
      // Reset for new block
      setTitle("");
      setDescription("");
      setContext("nova");
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setEndTime("10:00");
      setIsRecurring(false);
      setNotes("");
    }
  }, [block, initialDate, initialHour, isOpen]);

  // Load tasks linked to this focus block (and candidate tasks)
  useEffect(() => {
    const run = async () => {
      if (!isOpen || !block?.id) return;

      try {
        const linkedRes = await fetch(`/api/tasks?focus_block_id=${encodeURIComponent(block.id)}`);
        const linkedJson = await linkedRes.json();
        setLinkedTasks(Array.isArray(linkedJson.data) ? linkedJson.data : []);

        // Candidate tasks: incomplete tasks in same context (if possible)
        const qs = new URLSearchParams();
        qs.set("status", "todo");
        if (block.context) qs.set("context", String(block.context));
        const candRes = await fetch(`/api/tasks?${qs.toString()}`);
        const candJson = await candRes.json();
        setAttachCandidates(Array.isArray(candJson.data) ? candJson.data : []);
      } catch {
        setLinkedTasks([]);
        setAttachCandidates([]);
      }
    };

    void run();
  }, [isOpen, block?.id, block?.context]);

  const attachTask = async () => {
    if (!block?.id || !attachTaskId) return;
    await fetch(`/api/tasks/${attachTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focus_block_id: block.id }),
    });
    setAttachTaskId("");
    // Refresh
    const linkedRes = await fetch(`/api/tasks?focus_block_id=${encodeURIComponent(block.id)}`);
    const linkedJson = await linkedRes.json();
    setLinkedTasks(Array.isArray(linkedJson.data) ? linkedJson.data : []);
  };

  const detachTask = async (taskId: string) => {
    if (!block?.id) return;
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focus_block_id: null }),
    });
    const linkedRes = await fetch(`/api/tasks?focus_block_id=${encodeURIComponent(block.id)}`);
    const linkedJson = await linkedRes.json();
    setLinkedTasks(Array.isArray(linkedJson.data) ? linkedJson.data : []);
  };

  const handleSave = () => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const blockData: Partial<FocusBlock> = {
      ...(block?.id && { id: block.id }),
      title,
      description: description || undefined,
      context,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes: notes || undefined,
      recurrence_rule: isRecurring ? `FREQ=${recurrence.toUpperCase()}` : undefined,
      color: getContextConfig(context).color,
    };

    onSave(blockData);
    onClose();
  };

  const handleDelete = () => {
    if (block?.id && onDelete) {
      onDelete(block.id);
      onClose();
    }
  };

  const contextConfig = getContextConfig(context);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Editor Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={spring.default}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-xl overflow-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Edit Block" : "New Focus Block"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Title */}
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you working on?"
                  className="text-lg font-medium"
                />
              </div>

              {/* Context Picker */}
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                  Context
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CONTEXT_CONFIGS.slice(0, 8).map((cfg) => (
                    <button
                      key={cfg.id}
                      onClick={() => setContext(cfg.id)}
                      className={cn(
                        "p-2 rounded-md border-2 transition-all text-center",
                        context === cfg.id
                          ? "border-current"
                          : "border-transparent hover:bg-muted"
                      )}
                      style={{
                        color: context === cfg.id ? cfg.color : undefined,
                        backgroundColor: context === cfg.id ? `${cfg.color}15` : undefined,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-[10px] font-medium">{cfg.name}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {CONTEXT_CONFIGS.slice(8).map((cfg) => (
                    <button
                      key={cfg.id}
                      onClick={() => setContext(cfg.id)}
                      className={cn(
                        "p-2 rounded-md border-2 transition-all text-center",
                        context === cfg.id
                          ? "border-current"
                          : "border-transparent hover:bg-muted"
                      )}
                      style={{
                        color: context === cfg.id ? cfg.color : undefined,
                        backgroundColor: context === cfg.id ? `${cfg.color}15` : undefined,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-[10px] font-medium">{cfg.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {contextConfig.description}
                </p>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1 mb-2">
                    <Calendar className="w-3 h-3" />
                    Date
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1 mb-2">
                      <Clock className="w-3 h-3" />
                      Start
                    </label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-2 block">
                      End
                    </label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1 mb-2">
                  <Repeat className="w-3 h-3" />
                  Repeat
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecurring(false)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      !isRecurring
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    Once
                  </button>
                  <button
                    onClick={() => {
                      setIsRecurring(true);
                      setRecurrence("daily");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isRecurring && recurrence === "daily"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => {
                      setIsRecurring(true);
                      setRecurrence("weekly");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isRecurring && recurrence === "weekly"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1 mb-2">
                  <FileText className="w-3 h-3" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full h-20 px-3 py-2 text-sm bg-muted border-0 rounded-md resize-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-2 block">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes..."
                  className="w-full h-20 px-3 py-2 text-sm bg-muted border-0 rounded-md resize-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Linked Tasks */}
              {isEditing && block?.id && (
                <div className="pt-2 border-t border-border">
                  <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                    Tasks in this block
                  </label>

                  {linkedTasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                      No tasks linked yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-md"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{t.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {t.context || "house"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void detachTask(t.id)}
                            className="min-h-[44px] px-3 text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground border border-border rounded-sm active:scale-95"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <select
                      className="h-11 flex-1 bg-muted border-0 rounded-md px-3 text-sm"
                      value={attachTaskId}
                      onChange={(e) => setAttachTaskId(e.target.value)}
                    >
                      <option value="">Attach a task…</option>
                      {attachCandidates
                        .filter((t) => !linkedTasks.some((lt) => lt.id === t.id))
                        .slice(0, 20)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      className="h-11"
                      disabled={!attachTaskId}
                      onClick={() => void attachTask()}
                    >
                      Attach
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button onClick={handleSave} disabled={!title.trim()} className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  {isEditing ? "Save Changes" : "Create Block"}
                </Button>
                {isEditing && onDelete && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// QUICK ADD (inline creation)
// ============================================================================

interface QuickAddProps {
  date: Date;
  hour: number;
  onSave: (block: Partial<FocusBlock>) => void;
  onCancel: () => void;
}

export function QuickAdd({ date, hour, onSave, onCancel }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState<FocusContext>("nova");

  const handleSave = () => {
    if (!title.trim()) return;

    const startDateTime = new Date(date);
    startDateTime.setHours(hour, 0, 0, 0);
    
    const endDateTime = new Date(date);
    endDateTime.setHours(hour + 1, 0, 0, 0);

    onSave({
      title,
      context,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      color: getContextConfig(context).color,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute left-1 right-1 bg-card border border-border rounded-md shadow-lg p-2 z-30"
      style={{ top: 0 }}
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add..."
        className="text-sm h-8 mb-2"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center gap-1 flex-wrap mb-2">
        {CONTEXT_CONFIGS.slice(0, 6).map((cfg) => (
          <button
            key={cfg.id}
            onClick={() => setContext(cfg.id)}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-all",
              context === cfg.id ? "border-foreground scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: cfg.color }}
            title={cfg.name}
          />
        ))}
      </div>
      <div className="flex gap-1">
        <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="h-7 text-xs flex-1">
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
