"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CapitalCallsPage() {
  const shouldReduce = useReducedMotion();

  // Mock capital calls data
  const capitalCalls = [
    {
      id: "1",
      fundName: "Tech Growth Fund III",
      amount: 50000,
      dueDate: "2024-02-15",
      status: "pending",
      notice: "Capital call notice received",
    },
    {
      id: "2",
      fundName: "Real Estate Opportunity Fund",
      amount: 100000,
      dueDate: "2024-03-01",
      status: "upcoming",
      notice: "Anticipated based on fund schedule",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPending = capitalCalls
    .filter(c => c.status === "pending")
    .reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <h1 className="text-2xl font-bold tracking-tight">Capital Calls</h1>
        <p className="text-sm text-muted-foreground">
          Track and manage capital call requests from fund investments
        </p>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Card className={totalPending > 0 ? "border-amber-500/20 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Capital Calls</CardTitle>
            {totalPending > 0 ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {capitalCalls.filter(c => c.status === "pending").length} calls awaiting payment
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Capital Calls List */}
      <motion.div
        className="space-y-4"
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
        {capitalCalls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CalendarClock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No capital calls at this time</p>
            </CardContent>
          </Card>
        ) : (
          capitalCalls.map((call) => (
            <motion.div
              key={call.id}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: spring.default },
              }}
            >
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <CalendarClock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{call.fundName}</h3>
                        <p className="text-sm text-muted-foreground">{call.notice}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">${call.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Due: {call.dueDate}</p>
                      </div>
                      {getStatusBadge(call.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
