"""Teste v1.4: calm, unstick, fonturi încorporate, alt, GIF, hint-uri, lipire, dislexie, audit WCAG 2.2, forced-colors."""
import asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page3.html').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof7', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width':900,'height':700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        async def setst(s):
            await sw.evaluate("async (s) => { await chrome.storage.local.clear(); await chrome.storage.local.set({settings: s}); }", s)
            await page.goto(PAGE); await page.wait_for_timeout(1800)
        async def feat(cmd):
            return await sw.evaluate("""async (cmd) => { const [t]=await chrome.tabs.query({url:'file:///*'}); return await chrome.tabs.sendMessage(t.id,{type:'feat',cmd}); }""", cmd)
        # calm + unstick + altReveal + noFlash + font
        await setst({'enabled': True, 'calm': True, 'unstick': True, 'altReveal': True, 'noFlash': True, 'font': 'lexend', 'unblockPaste': True, 'hints': True})
        ok(await page.evaluate("getComputedStyle(document.getElementById('cookie')).display") == 'none', 'calm: bannerul cookie ascuns')
        ok(await page.evaluate("document.getElementById('cookie').hasAttribute('data-clr-calm')"), 'calm: marcat data-clr-calm')
        ok(await page.evaluate("getComputedStyle(document.getElementById('hdr')).position") == 'static', 'unstick: antet lipicios dezlipit')
        ok(await page.evaluate("document.querySelectorAll('[data-clr-altb]').length") == 2, 'alt vizibil: 2 insigne (lipsă + prezent)')
        ok(await page.evaluate("document.querySelectorAll('[data-clr-altb=miss]').length") == 1, 'alt lipsă marcat')
        ok(await page.evaluate("document.fonts.check('16px Lexend')"), 'font Lexend încărcat din extensie')
        ok(await page.evaluate("getComputedStyle(document.getElementById('p1')).fontFamily").__contains__('Lexend') if False else 'Lexend' in await page.evaluate("getComputedStyle(document.getElementById('p1')).fontFamily"), 'font Lexend aplicat paginii')
        # lipire deblocată
        await page.evaluate("document.getElementById('txt').dispatchEvent(new Event('paste',{bubbles:true,cancelable:true}))")
        ok(await page.evaluate("window.__paste||0") == 0, 'paste: handler-ul paginii nu rulează (deblocat)')
        # audit WCAG 2.2 suplimentar
        for _ in range(20):  # regulile suplimentare apar după o trecere de layout; navigatoarele lente au nevoie de timp
            a = await feat('audit'); rules = {i['rule'] for i in a['items']}
            if 'auth_ac' in rules and 'spacing_clip' in rules: break
            await page.wait_for_timeout(500)
        ok('auth_ac' in rules, 'audit: câmp parolă cu autocomplete=off'); ok('spacing_clip' in rules, 'audit: tăiere la spațierea textului (1.4.12)')
        ok(a['stats'].get('lix') is not None, f"LIX în statistici: {a['stats'].get('lix')}")
        # hint-uri numerotate: Alt+Shift+H, apoi 2 + Enter => al doilea țintă
        await page.evaluate("window.__clicked=null"); await page.mouse.click(5, 5)
        await page.keyboard.press('Alt+Shift+H'); await page.wait_for_timeout(300)
        await page.screenshot(path='v14_hints.png')
        await page.keyboard.press('2'); await page.keyboard.press('Enter'); await page.wait_for_timeout(300)
        ok(await page.evaluate("document.activeElement.tagName") in ('A', 'INPUT', 'BUTTON'), 'hint: tinta activată/focus mutat')
        # scanare cu un comutator
        await setst({'enabled': True, 'scan': True, 'scanMs': 600, 'calm': True})
        await page.evaluate("window.__clicked=null"); await page.mouse.click(5, 300)
        await page.keyboard.press('Alt+Shift+S'); await page.wait_for_timeout(2600)
        await page.screenshot(path='v14_scan.png')
        await page.keyboard.press('Space'); await page.wait_for_timeout(300); await page.keyboard.press('Escape')
        ok(await page.evaluate("document.activeElement !== document.body"), 'scanare: Space activează ținta evidențiată')
        # simulare dislexie
        await setst({'enabled': True, 'sim': 'dyslexia'})
        t0 = 'Aceasta este o propoziție suficient de lungă pentru testul de simulare dislexie și restaurare.'
        await page.wait_for_timeout(1200)
        ok(await page.evaluate("document.getElementById('p1').textContent") != t0, 'dislexie: litere amestecate')
        await setst({'enabled': True, 'sim': 'none'})
        ok(await page.evaluate("document.getElementById('p1').textContent") == t0, 'dislexie oprită: text intact după reîncărcare')
        await sw.evaluate("async()=>chrome.storage.local.set({settings:{enabled:true,sim:'dyslexia'}})"); await page.wait_for_timeout(1500)
        await sw.evaluate("async()=>chrome.storage.local.set({settings:{enabled:true,sim:'none'}})"); await page.wait_for_timeout(1200)
        ok(await page.evaluate("document.getElementById('p1').textContent") == t0, 'dislexie: restaurare la oprire fără reîncărcare')
        # simulări de vedere
        for sim in ('glare', 'astig'):
            await setst({'enabled': True, 'sim': sim})
            ok(await page.evaluate("document.getElementById('clr-style')!=null") and not errs, f'sim {sim} aplicat fără erori')
        # forced-colors / contrast mare OS
        await setst({'enabled': True, 'theme': 'wb', 'osPrefs': True})
        css1 = await page.evaluate("document.getElementById('clr-style').textContent.length")
        await page.emulate_media(forced_colors='active'); await page.wait_for_timeout(600)
        css2 = await page.evaluate("document.getElementById('clr-style')?.textContent.length || 0")
        ok(css1 != css2, f'forced-colors: CSS adaptat ({css1}->{css2})')
        await page.emulate_media(forced_colors='none')
        # dezactivare completă
        await setst({'enabled': False})
        ok(await page.evaluate("document.querySelectorAll('[data-clr-calm],[data-clr-altb],#clr-x').length") == 0, 'oprire: nicio urmă a extras.js')
        # FAB
        await setst({'enabled': True, 'fab': True}); await page.screenshot(path='v14_fab.png')
        ok(len(errs) == 0, f'fără erori de pagină {errs[:2]}')
        await ctx.close()
    print('EȘECURI:', fails or 'niciunul')
asyncio.run(main())
