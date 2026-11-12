import sys as _s
try:
    _s.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
import sys,json
from playwright.sync_api import sync_playwright
import pathlib
URL=(pathlib.Path(__file__).resolve().parent.parent/'site'/'index.html').as_uri()
LANGS=['ro','en','de','es','fr','hu','it','pt']
fails=[]
def ok(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b=p.chromium.launch()
    for l in LANGS:
        for w in (320,390,1440):
            pg=b.new_page(viewport={'width':w,'height':900});errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            pg.on('console',lambda m:errs.append(m.text) if m.type in('error','warning') else None)
            pg.goto(URL);pg.wait_for_timeout(250)
            pg.select_option('#langSel',l);pg.wait_for_timeout(250)
            st=pg.evaluate("""()=>({lang:document.documentElement.lang,title:document.title,ov:document.documentElement.scrollWidth-innerWidth,
              missing:[...document.querySelectorAll('[data-en]')].filter(e=>e.dataset.ro!==undefined&&document.documentElement.lang!=='en'&&document.documentElement.lang!=='ro'&&e.innerHTML===e.dataset.en&&e.dataset.en.length>25).length,
              raw:(document.body.innerText.match(/\\{[abrp]\\}|undefined|NaN/g)||[]).length,
              nlang:document.querySelector('#langSel').value,al:document.querySelector('#langSel').getAttribute('aria-label')})""")
            ok(st['lang']==l and st['nlang']==l,f'{l} {w}: lang attr')
            ok(st['ov']<=1,f'{l} {w}: overflow {st["ov"]}')
            ok(st['missing']==0,f'{l} {w}: untranslated {st["missing"]}')
            ok(st['raw']==0,f'{l} {w}: placeholders/undefined {st["raw"]}')
            ok(not errs,f'{l} {w}: errors {errs[:2]}')
            if w==1440:
                pg.click('#tab-c');pg.fill('#fgC','#999999') if pg.locator('#fgC').count() else None
                print('  title:',st['title'][:60],'| aria:',st['al'])
                # reload persistence
                pg.reload();pg.wait_for_timeout(250)
                ok(pg.evaluate("document.documentElement.lang")==l,f'{l}: persisted after reload')
            pg.close()
    b.close()
print('RESULT',json.dumps(fails));sys.exit(1 if fails else 0)
