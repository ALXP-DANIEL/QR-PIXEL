"use client";

import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useRef } from "react";

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
  QR_PADDING_MAX,
  QR_PADDING_MIN,
  QR_PADDING_STEP,
  type QrState,
} from "@/lib/qr";
import { cn } from "@/lib/utils";

interface StyleControlsProps {
  fgColor: string;
  bgColor: string;
  cardColor: string;
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

export function StyleControls({
  fgColor,
  bgColor,
  cardColor,
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <ColorField
          id="qr-fg-color"
          label="Foreground"
          value={fgColor}
          onChange={(value) => onPatch({ fgColor: value })}
        />
        <ColorField
          id="qr-bg-color"
          label="Background"
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
          <span className="text-xs leading-none select-none">Export size</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {exportSize} × {exportSize} px
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
    </div>
  );
}
