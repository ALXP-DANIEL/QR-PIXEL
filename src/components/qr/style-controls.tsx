"use client";

import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { type ReactNode, useRef } from "react";

import { Button } from "@/components/ui/button";
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
  EC_LEVEL_LABELS,
  type EcLevel,
  EXPORT_SIZE_MAX,
  EXPORT_SIZE_MIN,
  EXPORT_SIZE_STEP,
  QR_CORNER_DOT_STYLE_LABELS,
  QR_CORNER_SQUARE_STYLE_LABELS,
  QR_DOT_STYLE_LABELS,
  QR_PADDING_MAX,
  QR_PADDING_MIN,
  QR_PADDING_STEP,
  type QrCornerDotStyle,
  type QrCornerSquareStyle,
  type QrDotStyle,
  type QrState,
} from "@/lib/qr";
import { cn } from "@/lib/utils";

interface StyleControlsProps {
  fgColor: string;
  bgColor: string;
  cardColor: string;
  dotStyle: QrDotStyle;
  cornerSquareStyle: QrCornerSquareStyle;
  cornerDotStyle: QrCornerDotStyle;
  qrPadding: number;
  exportSize: number;
  ecLevel: EcLevel;
  hasLogo: boolean;
  logoName: string | null;
  onPatch: (patch: Partial<QrState>) => void;
  onLogoSelect: (file: File) => void;
  onLogoRemove: () => void;
  showLogo?: boolean;
}

function ControlSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function ColorField({
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

function DotPreview({ style }: { style: QrDotStyle }) {
  const rounded =
    style === "dots"
      ? "rounded-full"
      : style === "rounded" ||
          style === "extra-rounded" ||
          style === "classy-rounded"
        ? "rounded-[3px]"
        : "rounded-none";

  return (
    <span className="grid grid-cols-3 gap-1">
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: Decorative fixed preview grid.
          key={index}
          className={cn(
            "size-1.5 bg-current",
            rounded,
            style === "classy" && index % 2 === 0 && "rounded-[3px]",
          )}
        />
      ))}
    </span>
  );
}

export function StyleControls({
  fgColor,
  bgColor,
  cardColor,
  dotStyle,
  cornerSquareStyle,
  cornerDotStyle,
  qrPadding,
  exportSize,
  ecLevel,
  hasLogo,
  logoName,
  onPatch,
  onLogoSelect,
  onLogoRemove,
  showLogo = true,
}: StyleControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-5">
      <ControlSection title="Color">
        <div className="grid grid-cols-2 gap-4">
          <ColorField
            id="qr-fg-color"
            label="Foreground"
            value={fgColor}
            onChange={(value) => onPatch({ fgColor: value })}
          />
          <ColorField
            id="qr-bg-color"
            label="QR background"
            value={bgColor}
            onChange={(value) => onPatch({ bgColor: value })}
          />
          <ColorField
            id="qr-card-color"
            label="Card"
            value={cardColor}
            onChange={(value) => onPatch({ cardColor: value })}
          />
        </div>
      </ControlSection>

      <ControlSection title="QR dots">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(QR_DOT_STYLE_LABELS).map(([value, label]) => {
            const isActive = dotStyle === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onPatch({ dotStyle: value as QrDotStyle })}
                className={cn(
                  "flex h-15 items-center gap-3 border border-input bg-transparent px-3 text-left text-xs transition-colors hover:bg-muted/60",
                  isActive &&
                    "border-foreground bg-background text-foreground shadow-sm",
                )}
              >
                <span className="grid size-7 place-items-center text-foreground">
                  <DotPreview style={value as QrDotStyle} />
                </span>
                <span className="min-w-0 truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </ControlSection>

      <ControlSection title="Corner style">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qr-corner-square-style">Corner frame</Label>
            <Select
              items={QR_CORNER_SQUARE_STYLE_LABELS}
              value={cornerSquareStyle}
              onValueChange={(value) =>
                onPatch({ cornerSquareStyle: value as QrCornerSquareStyle })
              }
            >
              <SelectTrigger id="qr-corner-square-style" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QR_CORNER_SQUARE_STYLE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qr-corner-dot-style">Corner dots</Label>
            <Select
              items={QR_CORNER_DOT_STYLE_LABELS}
              value={cornerDotStyle}
              onValueChange={(value) =>
                onPatch({ cornerDotStyle: value as QrCornerDotStyle })
              }
            >
              <SelectTrigger id="qr-corner-dot-style" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QR_CORNER_DOT_STYLE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ControlSection>

      <ControlSection title="Sizing">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs leading-none select-none">QR padding</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {qrPadding}px
            </span>
          </div>
          <Slider
            aria-label="QR padding"
            min={QR_PADDING_MIN}
            max={QR_PADDING_MAX}
            step={QR_PADDING_STEP}
            value={[qrPadding]}
            onValueChange={(value) =>
              onPatch({ qrPadding: Array.isArray(value) ? value[0] : value })
            }
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs leading-none select-none">
              Export size
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {exportSize} x {exportSize} px
            </span>
          </div>
          <Slider
            aria-label="Export size"
            min={EXPORT_SIZE_MIN}
            max={EXPORT_SIZE_MAX}
            step={EXPORT_SIZE_STEP}
            value={[exportSize]}
            onValueChange={(value) =>
              onPatch({ exportSize: Array.isArray(value) ? value[0] : value })
            }
          />
        </div>
      </ControlSection>

      <ControlSection title="Output">
        <div className={cn("grid gap-4", showLogo && "sm:grid-cols-2")}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qr-ec-level">Error correction</Label>
            <Select
              items={EC_LEVEL_LABELS}
              value={ecLevel}
              onValueChange={(value) => onPatch({ ecLevel: value as EcLevel })}
            >
              <SelectTrigger id="qr-ec-level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EC_LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasLogo && (
              <p className="text-xs text-muted-foreground">
                Raised to H while a logo is present.
              </p>
            )}
          </div>

          {showLogo && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs leading-none select-none">Logo</span>
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
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onLogoSelect(file);
                  }
                  event.target.value = "";
                }}
              />
            </div>
          )}
        </div>
      </ControlSection>
    </div>
  );
}
