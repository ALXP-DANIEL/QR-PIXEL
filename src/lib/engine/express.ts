import { createRng } from "@/lib/background-scene";
import { contrastRatio } from "@/lib/color";
import type { ThemeGenome } from "@/lib/engine/genome";
import { type Oklch, oklchToHex } from "@/lib/engine/oklch";
import {
  CAPTION_FONT_SIZE_MIN,
  EMOJI_LAYOUT_LABELS,
  PREVIEW_BACKGROUND_PATTERN_LABELS,
  type QrCaption,
  type QrState,
} from "@/lib/qr";

export type ExpressedTheme = Pick<
  QrState,
  | "bgColor"
  | "fgColor"
  | "cardColor"
  | "dotStyle"
  | "cornerSquareStyle"
  | "cornerDotStyle"
  | "previewBackground"
  | "caption"
>;

/** Minimum module contrast; comfortably above what phone scanners need. */
export const QR_MIN_CONTRAST = 7;
/** Minimum caption-on-backdrop contrast (WCAG large text is 3:1). */
export const CAPTION_MIN_CONTRAST = 3.5;
/** Minimum OKLCH lightness gap so the pattern never melts into the backdrop. */
export const PATTERN_MIN_DELTA_L = 0.14;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Walks lightness in `direction` until `color` clears `ratio` against `against`. */
function solveContrast(
  color: Oklch,
  against: string,
  ratio: number,
  direction: -1 | 1,
): string {
  for (let l = color.l; l >= 0 && l <= 1; l += 0.01 * direction) {
    const hex = oklchToHex({ ...color, l });
    if (contrastRatio(hex, against) >= ratio) {
      return hex;
    }
  }
  return direction < 0 ? "#000000" : "#ffffff";
}

function patternSizeRange(genome: ThemeGenome): [number, number] {
  if (genome.pattern === "emoji") {
    return genome.layout === "sprinkle" || genome.layout === "mosaic"
      ? [48, 112]
      : [52, 96];
  }
  return genome.pattern === "confetti" ? [44, 88] : [24, 72];
}

export function expressGenome(
  genome: ThemeGenome,
  caption: QrCaption,
): ExpressedTheme {
  const accentHue = genome.hue + genome.harmony;

  const backdrop: Oklch = {
    l: 0.12 + genome.mood * 0.86,
    c: genome.vibrancy * 0.16,
    h: genome.hue,
  };
  const backdropHex = oklchToHex(backdrop);

  // Push the pattern away from the backdrop; flip if that runs out of room.
  let direction: -1 | 1 = backdrop.l > 0.55 ? -1 : 1;
  const gap = PATTERN_MIN_DELTA_L + genome.pop * 0.4;
  let patternL = backdrop.l + direction * gap;
  if (patternL < 0.08 || patternL > 0.96) {
    direction = direction === 1 ? -1 : 1;
    patternL = backdrop.l + direction * gap;
  }
  patternL = clamp(patternL, 0.08, 0.96);
  const pattern: Oklch = {
    l: patternL,
    c: 0.07 + genome.vibrancy * 0.1 + genome.pop * 0.05,
    h: accentHue,
  };

  const qrBackground = oklchToHex({
    l: 0.985,
    c: 0.004 + genome.card * 0.01,
    h: genome.hue,
  });

  const card =
    genome.card < 0.5
      ? {
          l: 0.94 + (0.5 - genome.card) * 0.08,
          c: genome.card * 0.06,
          h: genome.hue,
        }
      : {
          l: 0.62 + (1 - genome.card) * 0.28,
          c: 0.12 + (genome.card - 0.5) * 0.12,
          h: accentHue,
        };

  const ink = solveContrast(
    {
      l: 0.34,
      c: genome.ink * 0.15,
      h: genome.ink > 0.5 ? accentHue : genome.hue,
    },
    qrBackground,
    QR_MIN_CONTRAST,
    -1,
  );

  const captionColor = solveContrast(
    { ...pattern, c: Math.max(pattern.c, 0.09) },
    backdropHex,
    CAPTION_MIN_CONTRAST,
    backdrop.l > 0.55 ? -1 : 1,
  );

  const [minSize, maxSize] = patternSizeRange(genome);
  const patternSize =
    Math.round((minSize + genome.density * (maxSize - minSize)) / 4) * 4;

  return {
    fgColor: ink,
    bgColor: qrBackground,
    cardColor: oklchToHex(card),
    dotStyle: genome.dotStyle,
    cornerSquareStyle: genome.cornerSquareStyle,
    cornerDotStyle: genome.cornerDotStyle,
    previewBackground: {
      color: backdropHex,
      pattern: genome.pattern,
      patternColor: oklchToHex(pattern),
      patternSize,
      emojis: [...genome.emojis],
      emojiLayout: genome.layout,
      seed: genome.wallpaperSeed,
    },
    caption: {
      enabled: caption.enabled,
      text: caption.text,
      fontFamily: genome.fontFamily,
      fontWeight: genome.fontWeight,
      fontSize:
        Math.round((CAPTION_FONT_SIZE_MIN + genome.captionScale * 28) / 2) * 2,
      color: captionColor,
      align: genome.align,
      position: genome.position,
    },
  };
}

// ---------------------------------------------------------------- naming

const MOOD_WORDS: [number, string[]][] = [
  [0.3, ["Midnight", "Nocturne", "After-hours", "Deep"]],
  [0.55, ["Dusk", "Velvet", "Smoky", "Moody"]],
  [0.8, ["Muted", "Soft", "Dusty", "Hazy"]],
  [1.01, ["Pastel", "Sunlit", "Airy", "Paper"]],
];
const VIVID_WORDS = ["Electric", "Neon", "Vivid", "Loud"];
const NEUTRAL_WORDS = ["Graphite", "Stone", "Ash", "Chalk"];

// OKLCH hue landmarks.
const HUE_WORDS: [number, string[]][] = [
  [25, ["Crimson", "Rose"]],
  [50, ["Coral", "Terracotta"]],
  [75, ["Amber", "Apricot"]],
  [100, ["Honey", "Saffron"]],
  [125, ["Lime", "Chartreuse"]],
  [150, ["Moss", "Fern"]],
  [175, ["Jade", "Mint"]],
  [200, ["Teal", "Lagoon"]],
  [225, ["Cyan", "Glacier"]],
  [255, ["Azure", "Cobalt"]],
  [280, ["Indigo", "Iris"]],
  [310, ["Violet", "Plum"]],
  [340, ["Magenta", "Orchid"]],
];

function nearestHueWords(hue: number): string[] {
  let best = HUE_WORDS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of HUE_WORDS) {
    const raw = Math.abs(entry[0] - hue) % 360;
    const distance = Math.min(raw, 360 - raw);
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best[1];
}

function capitalize(value: string): string {
  return value[0].toUpperCase() + value.slice(1);
}

/** Deterministic, human-friendly name derived from the genes themselves. */
export function nameGenome(genome: ThemeGenome, mixedEmoji: boolean): string {
  const rng = createRng(genome.wallpaperSeed ^ Math.round(genome.hue * 997));
  const lightness = 0.12 + genome.mood * 0.86;
  const moodWords =
    genome.vibrancy > 0.8
      ? VIVID_WORDS
      : (MOOD_WORDS.find(([limit]) => lightness < limit) ?? MOOD_WORDS[3])[1];
  const hueWords =
    genome.vibrancy < 0.15 ? NEUTRAL_WORDS : nearestHueWords(genome.hue);
  const mood = moodWords[Math.floor(rng() * moodWords.length)];
  const hue = hueWords[Math.floor(rng() * hueWords.length)];
  const detail =
    genome.pattern === "emoji"
      ? `${mixedEmoji ? "Mixed" : genome.emojiTheme} ${EMOJI_LAYOUT_LABELS[genome.layout].toLowerCase()}`
      : capitalize(PREVIEW_BACKGROUND_PATTERN_LABELS[genome.pattern]);
  return `${mood} ${hue} · ${detail}`;
}
