"use client";

import { useState } from "react";
import { toast } from "sonner";

import { type ActivePanel, ControlDock } from "@/components/qr/control-dock";
import { type PreviewStatus, QrPreview } from "@/components/qr/qr-preview";
import { downloadBlob } from "@/lib/download";
import {
  buildPayload,
  CAPTION_FONT_SIZE_MAX,
  CAPTION_FONT_SIZE_MIN,
  type CaptionAlign,
  type CaptionFontFamily,
  type CaptionFontWeight,
  type CaptionPosition,
  createDefaultState,
  type EcLevel,
  isContentEmpty,
  type PreviewBackgroundPattern,
  type QrCaption,
  type QrCornerDotStyle,
  type QrCornerSquareStyle,
  type QrDotStyle,
  type QrFields,
  type QrState,
  type QrType,
  SAFE_BACKGROUND_EMOJIS,
  type ValidationResult,
  validate,
} from "@/lib/qr";
import { renderFramedQrCanvas, renderFramedQrSvg } from "@/lib/qr-render";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const BACKGROUND_PATTERNS: PreviewBackgroundPattern[] = [
  "dots",
  "grid",
  "diagonal",
  "emoji",
];
const QR_DOT_STYLES: QrDotStyle[] = [
  "square",
  "dots",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
];
const QR_CORNER_SQUARE_STYLES: QrCornerSquareStyle[] = [
  "square",
  "dot",
  "extra-rounded",
];
const QR_CORNER_DOT_STYLES: QrCornerDotStyle[] = ["square", "dot"];
const CAPTION_FONT_FAMILIES: CaptionFontFamily[] = ["sans", "serif", "mono"];
const CAPTION_FONT_WEIGHTS: CaptionFontWeight[] = ["normal", "medium", "bold"];
const CAPTION_ALIGNS: CaptionAlign[] = ["left", "center", "right"];
const CAPTION_POSITIONS: CaptionPosition[] = ["top", "bottom"];
const FILENAME_ADJECTIVES = [
  "bright",
  "cosmic",
  "crisp",
  "electric",
  "fresh",
  "glossy",
  "lucky",
  "pixel",
  "quick",
  "vivid",
] as const;
const FILENAME_NOUNS = [
  "badge",
  "beam",
  "code",
  "link",
  "mark",
  "portal",
  "signal",
  "spark",
  "tag",
  "tile",
] as const;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);
  const segment = normalizedHue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match =
    segment < 1
      ? [chroma, x, 0]
      : segment < 2
        ? [x, chroma, 0]
        : segment < 3
          ? [0, chroma, x]
          : segment < 4
            ? [0, x, chroma]
            : segment < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const m = lightness / 100 - chroma / 2;

  return `#${match
    .map((value) =>
      Math.round((value + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function randomEmoji(): string {
  return randomItem(SAFE_BACKGROUND_EMOJIS);
}

function createRandomTheme(
  currentCaption: QrCaption,
): Pick<
  QrState,
  | "bgColor"
  | "fgColor"
  | "cardColor"
  | "dotStyle"
  | "cornerSquareStyle"
  | "cornerDotStyle"
  | "previewBackground"
  | "caption"
> {
  const hue = randomInt(0, 359);
  const accentHue = hue + randomInt(-18, 18);
  const saturation = randomInt(52, 82);

  return {
    fgColor: hslToHex(accentHue, saturation, randomInt(16, 24)),
    bgColor: hslToHex(accentHue, randomInt(34, 50), randomInt(92, 97)),
    cardColor: hslToHex(accentHue, randomInt(28, 44), randomInt(78, 86)),
    dotStyle: randomItem(QR_DOT_STYLES),
    cornerSquareStyle: randomItem(QR_CORNER_SQUARE_STYLES),
    cornerDotStyle: randomItem(QR_CORNER_DOT_STYLES),
    previewBackground: {
      color: hslToHex(
        hue + randomInt(-10, 10),
        randomInt(44, 68),
        randomInt(84, 93),
      ),
      pattern: randomItem(BACKGROUND_PATTERNS),
      patternColor: hslToHex(
        hue + randomInt(-24, 24),
        randomInt(46, 76),
        randomInt(28, 42),
      ),
      patternSize: randomInt(28, 112),
      emoji: randomEmoji(),
    },
    caption: {
      enabled: currentCaption.enabled,
      text: currentCaption.text,
      fontFamily: randomItem(CAPTION_FONT_FAMILIES),
      fontWeight: randomItem(CAPTION_FONT_WEIGHTS),
      fontSize: randomInt(
        CAPTION_FONT_SIZE_MIN / 2,
        CAPTION_FONT_SIZE_MAX / 2,
      ) * 2,
      color: hslToHex(accentHue, saturation, randomInt(10, 30)),
      align: randomItem(CAPTION_ALIGNS),
      position: randomItem(CAPTION_POSITIONS),
    },
  };
}

function exportErrorMessage(error: unknown, format: string): string {
  if (error instanceof Error && /too big/i.test(error.message)) {
    return "Content is too long for a QR code";
  }
  return `Could not export ${format}`;
}

function createDownloadFilename(extension: "png" | "svg"): string {
  const adjective = randomItem(FILENAME_ADJECTIVES);
  const noun = randomItem(FILENAME_NOUNS);
  const suffix = randomInt(1000, 9999);
  return `qr-${adjective}-${noun}-${suffix}.${extension}`;
}

export function QrApp() {
  const [state, setState] = useState<QrState>(createDefaultState);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const contentEmpty = isContentEmpty(state.type, state.fields);
  const validation: ValidationResult = contentEmpty
    ? { ok: true }
    : validate(state.type, state.fields);
  const payload =
    !contentEmpty && validation.ok
      ? buildPayload(state.type, state.fields)
      : null;
  const effectiveEcLevel: EcLevel = state.logoDataUrl ? "H" : state.ecLevel;
  const status: PreviewStatus = contentEmpty
    ? "empty"
    : validation.ok
      ? "ready"
      : "invalid";
  const invalidMessage = validation.ok ? null : validation.message;

  const patch = (partial: Partial<QrState>) =>
    setState((current) => ({ ...current, ...partial }));

  const patchFields = <T extends QrType>(
    type: T,
    partial: Partial<QrFields[T]>,
  ) =>
    setState((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [type]: { ...current.fields[type], ...partial },
      },
    }));

  const requirePayload = (): string | null => {
    if (payload === null) {
      toast.error(invalidMessage ?? "Enter some content first");
      return null;
    }
    return payload;
  };

  const handleDownloadPng = async () => {
    const content = requirePayload();
    if (content === null) {
      return;
    }
    try {
      const canvas = await renderFramedQrCanvas({
        payload: content,
        size: state.exportSize,
        frame: state.exportFrame,
        qrPadding: state.qrPadding,
        fgColor: state.fgColor,
        bgColor: state.bgColor,
        dotStyle: state.dotStyle,
        cornerSquareStyle: state.cornerSquareStyle,
        cornerDotStyle: state.cornerDotStyle,
        cardColor: state.cardColor,
        ecLevel: effectiveEcLevel,
        logoDataUrl: state.logoDataUrl,
        previewBackground: state.previewBackground,
        caption: state.caption,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob === null) {
        throw new Error("PNG encoding failed");
      }
      downloadBlob(blob, createDownloadFilename("png"));
      toast.success("PNG downloaded");
    } catch (error) {
      toast.error(exportErrorMessage(error, "PNG"));
    }
  };

  const handleDownloadSvg = async () => {
    const content = requirePayload();
    if (content === null) {
      return;
    }
    try {
      const svg = await renderFramedQrSvg({
        payload: content,
        size: state.exportSize,
        frame: state.exportFrame,
        qrPadding: state.qrPadding,
        fgColor: state.fgColor,
        bgColor: state.bgColor,
        dotStyle: state.dotStyle,
        cornerSquareStyle: state.cornerSquareStyle,
        cornerDotStyle: state.cornerDotStyle,
        cardColor: state.cardColor,
        ecLevel: effectiveEcLevel,
        logoDataUrl: state.logoDataUrl,
        previewBackground: state.previewBackground,
        caption: state.caption,
      });
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      downloadBlob(blob, createDownloadFilename("svg"));
      toast.success("SVG downloaded");
    } catch (error) {
      toast.error(exportErrorMessage(error, "SVG"));
    }
  };

  const handleCopy = async () => {
    const content = requirePayload();
    if (content === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Content copied to clipboard");
    } catch {
      toast.error("Clipboard is unavailable");
    }
  };

  const handleReset = () => {
    setState(createDefaultState());
    toast.success("Reset to defaults");
  };

  const handleLogoSelect = (file: File) => {
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patch({ logoDataUrl: reader.result, logoName: file.name });
      }
    };
    reader.onerror = () => toast.error("Could not read the logo file");
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => patch({ logoDataUrl: null, logoName: null });

  const handleRandomize = () => {
    patch(createRandomTheme(state.caption));
  };

  return (
    <>
      <main className="relative flex-1">
        <QrPreview
          status={status}
          invalidMessage={invalidMessage}
          payload={payload}
          fgColor={state.fgColor}
          bgColor={state.bgColor}
          cardColor={state.cardColor}
          dotStyle={state.dotStyle}
          cornerSquareStyle={state.cornerSquareStyle}
          cornerDotStyle={state.cornerDotStyle}
          qrPadding={state.qrPadding}
          ecLevel={effectiveEcLevel}
          logoDataUrl={state.logoDataUrl}
          previewBackground={state.previewBackground}
          caption={state.caption}
          dockExpanded={activePanel !== null}
        />
      </main>
      <ControlDock
        state={state}
        validation={validation}
        onTypeChange={(type) => patch({ type })}
        onFieldChange={patchFields}
        onPatch={patch}
        onLogoSelect={handleLogoSelect}
        onLogoRemove={handleLogoRemove}
        onDownloadPng={handleDownloadPng}
        onDownloadSvg={handleDownloadSvg}
        onCopy={handleCopy}
        onReset={handleReset}
        onRandomize={handleRandomize}
        onActivePanelChange={setActivePanel}
      />
    </>
  );
}
