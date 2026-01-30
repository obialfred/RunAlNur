"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";

// Mock commitments data
const mockCommitments: Commitment[] = [];

interface Commitment {
  id: string;
  fundName: string;
  manager: string;
  commitmentAmount: number;
  calledAmount: number;
  distributedAmount: number;
  nav: number;
  vintageYear: number;
  assetClass: string;
  status: string;
}

export default function InvestmentsPage() {
  const shouldReduce = useReducedMotion();
  const [commitments] = useState<Commitment[]>(mockCommitments);

  // Calculate totals
  const totalCommitted = commitments.reduce((sum, c) => sum + c.commitmentAmount, 0);
  const totalCalled = commitments.reduce((sum, c) => sum + c.calledAmount, 0);
  const totalDistributed = commitments.reduce((sum, c) => sum + c.distributedAmount, 0);
  const totalNav = commitments.reduce((sum, c) => sum + c.nav, 0);
  const unfundedCommitment = totalCommitted - totalCalled;

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
            Private Investments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fund commitments, capital calls, and distributions
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Commitment
        </Button>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.fast },
          },
        }}
      >
        <MetricCard label="Total Committed" value={totalCommitted} />
        <MetricCard label="Called" value={totalCalled} />
        <MetricCard label="Unfunded" value={unfundedCommitment} highlight />
        <MetricCard label="Current NAV" value={totalNav} />
      </motion.div>

      {/* Commitments Table */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...spring.default }}
      >
        <div className="agentic-card-header">
          <h2 className="text-section">Fund Commitments</h2>
        </div>
        <div className="table-responsive">
          <table className="agentic-table">
            <thead>
              <tr>
                <th>Fund</th>
                <th>Vintage</th>
                <th>Committed</th>
                <th>Called</th>
                <th>Distributed</th>
                <th>NAV</th>
                <th>TVPI</th>
              </tr>
            </thead>
            <tbody>
              {commitments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No fund commitments yet</p>
                      <p className="text-xs mt-1">
                        Track your PE/VC fund investments
                      </p>
                      <Button size="sm" className="mt-4 gap-2">
                        <Plus className="w-4 h-4" />
                        Add Commitment
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                commitments.map((commitment) => (
                  <CommitmentRow key={commitment.id} commitment={commitment} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Upcoming Capital Calls */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...spring.default }}
      >
        <div className="agentic-card-header flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-section">Upcoming Capital Calls</h2>
        </div>
        <div className="agentic-card-content">
          <div className="text-center py-8 text-sm text-muted-foreground">
            No upcoming capital calls
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className="agentic-card p-4"
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
    >
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`text-xl font-semibold tabular-nums ${
          highlight ? "text-[var(--warning)]" : ""
        }`}
      >
        ${value.toLocaleString()}
      </div>
    </motion.div>
  );
}

function CommitmentRow({ commitment }: { commitment: Commitment }) {
  const tvpi =
    commitment.calledAmount > 0
      ? (commitment.distributedAmount + commitment.nav) / commitment.calledAmount
      : 0;

  return (
    <tr className="group">
      <td>
        <div>
          <div className="font-medium">{commitment.fundName}</div>
          <div className="text-xs text-muted-foreground">{commitment.manager}</div>
        </div>
      </td>
      <td className="text-sm">{commitment.vintageYear}</td>
      <td className="text-sm tabular-nums">
        ${commitment.commitmentAmount.toLocaleString()}
      </td>
      <td className="text-sm tabular-nums">
        ${commitment.calledAmount.toLocaleString()}
      </td>
      <td className="text-sm tabular-nums">
        ${commitment.distributedAmount.toLocaleString()}
      </td>
      <td className="text-sm tabular-nums font-medium">
        ${commitment.nav.toLocaleString()}
      </td>
      <td className="text-sm tabular-nums">
        <span
          className={tvpi >= 1 ? "text-[var(--live)]" : "text-[var(--error)]"}
        >
          {tvpi.toFixed(2)}x
        </span>
      </td>
    </tr>
  );
}
