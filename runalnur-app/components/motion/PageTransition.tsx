"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { duration, easing } from "@/lib/motion/tokens";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={shouldReduce ? false : { opacity: 0, y: 6 }}
        animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{
          duration: duration.page,
          ease: easing.standard,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
