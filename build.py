#!/usr/bin/env python3
"""Construiește pachetele Claritas.
  dist/claritas-chromium.zip      Chrome, Edge, Opera/GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale ... (Chromium, MV3)
  dist/claritas-firefox.zip       Firefox (desktop+Android), LibreWolf, Zen, Floorp, Waterfox, Tor Browser, Mullvad Browser (Gecko)
  dist/claritas-safari-source.zip sursa + script pentru conversie Xcode (macOS/iOS) — necesită Mac
"""
import json, shutil, zipfile, pathlib, os
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
    # Versiunea livrată are shadow DOM „closed” (o pagină nu poate citi panourile). Doar pentru teste automate
    # (care evaluează în lumea paginii) se poate cere CLARITAS_TEST_SHADOW=open.
    if os.environ.get("CLARITAS_TEST_SHADOW") == "open":
        for f in ("modules2.js", "modules3.js"):
            t = (out / f).read_text(encoding="utf-8")
            (out / f).write_text(t.replace("'closed' /*@SH*/", "'open'"), encoding="utf-8")
    shutil.copy(root / "manifests" / mf, out / "manifest.json")
    json.load(open(out / "manifest.json"))

make_zip(dist / "chromium", dist / "claritas-chromium.zip")
make_zip(dist / "firefox", dist / "claritas-firefox.zip")

# Versiuni „legacy” (Manifest V2) pentru Firefox 91–114 (ESR 91/102, Windows 7/8 mai vechi) și Safari 14–15.3.
# Chromium nu are variantă MV2: CSS-ul de bază folosește :where()/:not(listă) (Chromium 88+), iar Chromium 88 este și prima versiune MV3.
def to_mv2(mf, min_ver=None, family="firefox"):
    mf = json.loads(json.dumps(mf))
    mf["manifest_version"] = 2
    if "action" in mf:
        mf["browser_action"] = mf.pop("action")
    perms = list(mf.get("permissions", [])) + list(mf.pop("host_permissions", []))
    mf["permissions"] = perms
    bg = mf.get("background", {})
    if "scripts" in bg:
        bg["persistent"] = False
    mf["background"] = bg
    war = mf.get("web_accessible_resources", [])
    flat = []
    for w in war:
        flat += w["resources"] if isinstance(w, dict) else [w]
    mf["web_accessible_resources"] = flat
    cmds = mf.get("commands", {})
    if "_execute_action" in cmds:
        cmds["_execute_browser_action"] = cmds.pop("_execute_action")
    mf.pop("minimum_chrome_version", None)
    if family == "firefox":
        g = mf["browser_specific_settings"]["gecko"]
        g["strict_min_version"] = min_ver or "91.0"
        mf["browser_specific_settings"].pop("gecko_android", None)
        g.pop("data_collection_permissions", None)  # cheia există doar din Firefox 140
    mf.pop("storage", None) if family == "safari" else None
    return mf

for name, mfname, fam, ver in (("firefox-legacy", "firefox.json", "firefox", "91.0"), ("safari-legacy", "safari.json", "safari", None)):
    out = dist / name
    shutil.copytree(ext, out)
    mf2 = to_mv2(json.load(open(root / "manifests" / mfname)), ver, fam)
    json.dump(mf2, open(out / "manifest.json", "w"), indent=2, ensure_ascii=False)
make_zip(dist / "firefox-legacy", dist / "claritas-firefox-legacy.zip")

# Safari: proiect-sursă + script de conversie (rulat pe Mac cu Xcode)
def safari_pack(srcdir, zipname):
    sf = dist / "safari-pack"
    shutil.copytree(srcdir, sf / "extension")
    (sf / "build-safari.sh").write_text(SAFARI_SH)
    (sf / "build-safari.sh").chmod(0o755)
    make_zip(sf, dist / zipname)
    shutil.rmtree(sf)

SAFARI_SH = """#!/bin/bash
# Rulează pe macOS cu Xcode instalat (nu doar Command Line Tools).
set -e
cd "$(dirname "$0")"
xcrun safari-web-extension-converter ./extension \\
  --project-location ./xcode --app-name Claritas \\
  --bundle-identifier tf.trom.claritas --copy-resources --force
echo "Proiect creat în ./xcode. Deschide-l în Xcode, alege schema 'Claritas (macOS)' sau '(iOS)', apasă Run."
echo "Apoi: Safari > Setări > Extensii > Claritas (bifează) și acordă accesul la site-uri."
echo "Dacă nu apare: Safari > Dezvoltare > Permite extensii nesemnate (la fiecare pornire Safari)."
"""
# Safari: proiect-sursă + script de conversie (rulat pe Mac cu Xcode)
safari_pack(dist / "safari", "claritas-safari-source.zip")
safari_pack(dist / "safari-legacy", "claritas-safari-legacy-source.zip")
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
    CSP = "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self'"
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
