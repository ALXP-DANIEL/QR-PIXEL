/*
 * OKLCH <-> sRGB hex. OKLCH is perceptually uniform: equal steps in L look
 * equally bright across hues, so the engine can reason about "lighter",
 * "more vivid" and "same brightness, different hue" without HSL's quirks
 * (HSL yellow at 50% is far brighter than HSL blue at 50%).
 */

export interface Oklch {
  /** Lightness 0..1 */
  l: number;
  /** Chroma, ~0..0.37 for sRGB */
  c: number;
  /** Hue in degrees */
  h: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function toGamma(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function oklchToLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const l1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m1 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s1 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1,
    -1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1,
    -0.0041960863 * l1 - 0.7034186147 * m1 + 1.707637301 * s1,
  ];
}

function inGamut(rgb: [number, number, number]): boolean {
  const epsilon = 1e-4;
  return rgb.every((channel) => channel >= -epsilon && channel <= 1 + epsilon);
}

/**
 * Converts to hex, reducing chroma (keeping lightness and hue) until the
 * colour fits in sRGB — the standard CSS gamut-mapping approach.
 */
export function oklchToHex(color: Oklch): string {
  const target = { l: clamp01(color.l), c: Math.max(0, color.c), h: color.h };
  let rgb = oklchToLinearRgb(target);
  if (!inGamut(rgb)) {
    let low = 0;
    let high = target.c;
    for (let step = 0; step < 18; step++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinearRgb({ ...target, c: mid }))) {
        low = mid;
      } else {
        high = mid;
      }
    }
    rgb = oklchToLinearRgb({ ...target, c: low });
  }
  return `#${rgb
    .map((channel) =>
      Math.round(clamp01(toGamma(clamp01(channel))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function hexToOklch(hex: string): Oklch {
  const value = Number.parseInt(hex.replace(/^#/, "").slice(0, 6), 16) || 0;
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (channel) => toLinear(channel / 255),
  );
  const l1 = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m1 = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s1 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * l1 + 0.793617785 * m1 - 0.0040720468 * s1;
  const a = 1.9779984951 * l1 - 2.428592205 * m1 + 0.4505937099 * s1;
  const bb = 0.0259040371 * l1 + 0.7827717662 * m1 - 0.808675766 * s1;
  const h = (Math.atan2(bb, a) * 180) / Math.PI;
  return { l, c: Math.hypot(a, bb), h: (h + 360) % 360 };
}
