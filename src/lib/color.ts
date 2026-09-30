export interface Hsl {
  h: number;
  s: number;
  l: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hslToHex(
  hue: number,
  saturation: number,
  lightness: number,
): string {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = h / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const [r, g, b] =
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
  const m = l - chroma / 2;

  return `#${[r, g, b]
    .map((value) =>
      Math.round((value + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const parsed = Number.parseInt(value.slice(0, 6), 16);
  if (Number.isNaN(parsed)) {
    return [0, 0, 0];
  }
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }
  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const h =
    max === r
      ? (g - b) / delta + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Darkens `fg` in HSL space until it reaches `minRatio` against `bg`.
 * QR scanners want dark modules on a light field, so we only ever darken.
 */
export function ensureContrast(
  fg: string,
  bg: string,
  minRatio: number,
): string {
  if (contrastRatio(fg, bg) >= minRatio) {
    return fg;
  }
  const { h, s, l } = hexToHsl(fg);
  for (let lightness = l; lightness >= 0; lightness -= 2) {
    const candidate = hslToHex(h, s, lightness);
    if (contrastRatio(candidate, bg) >= minRatio) {
      return candidate;
    }
  }
  return "#000000";
}

/** A small harmonious palette spun off a single seed color. */
export function derivePalette(hex: string): string[] {
  const { h, s, l } = hexToHsl(hex);
  const sat = Math.max(s, 55);
  const light = clamp(l, 42, 68);
  return [
    hslToHex(h, sat, light),
    hslToHex(h + 35, sat, clamp(light + 8, 0, 78)),
    hslToHex(h - 35, sat, clamp(light - 4, 0, 78)),
    hslToHex(h + 160, sat * 0.9, clamp(light + 4, 0, 78)),
    hslToHex(h + 200, sat * 0.8, clamp(light + 12, 0, 82)),
  ];
}
