"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Plus, Building, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";

// Mock accounts data
const mockAccounts: Account[] = [];

interface Account {
  id: string;
  institution: string;
  accountType: string;
  accountName: string;
  balance: number;
  currency: string;
  lastSyncedAt?: string;
}

export default function TreasuryPage() {
  const shouldReduce = useReducedMotion();
  const [accounts] = useState<Account[]>(mockAccounts);

  // Calculate totals
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const checkingBalance = accounts
    .filter((a) => a.accountType === "checking")
    .reduce((sum, a) => sum + a.balance, 0);
  const savingsBalance = accounts
    .filter((a) => a.accountType === "savings")
    .reduce((sum, a) => sum + a.balance, 0);

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
            Treasury
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bank accounts and cash positions
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
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
        <SummaryCard
          icon={Wallet}
          label="Total Cash"
          value={totalBalance}
          color="text-foreground"
        />
        <SummaryCard
          icon={Building}
          label="Checking"
          value={checkingBalance}
          color="text-blue-500"
        />
        <SummaryCard
          icon={PiggyBank}
          label="Savings"
          value={savingsBalance}
          color="text-emerald-500"
        />
      </motion.div>

      {/* Accounts List */}
      <motion.div
        className="agentic-card"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...spring.default }}
      >
        <div className="agentic-card-header">
          <h2 className="text-section">Accounts</h2>
        </div>
        <div className="agentic-card-content">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No accounts yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your bank accounts to track your cash positions
              </p>
              <Button size="sm" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  color: string;
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
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-sm bg-muted flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </div>
          <div className="text-xl font-semibold tabular-nums">
            ${value.toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AccountRow({ account }: { account: Account }) {
  const typeIcons: Record<string, typeof Building> = {
    checking: Building,
    savings: PiggyBank,
    brokerage: Wallet,
    credit: CreditCard,
  };
  const Icon = typeIcons[account.accountType] || Building;

  return (
    <div className="flex items-center gap-4 p-3 rounded-sm hover:bg-muted transition-colors">
      <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{account.accountName}</div>
        <div className="text-xs text-muted-foreground">
          {account.institution} • {account.accountType}
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold tabular-nums">
          ${account.balance.toLocaleString()}
        </div>
        {account.lastSyncedAt && (
          <div className="text-xs text-muted-foreground">
            Synced {new Date(account.lastSyncedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
