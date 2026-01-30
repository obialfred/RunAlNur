"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";

export default function NetWorthPage() {
  const shouldReduce = useReducedMotion();

  // Mock data - will be replaced with real data from database
  const netWorthData = {
    total: 0,
    change24h: 0,
    change7d: 0,
    breakdown: [
      { label: "Real Estate", value: 0, percentage: 0 },
      { label: "Public Equity", value: 0, percentage: 0 },
      { label: "Private Investments", value: 0, percentage: 0 },
      { label: "Cash & Equivalents", value: 0, percentage: 0 },
      { label: "Other Assets", value: 0, percentage: 0 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <h1 className="text-2xl font-bold tracking-tight">Net Worth</h1>
        <p className="text-sm text-muted-foreground">
          Consolidated view of total assets across all entities
        </p>
      </motion.div>

      {/* Total Net Worth Card */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold">
                ${netWorthData.total.toLocaleString()}
              </span>
              <div className="flex items-center gap-2 text-sm">
                {netWorthData.change24h >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={netWorthData.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                  {netWorthData.change24h >= 0 ? "+" : ""}{netWorthData.change24h}%
                </span>
                <span className="text-muted-foreground">24h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Breakdown */}
      <motion.div
        className="grid gap-4 md:grid-cols-2"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.normal, delayChildren: 0.2 },
          },
        }}
      >
        {netWorthData.breakdown.map((item) => (
          <motion.div
            key={item.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: spring.default },
            }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <PieChart className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${item.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {item.percentage}% of portfolio
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Placeholder for chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Chart visualization will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
