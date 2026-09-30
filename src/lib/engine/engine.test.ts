import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/color";
import {
  CAPTION_MIN_CONTRAST,
  expressGenome,
  nameGenome,
  PATTERN_MIN_DELTA_L,
  QR_MIN_CONTRAST,
} from "@/lib/engine/express";
import {
  inferGenome,
  mutateGenome,
  rollGenome,
  sanitizeGenome,
} from "@/lib/engine/genome";
import { hexToOklch, oklchToHex } from "@/lib/engine/oklch";
import { createDefaultState } from "@/lib/qr";

const caption = createDefaultState().caption;

function hueDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}

describe("oklch", () => {
  it("round-trips sRGB colours", () => {
    for (const hex of ["#000000", "#ffffff", "#ff0000", "#3a7bd5", "#f5d0fe"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it("gamut-maps impossible colours instead of clipping hue", () => {
    const hex = oklchToHex({ l: 0.7, c: 0.4, h: 150 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(hueDistance(hexToOklch(hex).h, 150)).toBeLessThan(8);
  });
});

describe("theme engine", () => {
  it("is deterministic per seed and wildness", () => {
    expect(rollGenome(42, 0.5)).toEqual(rollGenome(42, 0.5));
    expect(rollGenome(42, 0.1)).not.toEqual(rollGenome(43, 0.1));
  });

  it.each([0, 0.35, 0.7, 1])(
    "always satisfies hard constraints at wildness %s",
    (wildness) => {
      for (let seed = 1; seed <= 300; seed++) {
        const genome = rollGenome(seed * 7919, wildness);
        const theme = expressGenome(genome, caption);
        expect(
          contrastRatio(theme.fgColor, theme.bgColor),
        ).toBeGreaterThanOrEqual(QR_MIN_CONTRAST);
        expect(hexToOklch(theme.fgColor).l).toBeLessThan(
          hexToOklch(theme.bgColor).l,
        );
        expect(
          contrastRatio(theme.caption.color, theme.previewBackground.color),
        ).toBeGreaterThanOrEqual(CAPTION_MIN_CONTRAST);
        const gap = Math.abs(
          hexToOklch(theme.previewBackground.patternColor).l -
            hexToOklch(theme.previewBackground.color).l,
        );
        expect(gap).toBeGreaterThanOrEqual(PATTERN_MIN_DELTA_L - 0.03);
      }
    },
  );

  it("strays further from classic harmonies as wildness rises", () => {
    const anchors = [0, 30, 120, 150, 180];
    const offAnchor = (wildness: number) => {
      let total = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const { harmony } = rollGenome(seed, wildness);
        total += Math.min(
          ...anchors.map((anchor) => hueDistance(Math.abs(harmony), anchor)),
        );
      }
      return total / 400;
    };
    expect(offAnchor(1)).toBeGreaterThan(offAnchor(0) * 2);
  });

  it("flattens pattern choice as wildness rises", () => {
    const share = (wildness: number) => {
      let emoji = 0;
      for (let seed = 1; seed <= 600; seed++) {
        if (rollGenome(seed, wildness).pattern === "emoji") emoji++;
      }
      return emoji / 600;
    };
    expect(share(0)).toBeGreaterThan(share(1));
  });

  it("mutates gently and leaves amount 0 unchanged", () => {
    const genome = rollGenome(7);
    expect(mutateGenome(genome, 1, 0)).toEqual(genome);
    let hueShift = 0;
    let patternKept = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const child = mutateGenome(genome, seed, 0.2);
      hueShift += hueDistance(child.hue, genome.hue);
      if (child.pattern === genome.pattern) patternKept++;
    }
    expect(hueShift / 200).toBeLessThan(15);
    expect(patternKept / 200).toBeGreaterThan(0.85);
  });

  it("infers a genome that re-expresses to a similar look", () => {
    const genome = rollGenome(99, 0.2);
    const state = {
      ...createDefaultState(),
      ...expressGenome(genome, caption),
    };
    const inferred = inferGenome(state);
    const again = expressGenome(inferred, caption);
    const l0 = hexToOklch(state.previewBackground.color).l;
    const l1 = hexToOklch(again.previewBackground.color).l;
    expect(Math.abs(l0 - l1)).toBeLessThan(0.05);
    expect(inferred.pattern).toBe(genome.pattern);
    expect(inferred.wallpaperSeed).toBe(genome.wallpaperSeed);
  });

  it("names genomes deterministically", () => {
    const genome = rollGenome(5);
    expect(nameGenome(genome, false)).toBe(nameGenome(genome, false));
    expect(nameGenome(genome, false)).toMatch(/^\S+ \S+ · .+/);
  });

  it("sanitizes stored genomes", () => {
    const genome = rollGenome(3);
    expect(sanitizeGenome(JSON.parse(JSON.stringify(genome)))).toEqual(genome);
    expect(sanitizeGenome(null)).toBeNull();
    expect(sanitizeGenome({ version: 2, hue: 1 })).toBeNull();
    expect(
      sanitizeGenome({ version: 1, hue: 10, mood: 9, pattern: "x" })?.mood,
    ).toBe(1);
  });
});
