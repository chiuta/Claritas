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
        pg = await ctx.new_page(); await pg.goto('about:blank'); print('NEWPAGE ok', flush=True)
        await ctx.close()
try: asyncio.run(asyncio.wait_for(main(), 100))
except BaseException as e: print('ERR', type(e).__name__, str(e)[-300:])
os._exit(0)
