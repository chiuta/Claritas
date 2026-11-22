#!/usr/bin/env bash
# Claritas — instalare asistată (macOS / Linux).
# Descarcă pachetul, verifică SHA-256, îl despachetează și deschide pagina de extensii a browserului.
# Browserele NU permit instalarea silențioasă din afara magazinelor: ultimul pas (Încarcă extensie despachetată /
# Load Temporary Add-on) rămâne al tău. Folosire:
#   bash install.sh [chrome|edge|brave|opera|vivaldi|chromium|firefox|safari] [base|axe|pdf]
# Variabile: CLARITAS_BASE (adresa pachetelor), CLARITAS_DIR (unde se despachetează), CLARITAS_NO_OPEN=1 (nu deschide browserul)
set -euo pipefail
BASE="${CLARITAS_BASE:-https://claritas.chiuta.ro/download}"
DIR="${CLARITAS_DIR:-$HOME/Claritas}"
B="${1:-chrome}"; V="${2:-base}"
case "$V" in base) SUF="";; axe|pdf) SUF="-$V";; *) echo "Variantă necunoscută: $V (base|axe|pdf)"; exit 2;; esac
case "$B" in
  chrome|edge|brave|opera|vivaldi|chromium) FAM=chromium;;
  firefox) FAM=firefox;;
  safari) FAM=safari-source; SUF="";;
  *) echo "Browser necunoscut: $B"; exit 2;;
esac
FILE="claritas-$FAM$SUF.zip"
for c in curl unzip; do command -v $c >/dev/null || { echo "Lipsește «$c». Instalează-l și rulează din nou."; exit 1; }; done
if command -v sha256sum >/dev/null; then SHA="sha256sum"; elif command -v shasum >/dev/null; then SHA="shasum -a 256"; else echo "Lipsește sha256sum/shasum"; exit 1; fi
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
echo "→ Descarc $FILE"
curl -fsSL "$BASE/$FILE" -o "$T/$FILE"
curl -fsSL "$BASE/SHA256SUMS" -o "$T/SHA256SUMS"
WANT="$(awk -v f="$FILE" '$2==f || $2=="*"f {print $1}' "$T/SHA256SUMS")"
GOT="$($SHA "$T/$FILE" | awk '{print $1}')"
[ -n "$WANT" ] || { echo "Fișierul nu apare în SHA256SUMS."; exit 1; }
[ "$WANT" = "$GOT" ] || { echo "SHA-256 NU se potrivește (așteptat $WANT, obținut $GOT). Nu instalez."; exit 1; }
echo "✓ SHA-256 corect ($GOT)"
OUT="$DIR/${FILE%.zip}"; rm -rf "$OUT"; mkdir -p "$OUT"; unzip -q "$T/$FILE" -d "$OUT"
echo "✓ Despachetat în: $OUT"
# copiază calea în clipboard, ca să o lipești în fereastra de selectare a folderului
for c in pbcopy wl-copy "xclip -selection clipboard" "xsel -ib"; do if command -v ${c%% *} >/dev/null; then printf %s "$OUT" | $c && echo "✓ Calea e în clipboard"; break; fi; done
if [ "$FAM" = "safari-source" ]; then
  echo; echo "Safari: pe un Mac cu Xcode rulează:  cd \"$OUT\" && ./build-safari.sh"
  echo "apoi activează extensia în Safari → Setări → Extensii."; exit 0
fi
if [ "$FAM" = "firefox" ]; then URL="about:debugging#/runtime/this-firefox"; STEP="Alege «Load Temporary Add-on» și selectează manifest.json din folderul de mai sus (dispare la repornirea Firefox; pentru instalare permanentă semnează pachetul ca add-on nelistat)."
else
  case "$B" in edge) URL="edge://extensions";; opera) URL="opera://extensions";; brave) URL="brave://extensions";; vivaldi) URL="vivaldi://extensions";; *) URL="chrome://extensions";; esac
  STEP="Activează «Mod dezvoltator», alege «Încarcă extensie despachetată» și selectează folderul de mai sus."
fi
echo; echo "Ultimul pas e al tău (browserele nu permit instalarea silențioasă):"; echo "  1. Pagina: $URL"; echo "  2. $STEP"
[ "${CLARITAS_NO_OPEN:-}" = "1" ] && exit 0
if [ "$(uname)" = "Darwin" ]; then
  case "$B" in chrome) APP="Google Chrome";; edge) APP="Microsoft Edge";; brave) APP="Brave Browser";; opera) APP="Opera";; vivaldi) APP="Vivaldi";; chromium) APP="Chromium";; firefox) APP="Firefox";; esac
  open -a "$APP" "$URL" 2>/dev/null || echo "(Nu am putut deschide $APP; deschide manual $URL)"
else
  case "$B" in chrome) BIN="google-chrome google-chrome-stable chromium";; edge) BIN="microsoft-edge microsoft-edge-stable";; brave) BIN="brave-browser brave";; opera) BIN="opera";; vivaldi) BIN="vivaldi vivaldi-stable";; chromium) BIN="chromium chromium-browser";; firefox) BIN="firefox";; esac
  for b in $BIN; do if command -v $b >/dev/null; then nohup $b "$URL" >/dev/null 2>&1 & echo "✓ Am deschis $b"; exit 0; fi; done
  echo "(Nu am găsit browserul în PATH; deschide manual $URL)"
fi
