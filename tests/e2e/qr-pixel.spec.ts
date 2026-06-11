import { expect, type Page, test } from "@playwright/test";

async function gotoReady(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "QR Pixel is loading" }),
  ).toBeHidden({
    timeout: 3000,
  });
}

test("shows the first-open splash screen once per session", async ({
  page,
}) => {
  await page.goto("/");

  const splash = page.getByRole("status", { name: "QR Pixel is loading" });
  await expect(splash).toBeVisible();
  await expect(page.getByText("[Preparing your QR studio]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "QR Pixel" })).toBeHidden();
  await expect(splash).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole("heading", { name: "QR Pixel" })).toBeVisible();

  await page.reload();

  await expect(splash).toBeHidden();
});

test("generates a QR preview from a URL", async ({ page }) => {
  await gotoReady(page);

  await expect(page.getByRole("heading", { name: "QR Pixel" })).toBeVisible();
  await expect(page.getByText("Nothing to encode yet")).toBeVisible();

  await page.getByLabel("Link").fill("example.com");

  await expect(
    page.getByRole("img", { name: "QR code preview" }),
  ).toBeVisible();
  await expect(page.getByText("Nothing to encode yet")).toBeHidden();
});

test("shows validation for invalid URL content", async ({ page }) => {
  await gotoReady(page);

  await page.getByLabel("Link").fill("example");

  await expect(
    page.getByRole("main").getByText("Enter a full domain, e.g. example.com"),
  ).toBeVisible();
  await expect(page.getByText("Can’t generate QR code")).toBeVisible();
});

test("exposes installable PWA metadata and service worker", async ({
  page,
}) => {
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()["content-type"]).toMatch(
    /application\/manifest\+json/,
  );

  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: "QR Pixel",
    short_name: "QR Pixel",
    start_url: "/",
    display: "standalone",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/icons/icon.svg",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/maskable-icon.svg",
        purpose: "maskable",
      }),
    ]),
  );

  const swResponse = await page.request.get("/sw.js");
  expect(swResponse.ok()).toBe(true);
  expect(swResponse.headers()["content-type"]).toMatch(
    /application\/javascript/,
  );
  expect(swResponse.headers()["cache-control"]).toMatch(/no-cache/);
});

test("builds payloads through the GraphQL API", async ({ page }) => {
  const response = await page.request.post("/api/graphql", {
    data: {
      query: `
        mutation Build($input: QrInput!) {
          buildPayload(input: $input) {
            payload
            validation { ok }
          }
        }
      `,
      variables: {
        input: {
          type: "wifi",
          wifi: {
            ssid: "Studio",
            password: "secret",
            encryption: "WPA",
            hidden: true,
          },
        },
      },
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toMatch(/no-store/);
  await expect(await response.json()).toEqual({
    data: {
      buildPayload: {
        payload: "WIFI:T:WPA;S:Studio;P:secret;H:true;;",
        validation: { ok: true },
      },
    },
  });
});

test("serves AE1-style generated Open Graph image", async ({ page }) => {
  const response = await page.request.get(
    "/api/og?type=Share&title=QR%20Pixel%20Studio&link=https%3A%2F%2Fqr-pixel.local",
  );

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/image\/png/);
  expect((await response.body()).byteLength).toBeGreaterThan(10_000);
});

test("shows AE1-style debug HUD when enabled", async ({ page }) => {
  await gotoReady(page);

  await page.keyboard.press("Control+D");

  await expect(page.getByText("Viewport")).toBeVisible();
  await expect(page.getByText("Service worker")).toBeVisible();
  await expect(page.getByText("View transitions")).toBeVisible();
});
