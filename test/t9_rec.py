"""Înregistrare: recorder.html + jurnal de acțiuni din pagină (flaguri Chrome pentru selecție automată a sursei)."""
import asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page4.html').resolve())
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof9', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox',
                  '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--auto-select-desktop-capture-source=Entire screen', '--auto-accept-this-tab-capture', '--auto-select-tab-capture-source-by-title=Pagina captură'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]
        page = await ctx.new_page(); await page.goto(PAGE); await page.wait_for_timeout(1200)
        rec = await ctx.new_page(); errs = []; rec.on('pageerror', lambda e: errs.append(str(e))); rec.on('console', lambda m: print('C', m.text) if m.type == 'error' else None)
        await rec.goto(f'chrome-extension://{eid}/recorder.html'); await rec.wait_for_timeout(500)
        await rec.evaluate("document.getElementById('sys').checked=false; document.getElementById('cnt').checked=false")
        await rec.click('#start'); await rec.wait_for_timeout(2500)
        st = await rec.evaluate("[document.getElementById('status').textContent, document.getElementById('stop').disabled]")
        print('status', st, errs)
        if st[1]:
            print('INCERCARE: sursa nu a fost selectată automat în headless'); await ctx.close(); return
        await page.bring_to_front(); await page.click('#b1'); await page.keyboard.press('Tab'); await page.keyboard.press('Alt+Shift+M'); await page.wait_for_timeout(800)
        await rec.bring_to_front(); await rec.wait_for_timeout(500); await rec.click('#stop'); await rec.wait_for_timeout(2500)
        print('out visible', await rec.evaluate("!document.getElementById('out').hidden"))
        vtt = await rec.evaluate("fetch(document.getElementById('dll').href).then(r=>r.text())"); print(vtt)
        size = await rec.evaluate("fetch(document.getElementById('dlv').href).then(r=>r.blob()).then(b=>b.size)"); print('video bytes', size)
        b64 = await rec.evaluate("fetch(document.getElementById('dlv').href).then(r=>r.arrayBuffer()).then(b=>{let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)})")
        import base64, subprocess
        open('/tmp/out.webm', 'wb').write(base64.b64decode(b64))
        r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', '/tmp/out.webm'], capture_output=True, text=True)
        print('ffprobe duration:', r.stdout.strip(), r.stderr.strip()[:200])
        r2 = subprocess.run(['ffmpeg', '-v', 'error', '-i', '/tmp/out.webm', '-f', 'null', '-'], capture_output=True, text=True)
        print('decodare ffmpeg erori:', r2.stderr.strip()[:200] or 'niciuna')
        await ctx.close()
asyncio.run(main())
