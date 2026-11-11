#!/bin/bash
# Descarcă mai multe versiuni Samsung Internet (arm64) din apkpure în /tmp/sb/<versionCode>.apk
mkdir -p /tmp/sb && cd /tmp/sb
get() { # tag url
  rm -f "$1.bin"
  curl -fsSL -m 400 -A "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36" -o "$1.bin" -w "$1 http=%{http_code} size=%{size_download}\n" "$2" || { echo "$1 curl eșuat"; return; }
  if unzip -l "$1.bin" 2>/dev/null | grep -q "AndroidManifest.xml"; then mv "$1.bin" "$1.apk"; unzip -l "$1.apk" | grep -oE "lib/[a-z0-9_-]+/" | sort -u | tr '\n' ' '; echo; else echo "$1: nu e APK simplu"; file "$1.bin" | head -1; fi
}
get latest "https://d.apkpure.com/b/APK/com.sec.android.app.sbrowser?version=latest"
get v1200310502 "https://d.apkpure.com/b/APK/com.sec.android.app.sbrowser?versionCode=1200310502"
get v1240615502 "https://d.apkpure.com/b/APK/com.sec.android.app.sbrowser?versionCode=1240615502"
ls -l /tmp/sb
exit 0
