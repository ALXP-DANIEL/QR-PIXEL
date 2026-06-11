"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Loader } from "@/components/layouts/wrapper/loader";

const SPLASH_STORAGE_KEY = "firstload";
const SPLASH_DURATION_MS = 2000;

export function WrapperLoader({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const status = sessionStorage.getItem(SPLASH_STORAGE_KEY);
    if (status === "true") {
      setLoaded(true);
      return;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_STORAGE_KEY, "true");
      setLoaded(true);
    }, SPLASH_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [mounted]);

  return (
    <AnimatePresence mode="wait">
      {!mounted || !loaded ? (
        <Loader key="loader" />
      ) : (
        <motion.div
          key="page"
          className="flex min-h-dvh flex-1 flex-col"
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
