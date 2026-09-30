import { describe, expect, it } from "vitest";

import {
  COALESCE_WINDOW_MS,
  createHistory,
  HISTORY_LIMIT,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/lib/history";

describe("history", () => {
  it("undoes and redoes discrete steps", () => {
    let h = createHistory(0);
    h = pushHistory(h, 1, { coalesce: false, now: 1 });
    h = pushHistory(h, 2, { coalesce: false, now: 2 });
    h = undoHistory(h);
    expect(h.present).toBe(1);
    h = undoHistory(h);
    expect(h.present).toBe(0);
    expect(undoHistory(h)).toBe(h);
    h = redoHistory(redoHistory(h));
    expect(h.present).toBe(2);
    expect(redoHistory(h)).toBe(h);
  });

  it("merges rapid edits such as a slider drag into one step", () => {
    let h = createHistory(0);
    for (let value = 1; value <= 10; value++) {
      h = pushHistory(h, value, { now: 1000 + value * 16 });
    }
    expect(h.present).toBe(10);
    expect(h.past).toEqual([0]);
    h = pushHistory(h, 11, { now: 1000 + 160 + COALESCE_WINDOW_MS + 1 });
    expect(h.past).toEqual([0, 10]);
  });

  it("starts a new step after a discrete action", () => {
    let h = createHistory(0);
    h = pushHistory(h, 1, { coalesce: false, now: 10 });
    h = pushHistory(h, 2, { now: 20 });
    expect(h.past).toEqual([0, 1]);
  });

  it("clears redo on a new change and caps its length", () => {
    let h = createHistory(0);
    h = pushHistory(h, 1, { coalesce: false });
    h = undoHistory(h);
    h = pushHistory(h, 5, { coalesce: false });
    expect(h.future).toEqual([]);
    for (let value = 0; value < HISTORY_LIMIT + 20; value++) {
      h = pushHistory(h, value + 100, { coalesce: false });
    }
    expect(h.past).toHaveLength(HISTORY_LIMIT);
  });
});
