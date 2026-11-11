#!/bin/bash
# Încearcă să descarce Samsung Internet (com.sec.android.app.sbrowser) din surse publice; raportează arhitectura.
mkdir -p /tmp/sb && cd /tmp/sb
for U in "https://d.apkpure.com/b/APK/com.sec.android.app.sbrowser?version=latest" "https://d.apkpure.com/b/XAPK/com.sec.android.app.sbrowser?version=latest" "https://apkpure.com/samsung-internet-browser/com.sec.android.app.sbrowser/download"; do
  echo "== $U"; rm -f f.bin
  curl -fsSL -m 300 -A "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36" -o f.bin -w "http=%{http_code} size=%{size_download} type=%{content_type}\n" "$U" || { echo "curl falhou"; continue; }
  S=$(stat -c %s f.bin); file f.bin | head -1
  [ "$S" -gt 20000000 ] || continue
  if unzip -l f.bin | grep -q "AndroidManifest.xml"; then
    unzip -l f.bin | grep -oE "lib/[a-z0-9_-]+/" | sort -u | tr '\n' ' '; echo
    cp f.bin /tmp/sbrowser.apk; echo "APK ok"; break
  elif unzip -l f.bin | grep -q "\.apk"; then
    mkdir -p /tmp/sbsplits && unzip -oq f.bin -d /tmp/sbx && find /tmp/sbx -name "*.apk" -exec cp {} /tmp/sbsplits/ \;
    ls -l /tmp/sbsplits; cp "$(ls -S /tmp/sbsplits/*.apk | head -1)" /tmp/sbrowser.apk; echo "XAPK ok"; break
  fi
done
ls -l /tmp/sbrowser.apk 2>&1 || echo "niciun APK Samsung Internet obținut"
exit 0
