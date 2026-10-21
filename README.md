# 4QR Studio 1.1.0

A WordPress admin tool for designing QR codes, editing dynamic links and viewing scan analytics. Built with React, TypeScript, Vite and Tailwind CSS.

## How it works

A dynamic QR encodes `https://your-site.com/q/your-link`. WordPress records the visit and issues a 302 redirect to the saved destination. Changing **Destination URL** updates where existing printed QRs send visitors.

The **QR Code Link** field lets editors choose or rename the suffix after `/q/`. Links allow 1–64 letters, numbers, hyphens or underscores and must be unique, ignoring case. Renaming preserves the code ID and scan history, but retires the previous URL. The editor requires acknowledgment before renaming a saved code. Download and replace any QRs containing the previous link.

Direct mode encodes the destination itself and bypasses plugin tracking. The mode is stored with the design; changing it requires downloading a new QR.

## Features

- Live QR preview, six patterns, corner choices, colors, transparency and logo upload. Some corner choices share renderer shapes; see the improvement plan.
- PNG, SVG and PDF exports; clipboard link and image actions. Save changes before exporting.
- My Codes with editing, link copying and deletion.
- Analytics totals, estimated unique visitors using salted IP hashes, daily visits, device/OS/browser breakdowns and up to 50 recent events in CSV. Refresh is manual; visits include ordinary link clicks.
- Management UI exclusively in **wp-admin → 4QR Studio**, with normal WordPress toolbar, sidebar and scrolling.
- Capability-protected REST endpoints under `qr-studio/v1`; users who can edit posts can manage all codes. Public visitors can follow active saved QR links without signing in.

## Installation and upgrade

1. Download `qr-wp-plugin.zip` from the GitHub release, or build it locally.
2. In WordPress, open **Plugins → Add New → Upload Plugin**, choose the ZIP and install it. For an upgrade, replace the existing plugin.
3. Activate, then open **4QR Studio** in the admin sidebar.
4. Enter a destination and QR Code Link, customize, save and download. Test a real scan before printing.

Requires WordPress 5.8+ and PHP 7.4+. Codes and scans remain in the existing custom database tables; v1.1.0 does not change the schema.

The former generator and analytics shortcodes have been removed. Delete their old text from any pages where you inserted them; the plugin does not edit page content automatically. It no longer embeds its UI or loads its assets on public pages. Public `/q/{slug}` redirects and the `?qr={slug}` fallback remain available.

## Development and verification

Use Node.js 22.12+ and PHP with PDO SQLite for the mocked backend tests.

```sh
npm ci
npm run dev
npm run typecheck
npm run test:api
php tests/test_backend.php
php tests/test_admin.php
npm run build
python make_zip.py --rebuild --method zipfile
```

The Vite development preview uses browser local storage. It does not provide WordPress redirects or real scan collection. Production management bundles mount only with the WordPress admin bootstrap.

The ZIP contains PHP, compiled `dist/`, runtime assets and documentation inside one `qr-wp-plugin/` folder. Source, tests and `node_modules` are excluded.

## GitHub delivery

Pushes to `main` and pull requests run verification and produce an installable ZIP artifact. Push a matching version tag, such as `v1.1.0`, to run verification again and publish a GitHub Release with the ZIP attached. Installing that release on a live WordPress site is a separate action.

- [UI/UX improvement plan](UI-UX-PLAN.md): complete journeys, priorities, acceptance checks and delivery roadmap, with shipped work separated from future work.
- [Changelog and upgrade notes](CHANGELOG.md).

Local mocked tests and layout fixtures do not replace installation and scanning tests on a real WordPress/MySQL staging site.
