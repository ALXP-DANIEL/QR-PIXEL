import QRCode from "qrcode";

import type { EcLevel, PreviewBackground, QrExportFrame } from "@/lib/qr";

export interface QrRenderOptions {
  payload: string;
  size: number;
  fgColor: string;
  bgColor: string;
  ecLevel: EcLevel;
  logoDataUrl: string | null;
}

const QR_MARGIN = 4;
const LOGO_PAD_RATIO = 0.25;
const LOGO_RATIO = 0.2;
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load logo image"));
    image.src = src;
  });
}

function containFit(
  image: HTMLImageElement,
  box: number,
): { width: number; height: number } {
  // Firefox reports 0×0 for SVGs without intrinsic dimensions; fall back to a square.
  if (image.naturalWidth === 0 || image.naturalHeight === 0) {
    return { width: box, height: box };
  }
  const scale = Math.min(box / image.naturalWidth, box / image.naturalHeight);
  return {
    width: image.naturalWidth * scale,
    height: image.naturalHeight * scale,
  };
}

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
  const { payload, size, fgColor, bgColor, ecLevel, logoDataUrl } = options;
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, {
    width: size,
    margin: QR_MARGIN,
    errorCorrectionLevel: ecLevel,
    color: { dark: fgColor, light: bgColor },
  });

  if (logoDataUrl) {
    const logo = await loadImage(logoDataUrl);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable");
    }
    const padBox = size * LOGO_PAD_RATIO;
    const padOrigin = (size - padBox) / 2;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(padOrigin, padOrigin, padBox, padBox, padBox * 0.12);
    ctx.fill();

    const logoBox = size * LOGO_RATIO;
    const { width, height } = containFit(logo, logoBox);
    ctx.drawImage(logo, (size - width) / 2, (size - height) / 2, width, height);
  }

  return canvas;
}

export async function renderQrSvg(options: QrRenderOptions): Promise<string> {
  const { payload, size, fgColor, bgColor, ecLevel, logoDataUrl } = options;
  const svg = await QRCode.toString(payload, {
    type: "svg",
    width: size,
    margin: QR_MARGIN,
    errorCorrectionLevel: ecLevel,
    color: { dark: fgColor, light: bgColor },
  });

  if (!logoDataUrl) {
    return svg;
  }

  const viewBoxMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /);
  if (!viewBoxMatch) {
    return svg;
  }
  const units = Number(viewBoxMatch[1]);
  const padBox = units * LOGO_PAD_RATIO;
  const padOrigin = (units - padBox) / 2;
  const logoBox = units * LOGO_RATIO;
  const logoOrigin = (units - logoBox) / 2;
  const overlay =
    `<rect x="${padOrigin}" y="${padOrigin}" width="${padBox}" height="${padBox}" rx="${padBox * 0.12}" fill="${bgColor}"/>` +
    `<image x="${logoOrigin}" y="${logoOrigin}" width="${logoBox}" height="${logoBox}" href="${logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace("</svg>", `${overlay}</svg>`);
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
  const qrBody = qrSvg.replace(/^<svg[^>]*>/, "").replace("</svg>", "");
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
