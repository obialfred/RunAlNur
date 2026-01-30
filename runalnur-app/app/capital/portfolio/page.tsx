"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { spring } from "@/lib/motion/tokens";

// Mock holdings data
interface Holding {
  id: string;
  name: string;
  symbol?: string;
  entityName?: string;
  quantity: number;
  costBasis: number;
  currentValue: number;
}

const mockHoldings: Holding[] = [
  // Empty for now - will be populated from database
];

export default function PortfolioPage() {
  const shouldReduce = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [holdings] = useState(mockHoldings);

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
            Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All holdings across entities and accounts
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Holding
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search holdings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Holdings Table */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <div className="table-responsive">
          <table className="agentic-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Entity</th>
                <th>Quantity</th>
                <th>Cost Basis</th>
                <th>Current Value</th>
                <th>Gain/Loss</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <p className="text-sm">No holdings yet</p>
                      <p className="text-xs mt-1">
                        Add your first holding to start tracking your portfolio
                      </p>
                      <Button size="sm" className="mt-4 gap-2">
                        <Plus className="w-4 h-4" />
                        Add Holding
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                holdings.map((holding: Holding) => (
                  <HoldingRow key={holding.id} holding={holding} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HoldingRow({ holding }: { holding: Holding }) {
  const shouldReduce = useReducedMotion();
  const gainLoss = (holding.currentValue || 0) - (holding.costBasis || 0);
  const gainLossPercent =
    holding.costBasis > 0 ? (gainLoss / holding.costBasis) * 100 : 0;
  const isPositive = gainLoss >= 0;

  return (
    <motion.tr
      initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group"
    >
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center text-xs font-medium">
            {holding.symbol?.slice(0, 2) || "?"}
          </div>
          <div>
            <div className="font-medium">{holding.name}</div>
            {holding.symbol && (
              <div className="text-xs text-muted-foreground">{holding.symbol}</div>
            )}
          </div>
        </div>
      </td>
      <td className="text-sm">{holding.entityName || "Personal"}</td>
      <td className="text-sm tabular-nums">{holding.quantity?.toLocaleString()}</td>
      <td className="text-sm tabular-nums">
        ${holding.costBasis?.toLocaleString()}
      </td>
      <td className="text-sm tabular-nums font-medium">
        ${holding.currentValue?.toLocaleString()}
      </td>
      <td>
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-[var(--live)]" />
          ) : (
            <TrendingDown className="w-3 h-3 text-[var(--error)]" />
          )}
          <span
            className={`text-sm tabular-nums ${
              isPositive ? "text-[var(--live)]" : "text-[var(--error)]"
            }`}
          >
            {isPositive ? "+" : ""}
            {gainLossPercent.toFixed(2)}%
          </span>
        </div>
      </td>
      <td>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </td>
    </motion.tr>
  );
}
