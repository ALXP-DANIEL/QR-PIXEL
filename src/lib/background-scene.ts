import { derivePalette } from "@/lib/color";
import {
  type EmojiLayout,
  FALLBACK_EMOJI,
  type PreviewBackground,
} from "@/lib/qr";

/*
 * Procedural wallpaper engine.
 *
 * Every layout is derived from hash(seed, cellX, cellY) with cells counted
 * outward from `origin` (the QR card centre). Nothing depends on the canvas
 * size, so the live preview and a 16:9 export show the same arrangement
 * around the card — the export just reveals more of an infinite wallpaper.
 */

export interface SceneFrame {
  width: number;
  height: number;
  /** Pixels per preview "reference pixel" (card = 400 reference px). */
  scale: number;
  originX: number;
  originY: number;
}

export type ShapeKind =
  | "dot"
  | "circle"
  | "ring"
  | "triangle"
  | "plus"
  | "squiggle"
  | "star"
  | "pill";

export type SceneItem =
  | {
      kind: "glyph";
      x: number;
      y: number;
      size: number;
      rotation: number;
      glyph: string;
      opacity: number;
    }
  | {
      kind: "shape";
      shape: ShapeKind;
      x: number;
      y: number;
      size: number;
      rotation: number;
      color: string;
      opacity: number;
    }
  | {
      kind: "line";
      x: number;
      y: number;
      x2: number;
      y2: number;
      width: number;
      color: string;
      opacity: number;
    }
  | {
      kind: "blob";
      x: number;
      y: number;
      radius: number;
      color: string;
      opacity: number;
    };

export interface Scene {
  width: number;
  height: number;
  color: string;
  originX: number;
  originY: number;
  items: SceneItem[];
  /** Distance from origin to the farthest corner, used by the ripple-in. */
  reach: number;
  /** Whether items pop in individually or the whole layer fades. */
  animate: "pop" | "fade";
}

// ---------------------------------------------------------------- randomness

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCell(seed: number, i: number, j: number, salt = 0): number {
  let h = (seed ^ 0x9e3779b9) | 0;
  h = Math.imul(h ^ i, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h ^ j, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h ^ salt, 0x27d4eb2f);
  h ^= h >>> 15;
  return h >>> 0;
}

function cellRng(seed: number, i: number, j: number, salt = 0) {
  return createRng(hashCell(seed, i, j, salt));
}

export function randomSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

// ------------------------------------------------------------------ layouts

function forEachCell(
  frame: SceneFrame,
  stepX: number,
  stepY: number,
  visit: (i: number, j: number, cx: number, cy: number) => void,
) {
  const minI = Math.floor(-frame.originX / stepX) - 1;
  const maxI = Math.ceil((frame.width - frame.originX) / stepX) + 1;
  const minJ = Math.floor(-frame.originY / stepY) - 1;
  const maxJ = Math.ceil((frame.height - frame.originY) / stepY) + 1;
  for (let j = minJ; j <= maxJ; j++) {
    for (let i = minI; i <= maxI; i++) {
      visit(i, j, frame.originX + i * stepX, frame.originY + j * stepY);
    }
  }
}

function glyphLayout(
  layout: EmojiLayout,
  glyphs: readonly string[],
  seed: number,
  gap: number,
  frame: SceneFrame,
): SceneItem[] {
  const items: SceneItem[] = [];
  const count = glyphs.length;
  const push = (
    x: number,
    y: number,
    size: number,
    rotation: number,
    glyph: string,
  ) => {
    if (
      x + size < 0 ||
      y + size < 0 ||
      x - size > frame.width ||
      y - size > frame.height
    ) {
      return;
    }
    items.push({ kind: "glyph", x, y, size, rotation, glyph, opacity: 1 });
  };

  switch (layout) {
    case "grid":
      forEachCell(frame, gap, gap, (i, j, cx, cy) => {
        push(cx, cy, gap * 0.42, 0, glyphs[mod(i + j * 2, count)]);
      });
      break;

    case "sprinkle":
      forEachCell(frame, gap, gap, (i, j, cx, cy) => {
        const rng = cellRng(seed, i, j);
        if (rng() < 0.1) {
          return;
        }
        const x = cx + (rng() - 0.5) * gap * 0.62;
        const y = cy + (rng() - 0.5) * gap * 0.62;
        const t = rng();
        const hero = rng() < 0.07;
        const size = hero
          ? gap * (0.95 + rng() * 0.3)
          : gap * (0.26 + t * t * 0.46);
        push(x, y, size, (rng() - 0.5) * 56, pick(rng, glyphs));
      });
      // Heroes last so they sit on top of their smaller neighbours.
      items.sort((a, b) => ("size" in a && "size" in b ? a.size - b.size : 0));
      break;

    case "mosaic": {
      const rowStep = gap * 0.866;
      const tiers = [0.34, 0.52, 0.7];
      forEachCell(frame, gap, rowStep, (i, j, cx, cy) => {
        const clusterRng = cellRng(
          seed,
          Math.floor(i / 2),
          Math.floor(j / 2),
          7,
        );
        const glyph = pick(clusterRng, glyphs);
        const rng = cellRng(seed, i, j, 3);
        const tier = tiers[mod(i + j + Math.floor(rng() * 2), 3)];
        const x = cx + (mod(j, 2) === 1 ? gap / 2 : 0);
        push(x, cy, gap * tier, (rng() - 0.5) * 14, glyph);
      });
      break;
    }

    case "wave": {
      const rng = createRng(seed);
      const phase = rng() * Math.PI * 2;
      const frequency = 0.55 + rng() * 0.6;
      const amplitude = gap * (0.25 + rng() * 0.25);
      const stepX = gap * 0.72;
      forEachCell(frame, stepX, gap, (i, j, cx, cy) => {
        const angle = i * frequency * 0.72 + j * 0.9 + phase;
        const y = cy + Math.sin(angle) * amplitude;
        const slope = Math.cos(angle) * amplitude * frequency * 0.72;
        const size = gap * (0.36 + 0.16 * Math.sin(i * 0.5 + j * 1.3 + phase));
        const rotation = (Math.atan2(slope, stepX) * 180) / Math.PI;
        push(cx, y, size, rotation, glyphs[mod(j, count)]);
      });
      break;
    }

    case "spiral": {
      // Phyllotaxis: each step turns by the golden angle and moves out by
      // sqrt(n), which packs items evenly like seeds in a sunflower head.
      const rng = createRng(hashCell(seed, 0, 0, 17));
      const golden = Math.PI * (3 - Math.sqrt(5));
      const spacing = gap * 0.56;
      const twist = rng() * Math.PI * 2;
      const glyphOffset = Math.floor(rng() * count);
      const reach = farthestCorner(frame) + gap;
      const total = Math.ceil((reach / spacing) ** 2);
      for (let index = 1; index <= total; index++) {
        const radius = spacing * Math.sqrt(index);
        const theta = index * golden + twist;
        const growth = Math.min(1, radius / (gap * 8));
        push(
          frame.originX + Math.cos(theta) * radius,
          frame.originY + Math.sin(theta) * radius,
          gap * (0.24 + 0.26 * growth) * (0.9 + rng() * 0.2),
          (theta * 180) / Math.PI + 90,
          glyphs[(index + glyphOffset) % count],
        );
      }
      break;
    }

    case "burst": {
      const ringGap = gap * 0.82;
      const reach = farthestCorner(frame);
      const rings = Math.ceil(reach / ringGap) + 1;
      for (let k = 0; k < rings; k++) {
        const rng = cellRng(seed, k, 0, 11);
        const radius = ringGap * (k + 0.6);
        const slots = Math.max(
          6,
          Math.round((Math.PI * 2 * radius) / (gap * 0.92)),
        );
        const offset = rng() * Math.PI * 2;
        const ringSize = gap * (0.3 + 0.28 * ((k % 3) / 2));
        const glyph = glyphs[mod(k, count)];
        for (let s = 0; s < slots; s++) {
          const theta = offset + (s / slots) * Math.PI * 2;
          push(
            frame.originX + Math.cos(theta) * radius,
            frame.originY + Math.sin(theta) * radius,
            ringSize * (0.85 + rng() * 0.3),
            (theta * 180) / Math.PI + 90,
            glyph,
          );
        }
      }
      break;
    }
  }

  return items;
}

const CONFETTI_SHAPES: ShapeKind[] = [
  "circle",
  "ring",
  "triangle",
  "plus",
  "squiggle",
  "star",
  "pill",
];

function confettiLayout(
  palette: readonly string[],
  seed: number,
  gap: number,
  frame: SceneFrame,
): SceneItem[] {
  const items: SceneItem[] = [];
  forEachCell(frame, gap, gap, (i, j, cx, cy) => {
    const rng = cellRng(seed, i, j, 5);
    if (rng() < 0.22) {
      return;
    }
    items.push({
      kind: "shape",
      shape: pick(rng, CONFETTI_SHAPES),
      x: cx + (rng() - 0.5) * gap * 0.7,
      y: cy + (rng() - 0.5) * gap * 0.7,
      size: gap * (0.16 + rng() * 0.26),
      rotation: rng() * 360,
      color: pick(rng, palette),
      opacity: 0.92,
    });
  });
  return items;
}

function auroraLayout(
  palette: readonly string[],
  seed: number,
  frame: SceneFrame,
): SceneItem[] {
  const rng = createRng(hashCell(seed, 0, 0, 13));
  const unit = Math.max(frame.width, frame.height);
  const count = 5 + Math.floor(rng() * 3);
  return Array.from({ length: count }, (_, index) => ({
    kind: "blob" as const,
    x: frame.originX + (rng() - 0.5) * unit * 1.1,
    y: frame.originY + (rng() - 0.5) * unit * 0.9,
    radius: unit * (0.22 + rng() * 0.3),
    color: palette[index % palette.length],
    opacity: 0.5 + rng() * 0.3,
  }));
}

function lineLayout(
  kind: "grid" | "diagonal",
  color: string,
  gap: number,
  frame: SceneFrame,
): SceneItem[] {
  const width = Math.max(1, frame.scale);
  const base = { kind: "line" as const, width, color, opacity: 0.72 };
  const items: SceneItem[] = [];
  if (kind === "grid") {
    const firstI = Math.floor(-frame.originX / gap);
    const lastI = Math.ceil((frame.width - frame.originX) / gap);
    for (let i = firstI; i <= lastI; i++) {
      const x = frame.originX + i * gap;
      items.push({ ...base, x, y: 0, x2: x, y2: frame.height });
    }
    const firstJ = Math.floor(-frame.originY / gap);
    const lastJ = Math.ceil((frame.height - frame.originY) / gap);
    for (let j = firstJ; j <= lastJ; j++) {
      const y = frame.originY + j * gap;
      items.push({ ...base, x: 0, y, x2: frame.width, y2: y });
    }
    return items;
  }
  // 45° lines x + y = c, spaced `gap` apart perpendicular to their direction.
  const step = gap * Math.SQRT2;
  const origin = frame.originX + frame.originY;
  const first = Math.floor(-origin / step);
  const last = Math.ceil((frame.width + frame.height - origin) / step);
  for (let k = first; k <= last; k++) {
    const c = origin + k * step;
    items.push({ ...base, x: c, y: 0, x2: c - frame.height, y2: frame.height });
  }
  return items;
}

function farthestCorner(frame: SceneFrame): number {
  return Math.max(
    Math.hypot(frame.originX, frame.originY),
    Math.hypot(frame.width - frame.originX, frame.originY),
    Math.hypot(frame.originX, frame.height - frame.originY),
    Math.hypot(frame.width - frame.originX, frame.height - frame.originY),
  );
}

export function buildScene(
  background: PreviewBackground,
  frame: SceneFrame,
): Scene {
  const gap = Math.max(8, background.patternSize * frame.scale);
  const glyphs =
    background.emojis.length > 0 ? background.emojis : [FALLBACK_EMOJI];
  const palette = derivePalette(background.patternColor);
  const seed = background.seed >>> 0;

  let items: SceneItem[] = [];
  let animate: Scene["animate"] = "pop";
  switch (background.pattern) {
    case "solid":
      break;
    case "dots":
      forEachCell(frame, gap, gap, (_i, _j, cx, cy) => {
        items.push({
          kind: "shape",
          shape: "dot",
          x: cx,
          y: cy,
          size: Math.max(3, gap * 0.14),
          rotation: 0,
          color: background.patternColor,
          opacity: 0.72,
        });
      });
      break;
    case "grid":
    case "diagonal":
      items = lineLayout(
        background.pattern,
        background.patternColor,
        gap,
        frame,
      );
      animate = "fade";
      break;
    case "emoji":
      items = glyphLayout(background.emojiLayout, glyphs, seed, gap, frame);
      break;
    case "confetti":
      items = confettiLayout(palette, seed, gap, frame);
      break;
    case "aurora":
      items = auroraLayout(palette, seed, frame);
      animate = "fade";
      break;
  }

  return {
    width: frame.width,
    height: frame.height,
    color: background.color,
    originX: frame.originX,
    originY: frame.originY,
    items,
    reach: farthestCorner(frame),
    animate,
  };
}

// ------------------------------------------------------------------- shapes

/** Unit shapes drawn in a 100×100 box centred on the origin. */
const SHAPE_PATHS: Record<
  ShapeKind,
  { d: string; mode: "fill" | "stroke"; strokeWidth?: number }
> = {
  dot: { d: "M -50 0 A 50 50 0 1 0 50 0 A 50 50 0 1 0 -50 0 Z", mode: "fill" },
  circle: {
    d: "M -50 0 A 50 50 0 1 0 50 0 A 50 50 0 1 0 -50 0 Z",
    mode: "fill",
  },
  ring: {
    d: "M -41 0 A 41 41 0 1 0 41 0 A 41 41 0 1 0 -41 0 Z",
    mode: "stroke",
    strokeWidth: 18,
  },
  triangle: { d: "M 0 -50 L 43.3 25 L -43.3 25 Z", mode: "fill" },
  plus: { d: "M -40 0 H 40 M 0 -40 V 40", mode: "stroke", strokeWidth: 20 },
  squiggle: {
    d: "M -48 0 q 12 -24 24 0 t 24 0 t 24 0 t 24 0",
    mode: "stroke",
    strokeWidth: 14,
  },
  star: {
    d: `${Array.from({ length: 10 }, (_, index) => {
      const radius = index % 2 === 0 ? 50 : 22;
      const theta = (index / 10) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ")} Z`,
    mode: "fill",
  },
  pill: { d: "M -30 0 H 30", mode: "stroke", strokeWidth: 36 },
};

// ---------------------------------------------------------------- animation

export const SCENE_ANIMATION_MS = 1100;
const POP_DURATION_MS = 420;
const POP_SPREAD_MS = SCENE_ANIMATION_MS - POP_DURATION_MS;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function itemProgress(scene: Scene, item: SceneItem, elapsed: number): number {
  if (elapsed >= SCENE_ANIMATION_MS) {
    return 1;
  }
  const distance = Math.hypot(item.x - scene.originX, item.y - scene.originY);
  const delay = (distance / Math.max(1, scene.reach)) * POP_SPREAD_MS;
  return Math.min(1, Math.max(0, (elapsed - delay) / POP_DURATION_MS));
}

// ------------------------------------------------------------ canvas output

const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
const glyphCache = new Map<string, HTMLCanvasElement>();
const pathCache = new Map<ShapeKind, Path2D>();

function glyphBitmap(glyph: string, drawSize: number): HTMLCanvasElement {
  const resolution = drawSize > 96 ? 256 : 128;
  const key = `${resolution}:${glyph}`;
  const cached = glyphCache.get(key);
  if (cached) {
    return cached;
  }
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `${Math.round(resolution * 0.78)}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, resolution / 2, resolution * 0.54);
  }
  glyphCache.set(key, canvas);
  return canvas;
}

function shapePath(shape: ShapeKind): Path2D {
  let path = pathCache.get(shape);
  if (!path) {
    path = new Path2D(SHAPE_PATHS[shape].d);
    pathCache.set(shape, path);
  }
  return path;
}

/**
 * Paints the scene. `elapsed` is ms since the scene appeared; pass nothing to
 * draw the settled state. Returns true while the entrance is still playing.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  elapsed = Number.POSITIVE_INFINITY,
): boolean {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = scene.color;
  ctx.fillRect(0, 0, scene.width, scene.height);

  const layerFade =
    scene.animate === "fade"
      ? Math.min(1, elapsed / (SCENE_ANIMATION_MS * 0.6))
      : 1;

  for (const item of scene.items) {
    const progress =
      scene.animate === "pop" ? itemProgress(scene, item, elapsed) : 1;
    if (progress <= 0) {
      continue;
    }
    const grow = scene.animate === "pop" ? easeOutBack(progress) : 1;
    ctx.globalAlpha = item.opacity * layerFade * Math.min(1, progress * 2);

    switch (item.kind) {
      case "glyph": {
        const box = (item.size / 0.78) * grow;
        const bitmap = glyphBitmap(item.glyph, box);
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.drawImage(bitmap, -box / 2, -box / 2, box, box);
        ctx.restore();
        break;
      }
      case "shape": {
        const def = SHAPE_PATHS[item.shape];
        const unit = (item.size / 100) * grow;
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.scale(unit, unit);
        if (def.mode === "fill") {
          ctx.fillStyle = item.color;
          ctx.fill(shapePath(item.shape));
        } else {
          ctx.strokeStyle = item.color;
          ctx.lineWidth = def.strokeWidth ?? 10;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke(shapePath(item.shape));
        }
        ctx.restore();
        break;
      }
      case "line":
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.width;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(item.x2, item.y2);
        ctx.stroke();
        break;
      case "blob": {
        const gradient = ctx.createRadialGradient(
          item.x,
          item.y,
          0,
          item.x,
          item.y,
          item.radius,
        );
        gradient.addColorStop(0, item.color);
        gradient.addColorStop(1, `${item.color.slice(0, 7)}00`);
        ctx.fillStyle = gradient;
        ctx.fillRect(
          item.x - item.radius,
          item.y - item.radius,
          item.radius * 2,
          item.radius * 2,
        );
        break;
      }
    }
  }

  ctx.restore();
  return elapsed < SCENE_ANIMATION_MS;
}

// --------------------------------------------------------------- SVG output

function n(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** PNG data URL of a glyph as this browser's emoji font draws it. */
export function glyphDataUrl(glyph: string): string {
  return glyphBitmap(glyph, 256).toDataURL("image/png");
}

export interface SceneSvgOptions {
  /**
   * Returns an image URL for a glyph. When provided, emoji are embedded as
   * images so the SVG looks identical everywhere; otherwise they are <text>
   * and depend on the viewer's emoji font.
   */
  glyphHref?: (glyph: string) => string;
}

export function sceneToSvg(
  scene: Scene,
  { glyphHref }: SceneSvgOptions = {},
): string {
  const defs: string[] = [];
  const glyphIds = new Map<string, string>();
  const glyphId = (glyph: string) => {
    let id = glyphIds.get(glyph);
    if (!id && glyphHref) {
      id = `bg-glyph-${glyphIds.size}`;
      glyphIds.set(glyph, id);
      // Unit-sized image centred on the origin; <use> scales it per item.
      defs.push(
        `<image id="${id}" href="${escapeXml(glyphHref(glyph))}" x="-0.5" y="-0.5" width="1" height="1"/>`,
      );
    }
    return id;
  };
  const body: string[] = [
    `<rect width="100%" height="100%" fill="${escapeXml(scene.color)}"/>`,
  ];

  scene.items.forEach((item, index) => {
    switch (item.kind) {
      case "glyph": {
        const id = glyphId(item.glyph);
        if (id) {
          body.push(
            `<use href="#${id}" transform="translate(${n(item.x)} ${n(item.y)}) rotate(${n(item.rotation)}) scale(${n(item.size / 0.78)})" opacity="${n(item.opacity)}"/>`,
          );
          break;
        }
        body.push(
          `<text transform="translate(${n(item.x)} ${n(item.y)}) rotate(${n(item.rotation)})" font-size="${n(item.size)}" font-family="${escapeXml(EMOJI_FONT)}" text-anchor="middle" dominant-baseline="central" opacity="${n(item.opacity)}">${escapeXml(item.glyph)}</text>`,
        );
        break;
      }
      case "shape": {
        const def = SHAPE_PATHS[item.shape];
        const paint =
          def.mode === "fill"
            ? `fill="${escapeXml(item.color)}"`
            : `fill="none" stroke="${escapeXml(item.color)}" stroke-width="${def.strokeWidth ?? 10}" stroke-linecap="round" stroke-linejoin="round"`;
        body.push(
          `<path d="${def.d}" transform="translate(${n(item.x)} ${n(item.y)}) rotate(${n(item.rotation)}) scale(${n(item.size / 100)})" ${paint} opacity="${n(item.opacity)}"/>`,
        );
        break;
      }
      case "line":
        body.push(
          `<line x1="${n(item.x)}" y1="${n(item.y)}" x2="${n(item.x2)}" y2="${n(item.y2)}" stroke="${escapeXml(item.color)}" stroke-width="${n(item.width)}" opacity="${n(item.opacity)}"/>`,
        );
        break;
      case "blob": {
        const id = `bg-blob-${index}`;
        defs.push(
          `<radialGradient id="${id}"><stop offset="0" stop-color="${escapeXml(item.color)}"/><stop offset="1" stop-color="${escapeXml(item.color)}" stop-opacity="0"/></radialGradient>`,
        );
        body.push(
          `<circle cx="${n(item.x)}" cy="${n(item.y)}" r="${n(item.radius)}" fill="url(#${id})" opacity="${n(item.opacity)}"/>`,
        );
        break;
      }
    }
  });

  return `${defs.length > 0 ? `<defs>${defs.join("")}</defs>` : ""}${body.join("")}`;
}
