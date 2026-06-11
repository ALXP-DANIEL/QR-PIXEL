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
  PREVIEW_BACKGROUND_PATTERN_LABELS,
  type PreviewBackground,
  type PreviewBackgroundPattern,
  QR_EXPORT_FRAME_LABELS,
  type QrExportFrame,
  type QrFields,
  type QrState,
  type QrType,
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
            <Input
              id="preview-bg-emoji"
              value={background.emoji}
              placeholder="✨"
              className="text-base"
              onChange={(event) =>
                patchBackground({ emoji: event.target.value.slice(0, 8) })
              }
            />
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
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Place a logo at the center of the QR code. Error correction is raised to
        H automatically.
      </p>
      {hasLogo ? (
        <div className="flex h-8 items-center gap-2 border border-input px-2.5 dark:bg-input/30">
          <span className="min-w-0 flex-1 truncate text-xs">
            {logoName ?? "Logo"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Remove logo"
            onClick={onLogoRemove}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadSimpleIcon />
          Upload logo
        </Button>
      )}
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-export-frame">Canvas</Label>
        <Select
          items={QR_EXPORT_FRAME_LABELS}
          value={exportFrame}
          onValueChange={(value) =>
            onPatch({ exportFrame: value as QrExportFrame })
          }
        >
          <SelectTrigger id="qr-export-frame" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(QR_EXPORT_FRAME_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" onClick={onDownloadPng}>
          <DownloadSimpleIcon weight="bold" />
          PNG
        </Button>
        <Button type="button" variant="outline" onClick={onDownloadSvg}>
          <FileSvgIcon />
          SVG
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Button type="button" variant="ghost" onClick={onCopy}>
          <CopySimpleIcon />
          Copy content
        </Button>
      </div>
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
      <div className="flex flex-col gap-2">
        {/* Floating panel */}
        <AnimatePresence
          initial={false}
          mode="wait"
          onExitComplete={() => {
            if (activePanel === null) {
              onActivePanelChange(null);
            }
          }}
        >
          {activePanel && (
            <motion.div
              key={activePanel}
              className="glass-panel overflow-hidden rounded-3xl"
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 420, damping: 36 },
              }}
              exit={{ opacity: 0, y: 6, transition: { duration: 0.14 } }}
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
      </div>
    </motion.div>
  );
}
