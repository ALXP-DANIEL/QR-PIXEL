"use client";

import { motion } from "motion/react";

import { PixelMark } from "@/components/qr/pixel-mark";

export function Loader() {
  return (
    <motion.output
      aria-label="QR Pixel is loading"
      className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-background font-sans"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.5, ease: "easeInOut" },
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0.5, ease: "easeInOut" },
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-pixel-grid opacity-40 mask-[radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]"
      />
      <span className="z-[1] animate-pulse text-8xl sm:text-[30vh]">
        <PixelMark className="size-28 sm:size-40" />
      </span>
      <span className="z-[1] mt-6 font-mono text-sm uppercase tracking-normal text-muted-foreground">
        [Preparing your QR studio]
      </span>
    </motion.output>
  );
}
