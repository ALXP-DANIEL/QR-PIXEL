"use client";

import { motion } from "motion/react";
import type * as React from "react";

export function FadeIn({
  children,
  delay = 0,
  className,
  x = 0,
  y = 12,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  x?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
