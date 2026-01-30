"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Monitor,
  Share,
  Plus,
  Download,
  Check,
  Apple,
  Chrome,
} from "lucide-react";
import { spring } from "@/lib/motion/tokens";

type DeviceType = "ios" | "android" | "mac" | "windows" | "unknown";

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator as { userAgentData?: { platform?: string } })
    .userAgentData?.platform?.toLowerCase() || navigator.platform.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mac/.test(platform)) return "mac";
  if (/win/.test(platform)) return "windows";

  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

interface InstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallGuide({ open, onOpenChange }: InstallGuideProps) {
  const [device, setDevice] = useState<DeviceType>("unknown");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
    setInstalled(isStandalone());
  }, []);

  if (installed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Already Installed
            </DialogTitle>
            <DialogDescription>
              You&apos;re already using Dynasty OS as an installed app. Enjoy the
              native experience!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Install Dynasty OS
          </DialogTitle>
          <DialogDescription>
            Get the full native app experience with automatic updates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Device-specific instructions */}
          {device === "ios" && <IOSInstructions />}
          {device === "android" && <AndroidInstructions />}
          {device === "mac" && <MacInstructions />}
          {device === "windows" && <WindowsInstructions />}
          {device === "unknown" && (
            <div className="space-y-4">
              <IOSInstructions />
              <MacInstructions />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IOSInstructions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className="p-4 bg-muted rounded-lg space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Apple className="w-4 h-4" />
        iPhone / iPad
      </div>

      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            1
          </span>
          <span>
            Tap the <strong>Share</strong> button{" "}
            <Share className="w-4 h-4 inline text-foreground" /> at the bottom
            of Safari
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            2
          </span>
          <span>
            Scroll down and tap{" "}
            <strong>&quot;Add to Home Screen&quot;</strong>{" "}
            <Plus className="w-4 h-4 inline text-foreground" />
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            3
          </span>
          <span>
            Tap <strong>&quot;Add&quot;</strong> in the top right corner
          </span>
        </li>
      </ol>

      <div className="pt-2 text-xs text-muted-foreground/70">
        💡 Open from your home screen for the full app experience
      </div>
    </motion.div>
  );
}

function AndroidInstructions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className="p-4 bg-muted rounded-lg space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Smartphone className="w-4 h-4" />
        Android
      </div>

      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            1
          </span>
          <span>
            Tap the <strong>menu</strong> button (three dots) in Chrome
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            2
          </span>
          <span>
            Tap <strong>&quot;Add to Home screen&quot;</strong> or{" "}
            <strong>&quot;Install app&quot;</strong>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            3
          </span>
          <span>
            Confirm by tapping <strong>&quot;Install&quot;</strong>
          </span>
        </li>
      </ol>
    </motion.div>
  );
}

function MacInstructions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className="p-4 bg-muted rounded-lg space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Monitor className="w-4 h-4" />
        Mac (Chrome / Edge / Arc)
      </div>

      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            1
          </span>
          <span>
            Look for the <strong>install icon</strong>{" "}
            <Download className="w-4 h-4 inline text-foreground" /> in the
            address bar (right side)
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            2
          </span>
          <span>
            Or go to <strong>Menu → Install Dynasty OS</strong>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            3
          </span>
          <span>
            Click <strong>&quot;Install&quot;</strong> in the popup
          </span>
        </li>
      </ol>

      <div className="pt-2 text-xs text-muted-foreground/70">
        💡 The app will appear in your Applications folder and Dock
      </div>
    </motion.div>
  );
}

function WindowsInstructions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.default}
      className="p-4 bg-muted rounded-lg space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Chrome className="w-4 h-4" />
        Windows (Chrome / Edge)
      </div>

      <ol className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            1
          </span>
          <span>
            Click the <strong>install icon</strong>{" "}
            <Download className="w-4 h-4 inline text-foreground" /> in the
            address bar
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            2
          </span>
          <span>
            Or click <strong>⋮ → Install Dynasty OS</strong>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium shrink-0">
            3
          </span>
          <span>
            Click <strong>&quot;Install&quot;</strong>
          </span>
        </li>
      </ol>
    </motion.div>
  );
}

// Hook for triggering the install guide
export function useInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    setIsInstalled(isStandalone());
  }, []);

  return {
    showGuide,
    setShowGuide,
    isInstalled,
    InstallGuideComponent: () => (
      <InstallGuide open={showGuide} onOpenChange={setShowGuide} />
    ),
  };
}
