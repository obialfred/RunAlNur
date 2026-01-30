"use client";

import { forwardRef, type ReactNode } from "react";
import {
  motion,
  type HTMLMotionProps,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import {
  spring,
  duration,
  easing,
  stagger as staggerValues,
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  buttonTap,
  buttonHover,
  cardHover,
  cardTap,
  pageVariants,
  shimmer,
  pulse,
} from "@/lib/motion/tokens";

// ============================================
// FADE IN - Basic fade with optional direction
// ============================================
interface FadeInProps extends HTMLMotionProps<"div"> {
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  children: ReactNode;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ direction = "up", delay = 0, children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    const directionOffset = {
      up: { y: 20 },
      down: { y: -20 },
      left: { x: 20 },
      right: { x: -20 },
      none: {},
    };

    return (
      <motion.div
        ref={ref}
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, ...directionOffset[direction] }}
        animate={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, ...directionOffset[direction] }}
        transition={{ ...spring.default, delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";

// ============================================
// SCALE IN - Scale with fade
// ============================================
interface ScaleInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children: ReactNode;
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ delay = 0, children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={shouldReduce ? { opacity: 0 } : scaleIn.initial}
        animate={shouldReduce ? { opacity: 1 } : scaleIn.animate}
        exit={shouldReduce ? { opacity: 0 } : scaleIn.exit}
        transition={{ ...spring.default, delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScaleIn.displayName = "ScaleIn";

// ============================================
// STAGGER - Container that staggers children
// ============================================
interface StaggerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  children: ReactNode;
}

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(
  ({ staggerDelay = staggerValues.normal, children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={shouldReduce ? "visible" : "hidden"}
        animate="visible"
        exit="exit"
        variants={staggerContainer(staggerDelay)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Stagger.displayName = "Stagger";

// ============================================
// STAGGER ITEM - Individual item in stagger
// ============================================
interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        variants={shouldReduce ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : staggerItem}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// ============================================
// PAGE WRAPPER - For page transitions
// ============================================
interface PageWrapperProps extends HTMLMotionProps<"main"> {
  children: ReactNode;
}

export const PageWrapper = forwardRef<HTMLElement, PageWrapperProps>(
  ({ children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.main
        ref={ref}
        initial={shouldReduce ? { opacity: 0 } : pageVariants.initial}
        animate={shouldReduce ? { opacity: 1 } : pageVariants.animate}
        exit={shouldReduce ? { opacity: 0 } : pageVariants.exit}
        {...props}
      >
        {children}
      </motion.main>
    );
  }
);
PageWrapper.displayName = "PageWrapper";

// ============================================
// ANIMATED BUTTON - Button with hover/tap
// ============================================
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        whileHover={shouldReduce ? {} : buttonHover}
        whileTap={shouldReduce ? {} : buttonTap}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

// ============================================
// ANIMATED CARD - Card with hover effects
// ============================================
interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  interactive?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, interactive = true, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={shouldReduce || !interactive ? {} : cardHover}
        whileTap={shouldReduce || !interactive ? {} : cardTap}
        transition={spring.default}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// ============================================
// SHIMMER - Loading skeleton shimmer
// ============================================
interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Shimmer({ className, width, height }: ShimmerProps) {
  return (
    <motion.div
      className={className}
      style={{
        width,
        height,
        background: "linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground)/0.1) 50%, hsl(var(--muted)) 100%)",
        backgroundSize: "200% 100%",
        borderRadius: "4px",
      }}
      animate={shimmer.animate}
    />
  );
}

// ============================================
// PULSE DOT - Live indicator
// ============================================
interface PulseDotProps {
  className?: string;
  color?: string;
}

export function PulseDot({ className, color = "var(--live)" }: PulseDotProps) {
  return (
    <motion.span
      className={className}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: color,
      }}
      animate={pulse.animate}
    />
  );
}

// ============================================
// COUNTER - Animated number
// ============================================
interface AnimatedCounterProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedCounter({ value, className, format }: AnimatedCounterProps) {
  const shouldReduce = useReducedMotion();
  
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      {shouldReduce ? (
        format ? format(value) : value
      ) : (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
        >
          {format ? format(value) : value}
        </motion.span>
      )}
    </motion.span>
  );
}

// ============================================
// PRESENCE - AnimatePresence wrapper
// ============================================
interface PresenceProps {
  children: ReactNode;
  mode?: "sync" | "wait" | "popLayout";
}

export function Presence({ children, mode = "wait" }: PresenceProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// ============================================
// HOVER SCALE - Simple hover scale effect
// ============================================
interface HoverScaleProps extends HTMLMotionProps<"div"> {
  scale?: number;
  children: ReactNode;
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ scale = 1.02, children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        whileHover={shouldReduce ? {} : { scale }}
        whileTap={shouldReduce ? {} : { scale: 0.98 }}
        transition={spring.snappy}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
HoverScale.displayName = "HoverScale";

// ============================================
// SLIDE IN - Directional slide
// ============================================
interface SlideInProps extends HTMLMotionProps<"div"> {
  direction: "left" | "right" | "top" | "bottom";
  children: ReactNode;
}

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({ direction, children, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    const offsets = {
      left: { x: "-100%" },
      right: { x: "100%" },
      top: { y: "-100%" },
      bottom: { y: "100%" },
    };

    return (
      <motion.div
        ref={ref}
        initial={shouldReduce ? { opacity: 0 } : { ...offsets[direction], opacity: 0 }}
        animate={shouldReduce ? { opacity: 1 } : { x: 0, y: 0, opacity: 1 }}
        exit={shouldReduce ? { opacity: 0 } : { ...offsets[direction], opacity: 0 }}
        transition={spring.default}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SlideIn.displayName = "SlideIn";

// ============================================
// FLOAT - Subtle floating animation
// ============================================
interface FloatProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  intensity?: number;
}

export const Float = forwardRef<HTMLDivElement, FloatProps>(
  ({ children, intensity = 5, ...props }, ref) => {
    const shouldReduce = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        animate={
          shouldReduce
            ? {}
            : {
                y: [-intensity, intensity, -intensity],
                transition: {
                  duration: 4,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
              }
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Float.displayName = "Float";

// Re-export motion for convenience
export { motion, AnimatePresence, useReducedMotion } from "framer-motion";
