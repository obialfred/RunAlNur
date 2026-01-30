"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Inbox, CheckCircle2, XCircle, Clock, Filter, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

// Mock approvals data
const mockApprovals: Approval[] = [];

interface Approval {
  id: string;
  entityType: string;
  entityName: string;
  action: string;
  requesterName: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
}

export default function InboxPage() {
  const shouldReduce = useReducedMotion();
  const [approvals] = useState<Approval[]>(mockApprovals);
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  const filteredApprovals =
    filter === "pending"
      ? approvals.filter((a) => a.status === "pending")
      : approvals;

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approvals and decisions requiring your attention
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-[var(--warning)]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setFilter("pending")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2",
            filter === "pending"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Pending
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-[var(--warning)] text-white rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            filter === "all"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All History
        </button>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-content text-center py-12">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {filter === "pending" ? "No pending approvals" : "No approval history"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "pending"
                ? "All caught up!"
                : "Approvals and decisions will appear here"}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: stagger.normal },
            },
          }}
        >
          {filteredApprovals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function ApprovalCard({ approval }: { approval: Approval }) {
  const shouldReduce = useReducedMotion();
  const isPending = approval.status === "pending";

  const statusIcons: Record<string, typeof Clock> = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
  };
  const Icon = statusIcons[approval.status];

  const statusColors: Record<string, string> = {
    pending: "text-[var(--warning)]",
    approved: "text-[var(--live)]",
    rejected: "text-[var(--error)]",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      className={cn(
        "agentic-card",
        isPending && "border-l-2 border-l-[var(--warning)]"
      )}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("mt-1", statusColors[approval.status])}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{approval.action}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {approval.entityType}: {approval.entityName}
                </div>
              </div>
              <div className="text-right">
                <div className={cn("text-xs font-medium capitalize", statusColors[approval.status])}>
                  {approval.status}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDate(approval.createdAt)}
                </div>
              </div>
            </div>

            {approval.notes && (
              <p className="mt-2 text-sm text-muted-foreground">{approval.notes}</p>
            )}

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span>Requested by {approval.requesterName}</span>
            </div>

            {isPending && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
