# <img src="icons/icon128.png" alt="Param Scout" width="32" height="32" align="top"> Param Scout

A lightweight Chrome extension that automatically surfaces path IDs and query parameters from any URL, displaying them in a non-invasive badge, popup, and in-page overlay. Works with REST APIs, ServiceNow, and any other URL-based application.

## Examples

**REST API path**

```
https://ansible.autodotes.com/execution/infrastructure/inventories/inventory/15/sources/183/details
```

| source | param | value |
|--------|-------|-------|
| path | inventory | 15 |
| path | sources | 183 |

**Query parameters**

```
https://example.com/search?q=hello&page=2&sort=desc
```

| source | param | value |
|--------|-------|-------|
| query | q | hello |
| query | page | 2 |
| query | sort | desc |

**ServiceNow (encoded query string in path)**

```
https://example.service-now.com/now/nav/ui/classic/params/target/sc_request.do%3Fsys_id%3Dabc123%26sysparm_catalog%3Dxyz
```

| source | param | value |
|--------|-------|-------|
| query | sys_id | abc123 |
| query | sysparm_catalog | xyz |

## Features

- **Icon badge** — shows the count of detected pairs at a glance
- **Click-to-open popup** — lists all pairs with one-click copy buttons and a "Copy all" action
- **In-page overlay** — a small pill in the bottom-right corner that expands into a panel; uses Shadow DOM so it never conflicts with the host page's styles
- **Path ID extraction** — numeric, UUID, pure-hex hashes (7+ chars), and mixed alphanumeric IDs (6+ chars with ≥ 2 digits) paired with their preceding resource name
- **Query parameter extraction** — all query params with non-empty values are surfaced
- **Embedded query string detection** — handles apps like ServiceNow that percent-encode a query string inside a path segment
- **`path` / `query` source badge** — every pair is labelled so you always know where it came from
- **Dark/light theme** — follows the system `prefers-color-scheme` preference
- **Zero dependencies** — pure vanilla JS/CSS, no build step required

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the root folder of this repository.
5. The Param Scout icon will appear in your toolbar.

## Usage

Navigate to any URL. The extension activates automatically:

- The **toolbar icon badge** shows how many pairs were found.
- Click the **toolbar icon** to open the popup with the full list.
- The **overlay pill** appears in the bottom-right of the page — click it to expand the panel, or click × to dismiss it for the current session.
- Click any **copy button** to copy a single value to your clipboard.
- Click **Copy all** in the popup to copy all pairs as `param=value` newline-separated text.

## Path ID Detection Rules

| Type | Pattern | Example |
|------|---------|---------|
| Numeric | `/^\d+$/` | `15`, `183` |
| UUID | RFC 4122 format | `550e8400-e29b-41d4-a716-446655440000` |
| Hex hash | 7+ hex chars | `a1b2c3d` (git SHA, ObjectId) |
| Alphanumeric | 6+ chars, letters + ≥ 2 digits | `abc123def` |

## Project Structure

```
manifest.json       Manifest V3 configuration
icons/              Extension icons (16×16, 48×48, 128×128)
src/
  parser.js         URL parsing logic (shared ES module)
  background.js     Service worker — listens for navigation, updates badge
  popup.html        Popup shell
  popup.js          Popup rendering and clipboard logic
  popup.css         Popup styles
  content.js        In-page overlay (Shadow DOM)
  content.css       Minimal host-page anchor styles
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
