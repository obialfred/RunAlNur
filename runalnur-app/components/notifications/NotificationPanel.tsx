"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNotifications, markNotificationRead } from "@/lib/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { spring, stagger } from "@/lib/motion/tokens";
import { Bell, Check, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body?: string;
  type?: string;
  read_at?: string | null;
  created_at: string;
}

export function NotificationPanel() {
  const shouldReduce = useReducedMotion();
  const { data: notifications, refresh } = useNotifications();

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    await refresh();
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-[var(--success)]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-[var(--error)]" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <motion.div
        className="agentic-card-header border-b border-border"
        initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <h2 className="text-section">Notifications</h2>
        </div>
      </motion.div>
      
      <ScrollArea className="flex-1">
        <motion.div
          className="divide-y divide-border"
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
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 && (
              <motion.div
                key="empty"
                className="p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring.default}
              >
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
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
                  No new notifications
                </div>
              </motion.div>
            )}
            
            {notifications.map((n: Notification, index: number) => (
              <motion.div
                key={n.id}
                className={`p-4 relative group ${!n.read_at ? 'bg-muted/30' : ''}`}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { 
                    opacity: 1, 
                    x: 0,
                    transition: spring.default,
                  },
                }}
                whileHover={shouldReduce ? {} : { 
                  backgroundColor: "hsl(var(--muted) / 0.5)",
                  x: 4,
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20, 
                  height: 0,
                  transition: { duration: 0.2 },
                }}
                layout
              >
                {/* Unread indicator */}
                {!n.read_at && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--live)]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={spring.default}
                  />
                )}
                
                <div className="flex items-start gap-3">
                  <motion.div
                    className="mt-0.5"
                    initial={shouldReduce ? {} : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.02, ...spring.bouncy }}
                  >
                    {getIcon(n.type)}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <motion.div
                      className="text-sm font-medium"
                      whileHover={shouldReduce ? {} : { x: 2 }}
                      transition={spring.snappy}
                    >
                      {n.title}
                    </motion.div>
                    {n.body && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.body}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/60 mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {!n.read_at && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={spring.snappy}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-7 px-2"
                          onClick={() => handleRead(n.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          READ
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </ScrollArea>
    </div>
  );
}
