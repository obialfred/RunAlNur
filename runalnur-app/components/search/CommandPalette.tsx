"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { spring, stagger, duration } from "@/lib/motion/tokens";
import { 
  LayoutDashboard, FolderKanban, Users, ClipboardList, 
  Bot, BarChart3, Activity, Radio, BookOpen, Compass,
  Building2, Home, Star, Settings, Search, Command
} from "lucide-react";

const commands = [
  { label: "Command Center", href: "/", icon: LayoutDashboard, section: "Navigate" },
  { label: "Projects", href: "/projects", icon: FolderKanban, section: "Navigate" },
  { label: "Contacts", href: "/contacts", icon: Users, section: "Navigate" },
  { label: "SOPs", href: "/sops", icon: ClipboardList, section: "Navigate" },
  { label: "AI Manager", href: "/ai", icon: Bot, section: "Navigate" },
  { label: "Reports", href: "/reports", icon: BarChart3, section: "Monitor" },
  { label: "Activity", href: "/activity", icon: Activity, section: "Monitor" },
  { label: "Live Status", href: "/status", icon: Radio, section: "Monitor" },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen, section: "Delegate" },
  { label: "Onboarding", href: "/onboarding", icon: Compass, section: "Delegate" },
  { label: "Janna Deals", href: "/arms/janna/deals", icon: Building2, section: "Arms" },
  { label: "Janna Properties", href: "/arms/janna/properties", icon: Home, section: "Arms" },
  { label: "Nova", href: "/arms/nova", icon: Star, section: "Arms" },
  { label: "Settings", href: "/settings", icon: Settings, section: "System" },
];

export function CommandPalette() {
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => 
      c.label.toLowerCase().includes(q) || 
      c.section.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex].href);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, selectedIndex, handleSelect]);

  // Group by section
  const grouped = useMemo(() => {
    const groups: Record<string, typeof commands> = {};
    filtered.forEach((cmd) => {
      if (!groups[cmd.section]) groups[cmd.section] = [];
      groups[cmd.section].push(cmd);
    });
    return groups;
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-lg overflow-hidden">
        {/* Search input */}
        <motion.div
          className="border-b border-border p-3 flex items-center gap-3"
          initial={shouldReduce ? {} : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...spring.default }}
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="h-9 text-sm bg-transparent border-0 focus-visible:ring-0 px-0"
            autoFocus
          />
          <motion.div
            className="flex items-center gap-1 text-[10px] text-muted-foreground"
            initial={shouldReduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
              <Command className="w-2.5 h-2.5 inline" />K
            </kbd>
          </motion.div>
        </motion.div>

        {/* Results */}
        <motion.div
          className="max-h-80 overflow-auto"
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
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="no-results"
                className="p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring.default}
              >
                <div className="text-2xl mb-2">🔍</div>
                <div className="text-sm text-muted-foreground">No results found</div>
                <div className="text-xs text-muted-foreground/60 mt-1">
                  Try a different search term
                </div>
              </motion.div>
            ) : (
              <motion.div key="results" className="py-2">
                {Object.entries(grouped).map(([section, cmds]) => (
                  <div key={section} className="mb-2">
                    <motion.div
                      className="px-4 py-1.5 text-[10px] font-medium tracking-wider uppercase text-muted-foreground"
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      {section}
                    </motion.div>
                    {cmds.map((cmd) => {
                      const globalIndex = filtered.findIndex(c => c.href === cmd.href);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = cmd.icon;
                      
                      return (
                        <motion.button
                          key={cmd.href}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                            isSelected 
                              ? 'bg-foreground text-background' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => handleSelect(cmd.href)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          variants={{
                            hidden: { opacity: 0, x: -15 },
                            visible: { 
                              opacity: 1, 
                              x: 0,
                              transition: spring.default,
                            },
                          }}
                          whileHover={shouldReduce ? {} : { x: 4 }}
                          whileTap={shouldReduce ? {} : { scale: 0.98 }}
                          transition={spring.snappy}
                        >
                          <motion.div
                            animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                            transition={spring.snappy}
                          >
                            <Icon className="w-4 h-4 opacity-60" />
                          </motion.div>
                          <span className="text-sm flex-1">{cmd.label}</span>
                          {isSelected && (
                            <motion.span
                              className="text-[10px] opacity-60"
                              initial={{ opacity: 0, x: 5 }}
                              animate={{ opacity: 0.6, x: 0 }}
                              transition={spring.snappy}
                            >
                              ↵
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="px-4 py-2 text-[10px] text-muted-foreground border-t border-border flex items-center justify-between"
          initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...spring.default }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↑</kbd>
              <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↵</kbd>
              <span className="ml-1">Select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Esc</kbd>
            <span className="ml-1">Close</span>
          </span>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
