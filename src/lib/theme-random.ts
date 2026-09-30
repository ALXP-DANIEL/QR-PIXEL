import { randomSeed } from "@/lib/background-scene";
import {
  type ExpressedTheme,
  expressGenome,
  nameGenome,
} from "@/lib/engine/express";
import {
  DEFAULT_WILDNESS,
  inferGenome,
  mutateGenome,
  rollGenome,
  type ThemeGenome,
} from "@/lib/engine/genome";
import { EMOJI_THEMES, type QrCaption, type QrState } from "@/lib/qr";

export { QR_MIN_CONTRAST } from "@/lib/engine/express";
export { DEFAULT_WILDNESS } from "@/lib/engine/genome";

export type RandomTheme = ExpressedTheme;

export interface RandomThemeResult {
  theme: RandomTheme;
  /** Procedural name, e.g. "Midnight Teal · Ocean spiral". */
  name: string;
  seed: number;
  genome: ThemeGenome;
}

function isMixed(genome: ThemeGenome): boolean {
  const theme = EMOJI_THEMES.find((entry) => entry.name === genome.emojiTheme);
  return (
    !theme ||
    genome.emojis.some(
      (emoji) => !(theme.emojis as readonly string[]).includes(emoji),
    )
  );
}

function express(
  genome: ThemeGenome,
  caption: QrCaption,
  seed: number,
): RandomThemeResult {
  return {
    theme: expressGenome(genome, caption),
    name: nameGenome(genome, isMixed(genome)),
    seed,
    genome,
  };
}

/**
 * Rolls a brand-new theme. `wildness` 0 keeps to classic harmonies and
 * favourite patterns; 1 samples almost uniformly. Always scannable.
 */
export function createRandomTheme(
  caption: QrCaption,
  seed: number = randomSeed(),
  wildness: number = DEFAULT_WILDNESS,
): RandomThemeResult {
  return express(rollGenome(seed, wildness), caption, seed);
}

/** True when `genome` still describes what is on screen (no manual edits). */
function genomeMatches(genome: ThemeGenome, state: QrState): boolean {
  const expressed = expressGenome(genome, state.caption);
  return (
    expressed.fgColor === state.fgColor &&
    expressed.cardColor === state.cardColor &&
    expressed.previewBackground.color === state.previewBackground.color &&
    expressed.previewBackground.patternColor ===
      state.previewBackground.patternColor &&
    expressed.previewBackground.pattern === state.previewBackground.pattern
  );
}

/**
 * Mutates the current theme instead of replacing it. Uses the stored genome
 * when it still matches the screen, otherwise infers one from the design so
 * manual tweaks survive into the evolution.
 */
export function evolveTheme(
  state: QrState,
  seed: number = randomSeed(),
  amount = 0.3,
): RandomThemeResult {
  const base =
    state.genome && genomeMatches(state.genome, state)
      ? state.genome
      : inferGenome(state);
  return express(mutateGenome(base, seed, amount), state.caption, seed);
}

export interface RandomLocks {
  /** Keep every colour (QR, card, backdrop, caption). */
  colors: boolean;
  /** Keep the backdrop pattern, emoji, layout, spacing, and seed. */
  backdrop: boolean;
  /** Keep QR module/corner shapes and caption typography. */
  shapes: boolean;
}

export const NO_LOCKS: RandomLocks = {
  colors: false,
  backdrop: false,
  shapes: false,
};

/** Copies the locked groups from `current` onto a freshly rolled theme. */
export function applyLocks(
  rolled: RandomTheme,
  current: RandomTheme,
  locks: RandomLocks,
): RandomTheme {
  const theme: RandomTheme = {
    ...rolled,
    previewBackground: { ...rolled.previewBackground },
    caption: { ...rolled.caption },
  };
  if (locks.colors) {
    theme.fgColor = current.fgColor;
    theme.bgColor = current.bgColor;
    theme.cardColor = current.cardColor;
    theme.previewBackground.color = current.previewBackground.color;
    theme.previewBackground.patternColor =
      current.previewBackground.patternColor;
    theme.caption.color = current.caption.color;
  }
  if (locks.backdrop) {
    const { pattern, patternSize, emojis, emojiLayout, seed } =
      current.previewBackground;
    Object.assign(theme.previewBackground, {
      pattern,
      patternSize,
      emojis,
      emojiLayout,
      seed,
    });
  }
  if (locks.shapes) {
    theme.dotStyle = current.dotStyle;
    theme.cornerSquareStyle = current.cornerSquareStyle;
    theme.cornerDotStyle = current.cornerDotStyle;
    const { fontFamily, fontWeight, fontSize, align, position } =
      current.caption;
    Object.assign(theme.caption, {
      fontFamily,
      fontWeight,
      fontSize,
      align,
      position,
    });
  }
  return theme;
}
