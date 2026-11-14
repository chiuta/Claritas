"""Diagnostic: lansare ca în harness (browser pornit după driverul Playwright)."""
import asyncio, os, sys, time
from playwright.async_api import async_playwright
EXT = os.path.abspath('../dist/chromium')
async def main():
    async with async_playwright() as p:
        t = time.time()
        ctx = await p.chromium.launch_persistent_context('/tmp/profx', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        print('LAUNCHED in', round(time.time() - t, 1), 'sw', [w.url[:50] for w in ctx.service_workers], flush=True)
        sw = ctx.service_workers[0]
        await sw.evaluate("chrome.tabs.create({url:'about:blank',active:true}).then(()=>1)")
        for i in range(4):
            await asyncio.sleep(1.5); print('PAGES', [(p.url[:30], p.is_closed()) for p in ctx.pages], flush=True)
        live = [p for p in ctx.pages if not p.is_closed()]
        pg = live[-1]
        try: await pg.goto('data:text/html,<title>x</title>hello'); print('GOTO ok', await pg.title(), flush=True)
        except Exception as e: print('GOTO ERR', str(e)[:200], flush=True)
        await ctx.close()
try: asyncio.run(asyncio.wait_for(main(), 100))
except BaseException as e: print('ERR', type(e).__name__, str(e)[-300:])
os._exit(0)
