import { describe, expect, it } from "vitest";

import { restoreState } from "@/lib/persist";
import { createDefaultState } from "@/lib/qr";

describe("restoreState", () => {
  it("round-trips a saved design", () => {
    const state = createDefaultState();
    state.fields.url.url = "example.com";
    state.previewBackground.emojiLayout = "spiral";
    state.caption.enabled = true;
    expect(restoreState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("rejects non-objects", () => {
    expect(restoreState(null)).toBeNull();
    expect(restoreState("nope")).toBeNull();
    expect(restoreState([1, 2])).toBeNull();
  });

  it("repairs invalid and out-of-range values from defaults", () => {
    const defaults = createDefaultState();
    const restored = restoreState({
      type: "fax",
      fgColor: "red",
      dotStyle: "hexagon",
      qrPadding: 9999,
      previewBackground: { pattern: "plaid", emojis: [], seed: -5 },
      caption: { fontSize: "big" },
      logoDataUrl: "javascript:alert(1)",
    });
    expect(restoreState({})).toEqual(defaults);
    expect(restoreState({})?.fields.url.url).toBe("");
    expect(restoreState({ fields: { url: { url: 1 } } })?.fields.url.url).toBe(
      "",
    );
    expect(restoreState({ qrPadding: 9999 })?.qrPadding).toBeLessThanOrEqual(
      48,
    );
    expect(restoreState({ type: "fax" })?.type).toBe(defaults.type);
    expect(restoreState({ fgColor: "red" })?.fgColor).toBe(defaults.fgColor);
    expect(restoreState({ dotStyle: "hexagon" })?.dotStyle).toBe(
      defaults.dotStyle,
    );
    expect(restored?.previewBackground.pattern).toBe(
      defaults.previewBackground.pattern,
    );
    expect(restored?.previewBackground.emojis).toEqual(
      defaults.previewBackground.emojis,
    );
    expect(restored?.previewBackground.seed).toBeGreaterThanOrEqual(0);
    expect(restored?.caption.fontSize).toBe(defaults.caption.fontSize);
    expect(restored?.logoDataUrl).toBeNull();
  });
});
