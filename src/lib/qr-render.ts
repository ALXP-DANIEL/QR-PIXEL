import QRCodeStyling from "qr-code-styling";

import type {
  EcLevel,
  PreviewBackground,
  QrCornerDotStyle,
  QrCornerSquareStyle,
  QrDotStyle,
  QrExportFrame,
} from "@/lib/qr";

export interface QrRenderOptions {
  payload: string;
  size: number;
  fgColor: string;
  bgColor: string;
  dotStyle: QrDotStyle;
  cornerSquareStyle: QrCornerSquareStyle;
  cornerDotStyle: QrCornerDotStyle;
  ecLevel: EcLevel;
  logoDataUrl: string | null;
}

const QR_MARGIN = 4;
const PREVIEW_CARD_REFERENCE_SIZE = 400;

interface ExportFrameOptions extends QrRenderOptions {
  frame: QrExportFrame;
  qrPadding: number;
  cardColor: string;
  previewBackground: PreviewBackground;
}

const EXPORT_FRAME_RATIOS: Record<
  QrExportFrame,
  { width: number; height: number }
> = {
  square: { width: 1, height: 1 },
  portrait: { width: 9, height: 16 },
  desktop: { width: 16, height: 9 },
};

function getFrameSize(
  frame: QrExportFrame,
  baseSize: number,
): { width: number; height: number } {
  const ratio = EXPORT_FRAME_RATIOS[frame];
  if (ratio.width === ratio.height) {
    return { width: baseSize, height: baseSize };
  }

  if (ratio.width > ratio.height) {
    return {
      width: Math.round(baseSize * (ratio.width / ratio.height)),
      height: baseSize,
    };
  }

  return {
    width: baseSize,
    height: Math.round(baseSize * (ratio.height / ratio.width)),
  };
}

function createStyledQr(options: QrRenderOptions, type: "canvas" | "svg") {
  return new QRCodeStyling({
    type,
    width: options.size,
    height: options.size,
    margin: QR_MARGIN,
    data: options.payload,
    image: options.logoDataUrl ?? undefined,
    qrOptions: {
      errorCorrectionLevel: options.ecLevel,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.2,
      margin: Math.round(options.size * 0.025),
    },
    dotsOptions: {
      type: options.dotStyle,
      color: options.fgColor,
      roundSize: true,
    },
    cornersSquareOptions: {
      type: options.cornerSquareStyle,
      color: options.fgColor,
    },
    cornersDotOptions: {
      type: options.cornerDotStyle,
      color: options.fgColor,
    },
    backgroundOptions: {
      color: options.bgColor,
    },
  });
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeSvgAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const right = x + width;
  const bottom = y + height;
  return [
    `M ${x + radius} ${y}`,
    `H ${right - radius}`,
    `Q ${right} ${y} ${right} ${y + radius}`,
    `V ${bottom - radius}`,
    `Q ${right} ${bottom} ${right - radius} ${bottom}`,
    `H ${x + radius}`,
    `Q ${x} ${bottom} ${x} ${bottom - radius}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    "Z",
  ].join(" ");
}

function fillCanvasBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: PreviewBackground,
) {
  ctx.fillStyle = background.color;
  ctx.fillRect(0, 0, width, height);

  if (background.pattern === "solid") {
    return;
  }

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = background.patternColor;
  ctx.fillStyle = background.patternColor;
  ctx.lineWidth = Math.max(1, Math.round(width / 960));

  if (background.pattern === "dots") {
    const gap = background.patternSize;
    const radius = Math.max(1.5, gap * 0.07);
    for (let x = gap / 2; x < width; x += gap) {
      for (let y = gap / 2; y < height; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (background.pattern === "grid") {
    const gap = background.patternSize;
    for (let x = 0; x <= width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  if (background.pattern === "diagonal") {
    const gap = background.patternSize;
    for (let x = -height; x < width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.stroke();
    }
  }

  if (background.pattern === "emoji") {
    const emoji = background.emoji.trim() || "✨";
    const gap = background.patternSize;
    ctx.globalAlpha = 0.9;
    ctx.font = `${Math.round(gap * 0.4)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let x = gap / 2; x < width + gap; x += gap) {
      for (let y = gap / 2; y < height + gap; y += gap) {
        ctx.fillText(emoji, x, y);
      }
    }
  }

  ctx.restore();
}

function svgBackgroundMarkup(background: PreviewBackground): string {
  const color = escapeSvgAttribute(background.color);
  const patternColor = escapeSvgAttribute(background.patternColor);
  const patternId = "preview-pattern";
  const patternSize = background.patternSize;
  const base = `<rect width="100%" height="100%" fill="${color}"/>`;

  if (background.pattern === "solid") {
    return base;
  }

  if (background.pattern === "dots") {
    return `${base}<defs><pattern id="${patternId}" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><circle cx="${patternSize / 2}" cy="${patternSize / 2}" r="${Math.max(1.5, patternSize * 0.07)}" fill="${patternColor}" opacity="0.72"/></pattern></defs><rect width="100%" height="100%" fill="url(#${patternId})"/>`;
  }

  if (background.pattern === "grid") {
    return `${base}<defs><pattern id="${patternId}" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><path d="M ${patternSize} 0 H 0 V ${patternSize}" fill="none" stroke="${patternColor}" stroke-width="1" opacity="0.72"/></pattern></defs><rect width="100%" height="100%" fill="url(#${patternId})"/>`;
  }

  if (background.pattern === "diagonal") {
    return `${base}<defs><pattern id="${patternId}" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${patternSize}" stroke="${patternColor}" stroke-width="1" opacity="0.72"/></pattern></defs><rect width="100%" height="100%" fill="url(#${patternId})"/>`;
  }

  const emoji = escapeSvgText(background.emoji.trim() || "✨");
  return `${base}<defs><pattern id="${patternId}" width="${patternSize}" height="${patternSize}" patternUnits="userSpaceOnUse"><text x="${patternSize / 2}" y="${patternSize / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.round(patternSize * 0.4)}">${emoji}</text></pattern></defs><rect width="100%" height="100%" fill="url(#${patternId})"/>`;
}

export async function renderQrCanvas(
  options: QrRenderOptions,
): Promise<HTMLCanvasElement> {
  const raw = await createStyledQr(options, "canvas").getRawData("png");
  if (!(raw instanceof Blob)) {
    throw new Error("QR canvas export failed");
  }
  const image = await createImageBitmap(raw);
  const canvas = document.createElement("canvas");
  canvas.width = options.size;
  canvas.height = options.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }
  ctx.drawImage(image, 0, 0, options.size, options.size);
  return canvas;
}

export async function renderQrSvg(options: QrRenderOptions): Promise<string> {
  const raw = await createStyledQr(options, "svg").getRawData("svg");
  if (!(raw instanceof Blob)) {
    throw new Error("QR SVG export failed");
  }
  return raw.text();
}

export async function renderFramedQrCanvas(
  options: ExportFrameOptions,
): Promise<HTMLCanvasElement> {
  const { width, height } = getFrameSize(options.frame, options.size);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }

  fillCanvasBackground(ctx, width, height, options.previewBackground);

  const minSide = Math.min(width, height);
  const cardSize = Math.round(minSide * 0.7);
  const cardPad = Math.round(
    (options.qrPadding / PREVIEW_CARD_REFERENCE_SIZE) * cardSize,
  );
  const qrSize = Math.max(128, cardSize - cardPad * 2);
  const cardX = (width - cardSize) / 2;
  const cardY = (height - cardSize) / 2;
  const cardRadius = Math.round(cardSize * 0.06);

  ctx.fillStyle = options.cardColor;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardSize, cardSize, cardRadius);
  ctx.fill();

  const qr = await renderQrCanvas({ ...options, size: qrSize });
  ctx.drawImage(qr, cardX + cardPad, cardY + cardPad, qrSize, qrSize);

  return canvas;
}

export async function renderFramedQrSvg(
  options: ExportFrameOptions,
): Promise<string> {
  const { width, height } = getFrameSize(options.frame, options.size);
  const minSide = Math.min(width, height);
  const cardSize = Math.round(minSide * 0.7);
  const cardPad = Math.round(
    (options.qrPadding / PREVIEW_CARD_REFERENCE_SIZE) * cardSize,
  );
  const qrSize = Math.max(128, cardSize - cardPad * 2);
  const cardX = (width - cardSize) / 2;
  const cardY = (height - cardSize) / 2;
  const cardRadius = Math.round(cardSize * 0.06);
  const qrX = cardX + cardPad;
  const qrY = cardY + cardPad;
  const qrSvg = await renderQrSvg({ ...options, size: qrSize });
  const qrBody = qrSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace("</svg>", "");
  const vbMatch = qrSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?)/);
  const qrVb = vbMatch ? Number(vbMatch[1]) : qrSize;
  const qrScale = qrVb > 0 ? qrSize / qrVb : 1;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    svgBackgroundMarkup(options.previewBackground),
    `<path d="${roundedRectPath(cardX, cardY, cardSize, cardSize, cardRadius)}" fill="${escapeSvgAttribute(options.cardColor)}"/>`,
    `<g transform="translate(${qrX} ${qrY}) scale(${qrScale})">${qrBody}</g>`,
    "</svg>",
  ].join("");
}
