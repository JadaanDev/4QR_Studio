# Assets Directory
> Pure Vanilla Assets for Jadaan.Dev — **Zero Tailwind Dependency**

This directory hosts standalone assets (fonts loader, CSS tokens, UI component classes, and raw SVG vector icons) allowing any web project to adopt the **Onyx Dark Minimal** design system using standard web standards without needing Tailwind installed.

---

## 📁 Directory Structure

```
site/styling-ref/assets/
├── fonts.css         # 100% Offline @font-face rules pointing to local ./fonts/
├── fonts/            # 56 downloaded .woff2 font files (IBM Plex Sans Arabic, Inter, JetBrains Mono)
├── tokens.css        # Pure CSS custom properties (:root variables), dark body base & ::selection
├── components.css    # Reusable vanilla classes (.link-card, .ambient-glow, .flip-icon, physics)
├── README.md         # This asset documentation
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

## 🚀 Quick Start (Vanilla HTML & CSS)

Simply include the CSS files in your HTML `<head>`:

```html
<head>
    <!-- 1. Typography (IBM Plex Sans Arabic, Inter, JetBrains Mono) -->
    <link rel="stylesheet" href="assets/fonts.css">

    <!-- 2. Core Tokens (Colors, Physics Curves, Selection, Scrollbars) -->
    <link rel="stylesheet" href="assets/tokens.css">

    <!-- 3. Component Classes (.link-card, .ambient-glow, .flip-icon, etc.) -->
    <link rel="stylesheet" href="assets/components.css">
</head>
```

### Using the Raw SVG Icons

Directly embed as an `<img>` tag or inline in HTML:
```html
<img src="assets/icons/x.svg" alt="X" width="16" height="16" />
<img src="assets/icons/globe.svg" alt="Switch Language" width="16" height="16" />
```
