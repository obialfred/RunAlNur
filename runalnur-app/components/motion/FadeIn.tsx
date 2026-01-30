"use client";

import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import { duration, easing } from "@/lib/motion/tokens";

export function FadeIn(props: HTMLMotionProps<"div">) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.standard,
      }}
      {...props}
    />
  );
}
