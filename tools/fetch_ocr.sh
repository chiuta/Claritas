#!/bin/bash
# Descarcă (npm) și aranjează fișierele modulului OCR opțional în modules-src/ocr/vendor.
# Licențe: tesseract.js și tesseract.js-core — Apache-2.0; date de limbă (tessdata_best) — Apache-2.0.
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d); cd "$T"; npm init -y >/dev/null
npm install --no-audit --no-fund tesseract.js@7 @tesseract.js-data/eng @tesseract.js-data/ron @tesseract.js-data/deu @tesseract.js-data/spa @tesseract.js-data/fra @tesseract.js-data/ita @tesseract.js-data/por @tesseract.js-data/hun >/dev/null
V="$OLDPWD/modules-src/ocr/vendor"; rm -rf "$V"; mkdir -p "$V/core" "$V/lang"
cp node_modules/tesseract.js/dist/tesseract.min.js node_modules/tesseract.js/dist/worker.min.js "$V/"
cp node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js "$V/core/"
for l in eng ron deu spa fra ita por hun; do cp node_modules/@tesseract.js-data/$l/4.0.0_best_int/$l.traineddata.gz "$V/lang/"; done
cp node_modules/tesseract.js/LICENSE "$V/LICENSE-tesseract.js" 2>/dev/null || true
cp node_modules/tesseract.js-core/LICENSE "$V/LICENSE-tesseract.js-core" 2>/dev/null || true
du -sh "$V"
