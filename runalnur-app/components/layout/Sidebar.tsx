"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ARMS } from "@/lib/constants";
import { spring, stagger, duration } from "@/lib/motion/tokens";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import { useMode, type Mode } from "@/lib/mode/context";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface SidebarContentProps {
  onNavigate?: () => void;
}

// Navigation structure per mode
const COMMAND_NAV = {
  monitor: [
    { href: "/", label: "COMMAND CENTER" },
    { href: "/activity", label: "ACTIVITY" },
    { href: "/status", label: "LIVE STATUS", live: true },
    { href: "/reports", label: "REPORTS" },
  ],
  orchestrate: ARMS.map(arm => ({
    href: `/arms/${arm.slug}`,
    label: arm.name.toUpperCase(),
  })),
  delegate: [
    { href: "/projects", label: "PROJECTS" },
    { href: "/contacts", label: "CONTACTS" },
    { href: "/calendar", label: "CALENDAR" },
    { href: "/quests", label: "QUESTS" },
    { href: "/sops", label: "SOPS" },
    { href: "/knowledge", label: "KNOWLEDGE" },
    { href: "/coo", label: "COO" },
    { href: "/ai", label: "AI CHAT" },
  ],
  continuity: [
    { href: "/decisions", label: "DECISIONS" },
    { href: "/principles", label: "PRINCIPLES" },
    { href: "/timeline", label: "TIMELINE" },
    { href: "/inbox", label: "INBOX" },
  ],
};

const CAPITAL_NAV = {
  overview: [
    { href: "/capital", label: "DASHBOARD" },
    { href: "/capital/networth", label: "NET WORTH" },
  ],
  holdings: [
    { href: "/capital/portfolio", label: "PORTFOLIO" },
    { href: "/capital/by-entity", label: "BY ENTITY" },
    { href: "/capital/by-asset", label: "BY ASSET CLASS" },
  ],
  treasury: [
    { href: "/capital/accounts", label: "ACCOUNTS" },
    { href: "/capital/cashflow", label: "CASH FLOW" },
  ],
  investments: [
    { href: "/capital/investments", label: "COMMITMENTS" },
    { href: "/capital/calls", label: "CAPITAL CALLS" },
  ],
  structure: [
    { href: "/capital/entities", label: "ENTITIES" },
    { href: "/capital/ownership", label: "OWNERSHIP MAP" },
  ],
};

const INFLUENCE_NAV = {
  overview: [
    { href: "/influence", label: "DASHBOARD" },
    { href: "/influence/week", label: "THIS WEEK" },
  ],
  relationships: [
    { href: "/influence/contacts", label: "ALL CONTACTS" },
    { href: "/influence/inner", label: "INNER CIRCLE" },
    { href: "/influence/strategic", label: "STRATEGIC" },
    { href: "/influence/graph", label: "NETWORK GRAPH" },
  ],
  media: [
    { href: "/media", label: "MEDIA LIBRARY" },
    { href: "/social", label: "SOCIAL COMMAND" },
    { href: "/social/calendar", label: "CONTENT CALENDAR" },
    { href: "/social/analytics", label: "ANALYTICS" },
  ],
  intelligence: [
    { href: "/influence/intel", label: "NEWS FEED" },
    { href: "/influence/alerts", label: "ALERTS" },
  ],
  legitimacy: [
    { href: "/influence/media", label: "MEDIA MENTIONS" },
    { href: "/influence/recognition", label: "RECOGNITION" },
  ],
  calendar: [
    { href: "/influence/calendar", label: "DIPLOMATIC" },
  ],
};

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();
  const { mode, isLoaded } = useMode();

  // Check if a path is active (exact or prefix match)
  const isActive = (href: string) => {
    if (href === "/" || href === "/capital" || href === "/influence") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Logo / Brand with Mode Switcher */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <ModeSwitcher />
          <div>
            <motion.div
              className="font-semibold text-sm tracking-tight"
              whileHover={shouldReduce ? {} : { x: 2 }}
              transition={spring.snappy}
            >
              RUNALNUR
            </motion.div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Empire OS
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - using native scroll for better iOS support */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="py-4"
            initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduce ? {} : { opacity: 0, x: 10 }}
            transition={spring.default}
          >
            {/* Render navigation based on current mode */}
            {mode === "command" && (
              <CommandNav pathname={pathname} isActive={isActive} onNavigate={onNavigate} />
            )}
            {mode === "capital" && (
              <CapitalNav pathname={pathname} isActive={isActive} onNavigate={onNavigate} />
            )}
            {mode === "influence" && (
              <InfluenceNav pathname={pathname} isActive={isActive} onNavigate={onNavigate} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Settings & Setup - Always visible */}
      <motion.div
        className="p-2 border-t border-border space-y-0.5 shrink-0"
        initial={shouldReduce ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...spring.default }}
      >
        <NavItem
          href="/onboarding"
          label="SETUP WIZARD"
          active={pathname === "/onboarding"}
          onNavigate={onNavigate}
        />
        <NavItem
          href="/settings"
          label="SETTINGS"
          active={pathname === "/settings"}
          onNavigate={onNavigate}
        />
      </motion.div>
    </div>
  );
}

// Command Mode Navigation
function CommandNav({ 
  pathname, 
  isActive, 
  onNavigate 
}: { 
  pathname: string; 
  isActive: (href: string) => boolean; 
  onNavigate?: () => void;
}) {
  const shouldReduce = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduce ? {} : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger.fast, delayChildren: 0.1 },
        },
      }}
    >
      {/* MONITOR Section */}
      <CollapsibleNavSection 
        id="monitor"
        label="Monitor" 
        items={COMMAND_NAV.monitor}
        isActive={isActive}
        onNavigate={onNavigate}
        defaultExpanded
      />

      {/* ORCHESTRATE Section */}
      <CollapsibleNavSection 
        id="orchestrate"
        label="Orchestrate" 
        items={COMMAND_NAV.orchestrate}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />

      {/* DELEGATE Section */}
      <CollapsibleNavSection 
        id="delegate"
        label="Delegate" 
        items={COMMAND_NAV.delegate}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
        defaultExpanded
      />

      {/* CONTINUITY Section */}
      <CollapsibleNavSection 
        id="continuity"
        label="Continuity" 
        items={COMMAND_NAV.continuity}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />
    </motion.div>
  );
}

// Capital Mode Navigation
function CapitalNav({ 
  pathname, 
  isActive, 
  onNavigate 
}: { 
  pathname: string; 
  isActive: (href: string) => boolean; 
  onNavigate?: () => void;
}) {
  const shouldReduce = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduce ? {} : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger.fast, delayChildren: 0.1 },
        },
      }}
    >
      <CollapsibleNavSection 
        id="overview"
        label="Overview" 
        items={CAPITAL_NAV.overview}
        isActive={isActive}
        onNavigate={onNavigate}
        defaultExpanded
      />

      <CollapsibleNavSection 
        id="holdings"
        label="Holdings" 
        items={CAPITAL_NAV.holdings}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
        defaultExpanded
      />

      <CollapsibleNavSection 
        id="treasury"
        label="Treasury" 
        items={CAPITAL_NAV.treasury}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />

      <CollapsibleNavSection 
        id="investments"
        label="Investments" 
        items={CAPITAL_NAV.investments}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />

      <CollapsibleNavSection 
        id="structure"
        label="Structure" 
        items={CAPITAL_NAV.structure}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />
    </motion.div>
  );
}

// Influence Mode Navigation
function InfluenceNav({ 
  pathname, 
  isActive, 
  onNavigate 
}: { 
  pathname: string; 
  isActive: (href: string) => boolean; 
  onNavigate?: () => void;
}) {
  const shouldReduce = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduce ? {} : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger.fast, delayChildren: 0.1 },
        },
      }}
    >
      <CollapsibleNavSection 
        id="overview"
        label="Overview" 
        items={INFLUENCE_NAV.overview}
        isActive={isActive}
        onNavigate={onNavigate}
        defaultExpanded
      />

      <CollapsibleNavSection 
        id="relationships"
        label="Relationships" 
        items={INFLUENCE_NAV.relationships}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
        defaultExpanded
      />

      <CollapsibleNavSection 
        id="media"
        label="Media & Social" 
        items={INFLUENCE_NAV.media}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
        defaultExpanded
      />

      <CollapsibleNavSection 
        id="intelligence"
        label="Intelligence" 
        items={INFLUENCE_NAV.intelligence}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />

      <CollapsibleNavSection 
        id="legitimacy"
        label="Legitimacy" 
        items={INFLUENCE_NAV.legitimacy}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />

      <CollapsibleNavSection 
        id="calendar"
        label="Calendar" 
        items={INFLUENCE_NAV.calendar}
        isActive={isActive}
        onNavigate={onNavigate}
        className="mt-4"
      />
    </motion.div>
  );
}

export function Sidebar() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.aside
      className="hidden md:flex w-56 border-r border-border bg-sidebar flex-col h-screen overflow-hidden"
      initial={shouldReduce ? {} : { x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={spring.default}
    >
      <SidebarContent />
    </motion.aside>
  );
}

// ============================================================================
// Collapsible Navigation Section
// ============================================================================

interface NavItemData {
  href: string;
  label: string;
  live?: boolean;
}

interface CollapsibleNavSectionProps {
  id: string;
  label: string;
  items: NavItemData[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

function CollapsibleNavSection({ 
  id, 
  label, 
  items, 
  isActive, 
  onNavigate,
  className,
  defaultExpanded = false
}: CollapsibleNavSectionProps) {
  // Check if any item in this section is active
  const hasActiveItem = items.some(item => isActive(item.href));
  
  // Simple local state - auto-expand if has active item, otherwise use default
  const [isExpanded, setIsExpanded] = useState(hasActiveItem || defaultExpanded);
  
  // Auto-expand when navigating to an item in this section
  useEffect(() => {
    if (hasActiveItem) {
      setIsExpanded(true);
    }
  }, [hasActiveItem]);

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={spring.default}
    >
      {/* Section Header - Clickable */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className={cn(
          "nav-section w-full flex items-center justify-between group cursor-pointer",
          "hover:text-foreground transition-colors"
        )}
      >
        <span className="flex items-center gap-1.5">
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={spring.snappy}
            className="text-muted-foreground"
          >
            <ChevronRight className="w-3 h-3" />
          </motion.span>
          {label}
        </span>
        
        {/* Item count badge when collapsed */}
        {!isExpanded && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
            {items.length}
          </span>
        )}
        
        {/* Active indicator when collapsed */}
        {!isExpanded && hasActiveItem && (
          <span className="w-1.5 h-1.5 rounded-full bg-foreground ml-1" />
        )}
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-2 space-y-0.5 pt-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center justify-between px-3 py-2 text-xs font-medium tracking-wide rounded-sm",
                isActive(item.href)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span>{item.label}</span>
              {item.live && (
                <span className="w-2 h-2 rounded-full bg-[var(--live)] animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </motion.div>
  );
}

interface NavItemProps {
  href: string;
  label: string;
  active?: boolean;
  live?: boolean;
  delay?: number;
  onNavigate?: () => void;
}

function NavItem({ href, label, active, live, delay = 0, onNavigate }: NavItemProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: { delay, ...spring.default },
        },
      }}
    >
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "relative flex items-center justify-between px-3 py-2.5 md:py-2 text-xs font-medium tracking-wide rounded-sm overflow-hidden min-h-[44px] md:min-h-0",
          active
            ? "text-background"
            : "text-muted-foreground"
        )}
      >
        {/* Background layer - animated */}
        <AnimatePresence>
          {active && (
            <motion.div
              className="absolute inset-0 bg-foreground rounded-sm"
              layoutId={shouldReduce ? undefined : "nav-active-bg"}
              initial={shouldReduce ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={spring.default}
            />
          )}
        </AnimatePresence>

        {/* Hover background */}
        {!active && (
          <motion.div
            className="absolute inset-0 bg-muted rounded-sm"
            initial={{ opacity: 0 }}
            whileHover={shouldReduce ? {} : { opacity: 1 }}
            transition={{ duration: duration.fast }}
          />
        )}

        {/* Content */}
        <motion.span
          className="relative z-10"
          whileHover={shouldReduce ? {} : { x: 3 }}
          transition={spring.snappy}
        >
          {label}
        </motion.span>

        {/* Live indicator */}
        {live && (
          <motion.span
            className="relative z-10 w-2 h-2 rounded-full bg-[var(--live)]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </Link>
    </motion.div>
  );
}
