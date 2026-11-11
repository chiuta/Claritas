"""Cele 8 limbi: popup, recorder, selector, încărcare la cerere, hub în pagină (captură vizuală)."""
import asyncio, pathlib, json, sys
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
EXP = {'en': ('Contrast', 'Screen recording'), 'ro': ('Contrast', 'Înregistrare ecran'), 'fr': ('Contraste', 'Enregistrement d’écran'), 'it': ('Contrasto', 'Registrazione dello schermo'),
       'es': ('Contraste', 'Grabación de pantalla'), 'pt': ('Contraste', 'Gravação de ecrã'), 'de': ('Kontrast', 'Bildschirmaufnahme'), 'hu': ('Kontraszt', 'Képernyőfelvétel')}
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof12', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width': 900, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]; errs = []
        for lg in EXP:
            await sw.evaluate("async (l)=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:{enabled:true,lang:l}})}", lg)
            pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e)))
            await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(900)
            tab = await pop.evaluate("document.querySelector('[data-i18n=tab_contrast]').textContent")
            sel = await pop.evaluate("document.querySelector('select[data-k=lang]').value")
            ok(tab == EXP[lg][0] and sel == lg, f'popup {lg}: tab_contrast="{tab}", selector={sel}')
            htmllang = await pop.evaluate("document.documentElement.lang"); ok(htmllang == lg, f'popup {lg}: html lang={htmllang}')
            await pop.close()
            rec = await ctx.new_page(); rec.on('pageerror', lambda e: errs.append(str(e)))
            await rec.goto(f'chrome-extension://{eid}/recorder.html'); await rec.wait_for_timeout(700)
            h = await rec.evaluate("document.getElementById('h').textContent")
            # recorder folosește limba browserului (auto); acceptăm engleza/limba curentă
            ok(h == EXP[lg][1], f'recorder {lg}: titlu "{h}"'); await rec.close()
        # selector: 8 opțiuni
        pop = await ctx.new_page(); await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(600)
        opts = await pop.evaluate("[...document.querySelectorAll('select[data-k=lang] option')].map(o=>o.value)")
        ok(opts == ['auto', 'en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu'], f'selector: {opts}')
        # sanitize acceptă toate limbile
        r = await pop.evaluate("['fr','it','es','pt','de','hu','xx'].map(l=>CLR.sanitize({lang:l}).lang)")
        ok(r == ['fr', 'it', 'es', 'pt', 'de', 'hu', 'auto'], f'sanitize lang: {r}')
        await pop.close()
        # hub în pagină, limba germană (încărcare la cerere în content script)
        await sw.evaluate("async()=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:{enabled:true,lang:'de'}})}")
        page = await ctx.new_page(); await page.goto('file://' + str(pathlib.Path('page3.html').resolve())); await page.wait_for_timeout(1500)
        await page.keyboard.press('Alt+Shift+P'); await page.wait_for_timeout(700)
        await page.screenshot(path='/tmp/hub_de.png')
        await ctx.close()
        ok(len(errs) == 0, f'fără erori {errs[:2]}')
    print('EȘECURI:', fails or 'niciunul')
asyncio.run(main())
