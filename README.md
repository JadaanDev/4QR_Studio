# 4QR Studio - Dynamic QR Code Generator & Analytics WordPress Plugin (v1.0.0)

A high-conversion **Dynamic QR Code Generator** WordPress Plugin built with **React**, **TailwindCSS**, and **Vite**, featuring custom styles (patterns, frames, eyes, colors, transparency, logos), high-resolution downloads (PNG, SVG, PDF), and real-time **Scan Analytics Tracking**.

Matches the **Jadaan.Dev Onyx Minimal Foundation** with self-hosted offline fonts and vector icons.

---

## 🎨 Asset Structure (100% Offline / Zero-CDN)
```text
assets/
├── fonts.css         # 100% Offline @font-face rules pointing to local ./fonts/
├── fonts/            # 56 downloaded .woff2 font files (IBM Plex Sans Arabic, Inter, JetBrains Mono)
├── tokens.css        # Pure CSS custom properties (:root variables), dark body base & ::selection
├── components.css    # Reusable vanilla classes (.link-card, .ambient-glow, .flip-icon, physics)
├── README.md         # Asset documentation
└── icons/            # Scalable, optimized vector SVG icons
    ├── x.svg             # X / Twitter brand mark
    ├── telegram.svg      # Telegram brand icon
    ├── telegram-chat.svg # Telegram direct chat icon
    ├── github.svg        # GitHub Octocat mark
    ├── tiktok.svg        # TikTok brand icon
    ├── youtube.svg       # YouTube brand icon
    ├── mail.svg          # Direct email icon
    ├── globe.svg         # Internationalization language toggle globe
    ├── chevron.svg       # Direction-aware arrow chevron
    ├── copy.svg          # Clipboard copy icon
    └── check.svg         # Confirmation checkmark icon
```

---

## ✨ Features (v1.0.0)

### 1. Visual Designer (4QR Studio)
- **Top Header Bar**: Clean back button, inline editable title, short link with 1-click clipboard copy, and dynamic destination URL editor.
- **Pattern Selector**: 6 distinct module patterns (Square, Rounded, Extra-Rounded, Classy curves, Dots, and Classy-Rounded).
- **Corners Style**:
  - **7 Outer Frame Styles**: Square, Circle, Rounded, Heavy, Extra-Rounded, Leaf frame, and Dotted/Gear frame.
  - **7 Inner Eye Styles**: Square, Circle, Rounded, Diamond, Teardrop/Leaf, Grid (3x3), and Dot.
- **Colors & Transparency**:
  - Pattern and background color pickers with hex inputs.
  - iOS-style **Transparent background** toggle switch.
  - Scanner contrast advisory tip.
- **Logo Integration**: Logo file upload (`+` card), live thumbnail preview, size and margin sliders, and removal button.
- **Preview & Export**:
  - Real-time SVG preview.
  - Formats: **PNG**, **SVG**, **PDF** (A4 layout via jsPDF).
  - **Copy QR Link** and **Copy Image** directly to clipboard.

---

### 2. Dynamic Shortlinks & Analytics Tracking
- **Dynamic Short Links**: `/q/{slug}` (with fallback query parameter `?qr={slug}`).
- **Privacy-Safe Scan Logger**:
  - Custom MySQL table `wp_qr_scans`.
  - SHA-256 anonymized visitor hashing.
  - Device breakdown (Mobile, Tablet, Desktop).
  - Operating systems (iOS, Android, Windows, macOS, Linux).
  - Browsers (Safari, Chrome, Firefox, Edge, Opera).
- **Analytics Dashboard**:
  - Metric cards: Total Scans, Unique Visitors, Active Codes, Top Device.
  - 14-day scan timeline chart.
  - Recent scan events log table with **Export CSV**.

---

### 3. WordPress Integration
- **Admin Menu**: **4QR Studio** menu with submenus for Generator, Analytics, and My Codes.
- **Frontend Shortcodes**:
  - `[qr_generator]`: Embeds the visual QR designer.
  - `[qr_analytics]`: Embeds the analytics dashboard.
- **Empty Starting State**: Zero mock or pre-seeded data; ready for clean production deployment.

---

## 📦 Packaging with Windows 11 Native Compression

Run the included Python packager:
```bash
python make_zip.py --rebuild
```
This produces `qr-wp-plugin.zip` containing all runtime code, assets, fonts, icons, and compiled frontend assets ready for **Plugins → Add New → Upload Plugin**.
