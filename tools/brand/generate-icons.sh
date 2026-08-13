#!/usr/bin/env bash
#
# Regenerates every favicon, touch icon and manifest icon from the two SVG sources in this folder.
#
#   ./tools/brand/generate-icons.sh
#
# Rasterising is done by headless Google Chrome. That is deliberate: this repo has no image
# tooling (no sharp, no ImageMagick, no rsvg), and adding a native build dependency to package.json
# for an asset regenerated once a year is a poor trade. Chrome is already a hard requirement for
# anyone deploying this stack, since every deploy ends by loading the dashboard in a real browser.
#
# TWO SOURCES, AND THE SMALL ONE IS NOT OPTIONAL:
#
#   icon.html        the full mark — bridge, hangers and star. Used from 32px up.
#   icon-small.html  16px only. The full mark's hangers merge into mud at 16px and the star becomes
#                    a smudge, so the small variant drops both, thickens the strokes and deepens the
#                    cable sag. A shallow sag is under one pixel at this size and renders as a flat
#                    bar, which reads as an "H" rather than a bridge.
#
# The .ico is written by hand below because no icon tooling is available either. It embeds PNGs,
# which every current browser and Windows Vista+ understand.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."   # repo root
HERE="tools/brand"
WEB="src/main/webapp"
IMG="$WEB/content/images"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

CHROME="${CHROME:-google-chrome}"
command -v "$CHROME" >/dev/null || { echo "need $CHROME on PATH (or set CHROME=)"; exit 1; }

render() { # size, source, destination
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
            --force-device-scale-factor=1 \
            --screenshot="$2" --window-size="$1,$1" "file://$PWD/$3" >/dev/null 2>&1
}

echo "rendering..."
render 16 "$OUT/icon-16.png" "$HERE/icon-small.html"
for s in 32 36 48 57 60 70 72 76 96 114 120 144 150 152 180 192 256 310 384 512; do
  render "$s" "$OUT/icon-$s.png" "$HERE/icon.html"
done

echo "building favicon.ico (16/32/48)..."
python3 - "$OUT" <<'PY'
import struct, sys, os
out = sys.argv[1]
imgs = [(s, open(os.path.join(out, f'icon-{s}.png'), 'rb').read()) for s in (16, 32, 48)]
header = struct.pack('<HHH', 0, 1, len(imgs))
offset = 6 + 16 * len(imgs)
entries = b''
for s, data in imgs:
    entries += struct.pack('<BBBBHHII', s, s, 0, 0, 1, 32, len(data), offset)
    offset += len(data)
open(os.path.join(out, 'favicon.ico'), 'wb').write(header + entries + b''.join(d for _, d in imgs))
PY

echo "installing..."
cp "$OUT/favicon.ico" "$WEB/favicon.ico"
cp "$OUT/favicon.ico" "$IMG/favicon.ico"
for s in 16 32 96; do cp "$OUT/icon-$s.png" "$IMG/favicon-${s}x${s}.png"; done
for s in 36 48 72 96 144 192; do cp "$OUT/icon-$s.png" "$IMG/android-icon-${s}x${s}.png"; done
for s in 57 60 72 76 114 120 144 152 180; do cp "$OUT/icon-$s.png" "$IMG/apple-icon-${s}x${s}.png"; done
cp "$OUT/icon-192.png" "$IMG/apple-icon.png"
cp "$OUT/icon-192.png" "$IMG/apple-icon-precomposed.png"
for s in 70 144 150 310; do cp "$OUT/icon-$s.png" "$IMG/ms-icon-${s}x${s}.png"; done
for s in 192 256 384 512; do cp "$OUT/icon-$s.png" "$IMG/icon-${s}x${s}.png"; done

# Root-level PNG favicons are NOT regenerated on purpose: angular.json's assets list copies
# content/, favicon.ico, manifest.webapp and robots.txt only, so a PNG at the webapp root never
# reaches a production build. index.html therefore links the content/images/ copies.
echo "done. $(git status --short -- "$WEB" | wc -l) file(s) changed."
