"use client";

import {
  ArrowCounterClockwiseIcon,
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CirclesThreeIcon,
  ClipboardIcon,
  ConfettiIcon,
  CopySimpleIcon,
  DiceFiveIcon,
  DnaIcon,
  DotsNineIcon,
  DownloadSimpleIcon,
  FileSvgIcon,
  GridFourIcon,
  type Icon,
  ImageIcon,
  LineSegmentsIcon,
  LockIcon,
  LockOpenIcon,
  MagicWandIcon,
  PencilSimpleIcon,
  RainbowIcon,
  ShuffleIcon,
  SmileyIcon,
  SparkleIcon,
  SpiralIcon,
  SquareIcon,
  SquaresFourIcon,
  SunIcon,
  UploadSimpleIcon,
  WavesIcon,
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
import { randomSeed } from "@/lib/background-scene";
import {
  BACKGROUND_PATTERN_SIZE_MAX,
  BACKGROUND_PATTERN_SIZE_MIN,
  BACKGROUND_PATTERN_SIZE_STEP,
  CAPTION_ALIGN_LABELS,
  CAPTION_FONT_FAMILY_LABELS,
  CAPTION_FONT_SIZE_MAX,
  CAPTION_FONT_SIZE_MIN,
  CAPTION_FONT_SIZE_STEP,
  CAPTION_FONT_WEIGHT_LABELS,
  CAPTION_POSITION_LABELS,
  type CaptionAlign,
  type CaptionFontFamily,
  type CaptionFontWeight,
  type CaptionPosition,
  EMOJI_LAYOUT_LABELS,
  EMOJI_THEMES,
  type EmojiLayout,
  MAX_BACKGROUND_EMOJIS,
  PREVIEW_BACKGROUND_PATTERN_LABELS,
  type PreviewBackground,
  type PreviewBackgroundPattern,
  QR_EXPORT_FRAME_LABELS,
  type QrCaption,
  type QrExportFrame,
  type QrFields,
  type QrState,
  type QrType,
  SAFE_BACKGROUND_EMOJIS,
  type ValidationResult,
} from "@/lib/qr";
import type { RandomLocks } from "@/lib/theme-random";
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
  onCopyImage: () => void;
  onCopy: () => void;
  onReset: () => void;
  onRandomize: () => void;
  onEvolve: () => void;
  wildness: number;
  onWildnessChange: (value: number) => void;
  rollCount: number;
  locks: RandomLocks;
  onLocksChange: (locks: RandomLocks) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
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

const PATTERN_ICONS: Record<PreviewBackgroundPattern, Icon> = {
  solid: SquareIcon,
  dots: DotsNineIcon,
  grid: GridFourIcon,
  diagonal: LineSegmentsIcon,
  emoji: SmileyIcon,
  confetti: ConfettiIcon,
  aurora: RainbowIcon,
};

const EMOJI_LAYOUT_ICONS: Record<EmojiLayout, Icon> = {
  sprinkle: SparkleIcon,
  burst: SunIcon,
  spiral: SpiralIcon,
  wave: WavesIcon,
  mosaic: CirclesThreeIcon,
  grid: SquaresFourIcon,
};

const PROCEDURAL_PATTERNS: PreviewBackgroundPattern[] = [
  "emoji",
  "confetti",
  "aurora",
];

function toggleEmoji(current: readonly string[], emoji: string): string[] {
  if (current.includes(emoji)) {
    return current.length > 1
      ? current.filter((item) => item !== emoji)
      : [...current];
  }
  const next = [...current, emoji];
  return next.slice(-MAX_BACKGROUND_EMOJIS);
}

function OptionTile({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: Icon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-1 border border-input bg-transparent px-1 text-[11px] transition-colors hover:bg-muted/60",
        active && "border-foreground bg-background text-foreground shadow-sm",
      )}
    >
      <Icon weight={active ? "fill" : "regular"} className="size-4" />
      <span className="max-w-full truncate">{label}</span>
    </button>
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
  const isProcedural = PROCEDURAL_PATTERNS.includes(background.pattern);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-medium text-foreground">Backdrop</h3>
          <p className="text-xs text-muted-foreground">
            Procedural wallpaper behind the card. Exports match the preview.
          </p>
        </div>
        {isProcedural && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => patchBackground({ seed: randomSeed() })}
          >
            <ShuffleIcon />
            Shuffle
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {(
          Object.entries(PREVIEW_BACKGROUND_PATTERN_LABELS) as [
            PreviewBackgroundPattern,
            string,
          ][]
        ).map(([value, label]) => (
          <OptionTile
            key={value}
            active={background.pattern === value}
            label={label}
            Icon={PATTERN_ICONS[value]}
            onClick={() => patchBackground({ pattern: value })}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BackgroundColorField
          id="preview-bg-color"
          label="Background"
          value={background.color}
          onChange={(color) => patchBackground({ color })}
        />
        {background.pattern !== "solid" && background.pattern !== "emoji" && (
          <BackgroundColorField
            id="preview-pattern-color"
            label={
              background.pattern === "dots" ||
              background.pattern === "grid" ||
              background.pattern === "diagonal"
                ? "Pattern"
                : "Palette seed"
            }
            value={background.patternColor}
            onChange={(patternColor) => patchBackground({ patternColor })}
          />
        )}
      </div>

      {background.pattern === "emoji" && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium leading-none">Layout</span>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {(
                Object.entries(EMOJI_LAYOUT_LABELS) as [EmojiLayout, string][]
              ).map(([value, label]) => (
                <OptionTile
                  key={value}
                  active={background.emojiLayout === value}
                  label={label}
                  Icon={EMOJI_LAYOUT_ICONS[value]}
                  onClick={() => patchBackground({ emojiLayout: value })}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium leading-none">Emoji</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {background.emojis.length}/{MAX_BACKGROUND_EMOJIS}
              </span>
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {EMOJI_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() =>
                    patchBackground({
                      emojis: theme.emojis.slice(0, 4),
                      seed: randomSeed(),
                    })
                  }
                  className="flex shrink-0 items-center gap-1 rounded-full border border-input px-2.5 py-1 text-[11px] transition-colors hover:bg-muted/60"
                >
                  <span aria-hidden="true">{theme.emojis[0]}</span>
                  {theme.name}
                </button>
              ))}
            </div>
            <div className="grid max-h-28 grid-cols-8 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-12">
              {SAFE_BACKGROUND_EMOJIS.map((emoji) => {
                const selected = background.emojis.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`${selected ? "Remove" : "Add"} ${emoji}`}
                    aria-pressed={selected}
                    onClick={() =>
                      patchBackground({
                        emojis: toggleEmoji(background.emojis, emoji),
                      })
                    }
                    className={cn(
                      "grid aspect-square place-items-center border border-input bg-transparent text-sm transition-[background-color,transform] hover:bg-muted/60 active:scale-90",
                      selected && "border-foreground bg-background",
                    )}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {background.pattern !== "solid" && background.pattern !== "aurora" && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs leading-none select-none">Spacing</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {background.patternSize}px
            </span>
          </div>
          <Slider
            aria-label="Pattern spacing"
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

function CaptionPanel({
  caption,
  onPatch,
}: {
  caption: QrCaption;
  onPatch: (patch: Partial<QrState>) => void;
}) {
  const patchCaption = (patch: Partial<QrCaption>) =>
    onPatch({ caption: { ...caption, ...patch } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-foreground">Caption</h3>
          <p className="text-xs text-muted-foreground">
            Text shown above or below the QR card.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={caption.enabled}
          onClick={() => patchCaption({ enabled: !caption.enabled })}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
            caption.enabled ? "bg-foreground" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block size-3.5 rounded-full bg-background shadow transition-transform",
              caption.enabled ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </div>

      {caption.enabled && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="caption-text">Caption text</Label>
            <Input
              id="caption-text"
              value={caption.text}
              placeholder="Scan me!"
              onChange={(e) => patchCaption({ text: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caption-font">Font</Label>
              <Select
                items={CAPTION_FONT_FAMILY_LABELS}
                value={caption.fontFamily}
                onValueChange={(v) =>
                  patchCaption({ fontFamily: v as CaptionFontFamily })
                }
              >
                <SelectTrigger id="caption-font" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAPTION_FONT_FAMILY_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <BackgroundColorField
              id="caption-color"
              label="Color"
              value={caption.color}
              onChange={(color) => patchCaption({ color })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium leading-none">Weight</span>
            <div className="flex gap-1">
              {(
                Object.entries(CAPTION_FONT_WEIGHT_LABELS) as [
                  CaptionFontWeight,
                  string,
                ][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={caption.fontWeight === value}
                  onClick={() => patchCaption({ fontWeight: value })}
                  className={cn(
                    "flex-1 border border-input bg-transparent py-1.5 text-xs transition-colors hover:bg-muted/60",
                    caption.fontWeight === value &&
                      "border-foreground bg-background text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs leading-none select-none">
                Font size
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {caption.fontSize}px
              </span>
            </div>
            <Slider
              aria-label="Caption font size"
              min={CAPTION_FONT_SIZE_MIN}
              max={CAPTION_FONT_SIZE_MAX}
              step={CAPTION_FONT_SIZE_STEP}
              value={[caption.fontSize]}
              onValueChange={(v) =>
                patchCaption({ fontSize: Array.isArray(v) ? v[0] : v })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium leading-none">Align</span>
              <div className="flex gap-1">
                {(
                  Object.entries(CAPTION_ALIGN_LABELS) as [
                    CaptionAlign,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={caption.align === value}
                    onClick={() => patchCaption({ align: value })}
                    className={cn(
                      "flex-1 border border-input bg-transparent py-1.5 text-xs transition-colors hover:bg-muted/60",
                      caption.align === value &&
                        "border-foreground bg-background text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium leading-none">Position</span>
              <div className="flex gap-1">
                {(
                  Object.entries(CAPTION_POSITION_LABELS) as [
                    CaptionPosition,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={caption.position === value}
                    onClick={() => patchCaption({ position: value })}
                    className={cn(
                      "flex-1 border border-input bg-transparent py-1.5 text-xs transition-colors hover:bg-muted/60",
                      caption.position === value &&
                        "border-foreground bg-background text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type CustomizeTab = "qr" | "backdrop" | "caption";

const CUSTOMIZE_TABS: { id: CustomizeTab; label: string }[] = [
  { id: "qr", label: "QR code" },
  { id: "backdrop", label: "Backdrop" },
  { id: "caption", label: "Caption" },
];

const LOCK_OPTIONS: { key: keyof RandomLocks; label: string }[] = [
  { key: "colors", label: "Colors" },
  { key: "backdrop", label: "Backdrop" },
  { key: "shapes", label: "Shapes" },
];

function SegmentedTabs<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Customize sections"
      className="relative grid grid-flow-col auto-cols-fr rounded-2xl bg-muted/60 p-1"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 rounded-xl py-1.5 text-xs transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 -z-10 rounded-xl bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LockChips({
  locks,
  onChange,
}: {
  locks: RandomLocks;
  onChange: (locks: RandomLocks) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] text-muted-foreground">
        Surprise keeps
      </span>
      {LOCK_OPTIONS.map(({ key, label }) => {
        const locked = locks[key];
        const LockGlyph = locked ? LockIcon : LockOpenIcon;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={locked}
            onClick={() => onChange({ ...locks, [key]: !locked })}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              locked
                ? "border-foreground bg-foreground text-background"
                : "border-input text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <LockGlyph
              weight={locked ? "fill" : "regular"}
              className="size-3"
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function wildnessLabel(value: number): string {
  if (value < 0.2) return "Tame";
  if (value < 0.5) return "Balanced";
  if (value < 0.8) return "Wild";
  return "Chaos";
}

function EnginePanel({
  wildness,
  onWildnessChange,
  onRandomize,
  onEvolve,
  locks,
  onLocksChange,
}: {
  wildness: number;
  onWildnessChange: (value: number) => void;
  onRandomize: () => void;
  onEvolve: () => void;
  locks: RandomLocks;
  onLocksChange: (locks: RandomLocks) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-medium text-foreground">Theme engine</h3>
          <p className="text-[11px] text-muted-foreground">
            Roll a new genome or evolve the current one.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEvolve}
            aria-keyshortcuts="E"
            title="Evolve (E)"
          >
            <DnaIcon />
            Evolve
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onRandomize}
            aria-keyshortcuts="R"
            title="New roll (R)"
          >
            <DiceFiveIcon />
            Roll
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs leading-none select-none">Wildness</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {wildnessLabel(wildness)} · {Math.round(wildness * 100)}
          </span>
        </div>
        <Slider
          aria-label="Wildness"
          min={0}
          max={100}
          step={1}
          value={[Math.round(wildness * 100)]}
          onValueChange={(value) =>
            onWildnessChange((Array.isArray(value) ? value[0] : value) / 100)
          }
        />
      </div>
      <LockChips locks={locks} onChange={onLocksChange} />
    </section>
  );
}

function CustomizePanel({
  state,
  locks,
  onLocksChange,
  wildness,
  onWildnessChange,
  onRandomize,
  onEvolve,
  onPatch,
  onReset,
  onLogoSelect,
  onLogoRemove,
}: {
  state: QrState;
  locks: RandomLocks;
  onLocksChange: (locks: RandomLocks) => void;
  wildness: number;
  onWildnessChange: (value: number) => void;
  onRandomize: () => void;
  onEvolve: () => void;
  onPatch: (patch: Partial<QrState>) => void;
  onReset: () => void;
  onLogoSelect: (file: File) => void;
  onLogoRemove: () => void;
}) {
  const [tab, setTab] = useState<CustomizeTab>("qr");

  return (
    <div className="flex flex-col gap-4">
      <SegmentedTabs
        id="customize"
        value={tab}
        options={CUSTOMIZE_TABS}
        onChange={setTab}
      />
      <EnginePanel
        wildness={wildness}
        onWildnessChange={onWildnessChange}
        onRandomize={onRandomize}
        onEvolve={onEvolve}
        locks={locks}
        onLocksChange={onLocksChange}
      />
      {tab === "qr" && (
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
      )}
      {tab === "backdrop" && (
        <BackgroundPanel
          background={state.previewBackground}
          onPatch={onPatch}
        />
      )}
      {tab === "caption" && (
        <CaptionPanel caption={state.caption} onPatch={onPatch} />
      )}
      <div className="h-px bg-border/70" />
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        <ArrowCounterClockwiseIcon />
        Reset everything to defaults
      </Button>
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
  onCopyImage,
  onCopy,
}: {
  exportFrame: QrExportFrame;
  onPatch: (patch: Partial<QrState>) => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onCopyImage: () => void;
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
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onCopyImage}>
            <ClipboardIcon />
            Copy image
          </Button>
          <Button type="button" variant="ghost" onClick={onCopy}>
            <CopySimpleIcon />
            Copy content
          </Button>
        </div>
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
  onCopyImage,
  onCopy,
  onReset,
  onRandomize,
  onEvolve,
  wildness,
  onWildnessChange,
  rollCount,
  locks,
  onLocksChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onActivePanelChange,
}: ControlDockProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const toggle = (id: Exclude<ActivePanel, null>) =>
    setActivePanel((prev) => (prev === id ? null : id));

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
                    locks={locks}
                    onLocksChange={onLocksChange}
                    wildness={wildness}
                    onWildnessChange={onWildnessChange}
                    onRandomize={onRandomize}
                    onEvolve={onEvolve}
                    onPatch={onPatch}
                    onReset={onReset}
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
                    onCopyImage={onCopyImage}
                    onCopy={onCopy}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact button bar */}
        <div className="flex gap-2 pb-[env(safe-area-inset-bottom)]">
          <div className="glass-panel isolate flex min-w-0 flex-1 rounded-3xl">
            {DOCK_ITEMS.map(({ id, label, Icon }) => {
              const isActive = activePanel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-expanded={isActive}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[9px] leading-none transition-colors duration-150 sm:py-3 sm:text-[11px]",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="dock-active-pill"
                      className="absolute inset-1 -z-10 rounded-[1.1rem] bg-foreground/8 dark:bg-foreground/12"
                      transition={{
                        type: "spring",
                        stiffness: 480,
                        damping: 34,
                      }}
                    />
                  )}
                  <Icon
                    weight={isActive ? "fill" : "regular"}
                    className="size-4 sm:size-5"
                  />
                  <span className="max-w-full truncate">{label}</span>
                </button>
              );
            })}
          </div>
          <div className="glass-panel flex shrink-0 rounded-3xl">
            {(
              [
                {
                  label: "Undo",
                  shortcut: "Meta+Z",
                  Glyph: ArrowUUpLeftIcon,
                  enabled: canUndo,
                  run: onUndo,
                },
                {
                  label: "Redo",
                  shortcut: "Meta+Shift+Z",
                  Glyph: ArrowUUpRightIcon,
                  enabled: canRedo,
                  run: onRedo,
                },
              ] as const
            ).map(({ label, shortcut, Glyph, enabled, run }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-keyshortcuts={shortcut}
                title={`${label} (${shortcut.replace("Meta", "⌘").replaceAll("+", "")})`}
                disabled={!enabled}
                onClick={run}
                className="flex w-10 flex-col items-center justify-center gap-1 py-2.5 text-[9px] leading-none text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:pointer-events-none disabled:opacity-35 sm:w-14 sm:py-3 sm:text-[11px]"
              >
                <Glyph className="size-4 sm:size-5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Randomize QR theme and background"
            aria-keyshortcuts="R"
            title="Surprise me (R)"
            onClick={onRandomize}
            className="glass-panel group flex w-13 shrink-0 flex-col items-center justify-center gap-1 rounded-3xl py-2.5 text-[9px] leading-none text-muted-foreground transition-colors duration-150 hover:text-foreground sm:w-18 sm:py-3 sm:text-[11px]"
          >
            <motion.span
              className="grid place-items-center"
              animate={{ rotate: rollCount * 270, scale: [1, 1.25, 1] }}
              key={rollCount}
              initial={{ rotate: (rollCount - 1) * 270 }}
              transition={{
                rotate: { type: "spring", stiffness: 260, damping: 14 },
                scale: { duration: 0.35, ease: "easeOut" },
              }}
            >
              <DiceFiveIcon
                weight={rollCount > 0 ? "fill" : "regular"}
                className="size-4 sm:size-5"
              />
            </motion.span>
            <span>Surprise</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
