import { createRng } from "@/lib/background-scene";
import { hexToOklch } from "@/lib/engine/oklch";
import {
  CAPTION_ALIGN_LABELS,
  CAPTION_FONT_FAMILY_LABELS,
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
  type PreviewBackgroundPattern,
  QR_CORNER_DOT_STYLE_LABELS,
  QR_CORNER_SQUARE_STYLE_LABELS,
  QR_DOT_STYLE_LABELS,
  type QrCornerDotStyle,
  type QrCornerSquareStyle,
  type QrDotStyle,
  type QrState,
  SAFE_BACKGROUND_EMOJIS,
} from "@/lib/qr";

/*
 * A theme is described by a genome: continuous genes (0..1 unless noted)
 * plus categorical genes. Rolling samples a genome, mutating nudges one, and
 * `expressGenome` turns it into concrete colours under hard constraints.
 */
export interface ThemeGenome {
  version: 1;
  /** Base hue, degrees. */
  hue: number;
  /** Accent hue offset from the base, degrees (0 = analogous, 180 = complementary). */
  harmony: number;
  /** Backdrop lightness: 0 = midnight, 1 = paper-white. */
  mood: number;
  /** Backdrop chroma: 0 = neutral grey, 1 = saturated. */
  vibrancy: number;
  /** How far the pattern stands out from the backdrop. */
  pop: number;
  /** Card treatment: 0 = soft neutral, 1 = bold accent. */
  card: number;
  /** QR ink chroma: 0 = near-black, 1 = deeply coloured. */
  ink: number;
  /** Pattern spacing: 0 = dense, 1 = airy. */
  density: number;
  /** Caption size within the allowed range. */
  captionScale: number;
  pattern: PreviewBackgroundPattern;
  layout: EmojiLayout;
  emojis: string[];
  emojiTheme: string;
  dotStyle: QrDotStyle;
  cornerSquareStyle: QrCornerSquareStyle;
  cornerDotStyle: QrCornerDotStyle;
  fontFamily: CaptionFontFamily;
  fontWeight: CaptionFontWeight;
  align: CaptionAlign;
  position: CaptionPosition;
  /** Seed for the wallpaper arrangement itself. */
  wallpaperSeed: number;
}

export type Rng = () => number;

/** 0 = tame (curated, harmonious) … 1 = chaos (anything scannable goes). */
export const DEFAULT_WILDNESS = 0.35;

const PATTERN_WEIGHTS: Record<PreviewBackgroundPattern, number> = {
  emoji: 42,
  confetti: 18,
  aurora: 14,
  dots: 9,
  grid: 6,
  diagonal: 6,
  solid: 5,
};

const LAYOUT_WEIGHTS: Record<EmojiLayout, number> = {
  sprinkle: 30,
  burst: 14,
  spiral: 16,
  wave: 14,
  mosaic: 14,
  grid: 8,
};

/** Classic harmony anchors (degrees). Tame rolls stay close to these. */
const HARMONY_ANCHORS = [0, 30, -30, 120, -120, 150, -150, 180];

// ------------------------------------------------------------- sampling

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function gaussian(rng: Rng): number {
  const u = Math.max(rng(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function keysOf<K extends string>(labels: Record<K, string>): K[] {
  return Object.keys(labels) as K[];
}

/**
 * Temperature-scaled categorical sampling: low wildness sharpens the
 * weights towards favourites, high wildness flattens them towards uniform.
 */
function sampleWeighted<K extends string>(
  rng: Rng,
  weights: Record<K, number>,
  wildness: number,
): K {
  const temperature = 0.6 + 2.4 * wildness;
  const entries = (Object.entries(weights) as [K, number][]).map(
    ([key, weight]) => [key, weight ** (1 / temperature)] as const,
  );
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return key;
    }
  }
  return entries[entries.length - 1][0];
}

function sampleHarmony(rng: Rng, wildness: number): number {
  const spread = 10 + 170 * wildness * wildness;
  return pick(rng, HARMONY_ANCHORS) + gaussian(rng) * spread;
}

function sampleMood(rng: Rng, wildness: number): number {
  // Tame: clearly light or clearly dark. Wild: anywhere, including murky mids.
  if (rng() < 1 - wildness) {
    return rng() < 0.28 ? 0.06 + rng() * 0.16 : 0.8 + rng() * 0.18;
  }
  return rng();
}

function sampleEmojis(
  rng: Rng,
  wildness: number,
): { theme: string; emojis: string[] } {
  const theme = pick(rng, EMOJI_THEMES);
  const count = 2 + Math.floor(rng() * (MAX_BACKGROUND_EMOJIS - 1));
  const pool: string[] = [...theme.emojis];
  const chosen: string[] = [];
  while (chosen.length < count) {
    // Wilder rolls borrow emoji from other themes.
    const source =
      rng() < wildness * 0.8 || pool.length === 0
        ? SAFE_BACKGROUND_EMOJIS
        : pool;
    const emoji = pick(rng, source);
    if (!chosen.includes(emoji)) {
      chosen.push(emoji);
    }
    const index = pool.indexOf(emoji);
    if (index >= 0) {
      pool.splice(index, 1);
    }
  }
  return { theme: theme.name, emojis: chosen };
}

// ---------------------------------------------------------------- roll

export function rollGenome(
  seed: number,
  wildness = DEFAULT_WILDNESS,
): ThemeGenome {
  const rng = createRng(seed);
  const w = clamp01(wildness);
  const { theme, emojis } = sampleEmojis(rng, w);
  return {
    version: 1,
    hue: rng() * 360,
    harmony: sampleHarmony(rng, w),
    mood: sampleMood(rng, w),
    vibrancy: clamp01(0.25 + rng() * (0.55 + 0.2 * w)),
    pop: clamp01(0.35 + rng() * 0.45 + gaussian(rng) * 0.15 * w),
    card: rng(),
    ink: clamp01(rng() * (0.55 + 0.45 * w)),
    density: rng(),
    captionScale: rng() * 0.55,
    pattern: sampleWeighted(rng, PATTERN_WEIGHTS, w),
    layout: sampleWeighted(rng, LAYOUT_WEIGHTS, w),
    emojis,
    emojiTheme: theme,
    dotStyle: pick(rng, keysOf(QR_DOT_STYLE_LABELS)),
    cornerSquareStyle: pick(rng, keysOf(QR_CORNER_SQUARE_STYLE_LABELS)),
    cornerDotStyle: pick(rng, keysOf(QR_CORNER_DOT_STYLE_LABELS)),
    fontFamily: pick(rng, keysOf(CAPTION_FONT_FAMILY_LABELS)),
    fontWeight: pick(rng, keysOf(CAPTION_FONT_WEIGHT_LABELS)),
    align: pick(rng, keysOf(CAPTION_ALIGN_LABELS)),
    position: pick(rng, keysOf(CAPTION_POSITION_LABELS)),
    wallpaperSeed: Math.floor(rng() * 2 ** 32),
  };
}

// -------------------------------------------------------------- mutate

/**
 * Nudges a genome. `amount` 0 returns an equal genome; ~0.3 feels like "the
 * same idea, slightly different"; 1 drifts far. Categorical genes flip with
 * probability proportional to `amount`.
 */
export function mutateGenome(
  genome: ThemeGenome,
  seed: number,
  amount = 0.3,
): ThemeGenome {
  const a = clamp01(amount);
  if (a === 0) {
    return { ...genome, emojis: [...genome.emojis] };
  }
  const rng = createRng(seed);
  const drift = (value: number, scale: number) =>
    clamp01(value + gaussian(rng) * scale * a);
  const flip = <T>(value: T, options: readonly T[]): T =>
    rng() < 0.35 * a ? pick(rng, options) : value;

  const emojis = genome.emojis.map((emoji) =>
    rng() < 0.3 * a ? pick(rng, SAFE_BACKGROUND_EMOJIS) : emoji,
  );

  return {
    ...genome,
    hue: (genome.hue + gaussian(rng) * 45 * a + 360) % 360,
    harmony: genome.harmony + gaussian(rng) * 30 * a,
    mood: drift(genome.mood, 0.18),
    vibrancy: drift(genome.vibrancy, 0.2),
    pop: drift(genome.pop, 0.2),
    card: drift(genome.card, 0.3),
    ink: drift(genome.ink, 0.25),
    density: drift(genome.density, 0.25),
    captionScale: drift(genome.captionScale, 0.2),
    pattern: flip(genome.pattern, keysOf(PREVIEW_BACKGROUND_PATTERN_LABELS)),
    layout: flip(genome.layout, keysOf(EMOJI_LAYOUT_LABELS)),
    emojis: Array.from(new Set(emojis)),
    dotStyle: flip(genome.dotStyle, keysOf(QR_DOT_STYLE_LABELS)),
    cornerSquareStyle: flip(
      genome.cornerSquareStyle,
      keysOf(QR_CORNER_SQUARE_STYLE_LABELS),
    ),
    cornerDotStyle: flip(
      genome.cornerDotStyle,
      keysOf(QR_CORNER_DOT_STYLE_LABELS),
    ),
    fontFamily: flip(genome.fontFamily, keysOf(CAPTION_FONT_FAMILY_LABELS)),
    fontWeight: flip(genome.fontWeight, keysOf(CAPTION_FONT_WEIGHT_LABELS)),
    wallpaperSeed:
      rng() < 0.5 * a ? Math.floor(rng() * 2 ** 32) : genome.wallpaperSeed,
  };
}

// --------------------------------------------------------------- infer

/**
 * Reverse-engineers a genome from whatever is on screen, so Evolve also
 * works after manual edits or on designs made before the engine existed.
 */
export function inferGenome(state: QrState): ThemeGenome {
  const backdrop = hexToOklch(state.previewBackground.color);
  const pattern = hexToOklch(state.previewBackground.patternColor);
  const card = hexToOklch(state.cardColor);
  const ink = hexToOklch(state.fgColor);
  const hue = backdrop.c > 0.02 ? backdrop.h : pattern.h;
  const bg = state.previewBackground;
  return {
    version: 1,
    hue,
    harmony: ((pattern.h - hue + 540) % 360) - 180,
    mood: clamp01((backdrop.l - 0.12) / 0.86),
    vibrancy: clamp01(backdrop.c / 0.16),
    pop: clamp01((Math.abs(pattern.l - backdrop.l) - 0.12) / 0.45),
    card: clamp01(card.c / 0.14),
    ink: clamp01(ink.c / 0.16),
    density: clamp01((bg.patternSize - 36) / 76),
    captionScale: clamp01((state.caption.fontSize - 12) / 52),
    pattern: bg.pattern,
    layout: bg.emojiLayout,
    emojis: [...bg.emojis],
    emojiTheme: "Custom",
    dotStyle: state.dotStyle,
    cornerSquareStyle: state.cornerSquareStyle,
    cornerDotStyle: state.cornerDotStyle,
    fontFamily: state.caption.fontFamily,
    fontWeight: state.caption.fontWeight,
    align: state.caption.align,
    position: state.caption.position,
    wallpaperSeed: bg.seed,
  };
}

// ------------------------------------------------------------ sanitize

function unit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp01(value)
    : fallback;
}

function oneOf<K extends string>(
  value: unknown,
  labels: Record<K, string>,
  fallback: K,
): K {
  return typeof value === "string" && value in labels ? (value as K) : fallback;
}

/** Validates a stored genome; anything unusable becomes null. */
export function sanitizeGenome(raw: unknown): ThemeGenome | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const g = raw as Record<string, unknown>;
  if (g.version !== 1 || typeof g.hue !== "number" || !Number.isFinite(g.hue)) {
    return null;
  }
  const base = rollGenome(0);
  const emojis = Array.isArray(g.emojis)
    ? g.emojis.filter((item): item is string => typeof item === "string")
    : [];
  return {
    version: 1,
    hue: ((g.hue % 360) + 360) % 360,
    harmony:
      typeof g.harmony === "number" && Number.isFinite(g.harmony)
        ? g.harmony
        : 0,
    mood: unit(g.mood, base.mood),
    vibrancy: unit(g.vibrancy, base.vibrancy),
    pop: unit(g.pop, base.pop),
    card: unit(g.card, base.card),
    ink: unit(g.ink, base.ink),
    density: unit(g.density, base.density),
    captionScale: unit(g.captionScale, base.captionScale),
    pattern: oneOf(g.pattern, PREVIEW_BACKGROUND_PATTERN_LABELS, base.pattern),
    layout: oneOf(g.layout, EMOJI_LAYOUT_LABELS, base.layout),
    emojis:
      emojis.length > 0 ? emojis.slice(0, MAX_BACKGROUND_EMOJIS) : base.emojis,
    emojiTheme: typeof g.emojiTheme === "string" ? g.emojiTheme : "Custom",
    dotStyle: oneOf(g.dotStyle, QR_DOT_STYLE_LABELS, base.dotStyle),
    cornerSquareStyle: oneOf(
      g.cornerSquareStyle,
      QR_CORNER_SQUARE_STYLE_LABELS,
      base.cornerSquareStyle,
    ),
    cornerDotStyle: oneOf(
      g.cornerDotStyle,
      QR_CORNER_DOT_STYLE_LABELS,
      base.cornerDotStyle,
    ),
    fontFamily: oneOf(
      g.fontFamily,
      CAPTION_FONT_FAMILY_LABELS,
      base.fontFamily,
    ),
    fontWeight: oneOf(
      g.fontWeight,
      CAPTION_FONT_WEIGHT_LABELS,
      base.fontWeight,
    ),
    align: oneOf(g.align, CAPTION_ALIGN_LABELS, base.align),
    position: oneOf(g.position, CAPTION_POSITION_LABELS, base.position),
    wallpaperSeed:
      typeof g.wallpaperSeed === "number" && Number.isFinite(g.wallpaperSeed)
        ? g.wallpaperSeed >>> 0
        : base.wallpaperSeed,
  };
}
