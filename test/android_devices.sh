#!/bin/bash
# Rulează pagina de test în browsere Android reale din emulator. Folosește: test/android_devices.sh
mkdir -p test/results; PORT=8790
adb root >/dev/null 2>&1; sleep 2
adb shell 'echo "_ --disable-fre --no-first-run --no-default-browser-check" > /data/local/tmp/chrome-command-line; chmod 755 /data/local/tmp/chrome-command-line' || true
echo "== pachete browser"; adb shell pm list packages | grep -iE "chrome|firefox|fenix|sbrowser|browser|webview" || true
run() {  # tag pkg
  tag=$1; pkg=$2
  adb shell pm list packages | grep -q "package:$pkg$" || { echo "SKIP [$tag] $pkg nu e instalat"; return; }
  echo "==== $tag ($pkg)"
  adb shell am force-stop $pkg; adb logcat -c
  python3 -I test/devsrv.py $PORT $tag test/results/$tag.json 150 > test/results/$tag.log 2>&1 &
  SP=$!; sleep 2
  adb shell am start -a android.intent.action.VIEW -d "http://10.0.2.2:$PORT/?s=on" -p $pkg
  sleep 15; adb exec-out screencap -p > test/results/$tag-1.png
  if ! grep -q REPORT test/results/$tag.log; then
    python3 test/uitap.py; adb exec-out screencap -p > test/results/$tag-2.png
    adb shell am start -W -a android.intent.action.VIEW -d "http://10.0.2.2:$PORT/?s=on" -p $pkg
    sleep 10; python3 test/uitap.py; sleep 5; adb exec-out screencap -p > test/results/$tag-3.png
  fi
  wait $SP; echo "exit=$?"; cat test/results/$tag.log
  adb exec-out screencap -p > test/results/$tag-end.png
  adb logcat -d | grep -iE "$pkg|AndroidRuntime|FATAL|ActivityManager.*(Start|crash)" | tail -60 > test/results/$tag-logcat.txt; adb shell dumpsys activity activities | grep -i mResumedActivity | head -2
}
[ -f /tmp/fenix.apk ] && adb install -r /tmp/fenix.apk >/dev/null 2>&1
run fenix org.mozilla.fenix
run chrome-android com.android.chrome
# Samsung Internet real (mai multe versiuni arm64 rulate prin traducere ARM în emulator x86_64)
for f in /tmp/sb/*.apk; do
  [ -s "$f" ] || continue; v=$(basename "$f" .apk); echo "######## Samsung Internet $v"
  adb uninstall com.sec.android.app.sbrowser >/dev/null 2>&1
  adb install -r "$f" 2>&1 | tail -2
  adb shell pm path com.sec.android.app.sbrowser
  run samsung-$v com.sec.android.app.sbrowser
done
exit 0
