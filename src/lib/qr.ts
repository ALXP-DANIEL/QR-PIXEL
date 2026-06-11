export type QrType = "url" | "text" | "email" | "phone" | "wifi";

export type EcLevel = "L" | "M" | "Q" | "H";

export type WifiEncryption = "WPA" | "WEP" | "nopass";

export type PreviewBackgroundPattern =
  | "solid"
  | "dots"
  | "grid"
  | "diagonal"
  | "emoji";

export type QrExportFrame = "square" | "portrait" | "desktop";

export type QrDotStyle =
  | "square"
  | "dots"
  | "rounded"
  | "extra-rounded"
  | "classy"
  | "classy-rounded";

export type QrCornerSquareStyle = "square" | "dot" | "extra-rounded";

export type QrCornerDotStyle = "square" | "dot";

export interface QrFields {
  url: { url: string };
  text: { text: string };
  email: { to: string; subject: string; body: string };
  phone: { phone: string };
  wifi: {
    ssid: string;
    password: string;
    encryption: WifiEncryption;
    hidden: boolean;
  };
}

export interface PreviewBackground {
  color: string;
  pattern: PreviewBackgroundPattern;
  patternColor: string;
  patternSize: number;
  emoji: string;
}

export interface QrState {
  type: QrType;
  fields: QrFields;
  fgColor: string;
  bgColor: string;
  cardColor: string;
  dotStyle: QrDotStyle;
  cornerSquareStyle: QrCornerSquareStyle;
  cornerDotStyle: QrCornerDotStyle;
  qrPadding: number;
  exportSize: number;
  exportFrame: QrExportFrame;
  ecLevel: EcLevel;
  previewBackground: PreviewBackground;
  logoDataUrl: string | null;
  logoName: string | null;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; field: string; message: string };

export const QR_TYPE_LABELS: Record<QrType, string> = {
  url: "URL",
  text: "Text",
  email: "Email",
  phone: "Phone",
  wifi: "Wi-Fi",
};

export const EC_LEVEL_LABELS: Record<EcLevel, string> = {
  L: "Low · 7%",
  M: "Medium · 15%",
  Q: "Quartile · 25%",
  H: "High · 30%",
};

export const EXPORT_SIZE_MIN = 256;
export const EXPORT_SIZE_MAX = 2048;
export const EXPORT_SIZE_STEP = 128;
export const QR_PADDING_MIN = 8;
export const QR_PADDING_MAX = 48;
export const QR_PADDING_STEP = 4;
export const BACKGROUND_PATTERN_SIZE_MIN = 24;
export const BACKGROUND_PATTERN_SIZE_MAX = 120;
export const BACKGROUND_PATTERN_SIZE_STEP = 4;

export const PREVIEW_BACKGROUND_PATTERN_LABELS: Record<
  PreviewBackgroundPattern,
  string
> = {
  solid: "Solid",
  dots: "Dots",
  grid: "Grid",
  diagonal: "Diagonal",
  emoji: "Emoji",
};

export const QR_EXPORT_FRAME_LABELS: Record<QrExportFrame, string> = {
  square: "Square",
  portrait: "Portrait",
  desktop: "Desktop",
};

export const QR_DOT_STYLE_LABELS: Record<QrDotStyle, string> = {
  square: "Square",
  dots: "Dots",
  rounded: "Rounded",
  "extra-rounded": "Extra rounded",
  classy: "Classy",
  "classy-rounded": "Classy rounded",
};

export const QR_CORNER_SQUARE_STYLE_LABELS: Record<
  QrCornerSquareStyle,
  string
> = {
  square: "Square",
  dot: "Dot",
  "extra-rounded": "Extra rounded",
};

export const QR_CORNER_DOT_STYLE_LABELS: Record<QrCornerDotStyle, string> = {
  square: "Square",
  dot: "Dot",
};

export function createDefaultState(): QrState {
  return {
    type: "url",
    fields: {
      url: { url: "" },
      text: { text: "" },
      email: { to: "", subject: "", body: "" },
      phone: { phone: "" },
      wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
    },
    fgColor: "#0a0a0a",
    bgColor: "#ffffff",
    cardColor: "#ffffff",
    dotStyle: "square",
    cornerSquareStyle: "square",
    cornerDotStyle: "square",
    qrPadding: 16,
    exportSize: 1024,
    exportFrame: "square",
    ecLevel: "M",
    previewBackground: {
      color: "#f8fafc",
      pattern: "dots",
      patternColor: "#0f172a",
      patternSize: 32,
      emoji: "✨",
    },
    logoDataUrl: null,
    logoName: null,
  };
}

export function createEmptyFields(): QrFields {
  return createDefaultState().fields;
}

export function isContentEmpty(type: QrType, fields: QrFields): boolean {
  switch (type) {
    case "url":
      return fields.url.url.trim() === "";
    case "text":
      return fields.text.text.trim() === "";
    case "email":
      return fields.email.to.trim() === "";
    case "phone":
      return fields.phone.phone.trim() === "";
    case "wifi":
      return fields.wifi.ssid.trim() === "";
  }
}

const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{3,20}$/;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  return SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function validate(type: QrType, fields: QrFields): ValidationResult {
  switch (type) {
    case "url": {
      const normalized = normalizeUrl(fields.url.url);
      let parsed: URL;
      try {
        parsed = new URL(normalized);
      } catch {
        return { ok: false, field: "url", message: "Enter a valid URL" };
      }
      const httpish =
        parsed.protocol === "http:" || parsed.protocol === "https:";
      if (
        httpish &&
        !parsed.hostname.includes(".") &&
        parsed.hostname !== "localhost"
      ) {
        return {
          ok: false,
          field: "url",
          message: "Enter a full domain, e.g. example.com",
        };
      }
      return { ok: true };
    }
    case "text":
      return { ok: true };
    case "email": {
      if (!EMAIL_PATTERN.test(fields.email.to.trim())) {
        return {
          ok: false,
          field: "to",
          message: "Enter a valid email address",
        };
      }
      return { ok: true };
    }
    case "phone": {
      const phone = fields.phone.phone.trim();
      const digits = phone.replace(/\D/g, "");
      if (!PHONE_PATTERN.test(phone) || digits.length < 3) {
        return {
          ok: false,
          field: "phone",
          message: "Enter a valid phone number",
        };
      }
      return { ok: true };
    }
    case "wifi": {
      const { ssid, password, encryption } = fields.wifi;
      if (ssid.trim() === "") {
        return {
          ok: false,
          field: "ssid",
          message: "Network name is required",
        };
      }
      if (encryption !== "nopass" && password === "") {
        return {
          ok: false,
          field: "password",
          message: "Password is required for a secured network",
        };
      }
      return { ok: true };
    }
  }
}

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildPayload(type: QrType, fields: QrFields): string {
  switch (type) {
    case "url":
      return normalizeUrl(fields.url.url);
    case "text":
      return fields.text.text;
    case "email": {
      const { to, subject, body } = fields.email;
      const params = [
        subject.trim() && `subject=${encodeURIComponent(subject)}`,
        body.trim() && `body=${encodeURIComponent(body)}`,
      ].filter(Boolean);
      return `mailto:${to.trim()}${params.length > 0 ? `?${params.join("&")}` : ""}`;
    }
    case "phone":
      return `tel:${fields.phone.phone.replace(/[^\d+]/g, "")}`;
    case "wifi": {
      const { ssid, password, encryption, hidden } = fields.wifi;
      const parts = [`T:${encryption}`, `S:${escapeWifi(ssid)}`];
      if (encryption !== "nopass") {
        parts.push(`P:${escapeWifi(password)}`);
      }
      if (hidden) {
        parts.push("H:true");
      }
      return `WIFI:${parts.join(";")};;`;
    }
  }
}
