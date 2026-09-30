"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { buildScene, drawScene, type Scene } from "@/lib/background-scene";
import type { PreviewBackground } from "@/lib/qr";

// Matches the preview card: w-[min(60vmin,400px)].
const CARD_REFERENCE_SIZE = 400;
const MAX_PIXEL_RATIO = 2;

interface BackgroundCanvasProps {
  background: PreviewBackground;
  /** Vertical offset (CSS px) of the card centre from the viewport centre. */
  cardOffsetY: number;
}

interface Viewport {
  width: number;
  height: number;
  ratio: number;
}

function readViewport(): Viewport {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
  };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface PaintState {
  canvas: RefObject<HTMLCanvasElement | null>;
  scene: RefObject<Scene | null>;
  start: RefObject<number | null>;
  frame: RefObject<number>;
}

// Draws the current scene and keeps looping until the entrance settles.
function paint(state: PaintState) {
  const ctx = state.canvas.current?.getContext("2d");
  const scene = state.scene.current;
  if (!ctx || !scene) {
    state.frame.current = 0;
    return;
  }
  const elapsed =
    state.start.current === null
      ? Number.POSITIVE_INFINITY
      : performance.now() - state.start.current;
  if (drawScene(ctx, scene, elapsed)) {
    state.frame.current = requestAnimationFrame(() => paint(state));
  } else {
    state.start.current = null;
    state.frame.current = 0;
  }
}

/**
 * Paints the procedural wallpaper with the same engine the exporter uses, so
 * what you see behind the card is exactly what lands in the PNG/SVG.
 */
export function BackgroundCanvas({
  background,
  cardOffsetY,
}: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    let pending = 0;
    const update = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => setViewport(readViewport()));
    };
    setViewport(readViewport());
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(pending);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Replay the ripple-in whenever the arrangement itself changes.
  const arrangementKey = [
    background.pattern,
    background.emojiLayout,
    background.seed,
    background.emojis.join(""),
  ].join("|");

  useEffect(() => {
    if (!arrangementKey || prefersReducedMotion()) {
      return;
    }
    // The rebuild effect below picks this up and drives the animation loop.
    startRef.current = performance.now();
  }, [arrangementKey]);

  // Rebuild on any visual change; repaint immediately unless an entrance
  // animation is already running (it will pick up the new scene next frame).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewport) {
      return;
    }
    const width = Math.round(viewport.width * viewport.ratio);
    const height = Math.round(viewport.height * viewport.ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const cardSize = Math.min(
      0.6 * Math.min(viewport.width, viewport.height),
      CARD_REFERENCE_SIZE,
    );
    sceneRef.current = buildScene(background, {
      width,
      height,
      scale: (cardSize / CARD_REFERENCE_SIZE) * viewport.ratio,
      originX: width / 2,
      originY: height / 2 + cardOffsetY * viewport.ratio,
    });
    if (frameRef.current === 0) {
      paint({
        canvas: canvasRef,
        scene: sceneRef,
        start: startRef,
        frame: frameRef,
      });
    }
  }, [background, cardOffsetY, viewport]);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="size-full"
        style={{ backgroundColor: background.color }}
      />
    </div>
  );
}
