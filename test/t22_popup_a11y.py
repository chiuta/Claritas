"""Popup: mod simplu (comutare, persistență) + audit de accesibilitate al propriului popup (nume accesibile, etichete, ținte tactile)."""
import os, asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
NAMES = """() => {
  const bad = [];
  const name = (e) => (e.getAttribute('aria-label') || '').trim() || (e.getAttribute('aria-labelledby') ? 'lb' : '') ||
    (e.labels && e.labels.length ? e.labels[0].textContent.trim() : '') || (e.closest('label') ? e.closest('label').textContent.trim() : '') ||
    (e.textContent || '').trim() || (e.getAttribute('title') || '').trim() || (e.getAttribute('placeholder') || '').trim();
  for (const e of document.querySelectorAll('button, input:not([type=hidden]), select, textarea, [role=tab], a[href]')) {
    if (e.closest('[hidden]')) continue;
    if (!name(e)) bad.push((e.id || e.getAttribute('data-k') || e.tagName) + '');
  }
  return bad;
}"""
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof22', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        eid = sw.url.split('/')[2]
        page = [pg for pg in ctx.pages if not pg.is_closed()][0]; errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(f'chrome-extension://{eid}/popup.html'); await page.wait_for_timeout(1500)
        ok(await page.evaluate("!!document.getElementById('modeBtn')"), 'butonul de mod există')
        ok(await page.evaluate("document.getElementById('modeBtn').getAttribute('aria-pressed')") == 'false', 'implicit: modul complet (aria-pressed=false)')
        ok(await page.evaluate("document.querySelector('.tabs').offsetParent!==null"), 'mod complet: filele sunt vizibile')
        bad = await page.evaluate(NAMES); ok(not bad, 'fără controale fără nume accesibil %s' % bad[:6])
        await page.click('#modeBtn'); await page.wait_for_timeout(400)
        ok(await page.evaluate("document.body.classList.contains('simple')"), 'mod simplu activat')
        ok(await page.evaluate("document.querySelector('.tabs').offsetParent===null"), 'mod simplu: filele ascunse')
        ok(await page.evaluate("getComputedStyle(document.querySelector('#p-contrast')).display") != 'none', 'mod simplu: panoul de contrast vizibil')
        ok(await page.evaluate("getComputedStyle(document.querySelector('#p-text')).display") == 'none', 'mod simplu: celelalte panouri ascunse')
        ok(await page.evaluate("document.getElementById('modeBtn').getAttribute('aria-pressed')") == 'true', 'aria-pressed=true în mod simplu')
        ok(await page.evaluate("!document.getElementById('simpleHint').hidden"), 'indiciul modului simplu e afișat')
        await page.reload(); await page.wait_for_timeout(1200)
        ok(await page.evaluate("document.body.classList.contains('simple')"), 'modul simplu persistă după reîncărcare')
        small = await page.evaluate("""() => [...document.querySelectorAll('body.simple button, body.simple input[type=checkbox], body.simple select')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return [e.id||e.getAttribute('data-k')||e.tagName,Math.round(r.width),Math.round(r.height)]}).filter(x=>x[1]<24||x[2]<24)""")
        ok(not small, 'ținte de cel puțin 24x24 px (WCAG 2.2 AA 2.5.8) în mod simplu %s' % small[:6])
        await page.click('#modeBtn'); await page.wait_for_timeout(300)
        ok(await page.evaluate("document.querySelector('.tabs').offsetParent!==null"), 'revenire la modul complet')
        ok(not errs, 'fără erori de pagină %s' % errs[:2])
        await ctx.close()
    print('rezumat eșecuri:', fails)
asyncio.run(main())
