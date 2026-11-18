"""Audit independent al PROPRIILOR pagini (popup în fiecare limbă/panou/mod + site): axe-core, reguli WCAG 2.x A/AA + best-practice.
axe-core este o implementare terță (Deque), nu scrisă de noi. Cale: env AXE_JS sau node_modules/axe-core/axe.min.js; lipsă => SKIP."""
import os, asyncio, pathlib, json
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
EXT = str(ROOT / 'dist/chromium')
AXE = os.environ.get('AXE_JS') or str(ROOT / 'node_modules/axe-core/axe.min.js')
fails = []
LAUNCH = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {'channel': 'chrome'}
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
RUN = """() => axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}, resultTypes:['violations']})
  .then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0,2).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary||'').split('\\n').slice(1,2).join('').slice(0,110))})))"""
IGNORE = {'region', 'landmark-one-main', 'page-has-heading-one'}  # reguli de pagină întreagă, nepotrivite pentru un popup
async def audit(pg, label):
    await pg.evaluate(open(AXE, encoding='utf-8').read())
    v = [x for x in await pg.evaluate(RUN) if x['id'] not in IGNORE]
    ok(not v, f'axe {label}: {len(v)} încălcări' + ('' if not v else ' ' + json.dumps(v, ensure_ascii=False)[:600]))
async def main():
    if not os.path.exists(AXE): print('SKIP axe-core lipsește (npm i axe-core)'); return
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof23', **LAUNCH, headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        eid = sw.url.split('/')[2]
        pg = await ctx.new_page(); await pg.set_viewport_size({'width': 380, 'height': 700})
        for lang in ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de', 'hu']:
            await sw.evaluate("(l) => chrome.storage.local.set({settings:{lang:l}})", lang)
            await pg.goto(f'chrome-extension://{eid}/popup.html'); await pg.wait_for_timeout(1200)
            await pg.evaluate("localStorage.removeItem('clr_simple')")
            ok((await pg.evaluate("document.querySelector('#modeBtn').textContent")).strip() != '' and await pg.evaluate("document.documentElement.lang") == lang, f'popup: limba efectivă = {lang}')
            tabs = await pg.evaluate("[...document.querySelectorAll('.tabs [role=tab], .tabs button')].map(b => b.id || b.getAttribute('data-p') || '')")
            await audit(pg, f'popup[{lang}] fila implicită')
            if lang in ('ro', 'en'):
                for i in range(len(tabs)):
                    await pg.evaluate("(i) => document.querySelectorAll('.tabs [role=tab], .tabs button')[i].click()", i); await pg.wait_for_timeout(250)
                    await audit(pg, f'popup[{lang}] fila #{i}')
            await pg.evaluate("localStorage.setItem('clr_simple','1')"); await pg.reload(); await pg.wait_for_timeout(900)
            await audit(pg, f'popup[{lang}] mod simplu')
        site = ROOT / 'site/index.html'
        for lang in ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de', 'hu']:
            await pg.set_viewport_size({'width': 1200, 'height': 800})
            await pg.goto(f'file://{site}'); await pg.wait_for_timeout(600)
            await pg.select_option('#langSel', lang); await pg.wait_for_timeout(500)
            ok(await pg.evaluate("document.documentElement.lang") == lang, f'site: limba comutată la {lang}')
            await audit(pg, f'site[{lang}]')
        await ctx.close()
    print('RESULT', fails)
    raise SystemExit(1 if fails else 0)
asyncio.run(main())
