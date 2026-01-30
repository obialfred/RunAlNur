"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export type Mode = "command" | "capital" | "influence";

export interface ModeConfig {
  id: Mode;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  route: string;
}

export const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  command: {
    id: "command",
    name: "Command",
    description: "Run the empire",
    icon: "Crown",
    accentColor: "default",
    route: "/",
  },
  capital: {
    id: "capital",
    name: "Capital",
    description: "What you own",
    icon: "Vault",
    accentColor: "gold",
    route: "/capital",
  },
  influence: {
    id: "influence",
    name: "Influence",
    description: "Who you know",
    icon: "Network",
    accentColor: "blue",
    route: "/influence",
  },
};

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
  config: ModeConfig;
  isLoaded: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const STORAGE_KEY = "runalnur-mode";

export function ModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // ALWAYS derive mode from the current pathname - URL is the source of truth
  const mode = getModeFromPath(pathname);

  // Mark as loaded after first render
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Persist mode to localStorage whenever it changes based on URL
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode, isLoaded]);

  // setMode now just navigates - the mode will change when the URL changes
  const setMode = useCallback((newMode: Mode) => {
    // Store immediately for faster feedback
    localStorage.setItem(STORAGE_KEY, newMode);
    // Note: The actual navigation is handled by the ModeSwitcher component
    // which calls router.push() after calling setMode
  }, []);

  const config = MODE_CONFIGS[mode];

  return (
    <ModeContext.Provider value={{ mode, setMode, config, isLoaded }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}

// Helper to check if a path belongs to a specific mode
export function getModeFromPath(pathname: string): Mode {
  if (pathname.startsWith("/capital")) return "capital";
  if (pathname.startsWith("/influence")) return "influence";
  // Influence content lives at top-level routes too
  if (pathname.startsWith("/media")) return "influence";
  if (pathname.startsWith("/social")) return "influence";
  return "command";
}

// Helper to get all modes as array
export function getAllModes(): ModeConfig[] {
  return Object.values(MODE_CONFIGS);
}
