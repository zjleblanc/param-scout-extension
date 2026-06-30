# Contributing to REST ID Extract

Thank you for your interest in contributing!

## Development Setup

No build step is required — the extension runs directly from source.

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/rest-id-extract-extension.git
   cd rest-id-extract-extension
   ```

2. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the repository root

3. After making changes to source files, click the **refresh icon** on the extension card in `chrome://extensions` to reload it.

## Code Style

- **Vanilla JS/CSS only** — no frameworks, no build tools, no external dependencies.
- **ES modules** — use `import`/`export` syntax; `manifest.json` declares `"type": "module"` for the service worker.
- **No bundler** — keep file paths and imports resolvable directly by the browser.
- Prefer `const` over `let`; avoid `var`.
- Use descriptive variable names over abbreviations.
- Do not add comments that restate what the code obviously does.

## Adding or Changing ID Detection

The parsing logic lives entirely in [`src/parser.js`](src/parser.js). The `ID_PATTERNS` array contains ordered regexes. Add new patterns at the appropriate specificity level (more specific patterns first).

When modifying patterns, verify against the example URLs in the README to avoid regressions.

## Submitting Changes

1. Fork the repository and create a feature branch from `main`.
2. Make your changes and test them by loading the unpacked extension.
3. Open a pull request with a clear description of what changed and why.
4. For bug reports, open an issue and include the URL that produced unexpected output (anonymize any sensitive IDs).

## Reporting Issues

Please include:
- The full URL (or a representative sanitized version)
- Expected extraction output
- Actual extension output
- Chrome version
