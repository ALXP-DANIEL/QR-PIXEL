import {
  GithubLogoIcon,
  LinkedinLogoIcon,
} from "@phosphor-icons/react/dist/ssr";

import { FadeIn } from "@/components/animation/fade-in";
import { ThemeToggle } from "@/components/layouts/header/theme-toggle";
import { PixelMark } from "@/components/qr/pixel-mark";
import { QrApp } from "@/components/qr/qr-app";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
          <FadeIn x={-44} y={-10}>
            <div className="glass-panel pointer-events-auto flex min-w-0 items-center gap-1.5 rounded-3xl p-1 sm:gap-3 sm:px-4 sm:py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/45 backdrop-blur-xl sm:size-9">
                <PixelMark className="size-4 sm:size-4.5" />
              </div>
              <div className="flex min-w-0 flex-col gap-1 pr-2 sm:pr-0">
                <h1 className="text-xs leading-none font-semibold tracking-tight sm:text-sm">
                  QR Pixel
                </h1>
                <p className="hidden text-xs leading-none text-muted-foreground sm:block">
                  Beautiful pixel-perfect QR codes in seconds
                </p>
              </div>
            </div>
          </FadeIn>
          <FadeIn x={14} y={-10}>
            <div className="glass-panel pointer-events-auto flex shrink-0 items-center gap-1 rounded-3xl p-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="View on LinkedIn"
                className="rounded-2xl border-transparent bg-transparent hover:bg-background/50"
                nativeButton={false}
                render={
                  <a
                    href={siteConfig.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on LinkedIn"
                  >
                    <span className="sr-only">View on LinkedIn</span>
                  </a>
                }
              >
                <LinkedinLogoIcon weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="View on GitHub"
                className="rounded-2xl border-transparent bg-transparent hover:bg-background/50"
                nativeButton={false}
                render={
                  <a
                    href={siteConfig.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on GitHub"
                  >
                    <span className="sr-only">View on GitHub</span>
                  </a>
                }
              >
                <GithubLogoIcon weight="bold" />
              </Button>
              <ThemeToggle />
            </div>
          </FadeIn>
        </div>
      </header>
      <QrApp />
    </div>
  );
}
