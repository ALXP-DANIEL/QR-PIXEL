"use client";

import { QrCodeIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  EcLevel,
  PreviewBackground,
  QrCaption,
  QrCornerDotStyle,
  QrCornerSquareStyle,
  QrDotStyle,
} from "@/lib/qr";
import { FALLBACK_EMOJI } from "@/lib/qr";
import { renderQrCanvas } from "@/lib/qr-render";
import { cn } from "@/lib/utils";

const PREVIEW_SIZE = 1024;

export type PreviewStatus = "empty" | "invalid" | "ready";

const CAPTION_FONT_WEIGHT_CSS: Record<QrCaption["fontWeight"], number> = {
  normal: 400,
  medium: 500,
  bold: 700,
};

const CAPTION_FONT_CSS: Record<QrCaption["fontFamily"], string> = {
  sans: "system-ui, -apple-system, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
};

interface QrPreviewProps {
  status: PreviewStatus;
  invalidMessage: string | null;
  payload: string | null;
  fgColor: string;
  bgColor: string;
  cardColor: string;
  dotStyle: QrDotStyle;
  cornerSquareStyle: QrCornerSquareStyle;
  cornerDotStyle: QrCornerDotStyle;
  qrPadding: number;
  ecLevel: EcLevel;
  logoDataUrl: string | null;
  previewBackground: PreviewBackground;
  caption: QrCaption;
  dockExpanded: boolean;
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function emojiPatternDataUrl(emoji: string, size: number): string {
  const glyph = emoji.trim() || FALLBACK_EMOJI;
  const fontSize = Math.round(size * 0.4);
  const center = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}">${escapeSvgText(glyph)}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function getPreviewBackgroundStyle(
  background: PreviewBackground,
): CSSProperties {
  const patternColor = background.patternColor;
  const patternSize = background.patternSize;

  switch (background.pattern) {
    case "dots":
      return {
        backgroundColor: background.color,
        backgroundImage: `radial-gradient(circle at ${patternSize / 2}px ${patternSize / 2}px, ${patternColor} ${Math.max(1.5, patternSize * 0.07)}px, transparent 0)`,
        backgroundSize: `${patternSize}px ${patternSize}px`,
      };
    case "grid":
      return {
        backgroundColor: background.color,
        backgroundImage: `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`,
        backgroundSize: `${patternSize}px ${patternSize}px`,
      };
    case "diagonal":
      return {
        backgroundColor: background.color,
        backgroundImage: `repeating-linear-gradient(135deg, ${patternColor} 0 1px, transparent 1px ${patternSize}px)`,
      };
    case "emoji":
      return {
        backgroundColor: background.color,
        backgroundImage: emojiPatternDataUrl(background.emoji, patternSize),
        backgroundSize: `${patternSize}px ${patternSize}px`,
      };
    case "solid":
      return {
        backgroundColor: background.color,
      };
  }
}

export function QrPreview({
  status,
  invalidMessage,
  payload,
  fgColor,
  bgColor,
  cardColor,
  dotStyle,
  cornerSquareStyle,
  cornerDotStyle,
  qrPadding,
  ecLevel,
  logoDataUrl,
  previewBackground,
  caption,
  dockExpanded,
}: QrPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const epochRef = useRef(0);
  const themeRef = useRef({ fgColor, bgColor });
  const qrCardControls = useAnimationControls();
  const [renderError, setRenderError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dockShift, setDockShift] = useState(112);

  useEffect(() => {
    const update = () => {
      // Scale shift with viewport height: ~20dvh, clamped so it never clips behind the header or overshoots on large screens
      setDockShift(
        Math.min(Math.max(Math.round(window.innerHeight * 0.2), 100), 160),
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status !== "ready" || payload === null) {
      return;
    }
    const epoch = ++epochRef.current;
    renderQrCanvas({
      payload,
      size: PREVIEW_SIZE,
      fgColor,
      bgColor,
      dotStyle,
      cornerSquareStyle,
      cornerDotStyle,
      ecLevel,
      logoDataUrl,
    })
      .then((rendered) => {
        if (epoch !== epochRef.current) {
          return;
        }
        const context = canvasRef.current?.getContext("2d");
        if (context) {
          context.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
          context.drawImage(rendered, 0, 0);
        }
        setRenderError(null);
      })
      .catch(() => {
        if (epoch === epochRef.current) {
          setRenderError("Content is too long for a QR code");
        }
      });
  }, [
    status,
    payload,
    fgColor,
    bgColor,
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
    ecLevel,
    logoDataUrl,
  ]);

  useEffect(() => {
    const previous = themeRef.current;
    themeRef.current = { fgColor, bgColor };
    if (previous.fgColor === fgColor && previous.bgColor === bgColor) {
      return;
    }
    qrCardControls.start({
      x: [0, -9, 8, -5, 3, 0],
      scale: [1, 0.985, 1.015, 1],
      filter: ["blur(0px)", "blur(2.5px)", "blur(1px)", "blur(0px)"],
      transition: { duration: 0.42, ease: "easeOut" },
    });
  }, [fgColor, bgColor, qrCardControls]);

  // Close on Escape
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  // Copy the already-drawn preview canvas into the fullscreen canvas on mount
  const fullscreenCanvasCallback = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const src = canvasRef.current;
      if (!src) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      ctx.drawImage(src, 0, 0);
    },
    [],
  );

  const showCanvas = status === "ready" && renderError === null;
  const errorMessage = status === "invalid" ? invalidMessage : renderError;
  const canExpand = showCanvas;

  return (
    <>
      <motion.div
        className="fixed inset-0 overflow-hidden"
        style={getPreviewBackgroundStyle(previewBackground)}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.05,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
      >
        <div className="absolute inset-0 bg-background/10" />
        <div className="relative flex h-full items-center justify-center px-4 pt-24 pb-24">
          <motion.div
            animate={{ y: dockExpanded ? -dockShift : 0 }}
            transition={{ duration: 0.26, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div
                className="flex flex-col items-center"
                style={{ gap: Math.round(caption.fontSize * 0.33) }}
              >
              {caption.enabled && caption.text.trim() && caption.position === "top" && (
                <div
                  style={{
                    fontFamily: CAPTION_FONT_CSS[caption.fontFamily],
                    fontWeight: CAPTION_FONT_WEIGHT_CSS[caption.fontWeight],
                    fontSize: caption.fontSize,
                    color: caption.color,
                    textAlign: caption.align,
                  }}
                  className="w-[min(60vmin,400px)] leading-none"
                >
                  {caption.text}
                </div>
              )}
              <motion.div
                className={cn(
                  "glass-panel relative w-[min(60vmin,400px)] rounded-3xl",
                  canExpand && "cursor-zoom-in",
                )}
                style={{
                  padding: qrPadding,
                  backgroundColor: showCanvas ? cardColor : undefined,
                }}
                animate={qrCardControls}
                whileHover={canExpand ? { scale: 1.04 } : undefined}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={() => canExpand && setExpanded(true)}
              >
                <canvas
                  ref={canvasRef}
                  width={PREVIEW_SIZE}
                  height={PREVIEW_SIZE}
                  role="img"
                  aria-label="QR code preview"
                  className={cn(
                    "aspect-square h-auto w-full rounded-[1.25rem]",
                    !showCanvas && "invisible",
                  )}
                />
                <AnimatePresence>
                  {!showCanvas && (
                    <motion.div
                      key={status === "empty" ? "empty" : "error"}
                      className="absolute inset-3 flex flex-col items-center justify-center gap-3 p-6 text-center sm:inset-4"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                    >
                      {status === "empty" ? (
                        <>
                          <QrCodeIcon
                            weight="duotone"
                            className="size-12 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <p className="text-sm font-medium">
                            Nothing to encode yet
                          </p>
                          <p className="text-xs/relaxed text-muted-foreground">
                            Add content in the dock below — your QR code appears
                            here live.
                          </p>
                        </>
                      ) : (
                        <>
                          <WarningCircleIcon
                            weight="duotone"
                            className="size-12 text-destructive"
                            aria-hidden="true"
                          />
                          <p className="text-sm font-medium">
                            Can't generate QR code
                          </p>
                          <p className="text-xs/relaxed text-muted-foreground">
                            {errorMessage}
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {caption.enabled && caption.text.trim() && caption.position === "bottom" && (
                <div
                  style={{
                    fontFamily: CAPTION_FONT_CSS[caption.fontFamily],
                    fontWeight: CAPTION_FONT_WEIGHT_CSS[caption.fontWeight],
                    fontSize: caption.fontSize,
                    color: caption.color,
                    textAlign: caption.align,
                  }}
                  className="w-[min(60vmin,400px)] leading-none"
                >
                  {caption.text}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setExpanded(false)}
              >
                {/* Blurred backdrop */}
                <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />

                {/* QR card */}
                <motion.div
                  className="relative z-10 w-[min(80vmin,600px)] p-4 sm:p-6 rounded-3xl bg-popover shadow-2xl cursor-zoom-out"
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.88, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <canvas
                    ref={fullscreenCanvasCallback}
                    width={PREVIEW_SIZE}
                    height={PREVIEW_SIZE}
                    role="img"
                    aria-label="QR code fullscreen preview"
                    className="aspect-square h-auto w-full rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="absolute top-3 right-3 flex items-center justify-center size-8 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <XIcon weight="bold" className="size-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
