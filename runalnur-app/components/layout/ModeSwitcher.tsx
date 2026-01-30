"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Crown, Landmark, Users, Check } from "lucide-react";
import { useMode, getAllModes, type Mode } from "@/lib/mode/context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { spring, duration } from "@/lib/motion/tokens";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const modeIcons: Record<Mode, typeof Crown> = {
  command: Crown,
  capital: Landmark,
  influence: Users,
};

const modeAccentClasses: Record<Mode, string> = {
  command: "",
  capital: "ring-1 ring-amber-500/30",
  influence: "ring-1 ring-blue-500/30",
};

export function ModeSwitcher() {
  const { mode, setMode, config } = useMode();
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const modes = getAllModes();

  const handleModeSelect = (selectedMode: Mode) => {
    if (selectedMode !== mode) {
      setMode(selectedMode);
      // Navigate to the mode's home route
      const modeConfig = modes.find(m => m.id === selectedMode);
      if (modeConfig) {
        router.push(modeConfig.route);
      }
    }
    setOpen(false);
  };

  const CurrentIcon = modeIcons[mode];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          className={cn(
            "w-8 h-8 bg-foreground rounded-sm flex items-center justify-center relative overflow-hidden",
            modeAccentClasses[mode]
          )}
          whileHover={shouldReduce ? {} : { scale: 1.05, rotate: 2 }}
          whileTap={shouldReduce ? {} : { scale: 0.95 }}
          transition={spring.snappy}
          aria-label={`Current mode: ${config.name}. Click to switch modes.`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={mode}
              className="text-background font-mono text-xs font-bold"
              initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduce ? {} : { opacity: 0, y: -10 }}
              transition={{ duration: duration.fast }}
            >
              RN
            </motion.span>
          </AnimatePresence>
          
          {/* Mode indicator dot */}
          {mode !== "command" && (
            <motion.div
              className={cn(
                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                mode === "capital" && "bg-amber-500",
                mode === "influence" && "bg-blue-500"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={spring.bouncy}
            />
          )}
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-64 p-0" 
        align="start" 
        sideOffset={8}
      >
        <motion.div
          initial={shouldReduce ? {} : { opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          {/* Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
                <span className="text-background font-mono text-[10px] font-bold">RN</span>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-tight">RUNALNUR</div>
                <div className="text-[9px] text-muted-foreground tracking-widest uppercase">
                  Empire OS
                </div>
              </div>
            </div>
          </div>
          
          {/* Mode Options */}
          <div className="p-2">
            {modes.map((modeConfig, index) => {
              const Icon = modeIcons[modeConfig.id];
              const isActive = mode === modeConfig.id;
              
              return (
                <motion.button
                  key={modeConfig.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-colors relative",
                    isActive 
                      ? "bg-foreground text-background" 
                      : "hover:bg-muted text-foreground"
                  )}
                  onClick={() => handleModeSelect(modeConfig.id)}
                  initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, ...spring.default }}
                  whileHover={shouldReduce ? {} : { x: 2 }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center",
                    isActive ? "bg-background/20" : "bg-muted"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold tracking-wide uppercase">
                      {modeConfig.name}
                    </div>
                    <div className={cn(
                      "text-[10px]",
                      isActive ? "text-background/70" : "text-muted-foreground"
                    )}>
                      {modeConfig.description}
                    </div>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring.bouncy}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
          
          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              Switch modes to change your focus. Notifications work across all modes.
            </p>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
