import { describe, expect, it } from "vitest";

import { buildScene, type SceneItem } from "@/lib/background-scene";
import { createDefaultState, type EmojiLayout } from "@/lib/qr";

const LAYOUTS: EmojiLayout[] = [
  "sprinkle",
  "burst",
  "spiral",
  "wave",
  "mosaic",
  "grid",
];

function background(layout: EmojiLayout, seed = 42) {
  return {
    ...createDefaultState().previewBackground,
    pattern: "emoji" as const,
    emojiLayout: layout,
    seed,
  };
}

function nearOrigin(
  items: SceneItem[],
  ox: number,
  oy: number,
  radius: number,
) {
  return items
    .filter((item) => Math.hypot(item.x - ox, item.y - oy) < radius)
    .map((item) => ({
      ...item,
      x: Math.round(item.x - ox),
      y: Math.round(item.y - oy),
    }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
}

describe("procedural background scene", () => {
  it.each(LAYOUTS)("is deterministic for the %s layout", (layout) => {
    const frame = {
      width: 900,
      height: 700,
      scale: 1,
      originX: 450,
      originY: 350,
    };
    expect(buildScene(background(layout), frame)).toEqual(
      buildScene(background(layout), frame),
    );
  });

  it.each(LAYOUTS)(
    "keeps the %s arrangement around the card independent of canvas size",
    (layout) => {
      const square = buildScene(background(layout), {
        width: 800,
        height: 800,
        scale: 1,
        originX: 400,
        originY: 400,
      });
      const wide = buildScene(background(layout), {
        width: 1600,
        height: 900,
        scale: 1,
        originX: 800,
        originY: 450,
      });
      const a = nearOrigin(square.items, 400, 400, 300);
      const b = nearOrigin(wide.items, 800, 450, 300);
      expect(a.length).toBeGreaterThan(5);
      expect(b).toEqual(a);
    },
  );

  it("produces a different sprinkle for a different seed", () => {
    const frame = {
      width: 800,
      height: 800,
      scale: 1,
      originX: 400,
      originY: 400,
    };
    expect(buildScene(background("sprinkle", 1), frame).items).not.toEqual(
      buildScene(background("sprinkle", 2), frame).items,
    );
  });

  it("varies glyph sizes and uses several emoji in sprinkle", () => {
    const scene = buildScene(background("sprinkle"), {
      width: 1200,
      height: 1200,
      scale: 1,
      originX: 600,
      originY: 600,
    });
    const glyphs = scene.items.filter((item) => item.kind === "glyph");
    const sizes = new Set(glyphs.map((item) => Math.round(item.size)));
    const emoji = new Set(glyphs.map((item) => item.glyph));
    expect(sizes.size).toBeGreaterThan(10);
    expect(emoji.size).toBe(background("sprinkle").emojis.length);
  });
});
