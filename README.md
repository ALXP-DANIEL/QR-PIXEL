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
- Emoji pattern

These styles are shown both in the live preview and exported output.

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

The app includes a randomizer that generates different QR visual styles using randomized colors, patterns, and style combinations.

A reset action is also available to return the QR state to the default design.

---

### GraphQL Payload Builder

QR Pixel includes a GraphQL endpoint for QR payload validation and generation.

Endpoint:

```txt
POST /api/graphql
