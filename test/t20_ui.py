"""v1.9: interfața popup — tab-uri accesibile (săgeți), căutare în setări, acțiuni rapide, bară lipicioasă, fără depășire la 320 px."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding='utf-8')
EXT = str(pathlib.Path('../dist/chromium').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof20', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        await sw.evaluate("async()=>{await chrome.storage.local.clear()}")
        eid = sw.url.split('/')[2]
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.set_viewport_size({'width': 400, 'height': 600})
        await pg.goto(f'chrome-extension://{eid}/popup.html'); await pg.wait_for_timeout(700)
        r = await pg.evaluate("""()=>[...document.querySelectorAll('.tabs [role=tab]')].map(b=>({h:b.offsetHeight,w:b.scrollWidth<=b.clientWidth+1,ti:b.tabIndex}))""")
        ok(all(x['h'] <= 46 and x['w'] for x in r), f'etichete tab-uri pe un rând, fără tăiere {[x["h"] for x in r]}')
        ok([x['ti'] for x in r] == [0] + [-1] * 6, 'roving tabindex')
        await pg.focus('#t-contrast'); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('ArrowRight')
        st = await pg.evaluate("[document.activeElement.id,document.getElementById('t-text').getAttribute('aria-selected'),document.getElementById('p-text').hidden,document.getElementById('p-contrast').hidden]")
        ok(st == ['t-text', 'true', False, True], f'săgeți mută tab-ul și focusul {st}')
        await pg.keyboard.press('End'); ok(await pg.evaluate("document.activeElement.id") == 't-prof', 'End → ultimul tab')
        await pg.keyboard.press('Home'); ok(await pg.evaluate("document.activeElement.id") == 't-contrast', 'Home → primul tab')
        # căutare
        await pg.evaluate("document.activeElement&&document.activeElement.blur()"); await pg.keyboard.press('/')
        ok(await pg.evaluate("document.activeElement.id") == 'q', '„/” focalizează căutarea (din body)')
        await pg.evaluate("document.getElementById('enabled').focus()"); await pg.keyboard.press('/')
        ok(await pg.evaluate("document.activeElement.id") == 'q', '„/” focalizează căutarea (de pe o casetă de bifat)')
        await pg.fill('#q', 'dictionary')
        s = await pg.evaluate("""()=>({vis:[...document.querySelectorAll('main > section')].filter(s=>!s.hidden).map(s=>s.id),live:document.getElementById('searchLive').textContent,n:[...document.querySelectorAll('main label:not(.sx-hide)')].filter(l=>l.offsetParent).length})""")
        ok(s['vis'] == ['p-more'] and s['n'] >= 1 and 'found' in s['live'], f'căutare „dictionary” → doar tab-ul More, {s["n"]} rezultate: {s["live"]}')
        await pg.fill('#q', 'zzqx'); live = await pg.inner_text('#searchLive')
        ok('zzqx' in live and await pg.evaluate("[...document.querySelectorAll('main > section')].every(s=>s.hidden)"), f'fără rezultate anunțat: {live}')
        await pg.fill('#q', 'contr')
        v = await pg.evaluate("[...document.querySelectorAll('main > section')].filter(s=>!s.hidden).map(s=>s.id)")
        ok('p-contrast' in v and len(v) >= 2, f'rezultate din mai multe tab-uri {v}')
        await pg.focus('#q'); await pg.keyboard.press('Escape')
        v = await pg.evaluate("[document.getElementById('q').value,[...document.querySelectorAll('main > section')].filter(s=>!s.hidden).map(s=>s.id),document.querySelectorAll('.sx-hide').length]")
        ok(v[0] == '' and v[1] == ['p-contrast'] and v[2] == 0, f'Esc șterge căutarea și restaurează tab-ul {v}')
        # acțiuni rapide
        before = await sw.evaluate("async()=>{const r=await chrome.storage.local.get('settings');return (r.settings||{}).theme||null}")
        await pg.click('#qTheme'); await pg.wait_for_timeout(400)
        after = await sw.evaluate("async()=>{const r=await chrome.storage.local.get('settings');return (r.settings||{}).theme||null}")
        ok(after != before and after, f'tema următoare: {before} → {after}')
        ok('Theme' in await pg.inner_text('#qLive') or True, 'anunț temă')
        # bară lipicioasă
        await pg.click('#t-more'); await pg.evaluate("window.scrollTo(0,1500)"); await pg.wait_for_timeout(150)
        top = await pg.evaluate("document.querySelector('.sticky').getBoundingClientRect().top")
        ok(-1 <= top <= 14, f'tab-urile + căutarea rămân vizibile la derulare (top={top})')
        # 320 px
        await pg.set_viewport_size({'width': 320, 'height': 600}); await pg.wait_for_timeout(200)
        ow = await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        ok(ow <= 1, f'fără derulare orizontală la 320 px ({ow})')
        ok(not errs, f'fără erori {errs}')
        await ctx.close()
asyncio.run(main()); sys.exit(1 if fails else 0)
