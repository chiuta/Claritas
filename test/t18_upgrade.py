"""Upgrade: date vechi/corupte din versiuni anterioare nu strică extensia; lista de citit avertizează la limită.
Necesită build cu CLARITAS_TEST_SHADOW=open (panoul este citit din pagină)."""
import io
import asyncio, pathlib, tempfile, sys, time
from playwright.async_api import async_playwright
import sys as _s
_s.stdout.reconfigure(encoding='utf-8', errors='replace')
EXT = str(pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'chromium'); T = tempfile.mkdtemp()
pathlib.Path(T, 'p.html').write_text('<!doctype html><html lang="en"><head><title>Upgrade page</title></head><body><main><p style="color:#aaa">Old text</p><p>Body</p></main></body></html>')
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
SH = "document.getElementById('clr-m3') && document.getElementById('clr-m3').shadowRoot"
async def main():
    if "'closed' /*@SH*/" in (pathlib.Path(EXT) / 'modules3.js').read_text(encoding='utf-8'):
        print('SKIP: build livrat (shadow closed); rulează cu CLARITAS_TEST_SHADOW=open'); return
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(T + '/pr', channel='chrome', headless=True, args=['--headless=new', '--no-sandbox', f'--disable-extensions-except={EXT}', f'--load-extension={EXT}'], viewport={'width': 1000, 'height': 800})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
        eid = sw.url.split('/')[2]; errs = []
        # --- 1. date vechi / corupte ---
        await sw.evaluate("""async()=>{await chrome.storage.local.clear(); await chrome.storage.local.set({
          settings:{enabled:true,lang:'en',autoFix:true,legacyKeyFromV12:1,modReadList:true,modInspect:'yes',zoom:'big'},
          sites:{'example.com':{enabled:false}, bad:null},
          readList:[{url:'https://old.example/a',title:'Old A'},null,'text',{url:'https://old.example/b'},{title:'no url'}],
          siteCss:{'localhost':'p{color:red}','x':42}}) }""")
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + T + '/p.html'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("()=>document.documentElement.getAttribute('lang')") == 'en', 'pagina încărcată cu date vechi')
        await pg.keyboard.press('Alt+Shift+B'); await pg.wait_for_timeout(700)
        n = await pg.evaluate(f"()=>{{const r={SH}; return r?r.querySelectorAll('.pnl ul li').length:-1}}")
        ok(n >= 1, f'lista de citit afișează intrările valide din versiuni vechi ({n})')
        pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append('popup: ' + str(e)))
        await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(900)
        ok(await pop.evaluate("()=>!!document.querySelector('#mod3Fs')"), 'popup se încarcă cu setări vechi')
        # --- 2. limita listei ---
        await sw.evaluate("""async()=>{const l=[];for(let i=0;i<300;i++)l.push({id:String(i),url:'https://e.example/'+i,title:'T'+i,note:'',sel:'',ts:i,read:false});
          await chrome.storage.local.set({readList:l, settings:{enabled:true,lang:'en',modReadList:true}})}""")
        pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto('file://' + T + '/p.html'); await pg2.wait_for_timeout(1000)
        await pg2.keyboard.press('Alt+Shift+B'); await pg2.wait_for_timeout(600)
        await pg2.evaluate(f"""()=>{{const r={SH}; [...r.querySelectorAll('.pnl button')].find(b=>b.textContent.startsWith('Save this page')).click()}}""")
        await pg2.wait_for_timeout(900)
        live = await pg2.evaluate(f"()=>{{const r={SH}; return r.querySelector('.sr').textContent}}")
        size = await sw.evaluate("async()=>(await chrome.storage.local.get('readList')).readList.length")
        ok('limit' in live and '300' in live, f'avertizare la limita listei: {live!r}')
        ok(size == 300, f'lista rămâne la limită ({size})')
        # --- 3. reflow la zoom 400 % (viewport 320x256) ---
        for key, hk in (('modReadList', 'Alt+Shift+B'), ('modSiteCss', 'Alt+Shift+U'), ('modInspect', 'Alt+Shift+I')):
            await sw.evaluate("async(k)=>{await chrome.storage.local.set({settings:{enabled:true,lang:'en',[k]:true}})}", key)
            pg3 = await ctx.new_page(); await pg3.set_viewport_size({'width': 320, 'height': 256})
            await pg3.goto('file://' + T + '/p.html'); await pg3.wait_for_timeout(900)
            await pg3.keyboard.press(hk); await pg3.wait_for_timeout(600)
            r = await pg3.evaluate(f"()=>{{const r={SH}; const p=r&&r.querySelector('.pnl'); if(!p) return null; const b=p.getBoundingClientRect(); return {{l:b.left,rt:b.right,w:innerWidth,sw:document.documentElement.scrollWidth, scroll:p.scrollHeight>p.clientHeight, ov:getComputedStyle(p).overflowY}}}}")
            if key == 'modInspect': await pg3.close(); continue  # inspectorul nu are panou fix
            ok(r is not None and r['l'] >= -1 and r['rt'] <= r['w'] + 1 and r['sw'] <= r['w'] + 1, f'reflow 320px ({key}): panou în ecran, fără scroll orizontal {r}')
            ok(r is not None and (not r['scroll'] or r['ov'] in ('auto', 'scroll')), f'reflow 320px ({key}): conținut derulabil {r}')
            await pg3.close()
        ok(not errs, f'fără erori {errs}')
        await ctx.close()
    print('EȘECURI:', 'niciunul' if not fails else fails); sys.exit(1 if fails else 0)
asyncio.run(main())
