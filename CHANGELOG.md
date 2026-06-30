# Changelog

## 2026-06-30 — Accessible accent color palette matched to icon

### Changed
- Replaced the placeholder purple accent (`#7d5892`) with a high-contrast palette derived from the scout hat icon's actual color.
- Light mode accent `#6b3492` achieves 8.1:1 contrast on white (WCAG AAA); hover `#5a2878`; badge background `#f3eaf9`; badge text `#6b3492`.
- Dark mode accent `#c084fc` on `#1a1a2e` achieves ~7.5:1 (WCAG AA); `--accent-fg` updated to near-black `#1a0a2e` for legibility on the light button surface; badge background `#2e1d40`; badge text `#e2c4f5`.
- Toolbar badge background (`background.js`) updated to `#6b3492`.
- Changes applied consistently across `popup.css` and the Shadow DOM CSS in `content.js`.

## 2026-06-30 — Scout hat icon and popup visual refresh

### Changed
- Replaced all remaining `REST`/`rest_id` internal identifiers: storage key prefix `rest_id_tab_` → `param_scout_tab_`; message type `REST_ID_UPDATE` → `PARAM_SCOUT_UPDATE`; Shadow DOM host element `#rest-id-extract-host` → `#param-scout-host` (in both `content.js` and `content.css`).
- Redesigned extension icon: a flat indigo-purple scout/ranger campaign hat with white band, buckle, crease lines, and question mark on the crown. Transparent background; hat fills the full canvas. Applied to `icon128.png`, `icon48.png`, `icon16.png`, and `icons/icon.svg`.
- Lightened the icon's purple ~28% toward white for a softer appearance at all three PNG sizes.
- Redesigned popup header into two rows: brand row (PNG icon + "Param Scout" title, centered) above a controls row (URL pill + Copy all button). Replaced the inline SVG logo with `<img src="../icons/icon128.png">` sized via CSS. Updated `popup.css` to use `flex-direction: column` for the header, `.header-brand` for the top row, and `.header-controls` for the bottom row.
- Pill button label in `content.js` updated from "N IDs" to "N params"; pill tooltip updated to "Show extracted params".

## 2026-06-30 — Rename extension to Param Scout

### Changed
- Renamed extension from "REST ID Extractor" to **Param Scout** to reflect its broader scope beyond REST APIs. Updated `manifest.json` (`name`, `description`, `default_title`), `popup.html` (`<title>`, `<h1>`, empty-state text), `content.js` (panel header, pill tooltip), and `README.md`.

## 2026-06-30 — Support URL-encoded embedded query strings (ServiceNow)

### Added
- New `parseEmbeddedQueryPairs` pass in `parser.js` detects query strings that are percent-encoded inside a path segment rather than appended to the URL directly. ServiceNow and similar apps route navigation through URLs like `/params/target/sc_request.do%3Fsys_id%3D...%26sysparm_catalog%3D...`; the `%3F` (`?`) and `%26` (`&`) are opaque to the browser's URL parser, so `searchParams` is empty. Decoding each path segment and checking for a `?` recovers the embedded key/value pairs, which are emitted with `source: 'query'`.

## 2026-06-30 — Expose all query parameters

### Changed
- `parseQueryPairs` now surfaces every query parameter with a non-empty value, not just those whose value looks like an ID. Parameters without a value (bare flags such as `?debug`) are still skipped. The `source: 'query'` badge in the popup and overlay distinguishes query params from path-extracted pairs.

## 2026-06-30 — Tighten extension permissions to least privilege

### Changed
- Removed redundant `activeTab` permission; the `tabs` permission already provides full access and `activeTab` added nothing on top of the existing host permissions.
- Narrowed host permission and content script match pattern from `<all_urls>` to `*://*/*`, limiting injection to http and https pages only and dropping unnecessary access to `file://`, `ftp://`, and browser-internal URLs.
- Renamed extension from "REST ID Extract" to "REST ID Extractor".
