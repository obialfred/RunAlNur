"use client";

import { ChatInterface } from "@/components/ai/ChatInterface";
import Link from "next/link";

export default function AIManagerPage() {
  return (
    <div 
      className="flex flex-col"
      style={{
        // Calculate height accounting for header, padding, and mobile nav
        // Mobile: topbar (56px) + page padding + mobile nav (64px) + safe areas
        // Desktop: topbar + page padding only
        height: 'calc(var(--app-height, 100dvh) - 56px - 24px - 64px - env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header - compact on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4 gap-2 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">COO</h1>
              <span className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-sm">
                CHAT
              </span>
            </div>
            <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 truncate">
              Your Chief Operating Officer. Direct commands only.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/coo"
            className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors hidden sm:block h-9 flex items-center"
          >
            → Priority Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="status-dot live" />
            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">OPUS 4.5</span>
          </div>
        </div>
      </div>

      {/* Chat Interface - fills remaining space */}
      <div className="agentic-card flex-1 min-h-0 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
