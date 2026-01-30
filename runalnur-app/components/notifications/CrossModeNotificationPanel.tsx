"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";
import { 
  Bell, Check, Crown, Landmark, Users, 
  AlertTriangle, AlertCircle, Clock, X 
} from "lucide-react";
import { useCrossModeAlerts } from "@/lib/hooks/useCrossModeAlerts";
import { useMode, type Mode } from "@/lib/mode/context";
import { formatAlertTime, getAlertActionUrl, PRIORITY_COLORS } from "@/lib/notifications/cross-mode";
import { cn } from "@/lib/utils";

const modeIcons: Record<Mode, typeof Crown> = {
  command: Crown,
  capital: Landmark,
  influence: Users,
};

const modeLabels: Record<Mode, string> = {
  command: "Command",
  capital: "Capital",
  influence: "Influence",
};

export function CrossModeNotificationPanel() {
  const shouldReduce = useReducedMotion();
  const router = useRouter();
  const { setMode } = useMode();
  const { alerts, alertsByMode, unreadByMode, totalUnread, markAsRead, dismiss, loading } = useCrossModeAlerts();

  const handleAlertClick = async (alert: typeof alerts[0]) => {
    // Mark as read
    if (!alert.read_at) {
      await markAsRead(alert.id);
    }
    
    // Switch mode if needed
    setMode(alert.source_mode);
    
    // Navigate to the alert's action URL
    const url = getAlertActionUrl(alert);
    router.push(url);
  };

  const handleDismiss = async (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    await dismiss(alertId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        className="p-4 border-b border-border"
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Notifications
            </h2>
          </div>
          {totalUnread > 0 && (
            <span className="text-xs px-2 py-0.5 bg-foreground text-background rounded-full">
              {totalUnread} unread
            </span>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <motion.div
          initial={shouldReduce ? {} : "hidden"}
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: stagger.fast,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Alerts grouped by mode */}
              {(["command", "capital", "influence"] as Mode[]).map((mode) => {
                const modeAlerts = alertsByMode[mode].filter(
                  (a) => !a.dismissed_at
                );
                if (modeAlerts.length === 0) return null;

                const Icon = modeIcons[mode];
                const unread = unreadByMode[mode];

                return (
                  <motion.div
                    key={mode}
                    className="border-b border-border last:border-b-0"
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    {/* Mode Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          {modeLabels[mode]}
                        </span>
                      </div>
                      {unread > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-foreground text-background rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Alerts */}
                    <div className="divide-y divide-border">
                      {modeAlerts.map((alert) => (
                        <AlertItem
                          key={alert.id}
                          alert={alert}
                          onClick={() => handleAlertClick(alert)}
                          onDismiss={(e) => handleDismiss(e, alert.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.div>
      </ScrollArea>
    </div>
  );
}

function AlertItem({
  alert,
  onClick,
  onDismiss,
}: {
  alert: {
    id: string;
    title: string;
    description?: string;
    priority: "critical" | "high" | "medium" | "low";
    read_at?: string;
    created_at: string;
  };
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}) {
  const shouldReduce = useReducedMotion();
  const isUnread = !alert.read_at;

  const getPriorityIcon = () => {
    switch (alert.priority) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      className={cn(
        "p-3 cursor-pointer group relative",
        isUnread && "bg-muted/20"
      )}
      onClick={onClick}
      whileHover={shouldReduce ? {} : { backgroundColor: "hsl(var(--muted) / 0.5)", x: 2 }}
      transition={spring.snappy}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--live)]" />
      )}

      {/* Priority indicator */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-0.5",
          PRIORITY_COLORS[alert.priority]
        )}
      />

      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getPriorityIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className={cn("text-sm", isUnread && "font-medium")}>
            {alert.title}
          </div>
          {alert.description && (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {alert.description}
            </div>
          )}
          <div className="text-[10px] text-muted-foreground/60 mt-1">
            {formatAlertTime(alert.created_at)}
          </div>
        </div>

        {/* Dismiss button */}
        <motion.button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-sm transition-opacity"
          onClick={onDismiss}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className="p-8 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring.default}
    >
      <motion.div
        animate={
          shouldReduce
            ? {}
            : {
                y: [0, -5, 0],
              }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
      </motion.div>
      <div className="text-sm text-muted-foreground">All caught up!</div>
      <div className="text-xs text-muted-foreground/60 mt-1">
        No notifications across any mode
      </div>
    </motion.div>
  );
}
