"""Content-script check on ANY Playwright engine (chromium / webkit / firefox) with a mocked WebExtension API.
Covers what Safari/WebKit would run: shared.js + content.js + features.js + extras.js (no background, no capture).
Usage: python engine_shim.py [chromium|webkit|firefox]"""
import asyncio, sys, pathlib, threading, json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent / 'extension'
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m, flush=True)
    if not c: fails.append(m)
MOCK = """
(() => {
  const S = {settings: %s}; const L = [];
  const mk = () => ({ addListener(f){ L.push(f) } });
  const store = {
    get: async (k) => { const o = {}; (Array.isArray(k) ? k : [k]).forEach(x => { if (x in S) o[x] = JSON.parse(JSON.stringify(S[x])) }); return o },
    set: async (o) => { const ch = {}; for (const k in o) { ch[k] = {newValue: o[k]}; S[k] = o[k] } L.forEach(f => { try { f(ch, 'local') } catch (e) {} }) }
  };
  const api = { id: 'shim', storage: { local: store, onChanged: mk(), managed: { get: async () => ({}) } },
    runtime: { id: 'shim', sendMessage: async () => ({}), onMessage: mk(), getURL: p => '/' + p, lastError: null },
    i18n: { getMessage: () => '' } };
  window.chrome = api; window.browser = api;
})();
"""
H = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>T</title></head><body>%s</body></html>'
PAGE = H % '<h1>Test</h1><p id="p" style="color:#bbbbbb;background:#ffffff">Text pal pe alb</p><input id="d" disabled value="Camp" style="color:#c8c8c8;background:#f0f0f0"><button id="b1">Buton</button>'
class Hd(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(PAGE.encode())
    def log_message(self, *a): pass
threading.Thread(target=ThreadingHTTPServer(('127.0.0.1', 8781), Hd).serve_forever, daemon=True).start()
def lum(c):
    r, g, b = [int(x) for x in c[c.index('(')+1:c.index(')')].split(',')[:3]]
    f = lambda v: (v/255/12.92) if v/255 <= 0.03928 else (((v/255)+0.055)/1.055) ** 2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def ratio(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True); return (x+0.05)/(y+0.05)
async def run(p, eng, settings):
    br = await getattr(p, eng).launch()
    ctx = await br.new_context(viewport={'width': 900, 'height': 600})
    await ctx.add_init_script(MOCK % json.dumps(settings))
    page = await ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    await page.goto('http://127.0.0.1:8781/')
    await page.add_script_tag(content='\n;\n'.join((ROOT/f).read_text(encoding='utf-8') for f in ['shared.js', 'content.js', 'features.js', 'extras.js']))
    await page.wait_for_timeout(2500)
    return br, ctx, page, errs
async def main():
    eng = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
    async with async_playwright() as p:
        br, ctx, page, errs = await run(p, eng, {'enabled': True, 'autoFix': True, 'target': 7})
        ok(await page.evaluate('typeof CLR') == 'object', f'{eng}: CLR încărcat')
        ok(not errs, f'{eng}: fără erori JS necaptate ({errs[:2]})')
        c1 = await page.evaluate("(()=>{const s=getComputedStyle(document.getElementById('p'));return [s.color,s.backgroundColor]})()")
        ok(ratio(*c1) >= 4.5, f'{eng}: contrast text pal corectat ({ratio(*c1):.1f}:1)')
        c2 = await page.evaluate("(()=>{const s=getComputedStyle(document.getElementById('d'));return [s.color,s.backgroundColor]})()")
        ok(ratio(*c2) >= 4.5, f'{eng}: contrast câmp dezactivat corectat ({ratio(*c2):.1f}:1)')
        await br.close()
        br, ctx, page, errs = await run(p, eng, {'enabled': True, 'theme': 'yb'})
        bg = await page.evaluate("getComputedStyle(document.body).backgroundColor")
        ok(bg in ('rgb(0, 0, 0)', 'rgba(0, 0, 0, 1)'), f'{eng}: temă galben pe negru ({bg})')
        await br.close()
        br, ctx, page, errs = await run(p, eng, {'enabled': False})
        c = await page.evaluate("getComputedStyle(document.getElementById('p')).color")
        ok(c == 'rgb(187, 187, 187)', f'{eng}: extensie oprită, pagina neschimbată ({c})')
        await br.close()
    print('ERRORI:', fails if fails else 'niciuna')
asyncio.run(main())
sys.exit(1 if fails else 0)
