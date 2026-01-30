"use client";

import { Bell, Crown, Landmark, Users } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCrossModeAlerts } from "@/lib/hooks/useCrossModeAlerts";
import { CrossModeNotificationPanel } from "@/components/notifications/CrossModeNotificationPanel";
import { spring } from "@/lib/motion/tokens";
import { useMode, type Mode } from "@/lib/mode/context";
import { cn } from "@/lib/utils";

const modeColors: Record<Mode, string> = {
  command: "",
  capital: "text-amber-500",
  influence: "text-blue-500",
};

export function NotificationBell() {
  const shouldReduce = useReducedMotion();
  const { mode } = useMode();
  const { totalUnread, unreadByMode } = useCrossModeAlerts();

  // Calculate if there are unread alerts in other modes
  const otherModeUnread = Object.entries(unreadByMode)
    .filter(([m]) => m !== mode)
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.div
          whileHover={shouldReduce ? {} : { scale: 1.05 }}
          whileTap={shouldReduce ? {} : { scale: 0.95 }}
          transition={spring.snappy}
        >
          <Button variant="outline" size="sm" className="h-8 px-2 relative">
            <motion.div
              animate={totalUnread > 0 && !shouldReduce ? {
                rotate: [0, -10, 10, -10, 10, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 5,
              }}
            >
              <Bell className="w-4 h-4" />
            </motion.div>
            
            <AnimatePresence>
              {totalUnread > 0 && (
                <motion.span
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--error)] text-white text-[10px] font-medium flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={spring.bouncy}
                >
                  <motion.span
                    key={totalUnread}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={spring.snappy}
                  >
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>

            {/* Mode indicators for other modes with unread */}
            <AnimatePresence>
              {otherModeUnread > 0 && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={spring.snappy}
                >
                  {unreadByMode.command > 0 && mode !== "command" && (
                    <div className="w-1 h-1 rounded-full bg-foreground" />
                  )}
                  {unreadByMode.capital > 0 && mode !== "capital" && (
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                  )}
                  {unreadByMode.influence > 0 && mode !== "influence" && (
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent className="p-0 w-[360px]">
        <CrossModeNotificationPanel />
      </SheetContent>
    </Sheet>
  );
}
