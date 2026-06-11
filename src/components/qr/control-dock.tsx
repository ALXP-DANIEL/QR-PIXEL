"use client";

import {
  ArrowCounterClockwiseIcon,
  CopySimpleIcon,
  DownloadSimpleIcon,
  FileSvgIcon,
  type Icon,
  ImageIcon,
  MagicWandIcon,
  PencilSimpleIcon,
  SparkleIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ContentForm } from "@/components/qr/content-form";
import { StyleControls } from "@/components/qr/style-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  BACKGROUND_PATTERN_SIZE_MAX,
  BACKGROUND_PATTERN_SIZE_MIN,
  BACKGROUND_PATTERN_SIZE_STEP,
  FALLBACK_EMOJI,
  PREVIEW_BACKGROUND_PATTERN_LABELS,
  type PreviewBackground,
  type PreviewBackgroundPattern,
  QR_EXPORT_FRAME_LABELS,
  type QrExportFrame,
  type QrFields,
  type QrState,
  type QrType,
  SAFE_BACKGROUND_EMOJIS,
  type ValidationResult,
} from "@/lib/qr";
import { cn } from "@/lib/utils";

export type ActivePanel = "content" | "customize" | "image" | "download" | null;

interface ControlDockProps {
  state: QrState;
  validation: ValidationResult;
  onTypeChange: (type: QrType) => void;
  onFieldChange: <T extends QrType>(
    type: T,
    patch: Partial<QrFields[T]>,
  ) => void;
  onPatch: (patch: Partial<QrState>) => void;
  onLogoSelect: (file: File) => void;
  onLogoRemove: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onCopy: () => void;
  onReset: () => void;
  onRandomize: () => void;
  onActivePanelChange: (panel: ActivePanel) => void;
}

function BackgroundColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex h-8 items-center gap-2 border border-input bg-transparent px-2 dark:bg-input/30">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-4.5 shrink-0 cursor-pointer appearance-none border-none bg-transparent p-0"
        />
        <span className="text-xs text-muted-foreground uppercase">{value}</span>
      </div>
    </div>
  );
}

function normalizeSafeEmoji(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return FALLBACK_EMOJI;
  }

  const exact = SAFE_BACKGROUND_EMOJIS.find((emoji) => emoji === trimmed);
  if (exact) {
    return exact;
  }

  const first = Array.from(trimmed)[0];
  return (
    SAFE_BACKGROUND_EMOJIS.find((emoji) => emoji === first) ?? FALLBACK_EMOJI
  );
}

function BackgroundPanel({
  background,
  onPatch,
}: {
  background: PreviewBackground;
  onPatch: (patch: Partial<QrState>) => void;
}) {
  const patchBackground = (patch: Partial<PreviewBackground>) =>
    onPatch({ previewBackground: { ...background, ...patch } });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <BackgroundColorField
          id="preview-bg-color"
          label="Background"
          value={background.color}
          onChange={(color) => patchBackground({ color })}
        />
        <BackgroundColorField
          id="preview-pattern-color"
          label="Pattern"
          value={background.patternColor}
          onChange={(patternColor) => patchBackground({ patternColor })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_0.7fr]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preview-bg-pattern">Pattern style</Label>
          <Select
            items={PREVIEW_BACKGROUND_PATTERN_LABELS}
            value={background.pattern}
            onValueChange={(value) =>
              patchBackground({
                pattern: value as PreviewBackgroundPattern,
              })
            }
          >
            <SelectTrigger id="preview-bg-pattern" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PREVIEW_BACKGROUND_PATTERN_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {background.pattern === "emoji" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preview-bg-emoji">Emoji</Label>
            <div className="flex gap-2">
              <div className="grid size-10 shrink-0 place-items-center border border-input bg-background text-xl">
                {background.emoji}
              </div>
              <Input
                id="preview-bg-emoji"
                value={background.emoji}
                placeholder={FALLBACK_EMOJI}
                className="text-base"
                onChange={(event) =>
                  patchBackground({
                    emoji: normalizeSafeEmoji(event.target.value),
                  })
                }
              />
            </div>
            <div className="grid max-h-24 grid-cols-7 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-10">
              {SAFE_BACKGROUND_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Use ${emoji} emoji background`}
                  aria-pressed={background.emoji === emoji}
                  onClick={() => patchBackground({ emoji })}
                  className={cn(
                    "grid size-7 place-items-center border border-input bg-transparent text-sm transition-colors hover:bg-muted/60",
                    background.emoji === emoji &&
                      "border-foreground bg-background",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Uses conservative emoji that render on most Android, iOS, and
              desktop devices.
            </p>
          </div>
        )}
      </div>

      {background.pattern !== "solid" && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs leading-none select-none">
              Pattern size
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {background.patternSize}px
            </span>
          </div>
          <Slider
            aria-label="Pattern size"
            min={BACKGROUND_PATTERN_SIZE_MIN}
            max={BACKGROUND_PATTERN_SIZE_MAX}
            step={BACKGROUND_PATTERN_SIZE_STEP}
            value={[background.patternSize]}
            onValueChange={(value) =>
              patchBackground({
                patternSize: Array.isArray(value) ? value[0] : value,
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function CustomizePanel({
  state,
  onPatch,
  onLogoSelect,
  onLogoRemove,
}: {
  state: QrState;
  onPatch: (patch: Partial<QrState>) => void;
  onLogoSelect: (file: File) => void;
  onLogoRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StyleControls
        fgColor={state.fgColor}
        bgColor={state.bgColor}
        cardColor={state.cardColor}
        dotStyle={state.dotStyle}
        cornerSquareStyle={state.cornerSquareStyle}
        cornerDotStyle={state.cornerDotStyle}
        qrPadding={state.qrPadding}
        exportSize={state.exportSize}
        ecLevel={state.ecLevel}
        hasLogo={state.logoDataUrl !== null}
        logoName={state.logoName}
        onPatch={onPatch}
        onLogoSelect={onLogoSelect}
        onLogoRemove={onLogoRemove}
        showLogo={false}
      />
      <div className="h-px bg-border/70" />
      <BackgroundPanel background={state.previewBackground} onPatch={onPatch} />
    </div>
  );
}

function ImagePanel({
  hasLogo,
  logoName,
  onLogoSelect,
  onLogoRemove,
}: {
  hasLogo: boolean;
  logoName: string | null;
  onLogoSelect: (file: File) => void;
  onLogoRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-medium text-foreground">Center logo</h3>
            <p className="text-xs text-muted-foreground">
              Error correction switches to high while a logo is used.
            </p>
          </div>
          {hasLogo && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Remove logo"
              onClick={onLogoRemove}
            >
              <XIcon />
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex min-h-24 w-full items-center gap-3 border border-dashed border-input bg-transparent p-3 text-left transition-colors hover:bg-muted/60",
            hasLogo && "border-solid bg-background/50",
          )}
        >
          <span className="grid size-12 shrink-0 place-items-center border border-input bg-muted/40 text-muted-foreground">
            {hasLogo ? (
              <ImageIcon className="size-5" />
            ) : (
              <UploadSimpleIcon className="size-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-foreground">
              {hasLogo ? (logoName ?? "Logo image") : "Upload image"}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              PNG, JPG, WebP, or SVG up to 2 MB.
            </span>
          </span>
        </button>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onLogoSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function DownloadPanel({
  exportFrame,
  onPatch,
  onDownloadPng,
  onDownloadSvg,
  onCopy,
}: {
  exportFrame: QrExportFrame;
  onPatch: (patch: Partial<QrState>) => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-medium text-foreground">Canvas</h3>
          <p className="text-xs text-muted-foreground">
            Export includes the backdrop, card, padding, and QR styling.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(QR_EXPORT_FRAME_LABELS).map(([value, label]) => {
            const isActive = exportFrame === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onPatch({ exportFrame: value as QrExportFrame })}
                className={cn(
                  "flex h-17 flex-col items-center justify-center gap-1 border border-input bg-transparent px-2 text-xs transition-colors hover:bg-muted/60",
                  isActive &&
                    "border-foreground bg-background text-foreground shadow-sm",
                )}
              >
                <span
                  className={cn(
                    "border border-current opacity-80",
                    value === "portrait" && "h-6 w-4",
                    value === "desktop" && "h-4 w-7",
                    value === "square" && "size-5",
                  )}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-foreground">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownloadPng}
            className="flex min-h-18 items-center gap-3 border border-input bg-primary px-3 text-left text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <span className="grid size-9 shrink-0 place-items-center border border-primary-foreground/25">
              <DownloadSimpleIcon weight="bold" />
            </span>
            <span>
              <span className="block text-sm font-medium">PNG</span>
              <span className="block text-xs opacity-75">Raster image</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onDownloadSvg}
            className="flex min-h-18 items-center gap-3 border border-input bg-transparent px-3 text-left transition-colors hover:bg-muted/60"
          >
            <span className="grid size-9 shrink-0 place-items-center border border-input text-muted-foreground">
              <FileSvgIcon />
            </span>
            <span>
              <span className="block text-sm font-medium">SVG</span>
              <span className="block text-xs text-muted-foreground">
                Vector file
              </span>
            </span>
          </button>
        </div>
        <Button type="button" variant="ghost" onClick={onCopy}>
          <CopySimpleIcon />
          Copy encoded content
        </Button>
      </section>
    </div>
  );
}

const DOCK_ITEMS: {
  id: Exclude<ActivePanel, null>;
  label: string;
  Icon: Icon;
}[] = [
  { id: "content", label: "Content", Icon: PencilSimpleIcon },
  { id: "customize", label: "Customize", Icon: MagicWandIcon },
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "download", label: "Download", Icon: DownloadSimpleIcon },
];

export function ControlDock({
  state,
  validation,
  onTypeChange,
  onFieldChange,
  onPatch,
  onLogoSelect,
  onLogoRemove,
  onDownloadPng,
  onDownloadSvg,
  onCopy,
  onReset,
  onRandomize,
  onActivePanelChange,
}: ControlDockProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const toggle = (id: Exclude<ActivePanel, null>) =>
    setActivePanel((prev) => (prev === id ? null : id));

  const handleReset = () => {
    setActivePanel("content");
    onReset();
  };

  useEffect(() => {
    if (activePanel !== null) {
      onActivePanelChange(activePanel);
    }
  }, [activePanel, onActivePanelChange]);

  useEffect(() => {
    if (!activePanel) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-slot='select-content']")) {
        return;
      }
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activePanel]);

  return (
    <motion.div
      ref={dockRef}
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl sm:inset-x-6 sm:bottom-6"
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        delay: 0.12,
      }}
    >
      <motion.div
        layout
        className="flex flex-col gap-2"
        transition={{ duration: 0.24, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {/* Floating panel */}
        <AnimatePresence
          initial={false}
          mode="popLayout"
          onExitComplete={() => {
            if (activePanel === null) {
              onActivePanelChange(null);
            }
          }}
        >
          {activePanel && (
            <motion.div
              layout
              key={activePanel}
              className="glass-panel overflow-hidden rounded-3xl"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 520,
                  damping: 27,
                  mass: 0.8,
                },
              }}
              exit={{
                opacity: 0,
                y: 8,
                scale: 0.985,
                transition: { duration: 0.12 },
              }}
            >
              <div className="max-h-[min(45dvh,340px)] overflow-y-auto p-4">
                {activePanel === "content" && (
                  <ContentForm
                    type={state.type}
                    fields={state.fields}
                    validation={validation}
                    onTypeChange={onTypeChange}
                    onFieldChange={onFieldChange}
                  />
                )}
                {activePanel === "customize" && (
                  <CustomizePanel
                    state={state}
                    onPatch={onPatch}
                    onLogoSelect={onLogoSelect}
                    onLogoRemove={onLogoRemove}
                  />
                )}
                {activePanel === "image" && (
                  <ImagePanel
                    hasLogo={state.logoDataUrl !== null}
                    logoName={state.logoName}
                    onLogoSelect={onLogoSelect}
                    onLogoRemove={onLogoRemove}
                  />
                )}
                {activePanel === "download" && (
                  <DownloadPanel
                    exportFrame={state.exportFrame}
                    onPatch={onPatch}
                    onDownloadPng={onDownloadPng}
                    onDownloadSvg={onDownloadSvg}
                    onCopy={onCopy}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact button bar */}
        <div className="flex gap-2 pb-[env(safe-area-inset-bottom)]">
          <div className="glass-panel flex min-w-0 flex-1 rounded-3xl">
            {DOCK_ITEMS.map(({ id, label, Icon }) => {
              const isActive = activePanel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[9px] leading-none transition-colors duration-150 sm:py-3 sm:text-[11px]",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    weight={isActive ? "fill" : "regular"}
                    className="size-4 sm:size-5"
                  />
                  <span className="max-w-full truncate">{label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Randomize QR theme and background"
            onClick={onRandomize}
            className="glass-panel flex w-13 shrink-0 flex-col items-center justify-center gap-1 rounded-3xl py-2.5 text-[9px] leading-none text-muted-foreground transition-colors duration-150 hover:text-foreground sm:w-18 sm:py-3 sm:text-[11px]"
          >
            <SparkleIcon className="size-4 sm:size-5" />
            <span>Random</span>
          </button>
          <button
            type="button"
            aria-label="Reset all settings"
            onClick={handleReset}
            className="glass-panel flex w-13 shrink-0 flex-col items-center justify-center gap-1 rounded-3xl py-2.5 text-[9px] leading-none text-muted-foreground transition-colors duration-150 hover:text-foreground sm:w-18 sm:py-3 sm:text-[11px]"
          >
            <ArrowCounterClockwiseIcon className="size-4 sm:size-5" />
            <span>Reset</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
