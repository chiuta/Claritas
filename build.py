#!/usr/bin/env python3
"""Construiește pachetele Claritas.
  dist/claritas-chromium.zip      Chrome, Edge, Opera/GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale ... (Chromium, MV3)
  dist/claritas-firefox.zip       Firefox (desktop+Android), LibreWolf, Zen, Floorp, Waterfox, Tor Browser, Mullvad Browser (Gecko)
  dist/claritas-safari-source.zip sursa + script pentru conversie Xcode (macOS/iOS) — necesită Mac
"""
import json, shutil, zipfile, pathlib
root = pathlib.Path(__file__).parent
ext, dist = root / "extension", root / "dist"
shutil.rmtree(dist, ignore_errors=True)

def make_zip(src, zippath, prefix=""):
    with zipfile.ZipFile(zippath, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(src.rglob("*")):
            if p.is_file():
                z.write(p, prefix + p.relative_to(src).as_posix())

for name, mf in (("chromium", "chrome.json"), ("firefox", "firefox.json"), ("safari", "safari.json")):
    out = dist / name
    shutil.copytree(ext, out)
    shutil.copy(root / "manifests" / mf, out / "manifest.json")
    json.load(open(out / "manifest.json"))

make_zip(dist / "chromium", dist / "claritas-chromium.zip")
make_zip(dist / "firefox", dist / "claritas-firefox.zip")

# Safari: proiect-sursă + script de conversie (rulat pe Mac cu Xcode)
sf = dist / "safari-pack"
shutil.copytree(dist / "safari", sf / "extension")
(sf / "build-safari.sh").write_text("""#!/bin/bash
# Rulează pe macOS cu Xcode instalat (nu doar Command Line Tools).
set -e
cd "$(dirname "$0")"
xcrun safari-web-extension-converter ./extension \\
  --project-location ./xcode --app-name Claritas \\
  --bundle-identifier tf.trom.claritas --copy-resources --force
echo "Proiect creat în ./xcode. Deschide-l în Xcode, alege schema 'Claritas (macOS)' sau '(iOS)', apasă Run."
echo "Apoi: Safari > Setări > Extensii > Claritas (bifează) și acordă accesul la site-uri."
echo "Dacă nu apare: Safari > Dezvoltare > Permite extensii nesemnate (la fiecare pornire Safari)."
""")
(sf / "build-safari.sh").chmod(0o755)
make_zip(sf, dist / "claritas-safari-source.zip")
shutil.rmtree(sf)
for z in sorted(dist.glob("*.zip")):
    print("OK", z.name, z.stat().st_size, "B")
