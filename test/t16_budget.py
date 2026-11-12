"""Regresie: bugetul de noduri al corectării automate nu trebuie să fie cumulativ (>125k noduri în viața paginii)."""
import io
import asyncio, pathlib, tempfile, sys
from playwright.async_api import async_playwright
import sys as _s
_s.stdout.reconfigure(encoding='utf-8', errors='replace')
EXT = str(pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'chromium')
T = tempfile.mkdtemp()
pathlib.Path(T, 'mn.html').write_text('<!doctype html><body style="background:#fff"><div id=c></div></body>')
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(T + '/prof', channel='chrome', headless=True, args=['--headless=new', '--no-sandbox', f'--disable-extensions-except={EXT}', f'--load-extension={EXT}'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
        await sw.evaluate("async()=>{await chrome.storage.local.set({settings:{enabled:true,lang:'en',autoFix:true}})}")
        pg = await ctx.new_page(); await pg.goto('file://' + T + '/mn.html'); await pg.wait_for_timeout(1000)
        for _ in range(70):
            await pg.evaluate("()=>{const c=document.getElementById('c');const f=document.createDocumentFragment();for(let i=0;i<2000;i++){const s=document.createElement('span');s.textContent='x';s.style.color='#bbb';f.appendChild(s)}c.appendChild(f)}")
            await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(4000)
        await pg.evaluate("()=>{const p=document.createElement('p');p.id='late';p.textContent='late text';p.style.color='#bbb';document.body.appendChild(p)}")
        await pg.wait_for_timeout(2500)
        col = await pg.evaluate("()=>getComputedStyle(document.getElementById('late')).color")
        await ctx.close()
        good = col != 'rgb(187, 187, 187)'
        print(('PASS' if good else 'FAIL'), 'buget noduri necumulativ după 140k elemente:', col)
        print('EȘECURI:', 'niciunul' if good else '1'); sys.exit(0 if good else 1)
asyncio.run(main())
