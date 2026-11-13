"""Teste v1.3: audit, structură, mod lectură (bionic/gradient/RSVP), evidențiator, ascundere, bară selecție, TTS, derulare, hostile."""
import os, asyncio, pathlib, sys, json
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page2.html').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof5', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await sw.evaluate("() => chrome.storage.local.clear()")
        await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:true}})")
        await page.goto(PAGE); await page.wait_for_timeout(1500)
        # trimitem mesaje ca popup-ul: din service worker către tab
        async def feat(cmd, **kw):
            return await sw.evaluate("""async ([cmd,kw]) => { const ts=await chrome.tabs.query({url:'file:///*'}); const t=ts[ts.length-1]; return await chrome.tabs.sendMessage(t.id, Object.assign({type:'feat',cmd}, kw)); }""", [cmd, kw])
        r = await feat('ping'); ok(r and r['ok'], f'features încărcat {r}')
        for _ in range(20):  # așteptăm pagina completă (Opera sub xvfb e mai lentă)
            a = await feat('audit'); rules = {i['rule'] for i in a['items']}
            if a['stats']['words'] > 40 and 'lang' in rules: break
            await page.wait_for_timeout(500)
        diag = ''
        if os.environ.get('CLR_DIAG'):
            info = await sw.evaluate("async()=>{const ts=await chrome.tabs.query({});return ts.map(t=>[t.id,(t.url||'').slice(-30),t.active,t.windowId])}")
            pgi = await page.evaluate("[location.href.slice(-20),document.body.innerText.split(/\\s+/).length,innerWidth,innerHeight,document.documentElement.lang,document.querySelectorAll('img').length]")
            diag = f' DIAG tabs={info} stats={a["stats"]} rules={sorted(rules)} n={len(a["items"])} page={pgi}'
        for need in ['lang', 'img_alt', 'name', 'vague', 'label', 'h_skip', 'target_small']:
            ok(need in rules, f'audit detectează {need}')
        ok(a['stats']['words'] > 40, f"statistici cuvinte={a['stats']['words']}" + diag)
        o = await feat('outline'); ok(any(x['kind']=='h' and x['level']==1 for x in o['items']) and any(x['kind']=='lm' for x in o['items']), 'structură: titluri + zone')
        ok((await feat('locate', id=o['items'][0]['id']))['ok'], 'locate funcționează')
        # evidențiator: selectăm text real și apăsăm culoarea 2 din bara de selecție
        await page.evaluate("""()=>{const p=document.getElementById('p1').firstChild;const r=document.createRange();r.setStart(p,0);r.setEnd(p,38);const s=getSelection();s.removeAllRanges();s.addRange(r);}""")
        await page.mouse.move(5,5); await page.mouse.down(); await page.mouse.up()   # declanșează mouseup → bară (selecția se pierde la click; refacem)
        await page.evaluate("""()=>{const p=document.getElementById('p1').firstChild;const r=document.createRange();r.setStart(p,0);r.setEnd(p,38);const s=getSelection();s.removeAllRanges();s.addRange(r);document.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));}""")
        await page.wait_for_timeout(300)
        h0 = await feat('hlList'); ok(h0['supported'], 'CSS Highlight API suportat')
        # simulăm acțiunea de evidențiere prin apel direct al aceluiași cod (butonul e în shadow închis)
        await page.evaluate("""()=>{const p=document.getElementById('p1').firstChild;const r=document.createRange();r.setStart(p,0);r.setEnd(p,38);const s=getSelection();s.removeAllRanges();s.addRange(r);}""")
        await sw.evaluate("() => 0")
        # folosim tastatura/mouse pe butonul din shadow: poziționăm prin screenshot-less fallback → mesaj intern
        # nu avem API public de adăugare; verificăm persistența prin storage scris de pagina însăși:
        key = await page.evaluate("location.origin + location.pathname")
        await sw.evaluate("k => chrome.storage.local.set({highlights:{[k]:[{id:'x1',t:'Aceasta este prima propoziție',p:'',s:'',c:3,d:1}]}})", key)
        await page.wait_for_timeout(500)
        h1 = await feat('hlList'); ok(len(h1['items']) == 1, f'highlight încărcat din storage: {h1["items"]}')
        hasH = await page.evaluate("CSS.highlights.has('clr-h3')"); ok(hasH, 'highlight randat în pagină (CSS Highlight API)')
        await feat('hlDelete', id='x1'); await page.wait_for_timeout(300)
        ok(not await page.evaluate("CSS.highlights.has('clr-h3')"), 'highlight șters')
        # stocare coruptă
        await sw.evaluate("() => chrome.storage.local.set({highlights:'x', hidden:[1,2], reader:{size:'999999',theme:'<script>'}})"); await page.wait_for_timeout(300)
        ok((await feat('hlList'))['ok'] and (await feat('hiddenList'))['ok'], 'stocare coruptă (highlights/hidden) tolerată')
        # ascundere element: injectăm selector în storage, verificăm
        await sw.evaluate("() => chrome.storage.local.set({hidden:{'':['#cookie-banner','!!!invalid[[']}})"); await page.wait_for_timeout(400)
        ok(await page.evaluate("getComputedStyle(document.getElementById('cookie-banner')).display") == 'none', 'element ascuns după selector')
        ok(await page.evaluate("getComputedStyle(document.body).display") != 'none', 'selector invalid nu strică pagina')
        await feat('hiddenClear'); await page.wait_for_timeout(300)
        ok(await page.evaluate("getComputedStyle(document.getElementById('cookie-banner')).display") != 'none', 'elemente restaurate')
        # mod lectură
        r = await feat('reader'); await page.wait_for_timeout(500); ok(r['open'], 'reader deschis')
        sh = await page.evaluate("""()=>{const h=document.getElementById('clr-f');return !!h && document.documentElement.style.overflow==='hidden'}"""); ok(sh, 'reader activ + scroll blocat')
        await page.screenshot(path='r1_reader.png')
        # extragere: cookie/nav nu apar. Interior shadow închis → verificăm prin text TTS/stats nu; folosim screenshot + RSVP
        r2 = await feat('rsvp'); await page.wait_for_timeout(900); await page.screenshot(path='r2_rsvp.png')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(200)
        await page.keyboard.press('Escape'); await page.wait_for_timeout(300)
        ok(await page.evaluate("document.documentElement.style.overflow") != 'hidden', 'Esc închide RSVP apoi reader; scroll restaurat')
        # reader cu bionic + gradient + teme salvate
        await sw.evaluate("() => chrome.storage.local.set({reader:{theme:'dark',size:26,width:60,lh:1.9,font:'serif',bionic:true,gradient:true,wpm:400}})")
        await feat('reader'); await page.wait_for_timeout(900); await page.screenshot(path='r3_bionic_gradient.png'); await feat('reader')
        # autoscroll
        await page.set_viewport_size({'width': 800, 'height': 300}); await page.evaluate("document.body.style.minHeight='4000px'")
        y0 = await page.evaluate("scrollY"); await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:true,scrollSpeed:300}})"); await page.wait_for_timeout(300)
        r = await feat('autoscroll'); await page.wait_for_timeout(1200); y1 = await page.evaluate("scrollY")
        ok(r['on'] and y1 > y0 + 100, f'derulare automată {y0}->{y1}')
        await page.mouse.wheel(0, 10); await page.wait_for_timeout(300); y2 = await page.evaluate("scrollY"); await page.wait_for_timeout(500); y3 = await page.evaluate("scrollY")
        ok(abs(y3 - y2) < 3, 'derularea se oprește la acțiunea utilizatorului')
        # setări noi: tint, sim, maxWidth, bigTargets, pointerRing, hue
        await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:true,tint:'yellow',tintStrength:30,sim:'tunnel',maxWidth:60,bigTargets:true,pointerRing:true,hue:90,noTransform:true,dwell:true,muteMedia:true,hoverSpeech:true,autoMode:'time',autoFrom:'00:00',autoTo:'23:59',autoTheme:'night'}})"); await page.wait_for_timeout(800)
        css = await page.evaluate("document.getElementById('clr-style').textContent")
        ok('max-width:60ch' in css and 'min-height:44px' in css and 'hue-rotate(90deg)' in css, 'CSS: maxWidth, bigTargets, hue')
        ok(await page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(13, 27, 42)', 'temă automată (time) aplicată → night')
        await page.mouse.move(100, 100); await page.wait_for_timeout(200); await page.screenshot(path='r4_misc.png')
        # hostile: setări noi corupte
        await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:true,tint:'};body{display:none',sim:{},maxWidth:'1e9',autoFrom:'25:99',autoTheme:'none',ttsVoice:'\\u0000x',hue:'NaN',dwellMs:-5,scrollSpeed:1e9}})"); await page.wait_for_timeout(600)
        css = await page.evaluate("document.getElementById('clr-style').textContent")
        ok('display:none' not in css.replace('display:none!important}', '') and await page.evaluate("getComputedStyle(document.body).display") != 'none', 'valori noi ostile neutralizate')
        # dezactivare → zero urme
        await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:false}})"); await page.wait_for_timeout(600)
        left = await page.evaluate("({f:!!document.getElementById('clr-f'),s:!!document.getElementById('clr-style')&&document.getElementById('clr-style').textContent.length>0,h:CSS.highlights.size,o:document.documentElement.style.overflow})")
        ok(not left['f'] and not left['s'] and left['h'] == 0 and left['o'] != 'hidden', f'teardown curat {left}')
        ok(len(errs) == 0, f'zero erori în pagină {errs[:2]}')
        await ctx.close()
    print('\nEȘECURI:', fails if fails else 'niciunul'); sys.exit(1 if fails else 0)
asyncio.run(main())
