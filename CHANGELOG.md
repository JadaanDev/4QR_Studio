# 4QR Studio 1.1.0

Released: 21 October 2026.

- Edit the dynamic **QR Code Link** suffix when creating or updating a code.
- Reject invalid or duplicate links, including case-insensitive collisions. Existing code IDs and scan history survive a rename.
- Explain that renaming retires the previous link; require acknowledgment before saving. Change Destination URL alone to keep printed QRs working.
- Show save errors in the designer and require saving before copying or exporting the QR.
- Persist direct/dynamic mode in the saved design configuration.
- Run the management interface exclusively in wp-admin; remove shortcode registration, embedding UI and fullscreen takeover styles. Public scan redirects remain available.
- Preserve WordPress toolbar spacing, sidebar states, notices and document scrolling. Scope theme resets to the app and retain visible keyboard focus.
- Replace technical build instructions in Settings with practical user help. Remove simulated scan controls from the shipped interface.
- Correct TypeScript errors, improve backend regression coverage, and add push verification and tagged GitHub releases with an installable ZIP.

## Upgrade notes

- Install the v1.1.0 ZIP over the existing plugin. No database schema change is required; saved codes and scans remain.
- Remove old generator/analytics shortcode text from any WordPress pages where it was previously inserted. The plugin no longer registers or renders those shortcodes and does not edit page content automatically.
- A link rename does not create an alias for the previous URL. Replace any published or printed QRs that encode it. Historical scan events keep the slug recorded at the time of the visit.
- Existing designs without a saved link mode open in dynamic mode, matching the previous default.
