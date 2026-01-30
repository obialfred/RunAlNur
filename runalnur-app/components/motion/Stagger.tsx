"use client";

import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import { duration } from "@/lib/motion/tokens";

interface StaggerProps extends HTMLMotionProps<"div"> {
  stagger?: number;
}

export function Stagger({ stagger = 0.06, ...props }: StaggerProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduce ? false : "hidden"}
      animate={shouldReduce ? "visible" : "visible"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: duration.normal,
            staggerChildren: stagger,
          },
        },
      }}
      {...props}
    />
  );
}
