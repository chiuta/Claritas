import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page.html').resolve())
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width':900,'height':700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        print('SW', sw.url)
        page = await ctx.new_page()
        async def shot(name, settings=None):
            if settings is not None:
                await sw.evaluate("s => chrome.storage.local.set({settings: s})", settings)
            await page.goto(PAGE); await page.wait_for_timeout(1500)
            await page.screenshot(path=name)
            n = await page.evaluate("document.querySelectorAll('[data-clr-c]').length")
            print(name, 'fixed:', n)
        await shot('s0_off.png', {'enabled': False})
        await shot('s1_fix.png', {'enabled': True})
        await shot('s2_ts.png', {'enabled': True, 'target': 7, 'textScale': 130})
        await shot('s3_wb.png', {'enabled': True, 'theme': 'wb', 'textScale': 100})
        await shot('s4_dark.png', {'enabled': True, 'theme': 'dark'})
        await shot('s5_mix.png', {'enabled': True, 'theme': 'none', 'target': 4.5, 'guide': True, 'warm': 30, 'cb': 'deut-fix', 'font':'dyslexic','lineHeight':1.8})
        await ctx.close()
asyncio.run(main())
