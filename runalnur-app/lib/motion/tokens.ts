// Motion Design Tokens - Empire OS
// Consistent, fluid animations throughout the system

// Durations (in seconds)
export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6,
  page: 0.5,
} as const;

// Easing curves (cubic-bezier)
export const easing = {
  // Standard Material-style curves
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1], // entering
  accelerate: [0.4, 0, 1, 1], // exiting
  // Smooth curves
  smooth: [0.25, 0.1, 0.25, 1],
  smoothOut: [0, 0.55, 0.45, 1],
  // Snappy
  snappy: [0.2, 0, 0, 1],
  bounce: [0.34, 1.56, 0.64, 1],
} as const;

// Spring configurations
export const spring = {
  // Soft, gentle movements
  soft: { type: "spring" as const, stiffness: 100, damping: 15, mass: 0.5 },
  // Default, balanced
  default: { type: "spring" as const, stiffness: 200, damping: 20, mass: 0.8 },
  // Snappy, responsive
  snappy: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.5 },
  // Bouncy
  bouncy: { type: "spring" as const, stiffness: 300, damping: 10, mass: 0.8 },
  // Stiff, quick
  stiff: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 },
  // Very gentle for large movements
  gentle: { type: "spring" as const, stiffness: 80, damping: 20, mass: 1 },
} as const;

// Stagger delays for lists
export const stagger = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
} as const;

// Common animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleInBounce = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Stagger container variants
export const staggerContainer = (staggerAmount: number = stagger.normal) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerAmount,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerAmount / 2,
      staggerDirection: -1,
    },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: spring.default,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: duration.fast },
  },
};

// Hover/tap states for interactive elements
export const buttonTap = {
  scale: 0.97,
  transition: spring.snappy,
};

export const buttonHover = {
  scale: 1.02,
  transition: spring.snappy,
};

export const cardHover = {
  y: -4,
  transition: spring.default,
};

export const cardTap = {
  scale: 0.98,
  transition: spring.snappy,
};

// Slide variants for panels/sidebars
export const slideFromLeft = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

export const slideFromRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

export const slideFromTop = {
  initial: { y: "-100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "-100%", opacity: 0 },
};

export const slideFromBottom = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

// Modal backdrop
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

// Modal content
export const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: spring.default,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: duration.fast },
  },
};

// Tooltip
export const tooltipVariants = {
  initial: { opacity: 0, scale: 0.9, y: 5 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: duration.fast, ease: easing.smooth },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: duration.instant },
  },
};

// Page transition
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
      staggerChildren: stagger.fast,
    },
  },
  exit: { 
    opacity: 0, 
    y: -4,
    transition: { duration: duration.fast },
  },
};

// Shimmer for loading skeletons
export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      ease: "linear" as const,
      repeat: Infinity,
    },
  },
};

// Pulse for live indicators
export const pulse = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      ease: "easeInOut" as const,
      repeat: Infinity,
    },
  },
};

// Number counter animation helper
export const counterTransition = {
  duration: duration.slow,
  ease: easing.smooth,
};

// Export all for convenience
export const motionTokens = {
  duration,
  easing,
  spring,
  stagger,
  variants: {
    fadeIn,
    fadeInUp,
    fadeInDown,
    fadeInLeft,
    fadeInRight,
    scaleIn,
    scaleInBounce,
    staggerContainer,
    staggerItem,
    slideFromLeft,
    slideFromRight,
    slideFromTop,
    slideFromBottom,
    backdrop: backdropVariants,
    modal: modalVariants,
    tooltip: tooltipVariants,
    page: pageVariants,
  },
  interactions: {
    buttonTap,
    buttonHover,
    cardHover,
    cardTap,
  },
  effects: {
    shimmer,
    pulse,
  },
};

export default motionTokens;
