export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** Timestamp of the last change, used to merge rapid edits. */
  lastChange: number;
}

export interface PushOptions {
  /**
   * Merge into the current step when the previous change was recent — keeps a
   * slider drag or colour-picker scrub as one undo step. Discrete actions
   * (randomize, reset) pass false so they are always undoable on their own.
   */
  coalesce?: boolean;
  now?: number;
}

export const HISTORY_LIMIT = 100;
export const COALESCE_WINDOW_MS = 600;
const NO_RECENT_CHANGE = Number.NEGATIVE_INFINITY;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [], lastChange: NO_RECENT_CHANGE };
}

export function pushHistory<T>(
  history: History<T>,
  next: T,
  { coalesce = true, now = Date.now() }: PushOptions = {},
): History<T> {
  if (Object.is(next, history.present)) {
    return history;
  }
  const merge =
    coalesce &&
    history.past.length > 0 &&
    now - history.lastChange < COALESCE_WINDOW_MS;
  return {
    past: merge
      ? history.past
      : [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    // A discrete step closes the window so the next edit starts a new step.
    lastChange: coalesce ? now : NO_RECENT_CHANGE,
  };
}

export function undoHistory<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) {
    return history;
  }
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    lastChange: NO_RECENT_CHANGE,
  };
}

export function redoHistory<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) {
    return history;
  }
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
    lastChange: NO_RECENT_CHANGE,
  };
}
