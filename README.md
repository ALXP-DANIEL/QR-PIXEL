# QR Pixel

QR Pixel is a production-ready Next.js 16 App Router tool for generating polished QR codes from URLs, free text, email links, phone numbers, and Wi-Fi credentials. The app renders a live QR preview in the browser, supports light/dark themes, lets users tune export size and error correction, and exports PNG or SVG files.

## Stack

- Next.js 16.2 App Router with React 19
- Tailwind CSS 4 and shadcn/base-ui-style primitives
- Biome for linting and formatting
- Vitest for QR payload unit tests
- Playwright for browser smoke tests
- Docker standalone output for production containers
- GitHub Actions CI plus GHCR image publishing
- Graphify code graph indexing under `graphify-out/`
- PWA manifest, service worker, offline fallback, install icons, and splash metadata
- GraphQL endpoint for QR validation and payload generation
- Maintenance-mode, wrapper loader, and dev HUD patterns adapted from the AE1.TECH revamp repo
- Config-driven SEO metadata and dynamic Open Graph image route adapted from the older AE1.TECH layout

## Local Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Verification

Run the full local gate:

```bash
npm run verify
```

Individual checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Playwright starts the standalone production server from the latest `npm run build` output. The `start` script mirrors the Docker runtime by copying `.next/static` and `public/` into `.next/standalone/` before launching `server.js`. If the build is stale, run `npm run build` before `npm run test:e2e`.

## Docker

Build and run the production image:

```bash
npm run docker:build
npm run docker:run
```

Or use Compose:

```bash
docker compose up --build
```

The container exposes port `3000` and runs the Next standalone server from `.next/standalone`.

## PWA

QR Pixel ships as an installable PWA:

- `src/app/manifest.ts` generates `/manifest.webmanifest`.
- `public/sw.js` caches the app shell and serves the generator while offline.
- `public/offline.html` is the fallback if the shell has not been cached yet.
- `public/icons/` contains install and maskable icons.
- `public/splash/` contains startup/screenshot artwork referenced by metadata and the manifest.

Service-worker headers are defined in `next.config.ts` so browsers receive `sw.js` as JavaScript with no stale caching.

## GraphQL

The QR payload engine is exposed at `POST /api/graphql`.

Example:

```bash
curl -s http://localhost:3000/api/graphql \
  -H 'content-type: application/json' \
  -d '{
    "query": "mutation Build($input: QrInput!) { buildPayload(input: $input) { payload validation { ok message } } }",
    "variables": {
      "input": {
        "type": "url",
        "url": { "url": "example.com" }
      }
    }
  }'
```

Useful operations:

- `query { health { ok name } }`
- `query { qrTypes { id label } }`
- `query Preview($input: QrInput!) { preview(input: $input) { payload validation { ok field message } } }`
- `mutation Build($input: QrInput!) { buildPayload(input: $input) { payload validation { ok field message } } }`

## Metadata And OG

Metadata is driven by `src/config/site.ts`, following the AE1.TECH pattern where the layout reads from one site config object.

Implemented metadata includes:

- title template
- description and keywords
- authors, creator, and publisher
- Open Graph website metadata
- Twitter summary image metadata
- robots and Googlebot directives
- manifest, icons, Apple PWA metadata, and viewport theme colors

Dynamic OG images are served from `GET /api/og`:

```txt
/api/og?type=Share&title=QR%20Pixel%20Studio&link=https%3A%2F%2Fqr-pixel.local
```

## Runtime Flags

QR Pixel includes two small operational switches inspired by the AE1.TECH revamp layout:

- `NEXT_PUBLIC_APP_URL` sets the canonical app URL used by metadata and Open Graph images. Use your production domain in deployed environments.
- `QR_PIXEL_MAINTENANCE=true` renders a focused maintenance screen instead of the generator.
- `NEXT_PUBLIC_QR_PIXEL_DEBUG=true` enables a compact dev HUD in production builds. In development, the HUD is enabled automatically. Press `Ctrl+D` or click `DEV` to toggle details.

## CI/CD

`.github/workflows/ci.yml` runs on pushes to `main` and pull requests:

1. Install dependencies with `npm ci`.
2. Cache `.next/cache` for faster builds.
3. Install Chromium for Playwright.
4. Run lint, typecheck, unit tests, production build, and E2E tests.
5. Upload the Playwright HTML report as an artifact.

`.github/workflows/docker-publish.yml` builds and publishes the Docker image to GitHub Container Registry on `main`, version tags, or manual dispatch.

## Graphify

Refresh the focused code graph:

```bash
npm run graphify:update
```

The wrapper copies only source, tests, key configs, Docker files, and this README into a temporary scope before indexing, then writes results to `graphify-out/`.

Useful outputs:

- `graphify-out/graph.html`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/manifest.json`

## Production Notes

- Runtime uses Node 24 Alpine and the Next standalone server.
- No runtime secrets are required for the current local QR/PWA/GraphQL feature set.
- Keep `next.config.ts` on `output: "standalone"` so Docker receives minimal server output.
- Run `npm audit` before release and triage production-impacting advisories separately from dev-tool advisories.
