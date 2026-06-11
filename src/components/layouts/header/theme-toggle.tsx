"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      className="rounded-2xl border-transparent bg-transparent hover:bg-background/50"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon weight="bold" className="dark:hidden" />
      <MoonIcon weight="bold" className="hidden dark:block" />
    </Button>
  );
}
