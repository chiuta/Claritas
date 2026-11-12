"""Regresie confidențialitate: panourile Claritas nu trebuie să fie citibile de scripturile paginii (shadow DOM closed).
Rulează pe build-ul implicit (fără CLARITAS_TEST_SHADOW=open)."""
import io
import asyncio, pathlib, tempfile, sys
from playwright.async_api import async_playwright
import sys as _s
_s.stdout.reconfigure(encoding='utf-8', errors='replace')
EXT = str(pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'chromium'); T = tempfile.mkdtemp()
pathlib.Path(T, 'p.html').write_text('<!doctype html><body><p>x</p></body>')
if "mode: 'open'" in (pathlib.Path(EXT) / 'modules3.js').read_text(encoding='utf-8') or "attachShadow({ mode: 'open'" in (pathlib.Path(EXT) / 'modules3.js').read_text(encoding='utf-8'):
    print('SKIP build de test (CLARITAS_TEST_SHADOW=open)'); sys.exit(0)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(T + '/pr', channel='chrome', headless=True, args=['--headless=new', '--no-sandbox', f'--disable-extensions-except={EXT}', f'--load-extension={EXT}'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
        await sw.evaluate("async()=>{await chrome.storage.local.set({settings:{enabled:true,lang:'en',modInspect:true,modReadList:true},readList:[{url:'https://secret.example/a',title:'SECRET',note:'private note',t:1}]})}")
        pg = await ctx.new_page(); await pg.goto('file://' + T + '/p.html'); await pg.wait_for_timeout(800)
        await pg.keyboard.press('Alt+Shift+B'); await pg.wait_for_timeout(800)
        r = await pg.evaluate("()=>{const out=[];for(const id of ['clr-m2','clr-m3']){const h=document.getElementById(id);if(h&&h.shadowRoot)out.push(id)}return {open:out,html:document.documentElement.outerHTML.includes('SECRET')}}")
        await ctx.close()
        good = not r['open'] and not r['html']
        print('PASS' if good else 'FAIL', 'panourile nu sunt citibile din pagină', r)
        sys.exit(0 if good else 1)
asyncio.run(main())
