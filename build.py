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
# Module opționale: OCR local (Tesseract.js împachetat). Se construiește doar dacă s-a rulat tools/fetch_ocr.sh.
ocr_src = root / "modules-src" / "ocr"
if (ocr_src / "vendor" / "tesseract.min.js").exists():
    CSP = "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    for name in ("chromium", "firefox"):
        out = dist / (name + "-ocr")
        shutil.copytree(dist / name, out)
        shutil.copy(ocr_src / "ocr.html", out / "ocr.html")
        shutil.copy(ocr_src / "ocr.js", out / "ocr.js")
        shutil.copytree(ocr_src / "vendor", out / "vendor")
        mf = json.load(open(out / "manifest.json"))
        mf["content_security_policy"] = {"extension_pages": CSP}
        json.dump(mf, open(out / "manifest.json", "w"), indent=2, ensure_ascii=False)
        make_zip(out, dist / ("claritas-%s-ocr.zip" % name))
        shutil.rmtree(out)

# Module opționale: axe-core (MPL-2.0) – audit WCAG suplimentar. Necesită tools/fetch_vendor.sh.
axe_src = root / "modules-src" / "axe" / "vendor"
if (axe_src / "axe.min.js").exists():
    for name in ("chromium", "firefox"):
        out = dist / (name + "-axe")
        shutil.copytree(dist / name, out)
        (out / "vendor").mkdir(exist_ok=True)
        shutil.copy(axe_src / "axe.min.js", out / "vendor" / "axe.min.js")
        shutil.copy(axe_src / "LICENSE-axe-core.txt", out / "vendor" / "LICENSE-axe-core.txt")
        mf = json.load(open(out / "manifest.json"))
        for cs in mf["content_scripts"]:
            if "modules3.js" in cs["js"]:
                cs["js"].insert(cs["js"].index("modules3.js"), "vendor/axe.min.js")
        json.dump(mf, open(out / "manifest.json", "w"), indent=2, ensure_ascii=False)
        make_zip(out, dist / ("claritas-%s-axe.zip" % name))
        shutil.rmtree(out)
# Module opționale: cititor PDF local (pdf.js, Apache-2.0).
pdf_src = root / "modules-src" / "pdf"
if (pdf_src / "vendor" / "pdf.min.mjs").exists():
    CSP = "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    for name in ("chromium", "firefox"):
        out = dist / (name + "-pdf")
        shutil.copytree(dist / name, out)
        shutil.copy(pdf_src / "pdf.html", out / "pdf.html")
        shutil.copy(pdf_src / "pdf.js", out / "pdf.js")
        shutil.copytree(pdf_src / "vendor", out / "vendor")
        mf = json.load(open(out / "manifest.json"))
        mf["content_security_policy"] = {"extension_pages": CSP}
        json.dump(mf, open(out / "manifest.json", "w"), indent=2, ensure_ascii=False)
        make_zip(out, dist / ("claritas-%s-pdf.zip" % name))
        shutil.rmtree(out)

for z in sorted(dist.glob("*.zip")):
    print("OK", z.name, z.stat().st_size, "B")
