"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  Edit3, 
  UserPlus, 
  BookOpen, 
  Calendar, 
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface PendingAction {
  id: string;
  type: 
    | "create_contact" 
    | "create_bulk_contacts" 
    | "create_knowledge"
    | "create_task" 
    | "create_project" 
    | "create_deadline" 
    | "create_milestone"
    | "update_contact" 
    | "delete_contact" 
    | "bulk_operation";
  description: string;
  data: Record<string, unknown>;
  requiresConfirmation: boolean;
  reasoning?: string;
}

interface ActionConfirmationProps {
  actions: PendingAction[];
  onApprove: (actionId: string, modifiedData?: Record<string, unknown>) => void;
  onApproveAll: () => void;
  onReject: (actionId: string, reason?: string) => void;
  onRejectAll: () => void;
  isProcessing?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function ActionTypeIcon({
  type,
  className,
}: {
  type: PendingAction["type"];
  className?: string;
}) {
  switch (type) {
    case "create_contact":
    case "create_bulk_contacts":
    case "update_contact":
      return <UserPlus className={className} />;
    case "create_knowledge":
      return <BookOpen className={className} />;
    case "create_deadline":
      return <Calendar className={className} />;
    case "create_milestone":
      return <Target className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
}

function getActionColor(type: PendingAction["type"]) {
  switch (type) {
    case "create_contact":
    case "create_bulk_contacts":
      return "text-blue-500";
    case "create_knowledge":
      return "text-emerald-500";
    case "create_deadline":
    case "create_milestone":
      return "text-amber-500";
    case "delete_contact":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

function formatActionData(type: PendingAction["type"], data: Record<string, unknown>): string[] {
  const items: string[] = [];

  switch (type) {
    case "create_contact":
    case "update_contact":
      if (data.name) items.push(`Name: ${data.name}`);
      if (data.email) items.push(`Email: ${data.email}`);
      if (data.phone) items.push(`Phone: ${data.phone}`);
      if (data.company) items.push(`Company: ${data.company}`);
      if (data.role) items.push(`Role: ${data.role}`);
      break;

    case "create_bulk_contacts":
      const contacts = data.contacts as Array<{ name: string }>;
      if (contacts) {
        items.push(`${contacts.length} contacts to create:`);
        contacts.slice(0, 5).forEach((c) => items.push(`  • ${c.name}`));
        if (contacts.length > 5) {
          items.push(`  ... and ${contacts.length - 5} more`);
        }
      }
      break;

    case "create_knowledge":
      if (data.title) items.push(`Title: ${data.title}`);
      if (data.category) items.push(`Category: ${data.category}`);
      if (data.content) {
        const content = String(data.content);
        items.push(`Content: ${content.length > 100 ? content.slice(0, 100) + "..." : content}`);
      }
      break;

    case "create_deadline":
      if (data.title) items.push(`Title: ${data.title}`);
      if (data.due_date) items.push(`Due: ${data.due_date}`);
      if (data.priority) items.push(`Priority: ${data.priority}`);
      break;

    case "create_milestone":
      if (data.title) items.push(`Title: ${data.title}`);
      if (data.target_date) items.push(`Target: ${data.target_date}`);
      break;

    default:
      // Generic fallback
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          items.push(`${key}: ${value}`);
        }
      });
  }

  return items;
}

// ============================================================================
// SINGLE ACTION CARD
// ============================================================================

interface ActionCardProps {
  action: PendingAction;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

function ActionCard({ action, onApprove, onReject, isProcessing }: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorClass = getActionColor(action.type);
  const dataItems = formatActionData(action.type, action.data);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring.snappy}
      className="border border-border rounded-md overflow-hidden bg-card"
    >
      {/* Header */}
      <div className="p-3 flex items-start gap-3">
        <div className={cn("w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0", colorClass)}>
          <ActionTypeIcon type={action.type} className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{action.description}</p>
          {action.reasoning && (
            <p className="text-xs text-muted-foreground mt-0.5">{action.reasoning}</p>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.snappy}
          >
            <div className="px-3 pb-3 pt-0 border-t border-border">
              <div className="pt-3 space-y-1">
                {dataItems.map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={onApprove}
          disabled={isProcessing}
          className="h-7 text-xs gap-1"
        >
          <Check className="w-3 h-3" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={isProcessing}
          className="h-7 text-xs gap-1"
        >
          <X className="w-3 h-3" />
          Reject
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActionConfirmation({
  actions,
  onApprove,
  onApproveAll,
  onReject,
  onRejectAll,
  isProcessing = false,
}: ActionConfirmationProps) {
  if (actions.length === 0) return null;

  const confirmableActions = actions.filter((a) => a.requiresConfirmation);

  if (confirmableActions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={spring.default}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">
            {confirmableActions.length === 1 
              ? "Confirm Action" 
              : `Confirm ${confirmableActions.length} Actions`}
          </h4>
          <p className="text-xs text-muted-foreground">
            Review before I execute
          </p>
        </div>

        {confirmableActions.length > 1 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onApproveAll}
              disabled={isProcessing}
              className="h-7 text-xs"
            >
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRejectAll}
              disabled={isProcessing}
              className="h-7 text-xs"
            >
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {confirmableActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onApprove={() => onApprove(action.id)}
              onReject={() => onReject(action.id)}
              isProcessing={isProcessing}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================================
// INLINE CONFIRMATION (for chat messages)
// ============================================================================

interface InlineConfirmationProps {
  action: PendingAction;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function InlineConfirmation({ 
  action, 
  onApprove, 
  onReject, 
  isProcessing 
}: InlineConfirmationProps) {
  const colorClass = getActionColor(action.type);
  const dataItems = formatActionData(action.type, action.data).slice(0, 3);

  return (
    <div className="bg-muted/50 border border-border rounded-md p-3 mt-2">
      <div className="flex items-start gap-2 mb-2">
        <div className={cn("w-6 h-6 rounded flex items-center justify-center bg-background", colorClass)}>
          <ActionTypeIcon type={action.type} className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{action.description}</p>
          <div className="mt-1 space-y-0.5">
            {dataItems.map((item, i) => (
              <p key={i} className="text-[10px] text-muted-foreground font-mono truncate">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="text-[10px] font-medium px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="text-[10px] font-medium px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
