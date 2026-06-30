#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$REPO_ROOT/manifest.json"

# ---------------------------------------------------------------------------
# Resolve version from manifest.json (requires python3 or node)
# ---------------------------------------------------------------------------
if command -v node &>/dev/null; then
  VERSION=$(node -e "process.stdout.write(require('$MANIFEST').version)")
elif command -v python3 &>/dev/null; then
  VERSION=$(python3 -c "import json,sys; print(json.load(open('$MANIFEST'))['version'], end='')")
else
  echo "Error: node or python3 is required to read the manifest version." >&2
  exit 1
fi

DIST_DIR="$REPO_ROOT/dist"
ZIP_NAME="param-scout-v${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

echo "Building Param Scout v${VERSION}..."

# ---------------------------------------------------------------------------
# Clean and recreate dist/
# ---------------------------------------------------------------------------
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# ---------------------------------------------------------------------------
# Files and directories to include in the package
# Chrome Web Store requires exactly what is declared in manifest.json.
# ---------------------------------------------------------------------------
INCLUDE=(
  manifest.json
  src/
  icons/
)

cd "$REPO_ROOT"
zip -r "$ZIP_PATH" "${INCLUDE[@]}" \
  --exclude "*.DS_Store" \
  --exclude "__MACOSX/*"

echo ""
echo "Done. Package ready for Chrome Web Store upload:"
echo "  $ZIP_PATH"
echo "  $(du -sh "$ZIP_PATH" | cut -f1)"
