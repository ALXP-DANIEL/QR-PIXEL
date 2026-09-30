"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

import { type ActivePanel, ControlDock } from "@/components/qr/control-dock";
import { type PreviewStatus, QrPreview } from "@/components/qr/qr-preview";
import { downloadBlob } from "@/lib/download";
import {
  createHistory,
  type History,
  type PushOptions,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/lib/history";
import { loadState, saveState } from "@/lib/persist";
import {
  buildPayload,
  createDefaultState,
  type EcLevel,
  isContentEmpty,
  type QrFields,
  type QrState,
  type QrType,
  type ValidationResult,
  validate,
} from "@/lib/qr";
import { renderFramedQrCanvas, renderFramedQrSvg } from "@/lib/qr-render";
import {
  applyLocks,
  createRandomTheme,
  DEFAULT_WILDNESS,
  evolveTheme,
  NO_LOCKS,
  type RandomLocks,
  type RandomThemeResult,
} from "@/lib/theme-random";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const SAVE_DELAY_MS = 400;
const WILDNESS_KEY = "qr-pixel:wildness";
const EVOLVE_AMOUNT = 0.3;

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

function exportOptions(state: QrState, payload: string, ecLevel: EcLevel) {
  return {
    payload,
    size: state.exportSize,
    frame: state.exportFrame,
    qrPadding: state.qrPadding,
    fgColor: state.fgColor,
    bgColor: state.bgColor,
    dotStyle: state.dotStyle,
    cornerSquareStyle: state.cornerSquareStyle,
    cornerDotStyle: state.cornerDotStyle,
    cardColor: state.cardColor,
    ecLevel,
    logoDataUrl: state.logoDataUrl,
    previewBackground: state.previewBackground,
    caption: state.caption,
  };
}

async function renderPngBlob(
  state: QrState,
  payload: string,
  ecLevel: EcLevel,
): Promise<Blob> {
  const canvas = await renderFramedQrCanvas(
    exportOptions(state, payload, ecLevel),
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (blob === null) {
    throw new Error("PNG encoding failed");
  }
  return blob;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='listbox']",
    ) !== null
  );
}

export function QrApp() {
  const [history, setHistory] = useState<History<QrState>>(() =>
    createHistory(createDefaultState()),
  );
  const [restored, setRestored] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [rollCount, setRollCount] = useState(0);
  const [locks, setLocks] = useState<RandomLocks>(NO_LOCKS);
  const [wildness, setWildness] = useState(DEFAULT_WILDNESS);
  const state = history.present;

  // Restore after mount so server and client render the same first frame.
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setHistory(createHistory(saved));
    }
    try {
      const raw = window.localStorage.getItem(WILDNESS_KEY);
      const storedWildness = raw === null ? Number.NaN : Number(raw);
      if (storedWildness >= 0 && storedWildness <= 1) {
        setWildness(storedWildness);
      }
    } catch {
      // Storage unavailable; keep the default.
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) {
      return;
    }
    const timer = window.setTimeout(() => saveState(state), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state, restored]);

  const handleWildnessChange = (value: number) => {
    setWildness(value);
    try {
      window.localStorage.setItem(WILDNESS_KEY, String(value));
    } catch {
      // Storage unavailable; the setting just won't persist.
    }
  };

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

  const update = (
    change: (current: QrState) => QrState,
    options?: PushOptions,
  ) =>
    setHistory((current) =>
      pushHistory(current, change(current.present), options),
    );

  const patch = (partial: Partial<QrState>, options?: PushOptions) =>
    update((current) => ({ ...current, ...partial }), options);

  const patchFields = <T extends QrType>(
    type: T,
    partial: Partial<QrFields[T]>,
  ) =>
    update((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [type]: { ...current.fields[type], ...partial },
      },
    }));

  const handleUndo = () => setHistory(undoHistory);
  const handleRedo = () => setHistory(redoHistory);

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
      const blob = await renderPngBlob(state, content, effectiveEcLevel);
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
      const svg = await renderFramedQrSvg(
        exportOptions(state, content, effectiveEcLevel),
      );
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      downloadBlob(blob, createDownloadFilename("svg"));
      toast.success("SVG downloaded");
    } catch (error) {
      toast.error(exportErrorMessage(error, "SVG"));
    }
  };

  const handleCopyImage = async () => {
    const content = requirePayload();
    if (content === null) {
      return;
    }
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      toast.error("Image copy isn't supported in this browser");
      return;
    }
    try {
      // Hand the clipboard a pending blob so Safari keeps the user gesture.
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": renderPngBlob(state, content, effectiveEcLevel),
        }),
      ]);
      toast.success("Image copied — paste it anywhere");
    } catch (error) {
      toast.error(exportErrorMessage(error, "image"));
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
    patch(createDefaultState(), { coalesce: false });
    toast("Reset to defaults", {
      id: "history",
      action: { label: "Undo", onClick: handleUndo },
    });
  };

  const handleLogoSelect = (file: File) => {
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patch(
          { logoDataUrl: reader.result, logoName: file.name },
          { coalesce: false },
        );
      }
    };
    reader.onerror = () => toast.error("Could not read the logo file");
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () =>
    patch({ logoDataUrl: null, logoName: null }, { coalesce: false });

  const applyGenerated = (
    result: RandomThemeResult,
    verb: "rolled" | "evolved",
  ) => {
    const locked = Object.values(locks).some(Boolean);
    patch(
      {
        ...applyLocks(result.theme, state, locks),
        // A partially locked theme no longer matches its genome; Evolve will
        // infer a fresh one from the screen instead.
        genome: locked ? null : result.genome,
      },
      { coalesce: false },
    );
    setRollCount((count) => count + 1);
    toast(result.name, {
      id: "randomize",
      description: `${verb === "evolved" ? "Evolved" : "New roll"}${locked ? " · locks kept" : ""} · R roll · E evolve`,
      action: { label: "Undo", onClick: handleUndo },
    });
  };

  const handleRandomize = () =>
    applyGenerated(
      createRandomTheme(state.caption, undefined, wildness),
      "rolled",
    );

  const handleEvolve = () =>
    applyGenerated(evolveTheme(state, undefined, EVOLVE_AMOUNT), "evolved");

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target) || event.altKey) {
      return;
    }
    const key = event.key.toLowerCase();
    const mod = event.metaKey || event.ctrlKey;
    if (mod && key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      return;
    }
    if (mod && key === "y") {
      event.preventDefault();
      handleRedo();
      return;
    }
    if (mod || event.shiftKey || event.repeat) {
      return;
    }
    if (key === "r") {
      event.preventDefault();
      handleRandomize();
    } else if (key === "e") {
      event.preventDefault();
      handleEvolve();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onShortcut(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

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
        onTypeChange={(type) => patch({ type }, { coalesce: false })}
        onFieldChange={patchFields}
        onPatch={patch}
        onLogoSelect={handleLogoSelect}
        onLogoRemove={handleLogoRemove}
        onDownloadPng={handleDownloadPng}
        onDownloadSvg={handleDownloadSvg}
        onCopyImage={handleCopyImage}
        onCopy={handleCopy}
        onReset={handleReset}
        onRandomize={handleRandomize}
        onEvolve={handleEvolve}
        wildness={wildness}
        onWildnessChange={handleWildnessChange}
        rollCount={rollCount}
        locks={locks}
        onLocksChange={setLocks}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onActivePanelChange={setActivePanel}
      />
    </>
  );
}
