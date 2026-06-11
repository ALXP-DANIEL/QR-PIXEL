import fs from "node:fs";
import { chromium } from "playwright";

const URL = "http://localhost:3000";
const SHOTS = "/tmp/qr-shots-v2";
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const step = (name, ok, extra = "") => {
  results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

const toastVisible = async (text) => {
  try {
    await page
      .locator("[data-sonner-toast]", { hasText: text })
      .first()
      .waitFor({ state: "visible", timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1200); // let entrance animations + dynamic glass settle
await page.screenshot({ path: `${SHOTS}/01-empty-light.png` });

step(
  "header heading",
  await page.getByRole("heading", { name: "QR Pixel" }).isVisible(),
);
step(
  "empty state inside glass",
  await page.getByText("Nothing to encode yet").isVisible(),
);
const glassFilters = await page.locator("svg filter").count();
step(
  "liquid glass SVG filter mounted",
  glassFilters > 0,
  `filters=${glassFilters}`,
);
step(
  "dock visible after spring entrance",
  await page.getByRole("button", { name: "PNG" }).isVisible(),
);

// Live QR
await page.getByLabel("Link").fill("example.com");
await page.waitForTimeout(800);
step(
  "canvas appears after typing URL",
  await page.getByRole("img", { name: "QR code preview" }).isVisible(),
);
const darkPixels = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let dark = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 100 && d[i + 3] > 200) dark++;
  }
  return dark;
});
step("canvas painted", darkPixels > 10000, `darkPixels=${darkPixels}`);
await page.screenshot({ path: `${SHOTS}/02-url-qr-light.png` });

// Type pill animation: switch type, ensure form swaps and pill follows
await page.getByRole("button", { name: "Text" }).click();
await page.waitForTimeout(600);
step(
  "type switch shows textarea",
  await page.getByLabel("Text", { exact: true }).isVisible(),
);
await page.screenshot({ path: `${SHOTS}/03-type-text.png` });
await page.getByRole("button", { name: "URL" }).click();
await page.waitForTimeout(400);
step(
  "switch back keeps URL value",
  (await page.getByLabel("Link").inputValue()) === "example.com",
);

// Tab transition
await page.getByRole("tab", { name: "Style" }).click();
await page.waitForTimeout(500);
step(
  "style tab content animates in",
  await page.getByText("Export size").isVisible(),
);
await page.getByRole("tab", { name: "Content" }).click();
await page.waitForTimeout(400);

// Invalid -> error overlay inside glass
await page.getByLabel("Link").fill("abc");
await page.waitForTimeout(600);
step(
  "invalid shows error card in glass",
  await page.getByText("Can’t generate QR code").isVisible(),
);
await page.getByLabel("Link").fill("example.com");
await page.waitForTimeout(700);
step(
  "recovers to canvas after fix",
  await page.getByRole("img", { name: "QR code preview" }).isVisible(),
);

// Downloads still work
const pngDl = page.waitForEvent("download");
await page.getByRole("button", { name: "PNG" }).click();
const png = await pngDl;
step("PNG download", png.suggestedFilename() === "qr-pixel.png");
step("download toast", await toastVisible("PNG downloaded"));

// Dark mode with glass
await page.getByRole("button", { name: "Toggle theme" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/04-dark.png` });
step(
  "dark mode",
  await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  ),
);
await page.getByRole("button", { name: "Toggle theme" }).click();
await page.waitForTimeout(300);

// Reset still returns to content tab + empty
await page.getByRole("tab", { name: "Style" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Reset all settings" }).click();
await page.waitForTimeout(600);
step(
  "reset -> empty state",
  await page.getByText("Nothing to encode yet").isVisible(),
);
step(
  "reset -> content tab",
  (await page
    .getByRole("tab", { name: "Content" })
    .getAttribute("aria-selected")) === "true",
);

// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.getByLabel("Link").fill("example.com");
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/05-mobile.png` });
const dockBox = await page.locator(".glass-panel.rounded-3xl").boundingBox();
step(
  "mobile dock width",
  dockBox !== null && dockBox.width > 350,
  `w=${dockBox?.width}`,
);
const canvasBox = await page.locator("canvas").boundingBox();
step(
  "mobile QR clear of dock",
  canvasBox !== null &&
    dockBox !== null &&
    canvasBox.y + canvasBox.height <= dockBox.y + 1,
  `canvasBottom=${canvasBox ? Math.round(canvasBox.y + canvasBox.height) : "?"} dockTop=${dockBox ? Math.round(dockBox.y) : "?"}`,
);

await browser.close();

console.log(results.join("\n"));
console.log(
  `\nConsole errors: ${consoleErrors.length === 0 ? "none" : `\n${consoleErrors.join("\n")}`}`,
);
