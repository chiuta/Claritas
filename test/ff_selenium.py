"""Teste Gecko (Firefox) cu Selenium + geckodriver: extensia se instalează temporar, popup 8 limbi, corecție contrast, temă, captură cu acoperire, iframe cross-origin.
Env: FIREFOX_BIN (opțional), GECKODRIVER (opțional), HEADLESS=1 implicit."""
import os, sys, json, time, threading, pathlib, glob, io, zipfile, tempfile, traceback, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from PIL import Image
EXT = str(pathlib.Path(os.environ.get('EXT_DIR', '../dist/firefox')).resolve())
UUID = '7a1c4a3e-5b22-4e0d-9f10-c1a2b3c4d5e6'
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
H = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>T</title></head><body>%s</body></html>'
LONGP = 'Centrul Național de Recunoaștere și Echivalare a Diplomelor (CNRED) este instituția care analizează diplomele; CNRED colaborează cu autoritățile, iar rezultatul analizei se comunică solicitantului în termen legal. Procedura de recunoaștere profesională presupune verificarea documentelor, compararea programelor de studii și evaluarea echivalenței, ceea ce poate dura mai multe săptămâni, deoarece dosarele incomplete sunt returnate. '
PAGES = {
 '/contrast.html': H % '<h1>Test</h1><p id="p" style="color:#bbbbbb;background:#ffffff">Text pal pe alb</p><input id="d" disabled value="Câmp dezactivat" style="color:#c8c8c8;background:#f0f0f0"><p>Contact: <span id="mail">ion.popescu@example.com</span></p><button id="b1">Buton</button>',
 '/mod.html': H % ('<header><a href="#c">Sari</a></header><nav aria-label="Principal"><a href="/a">Acasă</a></nav><main id="c"><h1>Titlu principal</h1><p>' + LONGP*3 + '</p><h2>Secțiunea doi</h2><p>' + LONGP*2 + '</p><h3>Subsecțiune</h3><p>' + LONGP*2 + '</p><figure><img id="i1" src="/x/a1.png"><figcaption>Casa veche din Brașov, 1900</figcaption></figure><img id="i2" src="/img/casa-din-brasov-2023.jpg"><img id="i4" src="/q.png" alt="Grafic vânzări"></main><aside aria-label="Lateral"><p>Notă laterală cu text suficient de lung.</p></aside><footer><p>Subsol</p></footer>' + ''.join('<p>umplutură %d</p>' % i for i in range(30))),
 '/outer.html': H % '<h1>Cadru</h1><iframe id="f" src="http://127.0.0.1:8772/inner.html" width="500" height="120"></iframe>',
 '/inner.html': H % '<p>Date: <b>secret.person@example.net</b></p>',
}
class Hd(BaseHTTPRequestHandler):
    def do_GET(self):
        p = PAGES.get(self.path.split('?')[0])
        if not p: self.send_response(404); self.end_headers(); return
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(p.encode())
    def log_message(self, *a): pass
for port in (8771, 8772): threading.Thread(target=ThreadingHTTPServer(('127.0.0.1', port), Hd).serve_forever, daemon=True).start()
def lum(rgb):
    def f(c):
        c /= 255; return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def ratio(a, b):
    la, lb = lum(a), lum(b); hi, lo = max(la, lb), min(la, lb); return (hi + 0.05) / (lo + 0.05)
def rgb(s): return tuple(int(x) for x in re.findall(r'\d+', s)[:3])
dl = tempfile.mkdtemp()
opts = Options()
if os.environ.get('FIREFOX_BIN'): opts.binary_location = os.environ['FIREFOX_BIN']
if os.environ.get('HEADLESS', '1') == '1': opts.add_argument('-headless')
opts.set_preference('extensions.webextensions.uuids', json.dumps({'claritas@trom.tf': UUID}))
opts.set_preference('browser.download.folderList', 2); opts.set_preference('browser.download.dir', dl)
opts.set_preference('browser.download.useDownloadDir', True); opts.set_preference('browser.download.manager.showWhenStarting', False)
opts.set_preference('browser.helperApps.neverAsk.saveToDisk', 'application/zip,application/octet-stream,image/png')
opts.set_preference('xpinstall.signatures.required', False); opts.set_preference('extensions.autoDisableScopes', 0)
svc = Service(os.environ['GECKODRIVER'], service_args=['--allow-system-access']) if os.environ.get('GECKODRIVER') else Service(service_args=['--allow-system-access'])
d = webdriver.Firefox(options=opts, service=svc)
d.set_window_size(900, 760)
def wait_dl(ext, secs=25):
    t = time.time()
    while time.time() - t < secs:
        fs = [f for f in glob.glob(dl + '/*') if f.endswith(ext) and not f.endswith('.part')]
        if fs:
            a = os.path.getsize(fs[0]); time.sleep(0.8)
            if os.path.getsize(fs[0]) == a and a > 0: return fs[0]
            continue
        time.sleep(0.4)
    return None
PAGE_H = d.current_window_handle; EXT_H = None
def open_ext_tab():
    """WebDriver nu poate naviga la moz-extension://; deschidem fila din contextul chrome, cu principal de sistem."""
    global EXT_H
    before = set(d.window_handles)
    d.set_context('chrome')
    d.execute_script("const t=gBrowser.addTab(arguments[0],{triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal()});gBrowser.selectedTab=t;", f'moz-extension://{UUID}/popup.html')
    d.set_context('content')
    time.sleep(1.5)
    new = [h for h in d.window_handles if h not in before]
    EXT_H = new[0]
def ext_tab():
    if EXT_H is None: open_ext_tab()
    d.switch_to.window(EXT_H)
def ext_set(settings, reload=False):
    ext_tab()
    d.execute_async_script("const [s,cb]=[arguments[0],arguments[arguments.length-1]];browser.storage.local.clear().then(()=>browser.storage.local.set({settings:s})).then(()=>cb(1))", settings)
    if reload: d.execute_script("location.reload()"); time.sleep(1.2)
    d.switch_to.window(PAGE_H)
try:
    try:
        aid = d.install_addon(EXT, temporary=True); ok(True, f'extensie instalată temporar ({aid})')
    except Exception as e:
        ok(False, f'instalare extensie: {e}'); raise
    print('INFO Firefox', d.capabilities.get('browserVersion'))
    # 1) popup + 8 limbi
    EXP = {'en': 'Contrast', 'ro': 'Contrast', 'fr': 'Contraste', 'it': 'Contrasto', 'es': 'Contraste', 'pt': 'Contraste', 'de': 'Kontrast', 'hu': 'Kontraszt'}
    for lg, want in EXP.items():
        try:
            ext_set({'enabled': True, 'lang': lg}, reload=True); ext_tab(); time.sleep(0.6)
            got = d.execute_script("const e=document.querySelector('[data-i18n=tab_contrast]');return e?e.textContent:null")
            hl = d.execute_script("return document.documentElement.lang")
            ok(got == want and hl == lg, f'popup {lg}: "{got}" lang={hl}'); d.switch_to.window(PAGE_H)
        except Exception as e: ok(False, f'popup {lg}: {e}')
    # 2) corecție contrast
    try:
        ext_set({'enabled': True, 'autoFix': True, 'target': 7}); d.get('http://127.0.0.1:8771/contrast.html'); time.sleep(2.5)
        r = d.execute_script("const f=e=>{const c=getComputedStyle(e);return [c.color,c.backgroundColor]};return [f(document.getElementById('p')),f(document.getElementById('d'))]")
        rp, rd = ratio(rgb(r[0][0]), rgb(r[0][1])), ratio(rgb(r[1][0]), rgb(r[1][1]))
        ok(rp >= 4.5, f'contrast text pal corectat ({rp:.1f}:1)'); ok(rd >= 4.5, f'contrast câmp dezactivat corectat ({rd:.1f}:1)')
    except Exception as e: ok(False, f'contrast: {e}')
    # 3) temă
    try:
        ext_set({'enabled': True, 'theme': 'yb'}); d.get('http://127.0.0.1:8771/contrast.html'); time.sleep(2)
        bg = d.execute_script("return getComputedStyle(document.body).backgroundColor")
        ok(rgb(bg) == (0, 0, 0), f'temă galben pe negru: fundal {bg}')
    except Exception as e: ok(False, f'temă: {e}')
    # 4) dezactivat = pagină neatinsă
    try:
        ext_set({'enabled': False}); d.get('http://127.0.0.1:8771/contrast.html'); time.sleep(1.5)
        c = d.execute_script("return getComputedStyle(document.getElementById('p')).color")
        ok(rgb(c) == (187, 187, 187), f'extensie oprită: pagina neschimbată ({c})')
    except Exception as e: ok(False, f'oprit: {e}')
    # 5) captură + acoperire (fereastra 1 = pagina, fereastra 2 = popup pentru mesaje)
    def capture(url, label, check):
        try:
            ext_set({'enabled': True}); d.switch_to.window(PAGE_H)
            d.get(url); time.sleep(2)
            ext_tab()
            res = d.execute_async_script("const cb=arguments[arguments.length-1];browser.tabs.query({url:'http://127.0.0.1/*'}).then(t=>browser.tabs.sendMessage(t[0].id,{type:'cap',cmd:'visible'})).then(()=>cb('ok'),e=>cb('ERR '+e))")
            d.switch_to.window(PAGE_H); time.sleep(4)
            for f in glob.glob(dl + '/*'): os.remove(f)
            ActionChains(d).send_keys(Keys.TAB, Keys.TAB, Keys.ENTER).perform()
            f = wait_dl('.png'); ok(f is not None, f'{label}: PNG descărcat ({res})')
            if f: check(Image.open(f).convert('RGB'))
        except Exception as e: ok(False, f'{label}: {e}'); traceback.print_exc()
    def black_at(im, x, y):
        s = im.size[0] / d.execute_script("return innerWidth")
        return sum(1 for dx in range(-24, 25, 6) if 0 <= int(x * s) + dx < im.size[0] and im.getpixel((int(x * s) + dx, int(y * s)))[:3] == (0, 0, 0)) >= 4
    def chk_mail(im):
        x, y = d.execute_script("const r=document.getElementById('mail').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]")
        ok(black_at(im, x, y), 'captură Firefox: e-mailul este acoperit cu negru')
    capture('http://127.0.0.1:8771/contrast.html', 'captură vizibilă', chk_mail)
    def chk_frame(im):
        x, y, w, h = d.execute_script("const r=document.getElementById('f').getBoundingClientRect();return [r.left,r.top,r.width,r.height]")
        s = im.size[0] / d.execute_script("return innerWidth")
        blk = sum(1 for xx in range(int(x * s), int((x + w) * s), 3) for yy in range(int(y * s), int((y + h) * s), 3) if im.getpixel((xx, yy))[:3] == (0, 0, 0))
        ok(blk > 150, f'captură Firefox: e-mailul din iframe cross-origin este acoperit ({blk} pixeli negri)')
    capture('http://127.0.0.1:8771/outer.html', 'captură cu iframe cross-origin', chk_frame)
    # 6) v1.7: module opționale pe Firefox
    try:
        ext_set({'enabled': True, 'lang': 'en', 'noMotion': True, 'modKeys': True, 'modSimplify': True, 'modImgAlt': True, 'modVoice': True, 'modCaps': True})
        d.switch_to.window(PAGE_H); d.get('http://127.0.0.1:8771/mod.html'); time.sleep(3.2)
        alts = d.execute_script("return ['i1','i2','i4'].map(i=>document.getElementById(i).getAttribute('alt'))")
        ok(alts[0] and 'Casa veche din Brașov' in alts[0] and alts[1] and 'Casa din brasov' in alts[1] and alts[2] == 'Grafic vânzări', f'Firefox v1.7: alt imagini {alts}')
        print('DIAG storage', end=' '); ext_tab(); print(d.execute_async_script("const cb=arguments[arguments.length-1];browser.storage.local.get('settings').then(r=>browser.tabs.query({}).then(t=>cb(JSON.stringify([r,t.map(x=>x.url)]))))")[:400]); d.switch_to.window(PAGE_H)
        def m2(what, **kw):
            ext_tab()
            r = d.execute_async_script("const [w,kw,cb]=[arguments[0],arguments[1],arguments[arguments.length-1]];browser.tabs.query({url:'http://127.0.0.1/*'}).then(t=>browser.tabs.sendMessage(t[0].id,Object.assign({type:'feat',cmd:'m2',what:w},kw))).then(r=>cb(r),e=>cb({err:String(e)}))", what, kw)
            d.switch_to.window(PAGE_H); return r
        print('DIAG nextH ->', m2('nextH')); a1 = d.execute_script("return document.activeElement.textContent"); m2('nextH'); a2 = d.execute_script("return document.activeElement.textContent")
        ok((a1, a2) == ('Titlu principal', 'Secțiunea doi'), f'Firefox v1.7: navigare titluri {a1!r}, {a2!r}')
        m2('list'); time.sleep(0.4)
        n = d.execute_script("const h=document.getElementById('clr-m2');return h&&h.shadowRoot?h.shadowRoot.querySelectorAll('.pnl li button').length:-1")
        ok(n >= 6, f'Firefox v1.7: listă repere/titluri/linkuri ({n})')
        d.execute_script("document.getElementById('clr-m2').shadowRoot.querySelector('.pnl').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
        m2('panel'); time.sleep(1.2)
        pt = d.execute_script("const p=document.getElementById('clr-m2').shadowRoot.querySelector('.pnl');return p?[p.textContent,Array.from(p.querySelectorAll('dt')).map(x=>x.textContent)]:null")
        ok(pt and 'CNRED' in pt[1] and 'Summary' in pt[0], f'Firefox v1.7: rezumat + glosar {pt[1][:3] if pt else None}')
        vc = m2('voiceCmd', text='zoom in'); time.sleep(0.8)
        ok(vc.get('id') == 'zin', f'Firefox v1.7: comandă vocală interpretată ({vc})')
        sp = m2('spot'); ok(sp.get('on') is True, 'Firefox v1.7: spotlight'); m2('spot')
        vt = m2('voice'); ok('ok' in vt, f'Firefox v1.7: voce nu aruncă ({vt})')
        ext_tab(); rp = d.execute_script("return CLR.report.build([{rule:'img_alt',sev:'err',label:'<x>'}],{url:'javascript:1',names:{}},'html')")
        ok('&lt;x&gt;' in rp and 'href=\"#\"' in rp, 'Firefox v1.7: raport HTML escapat'); d.switch_to.window(PAGE_H)
        ext_set({'enabled': True}); d.switch_to.window(PAGE_H); d.get('http://127.0.0.1:8771/mod.html'); time.sleep(2.2)
        gone = d.execute_script("return [!!document.getElementById('clr-m2'), document.querySelectorAll('[data-clr-alt]').length, document.getElementById('i1').getAttribute('alt')]")
        ok(gone == [False, 0, None], f'Firefox v1.7: dezactivarea modulelor restaurează pagina {gone}')
    except Exception as e: ok(False, f'module v1.7: {e}'); traceback.print_exc()
except Exception:
    traceback.print_exc()
finally:
    try: d.quit()
    except Exception: pass
print('EȘECURI:', fails or 'niciunul')
sys.exit(1 if fails else 0)
