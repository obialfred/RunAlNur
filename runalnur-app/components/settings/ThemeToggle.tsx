"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";

type Theme = "light" | "dark" | "system";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: typeof Sun;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Always use light theme",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Always use dark theme",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Match your system preference",
  },
];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const shouldReduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-3">
            Theme
          </label>
          <div className="flex gap-1 p-1 bg-muted rounded-md">
            {themeOptions.map((option) => (
              <div
                key={option.value}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-xs font-medium"
              >
                <option.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTheme = (theme as Theme) || "system";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-3">
          Theme
        </label>
        
        {/* Segmented Control */}
        <div className="flex gap-1 p-1 bg-muted rounded-md relative">
          {themeOptions.map((option) => {
            const isActive = currentTheme === option.value;
            const Icon = option.icon;
            
            return (
              <motion.button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-xs font-medium relative z-10 transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                whileHover={shouldReduce ? {} : { scale: 1.02 }}
                whileTap={shouldReduce ? {} : { scale: 0.98 }}
                transition={spring.snappy}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={option.value}
                    initial={shouldReduce ? {} : { rotate: -30, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={shouldReduce ? {} : { rotate: 30, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                </AnimatePresence>
                <span className="hidden sm:inline">{option.label}</span>
                
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="theme-toggle-active"
                    className="absolute inset-0 bg-background rounded-sm shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={spring.default}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground mt-2">
          {themeOptions.find((o) => o.value === currentTheme)?.description}
        </p>
      </div>

      {/* Preview */}
      <div>
        <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-3">
          Preview
        </label>
        <motion.div
          className="border border-border rounded-md overflow-hidden"
          initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          {/* Preview header */}
          <div className="px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
                <span className="text-background font-mono text-[10px] font-bold">RN</span>
              </div>
              <div>
                <div className="text-xs font-semibold">RUNALNUR</div>
                <div className="text-[10px] text-muted-foreground">Empire OS</div>
              </div>
            </div>
          </div>
          
          {/* Preview content */}
          <div className="p-4 bg-background">
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 rounded-sm bg-card border border-border flex items-center justify-center">
                <div className="text-[10px] text-muted-foreground">Card</div>
              </div>
              <div className="h-16 rounded-sm bg-muted flex items-center justify-center">
                <div className="text-[10px] text-muted-foreground">Muted</div>
              </div>
              <div className="h-16 rounded-sm bg-foreground flex items-center justify-center">
                <div className="text-[10px] text-background">Primary</div>
              </div>
            </div>
            
            {/* Status colors */}
            <div className="flex gap-2 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--live)]" />
                <span className="text-[10px] text-muted-foreground">Live</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
                <span className="text-[10px] text-muted-foreground">Warning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--error)]" />
                <span className="text-[10px] text-muted-foreground">Error</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Current resolved theme info */}
        <div className="flex items-center justify-between mt-3 text-[10px]">
          <span className="text-muted-foreground">
            Currently using:{" "}
            <span className="text-foreground font-medium capitalize">
              {resolvedTheme}
            </span>
          </span>
          {currentTheme === "system" && (
            <span className="text-muted-foreground/60">
              (based on system preference)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
