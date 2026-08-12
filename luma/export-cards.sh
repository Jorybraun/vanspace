#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$DIR/exports"
shot() {
  local html="$1" out="$2" w="$3" h="$4"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=${w},${h} \
    --screenshot="$DIR/exports/${out}" \
    "file://${DIR}/${html}" 2>/dev/null
  echo "→ exports/${out}"
}
shot card-square-light.html card-square-light.png 1080 1080
shot card-square-dark.html card-square-dark.png 1080 1080
shot card-square-flagship.html card-square-flagship.png 1080 1080
shot cover-landscape.html cover-landscape.png 1920 1080
echo "Done."
