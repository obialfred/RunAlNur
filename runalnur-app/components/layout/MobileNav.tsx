"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Sparkles,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: Users,
  },
  {
    href: "/ai",
    label: "AI",
    icon: Sparkles,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const navigatorWithStandalone = window.navigator as Navigator & {
        standalone?: boolean;
      };
      const isStandalone =
        navigatorWithStandalone.standalone === true ||
        window.matchMedia?.("(display-mode: standalone)").matches;
      setIsPwa(Boolean(isStandalone));
    };

    checkStandalone();

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    if (!mediaQuery) {
      return;
    }

    const handleChange = () => checkStandalone();
    mediaQuery.addEventListener?.("change", handleChange);
    mediaQuery.addListener?.(handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
      mediaQuery.removeListener?.(handleChange);
    };
  }, []);

  return (
    <>
      {/* iOS PWA safe-area underlay: fills the home-indicator gap with the same nav background */}
      {isPwa && (
        <div
          aria-hidden="true"
          className="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-background/95 backdrop-blur-md"
          style={{
            height: "env(safe-area-inset-bottom, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
          }}
        />
      )}

      <nav
        data-mobile-nav="true"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
        style={{
          paddingBottom: isPwa ? 0 : "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        {/* Keep icons in the 56px bar; safe-area is padding below (not part of the centering math). */}
        <div
          data-mobile-nav-inner="true"
          className="flex items-center justify-around h-14 max-w-md mx-auto"
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 relative",
                  // Touch-friendly targets - minimum 44x44px
                  "min-w-[56px] min-h-[52px] px-2 py-1.5",
                  "transition-colors duration-200 active:scale-95 active:opacity-80",
                  "-webkit-tap-highlight-color-transparent",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-2 top-0 h-0.5 bg-foreground rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  className={cn("w-5 h-5", isActive && "scale-110")}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
