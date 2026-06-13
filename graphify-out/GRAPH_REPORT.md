# Graph Report - .  (2026-06-13)

## Corpus Check
- Corpus is ~17,904 words - fits in a single context window. You may not need a graph.

## Summary
- 396 nodes · 686 edges · 32 communities (20 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.81)
- Token cost: 4,200 input · 1,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_QR Content Forms UI|QR Content Forms UI]]
- [[_COMMUNITY_QR State & Caption Types|QR State & Caption Types]]
- [[_COMMUNITY_App Layout & Fonts|App Layout & Fonts]]
- [[_COMMUNITY_QR Render Engine|QR Render Engine]]
- [[_COMMUNITY_Build Tooling & Dependencies|Build Tooling & Dependencies]]
- [[_COMMUNITY_Linting & Code Style|Linting & Code Style]]
- [[_COMMUNITY_GraphQL API Route|GraphQL API Route]]
- [[_COMMUNITY_Export & Control Dock|Export & Control Dock]]
- [[_COMMUNITY_ShadCN Component Config|ShadCN Component Config]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_App Feature Set|App Feature Set]]
- [[_COMMUNITY_CICD & Docker Pipeline|CI/CD & Docker Pipeline]]
- [[_COMMUNITY_E2E Test Suite|E2E Test Suite]]
- [[_COMMUNITY_PWA & Offline Assets|PWA & Offline Assets]]
- [[_COMMUNITY_Graphify Update Script|Graphify Update Script]]
- [[_COMMUNITY_Agent & Dev Instructions|Agent & Dev Instructions]]
- [[_COMMUNITY_VS Code Permissions|VS Code Permissions]]
- [[_COMMUNITY_VS Code Launch Config|VS Code Launch Config]]
- [[_COMMUNITY_VS Code Tasks Config|VS Code Tasks Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_Serena AI Config|Serena AI Config]]
- [[_COMMUNITY_File SVG Icon|File SVG Icon]]
- [[_COMMUNITY_Globe SVG Icon|Globe SVG Icon]]
- [[_COMMUNITY_Next.js Wordmark|Next.js Wordmark]]
- [[_COMMUNITY_Vercel Logo|Vercel Logo]]
- [[_COMMUNITY_Window Browser Icon|Window Browser Icon]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 60 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 15 edges
4. `renderFramedQrSvg()` - 10 edges
5. `QrType` - 9 edges
6. `QR Pixel App Overview` - 9 edges
7. `Button()` - 8 edges
8. `EcLevel` - 8 edges
9. `QrDotStyle` - 8 edges
10. `QrCornerSquareStyle` - 8 edges

## Surprising Connections (you probably didn't know these)
- `App Icon SVG (QR Pattern, Rounded)` --conceptually_related_to--> `QR Pixel App Overview`  [INFERRED]
  public/icons/icon.svg → README.md
- `Docker Compose qr-pixel Service` --conceptually_related_to--> `GHCR Docker Image Publishing`  [INFERRED]
  docker-compose.yml → .github/workflows/docker-publish.yml
- `Desktop Splash Screen SVG` --conceptually_related_to--> `PWA Offline Support Strategy`  [INFERRED]
  public/splash/desktop.svg → public/offline.html
- `Mobile Splash Screen SVG` --conceptually_related_to--> `PWA Offline Support Strategy`  [INFERRED]
  public/splash/mobile.svg → public/offline.html
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  src/app/layout.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **PWA Asset Bundle (Icons + Splash Screens + Offline Page)** — icons_icon_svg, icons_maskable_icon_svg, splash_desktop_svg, splash_mobile_svg, offline_html_offline_page [INFERRED 0.85]
- **CI/CD Pipeline (CI Verify + Docker Publish + Docker Compose)** — ci_yml_workflow, docker_publish_yml_workflow, docker_compose_qr_pixel_service [INFERRED 0.85]
- **QR Customization Feature Set (Styles + Backdrop + Randomizer)** — readme_qr_customization, readme_backdrop_styles, readme_randomizer, readme_live_preview [INFERRED 0.80]

## Communities (32 total, 12 thin omitted)

### Community 0 - "QR Content Forms UI"
Cohesion: 0.09
Nodes (41): cn(), QR_TYPES, qrFieldsSchema, TYPE_ICONS, WIFI_ENCRYPTION_LABELS, Card(), CardAction(), CardContent() (+33 more)

### Community 1 - "QR State & Caption Types"
Cohesion: 0.08
Nodes (30): GraphQlQrInput, PayloadResult, CAPTION_ALIGN_LABELS, CAPTION_FONT_FAMILY_LABELS, CAPTION_FONT_WEIGHT_LABELS, CAPTION_POSITION_LABELS, CaptionAlign, CaptionFontWeight (+22 more)

### Community 2 - "App Layout & Fonts"
Cohesion: 0.09
Nodes (21): FadeIn(), geistMono, geistSans, jetbrainsMono, metadata, RootLayout(), viewport, siteConfig (+13 more)

### Community 3 - "QR Render Engine"
Cohesion: 0.13
Nodes (34): EcLevel, PreviewBackground, QrCaption, QrCornerDotStyle, QrCornerSquareStyle, QrDotStyle, QrExportFrame, CAPTION_FONT_FAMILIES (+26 more)

### Community 4 - "Build Tooling & Dependencies"
Cohesion: 0.06
Nodes (31): devDependencies, babel-plugin-react-compiler, @biomejs/biome, @playwright/test, start-server-and-test, tailwindcss, @tailwindcss/postcss, @types/node (+23 more)

### Community 5 - "Linting & Code Style"
Cohesion: 0.08
Nodes (25): source, assist, actions, next, react, files, ignoreUnknown, includes (+17 more)

### Community 6 - "GraphQL API Route"
Cohesion: 0.14
Nodes (20): GET(), GraphQlRequestBody, isVariables(), json(), POST(), executeQrPixelGraphQl(), fieldsFromInput(), isGraphQlInputEmpty() (+12 more)

### Community 7 - "Export & Control Dock"
Cohesion: 0.11
Nodes (21): downloadBlob(), CaptionFontFamily, CaptionPosition, ActivePanel, ControlDock(), BACKGROUND_PATTERNS, CAPTION_ALIGNS, CAPTION_FONT_FAMILIES (+13 more)

### Community 8 - "ShadCN Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @base-ui/react, class-variance-authority, clsx, graphql, @hookform/resolvers, motion, next (+11 more)

### Community 11 - "App Feature Set"
Cohesion: 0.25
Nodes (11): App Icon SVG (QR Pattern, Rounded), Maskable App Icon SVG (QR Pattern, Full Bleed), Backdrop Styles, Export Options (PNG/SVG), GraphQL Payload Builder Endpoint, Live QR Preview, Logo Upload Feature, QR Content Types (+3 more)

### Community 12 - "CI/CD & Docker Pipeline"
Cohesion: 0.33
Nodes (6): CI Verify Job, CI Workflow, GHCR Docker Image Publishing, Docker Compose qr-pixel Service, Docker Publish Job, Docker Publish Workflow

### Community 13 - "E2E Test Suite"
Cohesion: 0.33
Nodes (3): consoleErrors, pngDl, results

### Community 14 - "PWA & Offline Assets"
Cohesion: 0.67
Nodes (4): PWA Offline Support Strategy, PWA Offline Fallback Page, Desktop Splash Screen SVG, Mobile Splash Screen SVG

### Community 15 - "Graphify Update Script"
Cohesion: 0.83
Nodes (3): copy_if_exists(), run_graphify(), update-codebase-graphify.sh script

### Community 16 - "Agent & Dev Instructions"
Cohesion: 0.67
Nodes (3): Next.js Agent Rules, Claude Project Instructions, Next.js Breaking Changes Warning

## Knowledge Gaps
- **153 isolated node(s):** `allow`, `results`, `consoleErrors`, `pngDl`, `version` (+148 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `QR Content Forms UI` to `QR State & Caption Types`, `App Layout & Fonts`, `QR Render Engine`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Build Tooling & Dependencies`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `QrType` connect `QR State & Caption Types` to `QR Content Forms UI`, `GraphQL API Route`, `Export & Control Dock`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `allow`, `results`, `consoleErrors` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `QR Content Forms UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09098039215686274 - nodes in this community are weakly interconnected._
- **Should `QR State & Caption Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08305647840531562 - nodes in this community are weakly interconnected._
- **Should `App Layout & Fonts` be split into smaller, more focused modules?**
  _Cohesion score 0.08502024291497975 - nodes in this community are weakly interconnected._