"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

// next-themes injects an inline script to apply the theme before first paint.
// It only needs to run from the server HTML; on the client React warns about
// rendering <script> tags, so mark it inert there. The script element already
// sets suppressHydrationWarning, so the differing `type` is safe.
const clientScriptProps =
  typeof window === "undefined" ? undefined : { type: "application/json" };

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider scriptProps={clientScriptProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}
