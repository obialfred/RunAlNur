"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

export default function CashFlowPage() {
  const shouldReduce = useReducedMotion();

  // Mock cash flow data
  const cashFlowData = {
    inflows: {
      total: 0,
      breakdown: [
        { source: "Investment Returns", amount: 0 },
        { source: "Rental Income", amount: 0 },
        { source: "Distributions", amount: 0 },
        { source: "Other Income", amount: 0 },
      ],
    },
    outflows: {
      total: 0,
      breakdown: [
        { source: "Operating Expenses", amount: 0 },
        { source: "Capital Calls", amount: 0 },
        { source: "Taxes", amount: 0 },
        { source: "Other Expenses", amount: 0 },
      ],
    },
    netCashFlow: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <h1 className="text-2xl font-bold tracking-tight">Cash Flow</h1>
        <p className="text-sm text-muted-foreground">
          Track money movement across all accounts and entities
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.fast, delayChildren: 0.1 },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: spring.default },
          }}
        >
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Inflows</CardTitle>
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                +${cashFlowData.inflows.total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: spring.default },
          }}
        >
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Outflows</CardTitle>
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">
                -${cashFlowData.outflows.total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: spring.default },
          }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${cashFlowData.netCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>
                {cashFlowData.netCashFlow >= 0 ? "+" : ""}${cashFlowData.netCashFlow.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Breakdown Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-500 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Inflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cashFlowData.inflows.breakdown.map((item) => (
                <div key={item.source} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.source}</span>
                  <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />
              Outflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cashFlowData.outflows.breakdown.map((item) => (
                <div key={item.source} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.source}</span>
                  <span className="text-sm font-medium">${item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Cash flow chart will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
