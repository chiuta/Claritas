#!/usr/bin/env python3
"""Claritas — mod CI: auditează pagini (URL-uri sau fișiere HTML) cu aceleași reguli ca extensia, fără browser instalat cu extensia.
Rulează motorul de audit (shared.js + features.js + extras.js + modules.js) într-un Chromium Playwright, cu API-ul extensiei simulat.
Ieșire: raport JSON / CSV / HTML per pagină + cod de ieșire 1 dacă numărul de erori depășește pragul.

  pip install playwright && playwright install chromium
  python tools/claritas_ci.py https://exemplu.ro page.html --format html --out rapoarte --max-errors 0

Notă: verifică doar regulile automate ale Claritas (nu înlocuiește revizuirea manuală / un audit WCAG complet)."""
import argparse, asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent / 'extension'
MOCK = """(() => { const S = {settings: %s}; const L = [];
 const mk = () => ({ addListener(f){ L.push(f) } });
 const store = { get: async (k) => { const o = {}; (Array.isArray(k) ? k : [k]).forEach(x => { if (x in S) o[x] = JSON.parse(JSON.stringify(S[x])) }); return o }, set: async () => {} };
 const api = { id: 'ci', storage: { local: store, sync: store, onChanged: mk(), managed: { get: async () => ({}) } },
   runtime: { id: 'ci', sendMessage: async () => ({}), onMessage: mk(), getURL: p => '/' + p, lastError: null, getManifest: () => ({version: '%s'}) }, i18n: { getMessage: () => '' } };
 window.chrome = api; window.browser = api; })();"""
def slug(s): return ''.join(c if c.isalnum() else '_' for c in s)[:80].strip('_') or 'page'
async def audit(browser, target, lang, wait_ms, version):
    url = target if '://' in target else pathlib.Path(target).resolve().as_uri()
    ctx = await browser.new_context(viewport={'width': 1280, 'height': 900})
    await ctx.add_init_script(MOCK % (json.dumps({'enabled': True, 'lang': lang, 'modAuditPlus': True, 'autoFix': False, 'osPrefs': False}), version))
    page = await ctx.new_page()
    await page.goto(url, wait_until='load', timeout=60000)
    await page.add_script_tag(content='\n;\n'.join((ROOT / f).read_text(encoding='utf-8') for f in ['shared.js', 'content.js', 'features.js', 'extras.js', 'modules.js', 'report.js']))
    await page.wait_for_timeout(wait_ms)
    res = await page.evaluate("""() => { const r = CLR.feat && CLR.feat.run({cmd: 'audit'}); return r && r.ok ? {items: r.items, title: document.title, lang: CLR.langCode(%s), names: Object.fromEntries(Object.keys(CLR.report.MAP).map((k) => [k, CLR.t(%s, 'a_' + k)]))} : null }""" % (json.dumps(lang), json.dumps(lang)))
    if res is None: await ctx.close(); raise RuntimeError('auditul nu a pornit pentru ' + target)
    out = {}
    for fmt in ('json', 'csv', 'html'):
        out[fmt] = await page.evaluate("""([items, meta, fmt]) => CLR.report.build(items, meta, fmt)""", [res['items'], {'url': url, 'title': res['title'], 'date': '', 'version': version, 'lang': lang, 'names': res['names']}, fmt])
    await ctx.close()
    return url, res['items'], out
async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('targets', nargs='+'); ap.add_argument('--format', choices=['json', 'csv', 'html', 'all'], default='json')
    ap.add_argument('--out', default='claritas-reports'); ap.add_argument('--max-errors', type=int, default=0, help='prag de erori (implicit 0)')
    ap.add_argument('--lang', default='en'); ap.add_argument('--wait', type=int, default=1800, help='ms de așteptare după încărcare')
    a = ap.parse_args(); out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    version = json.loads((ROOT.parent / 'manifests' / 'chrome.json').read_text())['version']; total = 0; bad = False
    async with async_playwright() as p:
        br = await p.chromium.launch()
        for t in a.targets:
            try: url, items, rep = await audit(br, t, a.lang, a.wait, version)
            except Exception as e: print('EROARE', t, e, file=sys.stderr); bad = True; continue
            err = sum(1 for i in items if i['sev'] == 'err'); warn = sum(1 for i in items if i['sev'] == 'warn'); total += err
            for fmt in (['json', 'csv', 'html'] if a.format == 'all' else [a.format]): (out / (slug(t) + '.' + fmt)).write_text(rep[fmt], encoding='utf-8')
            print(f'{"FAIL" if err > a.max_errors else "OK  "} {t}: {err} erori, {warn} avertismente'); bad = bad or err > a.max_errors
        await br.close()
    sys.exit(1 if bad else 0)
asyncio.run(main())
