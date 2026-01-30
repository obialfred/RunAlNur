"use client";

import { motion, useReducedMotion } from "framer-motion";
import { spring, stagger } from "@/lib/motion/tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Clock, CheckCircle2, X, UserMinus, Calendar, TrendingDown } from "lucide-react";

export default function AlertsPage() {
  const shouldReduce = useReducedMotion();

  // Mock alerts - relationship decay warnings, important dates, etc.
  const alerts = [
    {
      id: "1",
      type: "decay",
      severity: "warning",
      title: "Relationship Decay Warning",
      message: "Your relationship with Sheikh Abdullah Al-Fahad has dropped below 80%. Consider reaching out.",
      contact: "Sheikh Abdullah Al-Fahad",
      timestamp: "2024-01-20T10:00:00Z",
      actionable: true,
    },
    {
      id: "2",
      type: "date",
      severity: "info",
      title: "Upcoming Birthday",
      message: "Dr. Aisha Rahman's birthday is in 3 days. Send a personalized message?",
      contact: "Dr. Aisha Rahman",
      timestamp: "2024-01-20T08:00:00Z",
      actionable: true,
    },
    {
      id: "3",
      type: "engagement",
      severity: "warning",
      title: "No Recent Contact",
      message: "You haven't interacted with Ambassador Chen Wei in 30 days.",
      contact: "Ambassador Chen Wei",
      timestamp: "2024-01-19T15:00:00Z",
      actionable: true,
    },
    {
      id: "4",
      type: "intel",
      severity: "info",
      title: "News Mention",
      message: "Sarah Chen was quoted in TechCrunch discussing AI investments.",
      contact: "Sarah Chen",
      timestamp: "2024-01-19T12:00:00Z",
      actionable: false,
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "decay": return <TrendingDown className="w-4 h-4" />;
      case "date": return <Calendar className="w-4 h-4" />;
      case "engagement": return <UserMinus className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "warning": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "error": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">Relationship Alerts</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated nudges to help you maintain and strengthen relationships
          </p>
        </div>
        <Button variant="outline" size="sm">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
      </motion.div>

      {/* Alert Stats */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...spring.default }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-bold">
                {alerts.filter(a => a.severity === "warning").length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {alerts.filter(a => a.actionable).length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Actionable Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
            <p className="text-xs text-muted-foreground">Resolved Today</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        className="space-y-4"
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
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: spring.default },
            }}
          >
            <Card className={`${getSeverityColor(alert.severity)} border`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{alert.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.actionable && (
                      <Button size="sm">Take Action</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
