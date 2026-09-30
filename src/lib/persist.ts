import { sanitizeGenome } from "@/lib/engine/genome";
import {
  BACKGROUND_PATTERN_SIZE_MAX,
  BACKGROUND_PATTERN_SIZE_MIN,
  CAPTION_ALIGN_LABELS,
  CAPTION_FONT_FAMILY_LABELS,
  CAPTION_FONT_SIZE_MAX,
  CAPTION_FONT_SIZE_MIN,
  CAPTION_FONT_WEIGHT_LABELS,
  CAPTION_POSITION_LABELS,
  createDefaultState,
  EC_LEVEL_LABELS,
  EMOJI_LAYOUT_LABELS,
  EXPORT_SIZE_MAX,
  EXPORT_SIZE_MIN,
  MAX_BACKGROUND_EMOJIS,
  PREVIEW_BACKGROUND_PATTERN_LABELS,
  QR_CORNER_DOT_STYLE_LABELS,
  QR_CORNER_SQUARE_STYLE_LABELS,
  QR_DOT_STYLE_LABELS,
  QR_EXPORT_FRAME_LABELS,
  QR_PADDING_MAX,
  QR_PADDING_MIN,
  QR_TYPE_LABELS,
  type QrState,
} from "@/lib/qr";

export const STORAGE_KEY = "qr-pixel:design:v1";

type Loose = Record<string, unknown>;

function isRecord(value: unknown): value is Loose {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<K extends string>(
  value: unknown,
  labels: Record<K, string>,
  fallback: K,
): K {
  return typeof value === "string" && value in labels ? (value as K) : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}

function number(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function section(value: unknown): Loose {
  return isRecord(value) ? value : {};
}

/**
 * Rebuilds a saved design field by field on top of the defaults, so an old,
 * partial or hand-edited payload can never put the app in an invalid state.
 */
export function restoreState(raw: unknown): QrState | null {
  if (!isRecord(raw)) {
    return null;
  }
  const d = createDefaultState();
  const fields = section(raw.fields);
  const url = section(fields.url);
  const plain = section(fields.text);
  const email = section(fields.email);
  const phone = section(fields.phone);
  const wifi = section(fields.wifi);
  const bg = section(raw.previewBackground);
  const caption = section(raw.caption);
  const emojis = Array.isArray(bg.emojis)
    ? bg.emojis
        .filter(
          (item): item is string => typeof item === "string" && item !== "",
        )
        .slice(0, MAX_BACKGROUND_EMOJIS)
    : [];
  const logo =
    typeof raw.logoDataUrl === "string" &&
    raw.logoDataUrl.startsWith("data:image/")
      ? raw.logoDataUrl
      : null;

  return {
    type: oneOf(raw.type, QR_TYPE_LABELS, d.type),
    fields: {
      url: { url: text(url.url, "") },
      text: { text: text(plain.text, "") },
      email: {
        to: text(email.to, ""),
        subject: text(email.subject, ""),
        body: text(email.body, ""),
      },
      phone: { phone: text(phone.phone, "") },
      wifi: {
        ssid: text(wifi.ssid, ""),
        password: text(wifi.password, ""),
        encryption:
          wifi.encryption === "WEP" || wifi.encryption === "nopass"
            ? wifi.encryption
            : "WPA",
        hidden: bool(wifi.hidden, false),
      },
    },
    fgColor: color(raw.fgColor, d.fgColor),
    bgColor: color(raw.bgColor, d.bgColor),
    cardColor: color(raw.cardColor, d.cardColor),
    dotStyle: oneOf(raw.dotStyle, QR_DOT_STYLE_LABELS, d.dotStyle),
    cornerSquareStyle: oneOf(
      raw.cornerSquareStyle,
      QR_CORNER_SQUARE_STYLE_LABELS,
      d.cornerSquareStyle,
    ),
    cornerDotStyle: oneOf(
      raw.cornerDotStyle,
      QR_CORNER_DOT_STYLE_LABELS,
      d.cornerDotStyle,
    ),
    qrPadding: number(
      raw.qrPadding,
      QR_PADDING_MIN,
      QR_PADDING_MAX,
      d.qrPadding,
    ),
    exportSize: number(
      raw.exportSize,
      EXPORT_SIZE_MIN,
      EXPORT_SIZE_MAX,
      d.exportSize,
    ),
    exportFrame: oneOf(raw.exportFrame, QR_EXPORT_FRAME_LABELS, d.exportFrame),
    ecLevel: oneOf(raw.ecLevel, EC_LEVEL_LABELS, d.ecLevel),
    previewBackground: {
      color: color(bg.color, d.previewBackground.color),
      pattern: oneOf(
        bg.pattern,
        PREVIEW_BACKGROUND_PATTERN_LABELS,
        d.previewBackground.pattern,
      ),
      patternColor: color(bg.patternColor, d.previewBackground.patternColor),
      patternSize: number(
        bg.patternSize,
        BACKGROUND_PATTERN_SIZE_MIN,
        BACKGROUND_PATTERN_SIZE_MAX,
        d.previewBackground.patternSize,
      ),
      emojis: emojis.length > 0 ? emojis : d.previewBackground.emojis,
      emojiLayout: oneOf(
        bg.emojiLayout,
        EMOJI_LAYOUT_LABELS,
        d.previewBackground.emojiLayout,
      ),
      seed: number(bg.seed, 0, 2 ** 32 - 1, d.previewBackground.seed) >>> 0,
    },
    logoDataUrl: logo,
    logoName: logo ? text(raw.logoName, "Logo") : null,
    genome: sanitizeGenome(raw.genome),
    caption: {
      enabled: bool(caption.enabled, d.caption.enabled),
      text: text(caption.text, d.caption.text),
      fontFamily: oneOf(
        caption.fontFamily,
        CAPTION_FONT_FAMILY_LABELS,
        d.caption.fontFamily,
      ),
      fontWeight: oneOf(
        caption.fontWeight,
        CAPTION_FONT_WEIGHT_LABELS,
        d.caption.fontWeight,
      ),
      fontSize: number(
        caption.fontSize,
        CAPTION_FONT_SIZE_MIN,
        CAPTION_FONT_SIZE_MAX,
        d.caption.fontSize,
      ),
      color: color(caption.color, d.caption.color),
      align: oneOf(caption.align, CAPTION_ALIGN_LABELS, d.caption.align),
      position: oneOf(
        caption.position,
        CAPTION_POSITION_LABELS,
        d.caption.position,
      ),
    },
  };
}

export function loadState(): QrState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? restoreState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveState(state: QrState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (usually a large logo): keep everything but the logo.
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, logoDataUrl: null, logoName: null }),
      );
    } catch {
      // Storage unavailable (private mode, blocked site data) — skip saving.
    }
  }
}
