"""v1.9: text pe imagine de fundal (titlu gri pe imagine albastră întunecată, ca pe pagina CNRED)."""
import asyncio, pathlib, sys, threading, zlib, struct, base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8')
EXT = str(pathlib.Path('../dist/chromium').resolve())
def png(rgb):
    raw = b''.join(b'\x00' + bytes(rgb) * 8 for _ in range(8))
    def ch(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return 'data:image/png;base64,' + base64.b64encode(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', 8, 8, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')).decode()
DARK, LIGHT = png((20, 60, 100)), png((235, 240, 245))
HTML = f"""<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>t</title><style>
body{{margin:0;background:#fff;font:20px sans-serif}} .hero{{padding:30px;background-size:cover}}
</style></head><body>
<div class="hero" style="background-image:url({DARK})"><h1 id="a" style="color:#8a8a60">Adeverințe privind sistemul de învățământ</h1></div>
<div class="hero" style="background-image:url({LIGHT})"><h1 id="b" style="color:#bbbbbb">Text deschis pe imagine deschisă</h1></div>
<div class="hero" style="background-image:url(/nope.png)"><h1 id="c" style="color:#8a8a60">Imagine nemăsurabilă</h1></div>
<div class="hero" style="background:#fff url({DARK}) no-repeat right"><h1 id="d" style="color:#000">Negru pe alb cu pictogramă</h1></div>
<p id="e" style="color:#8a8a60;background:url({DARK}) no-repeat right center;padding-right:30px;margin:10px">Legătură cu pictogramă mică (nu e fundal)</p>
<div class="hero" style="background-image:url({DARK})"><div id="cardw" style="background:#fff;padding:10px"><p id="f" style="color:#aaa;margin:0">Text gri pe card alb peste imagine</p></div></div>
<div class="hero" style="background-image:url(http://example.invalid/x.jpg);background-size:cover"><h1 id="g" style="color:#8a8a60">Imagine pe altă origine</h1></div>
</body></html>"""
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/': self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(HTML.encode())
        else: self.send_response(404); self.end_headers()
    def log_message(self, *a): pass
threading.Thread(target=ThreadingHTTPServer(('127.0.0.1', 8771), H).serve_forever, daemon=True).start()
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof19', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width': 900, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        await sw.evaluate("async()=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:{enabled:true}})}")
        pg = await ctx.new_page(); errs = []; reqs = []; pg.on('request', lambda r: reqs.append(r.url)); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8771/'); await pg.wait_for_timeout(2500)
        g = await pg.evaluate("""()=>Object.fromEntries(['a','b','c','d','e','f','g'].map(i=>{const e=document.getElementById(i),c=getComputedStyle(e);return [i,{col:c.color,sh:c.textShadow,h:e.hasAttribute('data-clr-h')}]}))""")
        print(g)
        rgb = lambda s: [int(x) for x in s[s.index('(')+1:s.index(')')].split(',')[:3]]
        lum = lambda c: sum(w * (((v/255)/12.92) if v/255 <= .03928 else (((v/255)+.055)/1.055)**2.4) for w, v in zip((.2126, .7152, .0722), c))
        ratio = lambda a, b: (max(lum(a), lum(b)) + .05) / (min(lum(a), lum(b)) + .05)
        ca = rgb(g['a']['col']); ok(ratio(ca, (20, 60, 100)) >= 4.5 and g['a']['h'], f'a: gri pe imagine albastră → contrast {ratio(ca,(20,60,100)):.1f}, halou')
        cb = rgb(g['b']['col']); ok(ratio(cb, (235, 240, 245)) >= 4.5, f'b: text deschis pe imagine deschisă → contrast {ratio(cb,(235,240,245)):.1f}')
        cc = rgb(g['c']['col']); ok(lum(cc) > 0.5 and g['c']['h'] and g['c']['sh'] != 'none', f'c: imagine nemăsurabilă → alb + halou {g["c"]}')
        ok(rgb(g['d']['col']) == [0, 0, 0] and not g['d']['h'], f'd: fundal alb opac + pictogramă → neatins {g["d"]}')
        ok(rgb(g['e']['col']) == [138, 138, 96] and not g['e']['h'], f'e: pictogramă mică no-repeat → neatins {g["e"]}')
        cf = rgb(g['f']['col']); ok(ratio(cf, (255, 255, 255)) >= 4.5 and not g['f']['h'], f'f: card alb opac peste imagine → corectat față de alb {ratio(cf,(255,255,255)):.1f}')
        cg = rgb(g['g']['col']); ok(lum(cg) > 0.5 and g['g']['h'], f'g: imagine pe altă origine (nu se descarcă) → alb + halou {g["g"]}')
        ok(sum('example.invalid' in r for r in reqs) <= 1, f'nicio cerere suplimentară către alte origini {reqs}')
        ok(not errs, f'fără erori {errs}')
        await ctx.close()
asyncio.run(main()); sys.exit(1 if fails else 0)
