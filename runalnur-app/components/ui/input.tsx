"use client";

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { spring } from "@/lib/motion/tokens"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    const shouldReduce = useReducedMotion();
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="relative">
        {label && (
          <motion.label
            className="block text-xs text-muted-foreground mb-1.5"
            initial={shouldReduce ? {} : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.default}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          <input
            type={type}
            ref={ref}
            data-slot="input"
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {/* Animated focus underline */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full origin-center"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused && !shouldReduce ? 1 : 0 }}
            transition={spring.snappy}
          />
        </div>
      </div>
    );
  }
);
Input.displayName = "Input"

export { Input }
