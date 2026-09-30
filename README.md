# QR Pixel
<img width="2172" height="724" alt="image" src="https://github.com/user-attachments/assets/448b42d3-8ee9-4dc2-8003-4a0a2256aca6" />

**Beautiful pixel-perfect QR codes in seconds**

QR Pixel is a modern single-page QR code generator built with Next.js 16, React 19, Tailwind CSS 4, and `qr-code-styling`. It provides a premium glass-style interface for creating, customizing, previewing, and exporting QR codes instantly.

The app supports multiple QR content types, custom QR styling, logo uploads, randomized themes, live preview, and PNG/SVG export.

---

## Preview

QR Pixel provides a full-screen QR studio with:

- Floating glass header
- Centered live QR preview
- Bottom control dock
- QR customization controls
- Backdrop pattern customization
- Logo upload
- PNG and SVG export

---

## Features

### QR Content Types

QR Pixel supports multiple payload types:

- URL
- Text
- Email
- Phone
- Wi-Fi

Each content type has validation and payload generation handled by the shared QR logic.

---

### Live QR Preview

The QR preview updates instantly when the user changes:

- Content
- QR colors
- QR dot style
- Corner style
- Background color
- Card color
- Padding
- Logo image
- Backdrop style

---

### QR Customization

Users can customize:

- Foreground color
- QR background color
- Card color
- Dot/module style
- Corner frame style
- Corner dot style
- QR padding
- Export size
- Error correction level

Supported QR styles include:

- Square
- Dots
- Rounded
- Extra rounded
- Classy
- Classy rounded

---

### Backdrop Styles

QR Pixel includes multiple visual backdrop modes:

- Solid
- Dots
- Grid
- Diagonal
- Emoji wallpaper (up to 6 emoji at once)
- Confetti (procedural shapes in a derived palette)
- Aurora (soft gradient blobs)

Emoji wallpapers come in five layouts, inspired by Android's emoji wallpapers:

- Sprinkle: jittered positions, random sizes and tilt, occasional oversized "hero" emoji
- Burst: concentric rings radiating from the QR card
- Wave: rows that follow a seeded sine wave
- Spiral: golden-angle phyllotaxis (sunflower-seed packing) around the card
- Mosaic: staggered hex rows with clustered emoji and tiered sizes
- Tiles: an even, cycling grid

Every layout is procedural: each cell is hashed from `(seed, x, y)` counted
outward from the card centre, so the same seed always gives the same
wallpaper. Preview and export share one renderer
(`src/lib/background-scene.ts`), so a PNG or SVG in any frame shows the same
arrangement around the card as the screen. **Shuffle** rolls a new seed.

---

### Logo Upload

Users can upload a custom logo to embed inside the QR code.

Current upload limit:

- Maximum file size: 2 MB

---

### Export Options

QR Pixel supports exporting QR codes as:

- PNG
- SVG

Export includes:

- QR code
- Card styling
- Backdrop styling
- Padding
- Colors
- Logo image

Supported export canvas formats:

- Square
- Portrait
- Desktop

---

### Randomizer

QR Pixel generates themes with a small genetic engine
(`src/lib/engine/`) instead of fixed templates.

- **Genome.** A theme is a set of genes: continuous ones (base hue, harmony
  angle, mood/lightness, vibrancy, pattern pop, card tint, ink colour,
  density, caption size) and categorical ones (pattern, emoji layout, emoji
  set, QR shapes, typography, wallpaper seed).
- **Roll (`R` or Surprise).** Samples a new genome from a random 32-bit seed.
- **Evolve (`E`).** Mutates the current genome: small Gaussian drift on the
  continuous genes and occasional flips of categorical ones. If you edited
  colours by hand, the engine infers a genome from the screen first, so your
  tweaks carry into the evolution.
- **Wildness (0–100).** One temperature dial. Low values keep hues near
  classic harmonies (analogous, triadic, complementary…), prefer clearly light
  or dark moods, and favour popular patterns; high values widen the harmony
  spread, allow murky mid-tones, flatten pattern/layout odds toward uniform,
  and mix emoji across themes.
- **Expression.** Genes become colours in OKLCH (perceptually uniform, gamut
  mapped to sRGB) under hard constraints: QR ink ≥ 7:1 contrast and always
  darker than its background, pattern at least 0.14 OKLCH lightness away from
  the backdrop, caption ≥ 3.5:1 against the backdrop.
- **Names** are derived from the genes, e.g. "Midnight Teal · Ocean spiral".

Every roll shows its name in a toast with an **Undo** action. Lock chips in
the Customize panel ("Surprise keeps Colors / Backdrop / Shapes") keep those
parts while the engine changes the rest.

---

### History, Autosave, and Scannability

- Undo / redo for every change (`⌘Z` / `⇧⌘Z`, or the dock buttons). Slider
  drags and colour-picker scrubs merge into a single step.
- The design autosaves to `localStorage` and is restored on the next visit.
  Saved data is validated field by field, so stale or edited payloads fall
  back to defaults instead of breaking the app.
- The QR colour section shows a live contrast badge (safe at 7:1 or more,
  warning below 4:1 or when light modules sit on a dark field) with a one-click
  **Fix**.
- **Copy image** puts the framed PNG on the clipboard.

A reset action is also available to return the QR state to the default design.

---

### GraphQL Payload Builder

QR Pixel includes a GraphQL endpoint for QR payload validation and generation.

Endpoint:

```txt
POST /api/graphql
