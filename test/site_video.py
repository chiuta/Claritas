"""Clipurile de instalare, servite prin HTTP: fișiere există, VTT se încarcă în 8 limbi, cue-uri active, fără cereri externe."""
import sys, threading, http.server, functools, os
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright
ROOT = os.path.join(os.path.dirname(__file__), '..', 'site')
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % srv.server_port
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    pg = b.new_page()
    errs = []; ext = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('request', lambda r: ext.append(r.url) if not r.url.startswith('http://127.0.0.1') and not r.url.startswith('data:') else None)
    pg.goto(url)
    for lang in 'ro en fr it es pt de hu'.split():
        pg.select_option('#langSel', lang)
        pg.wait_for_timeout(150)
        r = pg.evaluate("""async()=>{const out=[];for(const v of document.querySelectorAll('figure.vid video')){
          const sh=[...v.textTracks].filter(t=>t.mode==='showing').map(t=>t.language);
          const t=[...v.textTracks].find(t=>t.language===document.documentElement.lang);
          for(let i=0;i<30&&(!t.cues||!t.cues.length);i++)await new Promise(r=>setTimeout(r,100));
          out.push({sh,n:t.cues?t.cues.length:0,cap:v.parentNode.querySelector('.vcap').textContent.length})}return out}""")
        ok(all(x['sh'] == [lang] and x['n'] >= 6 and x['cap'] > 40 for x in r), f'{lang}: pista activă + cue-uri + notă {r}')
    v = pg.evaluate("""()=>[...document.querySelectorAll('figure.vid video')].map(v=>v.querySelector('source').src)""")
    import urllib.request
    for u in v:
        r = urllib.request.urlopen(u); ok(r.status == 200 and int(r.headers['Content-Length']) > 50000, f'{u} {r.status}')
    ok(not ext, f'fără cereri externe {ext}')
    ok(not errs, f'fără erori {errs}')
    b.close()
srv.shutdown()
sys.exit(1 if fails else 0)
