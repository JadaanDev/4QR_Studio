# 4QR Studio — UI/UX and ease-of-use plan

**Version:** 1.1.0 · **Date:** 21 October 2026

## What a successful experience feels like

A site editor should be able to create, save and download a working QR in under two minutes without knowing how QR encoding, WordPress rewrites or REST endpoints work. A returning editor should find the right campaign, change its destination confidently and understand its scan results.

The product lives in **WordPress → 4QR Studio**. WordPress keeps its toolbar, sidebar, notices and normal scrolling. Only the public `/q/{link}` redirect is available outside the dashboard.

## Release scope at a glance

| Area | Shipped in 1.1.0 | Next improvement |
|---|---|---|
| QR Code Link | Editable suffix, live preview, format validation, duplicate errors | Debounced availability check and suggested alternatives |
| Existing printed QRs | Rename warning and explicit acknowledgment; history retained | Optional permanent aliases for previous links |
| Saving | Visible errors, saved/unsaved message, exports require save | Dirty-state guard when leaving the designer |
| Link mode | Dynamic/direct choice saved with the design | Simpler language and a first-use explanation |
| WordPress layout | Admin-only UI; toolbar offsets preserved; responsive navigation | Validate a wider matrix of admin themes, RTL and zoom |
| Help | Practical link, access and analytics guidance | Contextual examples and searchable help |
| Analytics | Existing totals, device breakdown, manual refresh, recent CSV | Date ranges, complete exports and clearer visit definitions |
| Release delivery | Checks on main/PR pushes; ZIP attached to version-tag releases | Automated WordPress integration and browser regression tests |

Everything in the final column and later roadmap sections is **planned**, not implemented in 1.1.0.

## 1. Navigation and information structure

Keep four destinations with the same names in WordPress and the app:

1. **My Codes** — the eventual default home: find campaigns and see their status.
2. **Create QR / Designer** — destination, link, appearance and download.
3. **Analytics** — overall results and results for one campaign.
4. **Settings & Help** — access, defaults and explanations.

Primary action: **Create QR Code**. Avoid multiple competing primary buttons. In the designer, **Save QR Code** becomes **Save Changes** for an existing item. After saving, **Download QR** becomes prominent.

Planned routing: persist the active screen and selected code in the URL hash so browser Back, refresh and per-code analytics links return to the expected place. Current 1.1.0 supports hash entry points but does not fully synchronize every navigation action.

## 2. Creating a code

Proposed progressive flow:

```text
Create QR → Add destination → Choose link → Customize (optional) → Save → Download → Test scan
```

### Destination

- Put Destination URL first and label it “Where should this QR take people?”
- Provide a realistic placeholder and explain any URL normalization before save.
- Validate supported schemes and show an actionable error next to the field.
- Detect loops back to the same QR link and reject them.
- Keep the website use case primary; do not advertise Wi-Fi/contact/text flows until their payloads are fully implemented and tested.

### QR Code Link

Display the site address and `/q/` as a fixed prefix, with only the suffix editable:

```text
https://your-site.com/q/ [ summer-menu ]
```

- Allow 1–64 ASCII letters, numbers, hyphens and underscores.
- Treat links as case-insensitive for lookup and availability.
- Show the full resulting link and update the QR preview as the user types.
- On conflict, keep the draft and explain “This link is already in use.”
- Next: check availability after a short pause; offer suggestions such as `summer-menu-2` without silently changing the user's choice.

### Dynamic versus direct

Use plain descriptions:

| Choice | QR contains | What editors should understand |
|---|---|---|
| Dynamic — recommended | The site's QR Code Link | Change the destination later and record visits; requires this WordPress site to remain online |
| Direct | The destination itself | The downloaded QR keeps that exact destination and bypasses plugin tracking |

Next: preserve the choice visibly in My Codes and exports; make sharing and PDF headings mode-aware.

## 3. Editing codes already in use

These are different actions and must have different explanations:

| Editor changes | Existing printed QR | Required UI response |
|---|---|---|
| Destination URL only | Continues working with the new destination | “Your existing QR keeps working.” |
| QR Code Link suffix | Old link stops working in 1.1.0 | Explain the previous URL, require acknowledgment, then instruct replacement of printed QRs |
| Appearance | Existing prints keep their original appearance | “Download again to use this design.” |
| Direct/dynamic mode | Existing prints retain their encoded content | Explain that switching mode requires downloading and replacing the QR |

Preserve the code ID, scan count and analytics history across renames. Historical events should retain the link used at scan time.

Future option: an alias table that reserves previous links and routes them to the same code. Before implementation, define alias ownership, collisions, restoration, deletion, retention and migration rules. Never promise alias preservation until it exists.

## 4. Designer layout and appearance controls

**Desktop:** destination/link controls on the left; stable preview and export card on the right. Keep the preview beneath both the WordPress toolbar and app navigation.

**Tablet/phone:** stack controls and preview, wrap navigation and long links, and avoid horizontal document scrolling. The normal WordPress mobile menu must stay usable.

Planned simplifications:

- Show a strong default QR with high contrast, generous quiet zone and no logo.
- Group controls into Pattern, Corners, Colors and Logo; collapse advanced options.
- Label style buttons with names, tooltips and selected states for assistive technology.
- Offer only shapes that actually render differently. Several current corner choices map to the same renderer options; implement the advertised shapes or consolidate the choices.
- Add “Reset appearance” and a small selection of tested presets.
- Make logo size limits and margin guidance understandable; validate file size/type and support removal with keyboard/touch.
- Show contrast and quiet-zone advice before download. A visual preview alone cannot guarantee scan reliability.

## 5. Saving, errors and protection of work

State model:

```text
Draft → Unsaved changes → Saving… → Saved → Download ready
                             ↓
                       Save failed → Keep draft → Retry
```

Shipped: server errors appear in the designer, invalid links cannot save, and downloading/copying the QR requires a saved version.

Next:

- Warn before switching codes, leaving the screen or closing a tab with unsaved changes.
- Provide an explicit Discard action and avoid overwriting drafts when background data loads.
- Disable concurrent saves and edits that could race with an in-flight request.
- Announce saves and errors with polite live regions; move focus to the first invalid field when appropriate.
- Handle expired sessions with “Your session expired. Sign in again, then retry”; keep the draft recoverable.
- Check HTTP status for every operation and never display success after failed persistence.

## 6. Downloading and sharing

- Offer PNG for everyday use, SVG for print/vector workflows and PDF for a printable sheet.
- Show which exact URL the QR encodes before export.
- Next: explicit PNG pixel sizes, filenames based on campaign title, PDF headings that match link mode, and an export preview.
- Next: test all export formats with and without logos and transparency; provide visible errors if image loading or clipboard access fails.
- Explain clipboard permission limitations without forcing unnecessary permission prompts.
- Replace simulated production scans with “Open saved link to test.” Explain that opening a dynamic link records a visit; add a separate test flag only if the backend can exclude test traffic reliably.

## 7. My Codes: finding and managing campaigns

Planned list/table features:

- Search by title, suffix and destination.
- Sort by created date, last updated and scan count; paginate large collections.
- Show title, QR Code Link, destination, mode, active status, visits and last update.
- Provide clear Edit, Copy Link, Download and View Analytics actions.
- Make View Analytics open the selected campaign, preserving the filter.
- Add pause/resume with a clear explanation of what visitors will see.
- Prefer trash/restore over permanent deletion. Explain the loss of links and analytics before permanent removal.
- Empty state: “No QR codes yet” plus Create QR Code and one short example.

## 8. Analytics that users can trust

Describe a scan as a **visit to a dynamic link**. Manual clicks, bots and preview services can also visit links; the server cannot prove a camera scan occurred.

Current behavior: all-time totals; distinct salted IP hashes as a visitor estimate; daily points for recorded dates; manual refresh; up to 50 recent events in CSV. The current daily chart is not restricted to 14 days.

Planned analytics work:

- Add last 7/30/90 days and custom date filters, with timezone shown.
- Fill zero-visit dates and keep the daily series within the selected range.
- Explain “Unique visitors” as an estimate based on hashed IP addresses, including shared networks and changing addresses.
- Distinguish total codes, active codes and the selected campaign consistently; maintain consistent status labels. v1.1.0 normalizes database IDs, counters and booleans at the API boundary.
- Add full filtered exports through paginated/streamed backend endpoints, with spreadsheet-formula protection.
- Surface loading, empty and error states independently; retain the previous chart during refresh.
- Define bot handling, test-visit exclusions, trusted proxy handling and a retention policy before adding more tracking.
- Avoid claims of complete anonymity: user agents and referrers are still stored.

## 9. WordPress integration and access

Shipped in 1.1.0:

- Register the management interface only in wp-admin.
- Remove both shortcode handlers and their frontend asset enqueueing.
- Keep public redirects available so printed QRs work for visitors who are signed out.
- Leave existing page content untouched; site owners remove legacy shortcode text themselves.
- Use authenticated, nonce-protected REST requests with capability checks.
- Keep WordPress toolbar/sidebar sizing and notices intact; scope CSS resets to the app.

Next decisions:

- Current editors with `edit_posts` can manage all codes. Decide whether a dedicated `manage_qr_codes` capability and per-user ownership are needed.
- Test roles explicitly: administrator, editor, author, contributor, subscriber and signed-out visitor.
- Add a site health diagnostic for rewrites, REST access, tables and writable logo/export paths if server-side media storage is introduced.

## 10. Accessibility and localization

Target WCAG 2.2 AA in a dedicated review:

- Persistent labels, useful descriptions, meaningful names for icon controls and visible focus.
- Keyboard operation for every control and logical focus after errors/dialogs.
- Selected states that do not rely on color alone, adequate contrast and sufficiently large touch targets.
- Responsive layouts at 200% zoom, reduced-motion preferences and long translated labels.
- Move user-facing React copy into a translation system; validate Arabic/RTL layouts and mixed-direction URLs.
- Test with a screen reader; automated checks alone do not establish accessibility conformance.

## 11. Delivery roadmap

| Priority | Work package | Exit condition | Effort estimate |
|---|---|---|---|
| Released | v1.1.0 link editor and admin-only layout | Validation, rename/history checks, typecheck and build pass | Complete |
| P1 | Safe editing | Dirty guards, recoverable drafts, accurate status, session errors | 2–3 days |
| P1 | Reliable QR output | High-contrast defaults, real shape choices, mode-aware export, decoder tests | 2–4 days |
| P1 | WordPress integration tests | Automated installation/upgrade, real toolbar/menu/mobile/RTL screenshots | 2–3 days |
| P2 | Campaign management | Search, filters, pagination, selected analytics, pause/resume | 3–5 days |
| P2 | Analytics clarity | Date ranges, zero dates, full CSV, definitions, retention controls | 3–5 days |
| P2 | Accessibility/localization | Keyboard, screen-reader and Arabic/RTL review with fixes | 3–5 days |
| P3 | Link aliases and recovery | Migration tested; old links reserved; deletion/restoration semantics documented | 3–5 days |

Estimates are planning ranges for one developer and depend on integration/testing access. Release each work package only after its acceptance checks pass.

## 12. Verification and acceptance checklist

### Automated checks for v1.1.0

- PHP syntax checks and backend regressions, including rename, case-insensitive collision, invalid suffix, 64-character boundary, stale ID, failed write and retained history.
- Admin integration smoke checks: no shortcode hooks/frontend assets; admin menu and nonce setup; REST permissions; missing/paused/public redirect behavior.
- TypeScript check and production build.
- Inspect the distributable: one `qr-wp-plugin/` folder, current version, compiled assets, no dependencies/tests/source or removed shortcode class.

### Manual release checks

- Install over v1.0.0 on a staging WordPress site; confirm existing codes and scans remain.
- Test toolbar positions at desktop (32px), tablet (46px), phone scrolling, folded sidebar, mobile menu, RTL, notices and 200% zoom.
- Create → Save → Download → Decode/scan → Redirect → Analytics.
- Change Destination URL; scan the previous print and verify the new destination.
- Rename QR Code Link; acknowledge the warning, verify the new link and previous-link unavailability, and confirm history remains.
- Try duplicate/invalid links and server/session failures; confirm no false success or unintended changes.
- Verify signed-out visitors can scan but cannot list, create, change, delete or view analytics.

Record the environment and results in release notes. Local fixtures and mocked SQLite checks are useful but do not replace a real WordPress/MySQL staging run.

## 13. Git and release process

1. Commit focused changes with descriptive messages.
2. Every push to `main` and every pull request runs PHP checks, regression tests, TypeScript and the production ZIP build.
3. Download the workflow artifact for staging verification.
4. Push the matching version tag, e.g. `v1.1.0`, after version metadata and changelog are updated.
5. The tag workflow verifies the version and publishes a GitHub Release with `qr-wp-plugin.zip` attached.
6. Installing a release on a live WordPress site remains a separate deployment action. A GitHub push alone does not update an installed plugin.

## 14. Measuring ease of use

Use short, consented usability sessions with five site editors. Ask them to create a campaign, download it, change a printed QR's destination and find its results without coaching.

Targets: median first QR under two minutes; at least four of five participants complete each task; no participant renames a live link expecting old prints to keep working; users can explain dynamic/direct mode and what a recorded visit means. Track observations in the project rather than adding visitor telemetry by default.

### Layout reference

The layout fixture follows the toolbar/sidebar geometry in WordPress core [common.css](https://github.com/WordPress/WordPress/blob/master/wp-admin/css/common.css) and [admin-bar.css](https://github.com/WordPress/WordPress/blob/master/wp-includes/css/admin-bar.css). Open `/tests/admin-layout.html` on the Vite server to compare desktop, folded sidebar, tablet and phone widths. This fixture does not establish live WordPress compatibility.
