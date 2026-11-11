"""Apasă butoane uzuale de prim-start pe Android (uiautomator dump). Usage: python uitap.py"""
import subprocess, re, xml.etree.ElementTree as ET
WORDS = ['no thanks', 'not now', 'accept', 'agree', 'i agree', 'continue', 'start', 'ok', 'allow', 'next', 'skip', 'confirm', 'got it', 'done', 'later', 'maybe later', 'use without', 'yes', 'close', 'dismiss']
def sh(c): return subprocess.run(c, shell=True, capture_output=True, text=True).stdout
for _ in range(6):
    sh('adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml /tmp/ui.xml >/dev/null 2>&1')
    try: root = ET.parse('/tmp/ui.xml').getroot()
    except Exception: break
    cands = []
    for n in root.iter('node'):
        t = (n.get('text') or n.get('content-desc') or '').strip().lower()
        if n.get('clickable') == 'true' and t and any(t == w or t.startswith(w) for w in WORDS):
            b = list(map(int, re.findall(r'\d+', n.get('bounds'))))
            cands.append((WORDS.index(next(w for w in WORDS if t == w or t.startswith(w))), t, (b[0]+b[2])//2, (b[1]+b[3])//2))
    if not cands: break
    cands.sort(); _, t, x, y = cands[0]
    print('tap', t, x, y, flush=True); sh(f'adb shell input tap {x} {y}')
    import time; time.sleep(2)
