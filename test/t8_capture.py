"""Teste v1.5: captură (vizibil, regiune, pagină întreagă, element) + acoperire automată + .md; înregistrare."""
import asyncio, pathlib, io, tempfile
from playwright.async_api import async_playwright
from PIL import Image
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page4.html').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof8', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width':900,'height':700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await sw.evaluate("async()=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:{enabled:true}})}")
        await page.goto(PAGE); await page.wait_for_timeout(1500)
        async def cap(cmd):
            await sw.evaluate("""async (cmd) => { const [t]=await chrome.tabs.query({url:'file:///*'}); await chrome.tabs.sendMessage(t.id,{type:'cap',cmd}); }""", cmd)
        async def save(n=2, wait=3000):
            await page.wait_for_timeout(wait)
            for _ in range(n): await page.keyboard.press('Tab')
            async with page.expect_download(timeout=15000) as dl: await page.keyboard.press('Enter')
            d = await dl.value; path = await d.path(); return d.suggested_filename, path
        mail = await page.evaluate("(()=>{const r=document.getElementById('mail').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
        # 1) zona vizibilă + acoperire automată
        await cap('visible')
        name, path = await save(2, 2500)
        im = Image.open(path).convert('RGB'); ok(name.endswith('.png') and im.size == (900, 700), f'vizibil: {name} {im.size}')
        cx, cy = int(mail[0] + mail[2] / 2), int(mail[1] + mail[3] / 2)
        ok(sum(im.getpixel((cx + d, cy)) == (0, 0, 0) for d in range(-10, 11, 5)) >= 3, 'e-mailul este acoperit cu negru în captură')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(300)
        # 2) regiune
        await cap('region'); await page.wait_for_timeout(700)
        await page.mouse.move(100, 120); await page.mouse.down(); await page.mouse.move(300, 270, steps=5); await page.mouse.up()
        name, path = await save(2, 2500); im = Image.open(path)
        ok(abs(im.size[0] - 200) <= 2 and abs(im.size[1] - 150) <= 2, f'regiune 200x150: {im.size}')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(300)
        # 3) pagina întreagă (derulare + lipire, antet fix doar o dată)
        await page.evaluate("window.scrollTo(0,0)"); await cap('full')
        name, path = await save(2, 9000); im = Image.open(path).convert('RGB')
        total = await page.evaluate("document.documentElement.scrollHeight")
        ok(abs(im.size[1] - total) <= 4 and im.size[0] == 900, f'pagină întreagă {im.size} vs {total}')
        # antetul fix (albastru închis #223) trebuie să apară o singură dată pe verticală la x=450
        col = [im.getpixel((450, y)) for y in range(im.size[1])]
        hdr = [y for y, c in enumerate(col) if abs(c[0]-0x22)<4 and abs(c[1]-0x22)<4 and abs(c[2]-0x33)<4]
        ok(hdr and max(hdr) < 120, f'antet fix doar în partea de sus ({len(hdr)} px, max y={max(hdr) if hdr else None})')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(300)
        # 4) element (butonul focalizat) + fișier .md
        await page.evaluate("window.scrollTo(0,0); document.getElementById('b1').focus()")
        await cap('element'); await page.wait_for_timeout(700); await page.keyboard.press('Enter')
        bw = await page.evaluate("(()=>{const r=document.getElementById('b1').getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]})()")
        await page.wait_for_timeout(2000)
        await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
        got = []
        page.on('download', lambda d: got.append(d))
        await page.keyboard.press('Enter'); await page.wait_for_timeout(2500)
        names = [d.suggested_filename for d in got]
        ok(len(got) == 1 and names[0].endswith('.zip'), f'o singură descărcare ZIP: {names}')
        import zipfile, io
        z = zipfile.ZipFile(await got[0].path()); zn = z.namelist()
        ok(z.testzip() is None and any(n.endswith('.png') for n in zn) and any(n.endswith('.md') for n in zn), f'ZIP valid cu PNG + .md: {zn}')
        txt = z.read([n for n in zn if n.endswith('.md')][0]).decode('utf8')
        ok('Descriere alternativă' in txt and 'Secțiunea 1' in txt and 'Creat local' in txt, 'sidecar .md conține titluri și nota locală')
        im = Image.open(io.BytesIO(z.read([n for n in zn if n.endswith('.png')][0])))
        ok(abs(im.size[0]-bw[0]) <= 2 and abs(im.size[1]-bw[1]) <= 2, f'element {bw} -> {im.size}')
        await page.keyboard.press('Escape')
        ok(len(errs) == 0, f'fără erori de pagină {errs[:2]}')
        await ctx.close()
    print('EȘECURI:', fails or 'niciunul')
asyncio.run(main())
