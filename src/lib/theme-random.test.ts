import { describe, expect, it } from "vitest";

import { contrastRatio, ensureContrast } from "@/lib/color";
import { createDefaultState } from "@/lib/qr";
import {
  applyLocks,
  createRandomTheme,
  evolveTheme,
  NO_LOCKS,
  QR_MIN_CONTRAST,
} from "@/lib/theme-random";

const caption = createDefaultState().caption;

describe("random theme", () => {
  it("is reproducible from a seed", () => {
    expect(createRandomTheme(caption, 1234)).toEqual(
      createRandomTheme(caption, 1234),
    );
  });

  it("always keeps QR modules scannable (dark on light, high contrast)", () => {
    for (let seed = 0; seed < 500; seed++) {
      const { theme } = createRandomTheme(caption, seed * 7919);
      expect(
        contrastRatio(theme.fgColor, theme.bgColor),
      ).toBeGreaterThanOrEqual(QR_MIN_CONTRAST);
    }
  });

  it("explores many patterns, layouts and vibes", () => {
    const patterns = new Set<string>();
    const names = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const result = createRandomTheme(caption, seed);
      patterns.add(result.theme.previewBackground.pattern);
      names.add(result.name.split(" · ")[0]);
    }
    expect(patterns.size).toBe(7);
    expect(names.size).toBeGreaterThanOrEqual(5);
  });

  it("preserves the caption text and toggle", () => {
    const { theme } = createRandomTheme(
      { ...caption, enabled: true, text: "Scan me" },
      99,
    );
    expect(theme.caption.enabled).toBe(true);
    expect(theme.caption.text).toBe("Scan me");
  });
});

describe("ensureContrast", () => {
  it("darkens a light foreground until it clears the ratio", () => {
    const fg = ensureContrast("#9ca3af", "#ffffff", 7);
    expect(contrastRatio(fg, "#ffffff")).toBeGreaterThanOrEqual(7);
  });
});

describe("applyLocks", () => {
  const current = createRandomTheme(caption, 1).theme;
  const rolled = createRandomTheme(caption, 2).theme;

  it("keeps locked colours only", () => {
    const theme = applyLocks(rolled, current, { ...NO_LOCKS, colors: true });
    expect(theme.fgColor).toBe(current.fgColor);
    expect(theme.previewBackground.color).toBe(current.previewBackground.color);
    expect(theme.previewBackground.pattern).toBe(
      rolled.previewBackground.pattern,
    );
    expect(theme.dotStyle).toBe(rolled.dotStyle);
  });

  it("keeps the locked backdrop arrangement and shapes", () => {
    const theme = applyLocks(rolled, current, {
      colors: false,
      backdrop: true,
      shapes: true,
    });
    expect(theme.previewBackground.seed).toBe(current.previewBackground.seed);
    expect(theme.previewBackground.emojis).toEqual(
      current.previewBackground.emojis,
    );
    expect(theme.previewBackground.color).toBe(rolled.previewBackground.color);
    expect(theme.dotStyle).toBe(current.dotStyle);
    expect(theme.caption.fontFamily).toBe(current.caption.fontFamily);
    expect(theme.fgColor).toBe(rolled.fgColor);
  });

  it("does not mutate the rolled theme", () => {
    const before = JSON.stringify(rolled);
    applyLocks(rolled, current, { colors: true, backdrop: true, shapes: true });
    expect(JSON.stringify(rolled)).toBe(before);
  });
});

describe("evolveTheme", () => {
  it("evolves from the stored genome when the screen still matches it", () => {
    const rolled = createRandomTheme(caption, 11);
    const state = {
      ...createDefaultState(),
      ...rolled.theme,
      genome: rolled.genome,
    };
    const evolved = evolveTheme(state, 5, 0.2);
    expect(
      evolved.genome.wallpaperSeed === rolled.genome.wallpaperSeed ||
        evolved.genome.pattern === rolled.genome.pattern,
    ).toBe(true);
    expect(evolved.genome.emojiTheme).toBe(rolled.genome.emojiTheme);
  });

  it("infers from manual edits instead of discarding them", () => {
    const rolled = createRandomTheme(caption, 11);
    const state = {
      ...createDefaultState(),
      ...rolled.theme,
      fgColor: "#123456",
      genome: rolled.genome,
    };
    expect(evolveTheme(state, 5, 0.2).genome.emojiTheme).toBe("Custom");
  });
});
