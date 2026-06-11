# Graph Report - qr-pixel-graphify-scope  (2026-06-12)

## Corpus Check
- 46 files · ~13,316 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 286 nodes · 563 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01e72247`
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
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 59 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 15 edges
4. `QrType` - 9 edges
5. `Features` - 9 edges
6. `Button()` - 8 edges
7. `EcLevel` - 8 edges
8. `QrDotStyle` - 8 edges
9. `QrCornerSquareStyle` - 8 edges
10. `QrCornerDotStyle` - 8 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  src/app/layout.tsx → src/lib/utils.ts
- `ControlDockProps` --references--> `QrState`  [EXTRACTED]
  src/components/qr/control-dock.tsx → src/lib/qr.ts
- `ImagePanel()` --calls--> `cn()`  [EXTRACTED]
  src/components/qr/control-dock.tsx → src/lib/utils.ts
- `PixelMark()` --calls--> `cn()`  [EXTRACTED]
  src/components/qr/pixel-mark.tsx → src/lib/utils.ts
- `QrPreview()` --calls--> `cn()`  [EXTRACTED]
  src/components/qr/qr-preview.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (13 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (50): PREVIEW_BACKGROUND_PATTERN_LABELS, QR_EXPORT_FRAME_LABELS, cn(), ContentForm(), QR_TYPES, qrFieldsSchema, TYPE_ICONS, WIFI_ENCRYPTION_LABELS (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): FadeIn(), geistMono, geistSans, jetbrainsMono, metadata, RootLayout(), viewport, siteConfig (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (32): EC_LEVEL_LABELS, EcLevel, PreviewBackground, QR_CORNER_DOT_STYLE_LABELS, QR_CORNER_SQUARE_STYLE_LABELS, QR_DOT_STYLE_LABELS, QrCornerDotStyle, QrCornerSquareStyle (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (31): devDependencies, babel-plugin-react-compiler, @biomejs/biome, @playwright/test, start-server-and-test, tailwindcss, @tailwindcss/postcss, @types/node (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (27): GET(), GraphQlRequestBody, isVariables(), json(), POST(), executeQrPixelGraphQl(), fieldsFromInput(), GraphQlQrInput (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (17): downloadBlob(), PreviewBackgroundPattern, SAFE_BACKGROUND_EMOJIS, ActivePanel, BACKGROUND_PATTERNS, createDownloadFilename(), createRandomTheme(), FILENAME_ADJECTIVES (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (19): dependencies, @base-ui/react, class-variance-authority, clsx, graphql, @hookform/resolvers, motion, next (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (11): Backdrop Styles, Export Options, Features, GraphQL Payload Builder, Live QR Preview, Logo Upload, Preview, QR Content Types (+3 more)

## Knowledge Gaps
- **94 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 7` to `Community 3`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06804214223002635 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08502024291497975 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1241565452091768 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._