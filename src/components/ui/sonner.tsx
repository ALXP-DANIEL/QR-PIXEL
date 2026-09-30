"use client";

import {
  CheckCircleIcon,
  InfoIcon,
  SpinnerIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <WarningIcon className="size-4" />,
        error: <XCircleIcon className="size-4" />,
        loading: <SpinnerIcon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Match the glass header and dock panels.
          "--normal-bg":
            "color-mix(in oklab, var(--background) 65%, transparent)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-3xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast glass-panel font-mono backdrop-blur-2xl shadow-[inset_0_1px_0_0_oklch(1_0_0/0.15),0_25px_50px_-12px_oklch(0_0_0/0.25)]!",
          title: "text-xs font-semibold",
          description: "text-xs text-muted-foreground!",
          actionButton:
            "rounded-2xl! bg-foreground! px-3! text-background! font-mono transition-opacity hover:opacity-80",
          cancelButton: "rounded-2xl! font-mono",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
