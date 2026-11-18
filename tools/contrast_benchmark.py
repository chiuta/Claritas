#!/usr/bin/env python3
"""Benchmark public de contrast: aceleași pagini cu și fără Claritas.
Două măsurători, ambele independente de motorul extensiei:
  - calcul propriu în pagină (WCAG 2.x) — atenție: folosește aceeași formulă ca ținta extensiei, deci este parțial circular;
  - regula color-contrast din axe-core (--axe cale/axe.min.js), implementare terță, care NU a fost scrisă de noi;
  - procent de noduri de text care trec AA (4.5:1 / 3:1 pentru text mare), înainte și după;
  - regresii: elemente cu text vizibil care ies din ecran orizontal după corecție, schimbarea înălțimii documentului.
Utilizare: python tools/contrast_benchmark.py [--urls fișier] [--ext dist/chromium] [--out rezultate.json]
Rulează pe un set de URL-uri din tools/benchmark_urls.txt (editabil). Rezultatele nu sunt o dovadă de conformitate."""
import argparse, os, asyncio, json, pathlib, statistics, sys
from playwright.async_api import async_playwright
JS = r"""() => {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const bgOf = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && c[3] > 0) { chain.push(c); if (c[3] >= 1) break; } } let base = [255, 255, 255, 1]; for (let i = chain.length - 1; i >= 0; i--) base = over(chain[i], base); return base; };
  let total = 0, pass = 0, skipped = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (w.nextNode()) {
    const n = w.currentNode; if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) { skipped++; continue; }
    const f = over(fg, bg); const l1 = lum(f), l2 = lum(bg); const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700; const large = px >= 24 || (px >= 18.66 && bold);
    total++; if (cr >= (large ? 3 : 4.5)) pass++;
  }
  const over_x = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && (e.textContent || '').trim() && getComputedStyle(e).position !== 'fixed'; }).length;
  return { total, pass, skipped, overflowX: over_x, docH: document.documentElement.scrollHeight };
}"""
AXE_SRC = None
async def measure(ctx, url, wait_ms):
    pg = await ctx.new_page()
    try:
        await pg.goto(url, wait_until='load', timeout=45000); await pg.wait_for_timeout(wait_ms)
        r = await pg.evaluate(JS)
        if AXE_SRC:
            try:
                await pg.evaluate(AXE_SRC)  # prin CDP: nu e blocat de CSP-ul paginii
                ax = await pg.evaluate("() => axe.run(document, {runOnly:{type:'rule',values:['color-contrast']}}).then(x => ({v: x.violations.reduce((n, v) => n + v.nodes.length, 0), p: x.passes.reduce((n, v) => n + v.nodes.length, 0), i: x.incomplete.reduce((n, v) => n + v.nodes.length, 0)}))")
                r['axe_violations'], r['axe_passes'], r['axe_incomplete'] = ax['v'], ax['p'], ax['i']
            except Exception as e:
                r['axe_error'] = str(e)[:80]
        return r
    except Exception as e:
        return {'error': str(e)[:120]}
    finally:
        await pg.close()
LAUNCH = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {'channel': 'chrome'}
async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--urls', default='tools/benchmark_urls.txt'); ap.add_argument('--ext', default='dist/chromium'); ap.add_argument('--out', default='contrast_benchmark.json'); ap.add_argument('--wait', type=int, default=2500); ap.add_argument('--min', type=int, default=20); ap.add_argument('--axe', default=None)
    a = ap.parse_args(); ext = str(pathlib.Path(a.ext).resolve())
    global AXE_SRC
    if a.axe: AXE_SRC = open(a.axe, encoding='utf-8').read()
    urls = [l.strip() for l in open(a.urls) if l.strip() and not l.startswith('#')]
    res = []
    async with async_playwright() as p:
        base = await p.chromium.launch_persistent_context('/tmp/bm_base', **LAUNCH, headless=True, args=['--no-sandbox'])
        withx = await p.chromium.launch_persistent_context('/tmp/bm_ext', **LAUNCH, headless=True, args=[f'--disable-extensions-except={ext}', f'--load-extension={ext}', '--headless=new', '--no-sandbox'])
        sw = withx.service_workers[0] if withx.service_workers else await withx.wait_for_event('serviceworker', timeout=30000)
        await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:true,autoFix:true,target:4.5}})")
        for u in urls:
            b = await measure(base, u, a.wait); x = await measure(withx, u, a.wait + 1500); b2 = await measure(base, u, a.wait)  # b2 = control: aceeași pagină, tot fără extensie
            res.append({'url': u, 'before': b, 'after': x, 'control': b2}); print(u, b, x, flush=True)
        await base.close(); await withx.close()
    def stable(r):  # pagina se schimbă singură (banner, încărcare leneșă, anti-bot) între două măsurători FĂRĂ extensie => nu poate fi atribuită extensiei
        c, b = r.get('control', {}), r['before']
        if 'error' in c: return False
        return abs(c['total'] - b['total']) <= 0.1 * max(b['total'], 1) and (not b['docH'] or abs(c['docH'] - b['docH']) / b['docH'] <= 0.2)
    for r in res: r['stable'] = 'error' not in r['before'] and 'error' not in r['after'] and stable(r)
    good = [r for r in res if r['stable'] and r['before']['total'] > a.min]
    unstable = [r['url'] for r in res if 'error' not in r['before'] and 'error' not in r['after'] and not r['stable']]
    rate = lambda d: d['pass'] / d['total'] if d['total'] else 1
    summary = {'pages_measured': len(good), 'pages_failed': len(res) - len(good) - len(unstable), 'pages_unstable_excluded': len(unstable),
               'aa_pass_before_median': round(statistics.median([rate(r['before']) for r in good]), 4) if good else None,
               'aa_pass_after_median': round(statistics.median([rate(r['after']) for r in good]), 4) if good else None,
               'pages_improved': sum(1 for r in good if rate(r['after']) > rate(r['before']) + 0.001),
               'pages_worse': sum(1 for r in good if rate(r['after']) < rate(r['before']) - 0.001),
               'pages_new_horizontal_overflow': sum(1 for r in good if r['after']['overflowX'] > r['before']['overflowX']),
               'pages_height_changed_over_10pct': sum(1 for r in good if r['before']['docH'] and abs(r['after']['docH'] - r['before']['docH']) / r['before']['docH'] > 0.10)}
    ax = [r for r in good if 'axe_violations' in r['before'] and 'axe_violations' in r['after']]
    if ax:
        summary.update({'axe_pages': len(ax), 'axe_violations_before_total': sum(r['before']['axe_violations'] for r in ax), 'axe_violations_after_total': sum(r['after']['axe_violations'] for r in ax),
                        'axe_pages_with_fewer': sum(1 for r in ax if r['after']['axe_violations'] < r['before']['axe_violations']), 'axe_pages_with_more': sum(1 for r in ax if r['after']['axe_violations'] > r['before']['axe_violations']),
                        'axe_pages_zero_before': sum(1 for r in ax if r['before']['axe_violations'] == 0), 'axe_pages_zero_after': sum(1 for r in ax if r['after']['axe_violations'] == 0)})
    summary['elements_not_measured_by_own_calc'] = sum(r['after'].get('skipped', 0) for r in good)
    with open(a.out.replace('.json', '.md'), 'w', encoding='utf-8') as f:
        f.write('| Pagină | Trec AA înainte | după | axe înainte | axe după | depășire X înainte→după |\n|---|---|---|---|---|---|\n')
        for r in res:
            if 'error' in r['before'] or 'error' in r['after']: f.write(f"| {r['url']} | eroare de încărcare | | | | |\n"); continue
            if not r['stable']: f.write(f"| {r['url']} | instabilă (se schimbă și fără extensie) — exclusă | | | | |\n"); continue
            b, x = r['before'], r['after']
            f.write(f"| {r['url']} | {b['pass']}/{b['total']} | {x['pass']}/{x['total']} | {b.get('axe_violations', '-')} | {x.get('axe_violations', '-')} | {b['overflowX']}→{x['overflowX']} |\n")
    json.dump({'summary': summary, 'pages': res}, open(a.out, 'w'), indent=1, ensure_ascii=False)
    print('REZUMAT', json.dumps(summary, ensure_ascii=False))
asyncio.run(main())
