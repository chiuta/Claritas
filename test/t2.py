import asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page.html').resolve())
JS = """() => {
 const lin=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
 const L=c=>0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);
 const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number);
 const out=[];
 document.querySelectorAll('input,select,textarea,h2,.small,.tag,a,button,label,.banner').forEach(e=>{
   const cs=getComputedStyle(e); const fg=rgb(cs.color); let bgs=cs.backgroundColor; let bg=rgb(bgs);
   if(cs.backgroundColor==='rgba(0, 0, 0, 0)'){bg=[255,255,255]}
   if(e.classList.contains('banner')) bg=[245,124,0];
   const r=(Math.max(L(fg),L(bg))+.05)/(Math.min(L(fg),L(bg))+.05);
   out.push((e.tagName+'.'+(e.className||'')).padEnd(14)+' fg='+cs.color+' bg='+cs.backgroundColor+' ratio='+r.toFixed(2)+' op='+cs.opacity);
 });
 return out.join('\\n');}"""
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof2', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        page = await ctx.new_page()
        for st in ({'enabled':False},{'enabled':True}):
            await sw.evaluate("s => chrome.storage.local.set({settings: s})", st)
            await page.goto(PAGE); await page.wait_for_timeout(1200)
            print('==', st); print(await page.evaluate(JS))
        # live update test: change setting without reload
        await sw.evaluate("s => chrome.storage.local.set({settings: s})", {'enabled':True,'theme':'yb'})
        await page.wait_for_timeout(600)
        print('yb body bg:', await page.evaluate("getComputedStyle(document.body).backgroundColor"), 'fixed attrs:', await page.evaluate("document.querySelectorAll('[data-clr-c]').length"))
        await sw.evaluate("s => chrome.storage.local.set({settings: s})", {'enabled':True,'theme':'none','textScale':140})
        await page.wait_for_timeout(1200)
        print('back to none; fs attrs:', await page.evaluate("document.querySelectorAll('[data-clr-fs]').length"), 'h2 size:', await page.evaluate("getComputedStyle(document.querySelector('h2')).fontSize"))
        await sw.evaluate("s => chrome.storage.local.set({settings: s})", {'enabled':False})
        await page.wait_for_timeout(600)
        print('disabled; leftover attrs:', await page.evaluate("document.querySelectorAll('[data-clr-c],[data-clr-fs],[data-clr-b],[data-clr-p]').length"), 'style el:', await page.evaluate("!!document.getElementById('clr-style')"))
        await ctx.close()
asyncio.run(main())
