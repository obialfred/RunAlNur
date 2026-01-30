"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 0.6,
  className,
  format,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (shouldReduce) {
      setDisplay(value);
      return;
    }

    const controls = animate(display, value, {
      duration,
      onUpdate(latest) {
        setDisplay(Math.round(latest));
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, shouldReduce]);

  const formatted = format ? format(display) : display.toString();

  return <span className={className}>{formatted}</span>;
}
