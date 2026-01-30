"use client";

import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import { duration, easing } from "@/lib/motion/tokens";

interface SlideInProps extends HTMLMotionProps<"div"> {
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}

export function SlideIn({
  direction = "up",
  distance = 12,
  ...props
}: SlideInProps) {
  const shouldReduce = useReducedMotion();
  const offset =
    direction === "up"
      ? { y: distance }
      : direction === "down"
        ? { y: -distance }
        : direction === "left"
          ? { x: distance }
          : { x: -distance };

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, ...offset }}
      animate={shouldReduce ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.standard,
      }}
      {...props}
    />
  );
}
