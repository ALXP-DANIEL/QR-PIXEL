# Graph Report - qr-pixel-graphify-scope  (2026-06-11)

## Corpus Check
- 45 files · ~9,310 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 227 nodes · 405 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `664659b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 15 edges
4. `QR Pixel` - 12 edges
5. `QrType` - 9 edges
6. `Button()` - 8 edges
7. `EcLevel` - 8 edges
8. `QrFields` - 8 edges
9. `ValidationResult` - 8 edges
10. `buildPayload()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  src/app/layout.tsx → src/lib/utils.ts
- `PixelMark()` --calls--> `cn()`  [EXTRACTED]
  src/components/qr/pixel-mark.tsx → src/lib/utils.ts
- `QrPreviewProps` --references--> `EcLevel`  [EXTRACTED]
  src/components/qr/qr-preview.tsx → src/lib/qr.ts
- `QrPreview()` --calls--> `cn()`  [EXTRACTED]
  src/components/qr/qr-preview.tsx → src/lib/utils.ts
- `StyleControlsProps` --references--> `QrState`  [EXTRACTED]
  src/components/qr/style-controls.tsx → src/lib/qr.ts

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (28): EC_LEVEL_LABELS, WifiEncryption, cn(), QR_TYPES, TYPE_ICONS, WIFI_ENCRYPTION_LABELS, StyleControls(), Card() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (23): fieldsFromInput(), GraphQlQrInput, isGraphQlInputEmpty(), PayloadResult, qrPixelRoot, qrPixelSchema, resolvePayload(), downloadBlob() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (15): geistMono, geistSans, jetbrainsMono, metadata, RootLayout(), viewport, siteConfig, Maintenance() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (13): FadeIn(), DebugInfo(), useViewportLabel(), ThemeToggle(), ContentForm(), ControlDock(), Button(), buttonVariants (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): devDependencies, babel-plugin-react-compiler, @biomejs/biome, @playwright/test, start-server-and-test, tailwindcss, @tailwindcss/postcss, @types/node (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (17): dependencies, @base-ui/react, class-variance-authority, clsx, graphql, liquid-glass-react, motion, next (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (15): scripts, build, dev, docker:build, docker:run, format, graphify:update, lint (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (11): EcLevel, containFit(), loadImage(), QrRenderOptions, renderQrCanvas(), renderQrSvg(), LiquidGlass, PreviewStatus (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): CI/CD, Docker, Graphify, GraphQL, Local Development, Metadata And OG, Production Notes, PWA (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.39
Nodes (6): GET(), GraphQlRequestBody, isVariables(), json(), POST(), executeQrPixelGraphQl()

## Knowledge Gaps
- **86 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 8`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 6` to `Community 5`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 7` to `Community 5`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11875843454790823 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10826210826210826 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._