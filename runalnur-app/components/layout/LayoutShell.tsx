"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useEdgeSwipe } from "@/lib/hooks/useEdgeSwipe";
import { useServiceWorkerUpdate } from "@/lib/hooks/useServiceWorkerUpdate";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

// Mobile nav base height + buffer (safe-area is added via CSS env())
const MOBILE_NAV_BASE_HEIGHT = 56; // px (iOS-style tab bar height)
const MOBILE_BOTTOM_PADDING = 0; // keep tight; safe-area handles separation

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login") || 
    pathname.startsWith("/signup") || 
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/onboarding");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hasUpdate, applyUpdate } = useServiceWorkerUpdate();

  // Swipe-right-anywhere to open sidebar on mobile (avoid iOS back-swipe edge conflict)
  const handleSwipeRight = useCallback(() => {
    if (window.innerWidth < 768) setSidebarOpen(true);
  }, []);

  useEdgeSwipe({
    onSwipeRight: handleSwipeRight,
    threshold: 60,
    enabled: !isAuthRoute && !sidebarOpen,
    mode: "anywhere",
  });

  if (isAuthRoute) {
    return (
      <div className="min-h-[var(--app-height,100dvh)] bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-[var(--app-height,100dvh)] overflow-hidden bg-background">

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent 
          side="left" 
          className="w-[280px] sm:w-80 p-0 bg-sidebar flex flex-col h-full min-h-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          showCloseButton={false}
        >
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {/* Top safe-area spacer for iOS PWA (prevents notch cropping).
            Keep the safe-area handling here (not on <body>), so scroll containers remain correct. */}
        <div
          className="shrink-0"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {/* PWA update banner (sticky, non-overlapping) */}
          {hasUpdate && (
            <div className="sticky top-0 z-[60] px-3 py-2 bg-background/95 backdrop-blur border-b border-border">
              <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground flex-1 min-w-0">
                  <span className="hidden sm:inline">Update available. Refresh to load the latest version.</span>
                  <span className="sm:hidden">Update available</span>
                </div>
                <button
                  onClick={() => void applyUpdate()}
                  className="text-[10px] font-medium tracking-wider uppercase px-3 py-2 min-h-[44px] rounded-sm border border-border hover:border-foreground/30 hover:text-foreground text-muted-foreground active:scale-95 shrink-0"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          <TopBar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        {/* Main content area with proper mobile scroll handling */}
        <main 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            // iOS momentum scrolling
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Content wrapper with mobile-aware bottom padding */}
          <div 
            className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto"
            style={{
              // Mobile: account for nav bar + safe area + buffer
              // Desktop: normal padding
              paddingBottom: `max(calc(${MOBILE_NAV_BASE_HEIGHT}px + ${MOBILE_BOTTOM_PADDING}px + env(safe-area-inset-bottom, 0px)), 24px)`,
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      <CommandPalette />
    </div>
  );
}
