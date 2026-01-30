"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/lib/hooks/usePWAInstall";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";

export function InstallPrompt() {
  const { isInstallable, isIOS, isDesktop, install, dismiss } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const success = await install();
      if (!success) {
        // If install failed, dismiss for now
        dismiss();
      }
    }
  };

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {!showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={spring.default}
            className="fixed left-4 right-4 z-50 bottom-[calc(1rem+4rem+var(--sab,0px))] md:bottom-4 md:left-auto md:right-4 md:w-80"
          >
            <div className="bg-card border border-border rounded-lg shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {isDesktop ? (
                    <Monitor className="w-5 h-5 text-primary" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium">Install Dynasty OS</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isDesktop 
                      ? "Add to your dock for quick access"
                      : "Add to home screen for the best experience"
                    }
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1 h-8 text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={dismiss}
                  className="h-8 text-xs"
                >
                  Later
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => {
                setShowIOSInstructions(false);
                dismiss();
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={spring.snappy}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-6 pb-[calc(2rem+var(--sab,0px))] md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 md:rounded-lg md:border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Install Dynasty OS</h2>
                <button
                  onClick={() => {
                    setShowIOSInstructions(false);
                    dismiss();
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                To install on your iPhone or iPad, follow these steps:
              </p>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-medium text-primary">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tap the Share button</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Find it at the bottom of Safari (or top on iPad)
                    </p>
                    <div className="mt-2 p-2 bg-muted rounded-md inline-flex items-center gap-2">
                      <Share className="w-4 h-4" />
                      <span className="text-xs">Share</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-medium text-primary">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Scroll down and tap "Add to Home Screen"</p>
                    <div className="mt-2 p-2 bg-muted rounded-md inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">Add to Home Screen</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-medium text-primary">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tap "Add" to confirm</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dynasty OS will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                onClick={() => {
                  setShowIOSInstructions(false);
                  dismiss();
                }}
              >
                Got it
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Compact version for settings page
export function InstallButton() {
  const { isInstallable, isInstalled, isIOS, install, dismiss } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        App installed
      </div>
    );
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (isInstallable) {
      await install();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={!isInstallable && !isIOS}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        {isInstallable || isIOS ? "Install App" : "Not available"}
      </Button>

      {/* iOS Instructions (same as above) */}
      <AnimatePresence>
        {showIOSInstructions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowIOSInstructions(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring.snappy}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-lg p-6 w-80"
            >
              <h3 className="font-medium mb-2">Install on iOS</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
              <Button
                className="w-full mt-4"
                size="sm"
                onClick={() => setShowIOSInstructions(false)}
              >
                Got it
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
