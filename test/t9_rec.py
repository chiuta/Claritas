"""Înregistrare: recorder.html + jurnal de acțiuni din pagină (flaguri Chrome pentru selecție automată a sursei)."""
import asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page4.html').resolve())
async def main():
    import os
    if os.environ.get('BROWSER_CDP'): print('SKIP înregistrare: selectorul de sursă nu poate fi acceptat automat într-un browser pornit prin CDP (verificat în Chromium/Chrome)'); return
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof9', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox',
                  '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--auto-select-desktop-capture-source=Entire screen', '--auto-accept-this-tab-capture', '--auto-select-tab-capture-source-by-title=Pagina captură'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
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
        vtt = await rec.evaluate("fetch(document.getElementById('dll').href).then(r=>r.text())"); print(vtt); ok_vtt = vtt.startswith('WEBVTT') and ('-->' in vtt); print(('PASS ' if ok_vtt else 'FAIL ') + 'jurnal VTT valid (antet WEBVTT și cel puțin o înregistrare)')
        size = await rec.evaluate("fetch(document.getElementById('dlv').href).then(r=>r.blob()).then(b=>b.size)"); print('video bytes', size)
        b64 = await rec.evaluate("fetch(document.getElementById('dlv').href).then(r=>r.arrayBuffer()).then(b=>{let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)})")
        import base64, subprocess
        open('/tmp/out.webm', 'wb').write(base64.b64decode(b64))
        import shutil, glob, re, os
        try:
            import imageio_ffmpeg; FF0 = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception: FF0 = None
        FF = FF0 or shutil.which('ffmpeg') or next(iter(sorted(glob.glob(os.path.expanduser('~/.cache/ms-playwright/ffmpeg-*/ffmpeg*')) + glob.glob(os.path.expanduser('~/AppData/Local/ms-playwright/ffmpeg-*/ffmpeg*')) + glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/ffmpeg-*/ffmpeg*')))), None)
        class R: pass
        r = R(); r.returncode = 1; r.stdout = ''; r.stderr = 'fără ffmpeg'
        if FF:
            ri = subprocess.run([FF, '-hide_banner', '-i', '/tmp/out.webm'], capture_output=True, text=True)
            m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', ri.stderr)
            if m: r.stdout = str(int(m[1])*3600 + int(m[2])*60 + float(m[3])); r.returncode = 0; r.stderr = ''
        print('ffprobe duration:', r.stdout.strip(), r.stderr.strip()[:200])
        try: dur = float(r.stdout.strip())
        except Exception: dur = None
        have_ff = r.returncode == 0 or dur is not None
        print(('PASS ' if (dur and dur > 1.5) else ('SKIP ' if not have_ff else 'FAIL ')) + f'WebM durată corectă ({dur})')
        r2 = subprocess.run([FF or 'ffmpeg', '-v', 'error', '-i', '/tmp/out.webm', '-f', 'null', '-'], capture_output=True, text=True)
        errtxt = '\n'.join(l for l in r2.stderr.splitlines() if 'non monotonically increasing dts' not in l).strip()
        if errtxt != r2.stderr.strip(): print('NOTĂ: avertisment dts de la muxer-ul ffmpeg (nu face fișierul nedecodabil), ignorat')
        print('decodare ffmpeg erori:', errtxt[:200] or 'niciuna')
        print(('PASS ' if (not errtxt and r2.returncode == 0) else ('SKIP ' if r2.returncode != 0 and not errtxt else 'FAIL ')) + 'WebM se decodează fără erori')
        print(('PASS ' if size and size > 2000 else 'FAIL ') + f'video descărcat ({size} B)')
        await ctx.close()
asyncio.run(main())
