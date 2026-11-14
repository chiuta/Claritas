"""Diagnostic Vivaldi: ce metode creează ținte noi vizibile pentru Playwright."""
import asyncio, os, json, urllib.request, time
from playwright.async_api import async_playwright
EXT = os.path.abspath('../dist/chromium')
def lst():
    import re
    port = 9334
    try: return [(t['type'], t['url'][:45]) for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=3))]
    except Exception as e: return str(e)
async def snap(ctx, tag):
    await asyncio.sleep(2); print(tag, 'PW', [(p.url[:30], p.is_closed()) for p in ctx.pages], 'CDP', lst(), flush=True)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/profx', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        await snap(ctx, 'start')
        sw = ctx.service_workers[0]
        await sw.evaluate("chrome.tabs.create({url:'about:blank'}).then(()=>1)"); await snap(ctx, 'tabs.create')
        await sw.evaluate("chrome.windows.create({url:'about:blank'}).then(()=>1)"); await snap(ctx, 'windows.create')
        pg = ctx.pages[0]
        try: await pg.evaluate("window.open('about:blank','_blank')"); 
        except Exception as e: print('open ERR', str(e)[:100])
        await snap(ctx, 'window.open')
        br = ctx.browser
        try:
            s = await br.new_browser_cdp_session()
            r = await s.send('Target.createTarget', {'url': 'about:blank', 'newWindow': True}); print('createTarget(newWindow)', r, flush=True)
        except Exception as e: print('createTarget ERR', str(e)[:150])
        await snap(ctx, 'createTarget')
        try:
            r = await asyncio.wait_for(ctx.new_page(), 10); print('new_page orig ok')
        except BaseException as e: print('new_page orig', type(e).__name__)
        await snap(ctx, 'new_page')
try: asyncio.run(asyncio.wait_for(main(), 120))
except BaseException as e: print('ERR', type(e).__name__, str(e)[-300:])
os._exit(0)
