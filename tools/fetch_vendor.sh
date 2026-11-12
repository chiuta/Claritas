#!/bin/bash
# Descarcă (npm) bibliotecile pentru modulele opționale -axe și -pdf. Rulează o singură dată, cu rețea.
# axe-core (MPL-2.0) → modules-src/axe/vendor ; pdf.js (Apache-2.0) → modules-src/pdf/vendor
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
( cd "$T" && npm pack axe-core pdfjs-dist >/dev/null 2>&1 && for f in *.tgz; do mkdir "x_${f%.tgz}" && tar xzf "$f" -C "x_${f%.tgz}"; done )
mkdir -p modules-src/axe/vendor modules-src/pdf/vendor
cp "$T"/x_axe-core-*/package/axe.min.js modules-src/axe/vendor/axe.min.js
cp "$T"/x_axe-core-*/package/LICENSE modules-src/axe/vendor/LICENSE-axe-core.txt
cp "$T"/x_pdfjs-dist-*/package/legacy/build/pdf.min.mjs "$T"/x_pdfjs-dist-*/package/legacy/build/pdf.worker.min.mjs modules-src/pdf/vendor/
cp "$T"/x_pdfjs-dist-*/package/LICENSE modules-src/pdf/vendor/LICENSE-pdfjs.txt
echo "axe-core $(grep -m1 '"version"' "$T"/x_axe-core-*/package/package.json | tr -dc '0-9.'), pdf.js $(grep -m1 '"version"' "$T"/x_pdfjs-dist-*/package/package.json | tr -dc '0-9.') în modules-src/*/vendor"
