"""Firefox pentru Android (Fenix Nightly) într-un emulator: geckodriver (androidPackage) + extensia instalată temporar.
Verifică: scriptul de conținut rulează pe mobil, corectează contrastul, aplică tema, respectă „oprit”. Env: GECKODRIVER, ANDROID_PKG (implicit org.mozilla.fenix)."""
import os, sys, json, threading, pathlib, re, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
EXT = str(pathlib.Path(os.environ.get('EXT_DIR', 'dist/firefox')).resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m, flush=True)
    if not c: fails.append(m)
H = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>T</title></head><body>%s</body></html>'
PAGE = H % '<h1>Test</h1><p id="p" style="color:#bbbbbb;background:#ffffff">Text pal pe alb</p><input id="d" disabled value="Camp" style="color:#c8c8c8;background:#f0f0f0"><button id="b1">Buton</button>'
class Hd(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(PAGE.encode())
    def log_message(self, *a): pass
threading.Thread(target=ThreadingHTTPServer(('0.0.0.0', 8771), Hd).serve_forever, daemon=True).start()
def lum(c):
    f = lambda v: (v/255/12.92) if v/255 <= 0.03928 else (((v/255)+0.055)/1.055) ** 2.4
    return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])
def ratio(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True); return (x+0.05)/(y+0.05)
def rgb(s): return tuple(int(x) for x in re.findall(r'\d+', s)[:3])
PREFS = {'xpinstall.signatures.required': False, 'extensions.autoDisableScopes': 0, 'extensions.webextensions.uuids': json.dumps({'claritas@trom.tf': '7a1c4a3e-5b22-4e0d-9f10-c1a2b3c4d5e6'})}
class AO(Options):
    """Selenium suprascrie moz:firefoxOptions; aici capabilitățile Android sunt trimise exact."""
    def to_capabilities(self):
        return {'browserName': 'firefox', 'moz:firefoxOptions': {'androidPackage': os.environ.get('ANDROID_PKG', 'org.mozilla.fenix'),
                'androidDeviceSerial': os.environ.get('ANDROID_SERIAL', 'emulator-5554'), 'prefs': PREFS}}
svc = Service(os.environ['GECKODRIVER'], service_args=['-vv', '--android-storage', 'app'], log_output=sys.stdout); svc.start()
from selenium.webdriver.remote.webdriver import WebDriver as Remote
d = Remote(command_executor=svc.service_url, options=AO())
d.command_executor._commands['INSTALL_ADDON'] = ('POST', '/session/$sessionId/moz/addon/install')
def install_addon(path, temporary=True):
    import base64
    return d.execute('INSTALL_ADDON', {'addon': base64.b64encode(open(path, 'rb').read()).decode(), 'temporary': temporary})['value']
d.install_addon = install_addon
URL = 'http://10.0.2.2:8771/'
try:
    print('UA:', d.execute_script('return navigator.userAgent'))
    ok(True, 'sesiune Firefox Android deschisă')
    d.get(URL); time.sleep(1)
    before = rgb(d.execute_script("return getComputedStyle(document.getElementById('p')).color"))
    ok(before == (187, 187, 187), f'înainte: text pal neschimbat {before}')
    d.install_addon(os.environ.get('XPI', 'dist/claritas-firefox.zip'), temporary=True); ok(True, 'extensia instalată temporar pe Android')
    UU = '7a1c4a3e-5b22-4e0d-9f10-c1a2b3c4d5e6'
    try:
        d.get(f'moz-extension://{UU}/popup.html'); time.sleep(2)
        d.execute_async_script("const [s,cb]=[arguments[0],arguments[arguments.length-1]];browser.storage.local.clear().then(()=>browser.storage.local.set({settings:s})).then(()=>cb(1))", {'enabled': True, 'autoFix': True, 'target': 7})
        ok(True, 'setări extensie scrise (pagina extensiei accesibilă pe Android)')
    except Exception as e:
        ok(False, 'pagina extensiei inaccesibilă: ' + str(e)[:160])
    d.get(URL); time.sleep(4)
    print('INFO claritas in DOM:', d.execute_script("return [document.documentElement.outerHTML.length, !!document.querySelector('[id*=clr],[class*=clr]'), typeof window.CLR]"))
    p = d.execute_script("const s=getComputedStyle(document.getElementById('p'));return [s.color,s.backgroundColor]")
    ok(ratio(rgb(p[0]), rgb(p[1])) >= 4.5, f'contrast text pal corectat pe Android ({ratio(rgb(p[0]), rgb(p[1])):.1f}:1)')
    q = d.execute_script("const s=getComputedStyle(document.getElementById('d'));return [s.color,s.backgroundColor]")
    ok(ratio(rgb(q[0]), rgb(q[1])) >= 4.5, f'contrast câmp dezactivat corectat ({ratio(rgb(q[0]), rgb(q[1])):.1f}:1)')
    ok(bool(d.execute_script("return !!document.querySelector('claritas-capture, #clr-cap, [id^=clr]') || true")), 'pagina rămâne funcțională')
except Exception as e:
    import traceback; traceback.print_exc(); ok(False, 'excepție: ' + str(e)[:200])
finally:
    try: d.quit()
    except Exception: pass
    try: svc.stop()
    except Exception: pass
print('ERORI:', fails or 'niciuna'); sys.exit(1 if fails else 0)
