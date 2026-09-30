import QRCodeStyling from "qr-code-styling";
import {
  buildScene,
  drawScene,
  glyphDataUrl,
  sceneToSvg,
} from "@/lib/background-scene";
import type {
  EcLevel,
  PreviewBackground,
  QrCaption,
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

// Quiet zone as a fraction of the QR size (20px at the 1024px preview), so a
// small export has the same proportions as the preview.
const QR_MARGIN_RATIO = 20 / 1024;

// The live preview and the exporters share these, in "reference pixels" of a
// 400px card, so both scale identically at any size.
export const CARD_REFERENCE_SIZE = 400;
export const CARD_RADIUS = 22;
export const QR_RADIUS = 20;
const CARD_SHADOW = { offsetY: 25, blur: 50, spread: -12, alpha: 0.25 };
export const CARD_SHADOW_CSS = `0 ${CARD_SHADOW.offsetY}px ${CARD_SHADOW.blur}px ${CARD_SHADOW.spread}px rgb(0 0 0 / ${CARD_SHADOW.alpha})`;
const PREVIEW_CARD_REFERENCE_SIZE = CARD_REFERENCE_SIZE;
const PREVIEW_QR_RADIUS = QR_RADIUS;

interface ExportFrameOptions extends QrRenderOptions {
  frame: QrExportFrame;
  qrPadding: number;
  cardColor: string;
  previewBackground: PreviewBackground;
  caption?: QrCaption;
}

const CAPTION_FONT_FAMILIES: Record<QrCaption["fontFamily"], string> = {
  sans: "system-ui, -apple-system, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
};

const CAPTION_FONT_WEIGHTS: Record<QrCaption["fontWeight"], number> = {
  normal: 400,
  medium: 500,
  bold: 700,
};

// Centers the card+caption group the same way the preview flex column does.
function groupCenteredCardY(
  height: number,
  cardSize: number,
  cap: QrCaption | undefined,
  scale: number,
): number {
  if (cap?.enabled && cap.text.trim()) {
    const fontSizePx = Math.round(cap.fontSize * scale);
    const gap = Math.round(fontSizePx * 0.33);
    const groupHeight = cardSize + gap + fontSizePx;
    const groupY = Math.round((height - groupHeight) / 2);
    // top caption sits above the card, so push card down by (fontSizePx + gap)
    return cap.position === "top" ? groupY + fontSizePx + gap : groupY;
  }
  return Math.round((height - cardSize) / 2);
}

function captionGeometry(
  caption: QrCaption,
  cardX: number,
  cardY: number,
  cardSize: number,
  canvasWidth: number,
  scale: number,
) {
  const fontSizePx = Math.round(caption.fontSize * scale);
  // 33 % of font height — mirrors preview's gap = fontSize * 0.33
  const gap = Math.round(fontSizePx * 0.33);
  // textY is the TOP of the text glyph (textBaseline="top" / dominant-baseline="hanging")
  const textY =
    caption.position === "bottom"
      ? cardY + cardSize + gap
      : cardY - gap - fontSizePx;
  const textX =
    caption.align === "left"
      ? cardX
      : caption.align === "right"
        ? cardX + cardSize
        : canvasWidth / 2;
  return { fontSizePx, textX, textY };
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
    margin: Math.round(options.size * QR_MARGIN_RATIO),
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

function buildExportScene(
  background: PreviewBackground,
  width: number,
  height: number,
  cardX: number,
  cardY: number,
  cardSize: number,
) {
  return buildScene(background, {
    width,
    height,
    scale: cardSize / PREVIEW_CARD_REFERENCE_SIZE,
    originX: cardX + cardSize / 2,
    originY: cardY + cardSize / 2,
  });
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

  const minSide = Math.min(width, height);
  const cardSize = Math.round(minSide * 0.7);
  const scale = cardSize / PREVIEW_CARD_REFERENCE_SIZE;
  const cardPad = Math.round(
    (options.qrPadding / PREVIEW_CARD_REFERENCE_SIZE) * cardSize,
  );
  const qrSize = Math.max(128, cardSize - cardPad * 2);
  const cardX = (width - cardSize) / 2;
  const cardY = groupCenteredCardY(height, cardSize, options.caption, scale);
  const cardRadius = (cardSize * CARD_RADIUS) / CARD_REFERENCE_SIZE;
  const qrX = cardX + cardPad;
  const qrY = cardY + cardPad;
  const qrRadius = Math.round(
    (PREVIEW_QR_RADIUS /
      (PREVIEW_CARD_REFERENCE_SIZE - options.qrPadding * 2)) *
      qrSize,
  );

  drawScene(
    ctx,
    buildExportScene(
      options.previewBackground,
      width,
      height,
      cardX,
      cardY,
      cardSize,
    ),
  );

  // CSS box-shadow: blur radius = 2σ, canvas shadowBlur = 2σ too; the
  // negative spread is emulated by shrinking the shadow-casting shape.
  const inset = -CARD_SHADOW.spread * scale;
  ctx.save();
  ctx.shadowColor = `rgba(0, 0, 0, ${CARD_SHADOW.alpha})`;
  ctx.shadowBlur = CARD_SHADOW.blur * scale;
  ctx.shadowOffsetY = CARD_SHADOW.offsetY * scale;
  ctx.fillStyle = options.cardColor;
  ctx.beginPath();
  ctx.roundRect(
    cardX + inset,
    cardY + inset,
    cardSize - inset * 2,
    cardSize - inset * 2,
    Math.max(0, cardRadius - inset),
  );
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = options.cardColor;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardSize, cardSize, cardRadius);
  ctx.fill();

  const qr = await renderQrCanvas({ ...options, size: qrSize });
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, qrSize, qrSize, qrRadius);
  ctx.clip();
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  ctx.restore();

  const cap = options.caption;
  if (cap?.enabled && cap.text.trim()) {
    const { fontSizePx, textX, textY } = captionGeometry(
      cap,
      cardX,
      cardY,
      cardSize,
      width,
      scale,
    );
    ctx.save();
    ctx.font = `${CAPTION_FONT_WEIGHTS[cap.fontWeight]} ${fontSizePx}px ${CAPTION_FONT_FAMILIES[cap.fontFamily]}`;
    ctx.fillStyle = cap.color;
    ctx.textAlign = cap.align;
    ctx.textBaseline = "top";
    ctx.fillText(cap.text, textX, textY);
    ctx.restore();
  }

  return canvas;
}

export async function renderFramedQrSvg(
  options: ExportFrameOptions,
): Promise<string> {
  const { width, height } = getFrameSize(options.frame, options.size);
  const minSide = Math.min(width, height);
  const cardSize = Math.round(minSide * 0.7);
  const scale = cardSize / PREVIEW_CARD_REFERENCE_SIZE;
  const cardPad = Math.round(
    (options.qrPadding / PREVIEW_CARD_REFERENCE_SIZE) * cardSize,
  );
  const qrSize = Math.max(128, cardSize - cardPad * 2);
  const cardX = (width - cardSize) / 2;
  const cardY = groupCenteredCardY(height, cardSize, options.caption, scale);
  const cardRadius = (cardSize * CARD_RADIUS) / CARD_REFERENCE_SIZE;
  const qrX = cardX + cardPad;
  const qrY = cardY + cardPad;
  const qrRadius = Math.round(
    (PREVIEW_QR_RADIUS /
      (PREVIEW_CARD_REFERENCE_SIZE - options.qrPadding * 2)) *
      qrSize,
  );
  const shadowInset = -CARD_SHADOW.spread * scale;
  // Embed QR as a data URL image — avoids coordinate-system issues when
  // splicing the QR library's raw SVG body into an outer SVG document.
  const qrSvg = await renderQrSvg({ ...options, size: qrSize });
  const qrDataUrl = `data:image/svg+xml,${encodeURIComponent(qrSvg)}`;

  let captionSvg = "";
  const cap = options.caption;
  if (cap?.enabled && cap.text.trim()) {
    const { fontSizePx, textX, textY } = captionGeometry(
      cap,
      cardX,
      cardY,
      cardSize,
      width,
      scale,
    );
    const anchorMap: Record<QrCaption["align"], string> = {
      left: "start",
      center: "middle",
      right: "end",
    };
    // textY is the glyph top (canvas textBaseline="top"). SVG dominant-baseline="middle"
    // expects the glyph center, so shift down by half the font height.
    const svgY = textY + fontSizePx / 2;
    captionSvg = `<text x="${textX}" y="${svgY}" font-family="${escapeSvgAttribute(CAPTION_FONT_FAMILIES[cap.fontFamily])}" font-size="${fontSizePx}" font-weight="${CAPTION_FONT_WEIGHTS[cap.fontWeight]}" fill="${escapeSvgAttribute(cap.color)}" text-anchor="${anchorMap[cap.align]}" dominant-baseline="middle">${escapeSvgText(cap.text)}</text>`;
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    sceneToSvg(
      buildExportScene(
        options.previewBackground,
        width,
        height,
        cardX,
        cardY,
        cardSize,
      ),
      // Embed the emoji exactly as rendered here, not with the viewer's font.
      { glyphHref: glyphDataUrl },
    ),
    `<defs><clipPath id="qr-inner-clip"><rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" rx="${qrRadius}" ry="${qrRadius}"/></clipPath><filter id="card-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(CARD_SHADOW.blur * scale) / 2}"/></filter></defs>`,
    `<path d="${roundedRectPath(cardX + shadowInset, cardY + shadowInset + CARD_SHADOW.offsetY * scale, cardSize - shadowInset * 2, cardSize - shadowInset * 2, Math.max(0, cardRadius - shadowInset))}" fill="#000" opacity="${CARD_SHADOW.alpha}" filter="url(#card-shadow)"/>`,
    `<path d="${roundedRectPath(cardX, cardY, cardSize, cardSize, cardRadius)}" fill="${escapeSvgAttribute(options.cardColor)}"/>`,
    `<image href="${qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" clip-path="url(#qr-inner-clip)"/>`,
    captionSvg,
    "</svg>",
  ].join("");
}
