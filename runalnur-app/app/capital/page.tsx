"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Landmark, TrendingUp, TrendingDown, Wallet, Building2, PiggyBank, ArrowRight } from "lucide-react";
import Link from "next/link";
import { spring, stagger } from "@/lib/motion/tokens";

// Mock data - will be replaced with real data
const mockData = {
  netWorth: 0,
  netWorthChange: 0,
  netWorthChangePercent: 0,
  liquidity: 0,
  holdings: {
    publicEquity: 0,
    privateEquity: 0,
    realEstate: 0,
    cash: 0,
    other: 0,
  },
  upcomingCalls: [],
  recentDistributions: [],
};

export default function CapitalDashboard() {
  const shouldReduce = useReducedMotion();
  const data = mockData;
  
  const isPositiveChange = data.netWorthChange >= 0;

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduce ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">
              Capital Mode
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Capital Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your wealth across all entities and asset classes
          </p>
        </div>
      </div>

      {/* Net Worth Card */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <div className="agentic-card-header">
          <h2 className="text-section">Net Worth</h2>
        </div>
        <div className="agentic-card-content">
          <div className="flex items-end gap-4">
            <div>
              <div className="text-4xl font-semibold tabular-nums">
                ${data.netWorth.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4 text-[var(--live)]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                )}
                <span
                  className={`text-sm ${
                    isPositiveChange ? "text-[var(--live)]" : "text-[var(--error)]"
                  }`}
                >
                  {isPositiveChange ? "+" : ""}
                  ${Math.abs(data.netWorthChange).toLocaleString()} (
                  {isPositiveChange ? "+" : ""}
                  {data.netWorthChangePercent.toFixed(2)}%)
                </span>
                <span className="text-xs text-muted-foreground">today</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={shouldReduce ? {} : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: stagger.fast, delayChildren: 0.2 },
          },
        }}
      >
        <QuickStatCard
          icon={Wallet}
          label="Liquidity"
          value={`$${data.liquidity.toLocaleString()}`}
          href="/capital/treasury"
        />
        <QuickStatCard
          icon={TrendingUp}
          label="Public Equity"
          value={`$${data.holdings.publicEquity.toLocaleString()}`}
          href="/capital/portfolio"
        />
        <QuickStatCard
          icon={Building2}
          label="Real Estate"
          value={`$${data.holdings.realEstate.toLocaleString()}`}
          href="/capital/by-asset"
        />
        <QuickStatCard
          icon={PiggyBank}
          label="Private Investments"
          value={`$${data.holdings.privateEquity.toLocaleString()}`}
          href="/capital/investments"
        />
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Capital Calls */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...spring.default }}
        >
          <div className="agentic-card-header flex items-center justify-between">
            <h2 className="text-section">Upcoming Capital Calls</h2>
            <Link
              href="/capital/calls"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="agentic-card-content">
            {data.upcomingCalls.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No upcoming capital calls
              </div>
            ) : (
              <div className="space-y-3">
                {/* Capital calls would be listed here */}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="agentic-card"
          initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...spring.default }}
        >
          <div className="agentic-card-header flex items-center justify-between">
            <h2 className="text-section">Recent Distributions</h2>
            <Link
              href="/capital/investments"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="agentic-card-content">
            {data.recentDistributions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No recent distributions
              </div>
            ) : (
              <div className="space-y-3">
                {/* Distributions would be listed here */}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Asset Allocation */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...spring.default }}
      >
        <div className="agentic-card-header flex items-center justify-between">
          <h2 className="text-section">Asset Allocation</h2>
          <Link
            href="/capital/portfolio"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View Portfolio <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="agentic-card-content">
          <div className="text-sm text-muted-foreground text-center py-8">
            Add holdings to see your asset allocation
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickStatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  href: string;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={spring.default}
    >
      <Link href={href}>
        <motion.div
          className="agentic-card p-4 hover:border-foreground/20 transition-colors cursor-pointer"
          whileHover={shouldReduce ? {} : { y: -2 }}
          whileTap={shouldReduce ? {} : { scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                {label}
              </div>
              <div className="text-lg font-semibold tabular-nums">{value}</div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
