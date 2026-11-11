import asyncio,pathlib,sys
exec(open('t12_audit3.py').read().split("async def main")[0])
async def m():
    async with async_playwright() as p:
        ctx=await p.chromium.launch_persistent_context('/tmp/prof14',channel='chrome',headless=True,args=[f'--disable-extensions-except={EXT}',f'--load-extension={EXT}','--headless=new','--no-sandbox'],viewport={'width':900,'height':700})
        sw=ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker',timeout=8000)
        await sw.evaluate("async()=>{await chrome.storage.local.set({settings:{enabled:true}})}")
        pg=await ctx.new_page(); await pg.goto(U+'/shadowframe.html'); await pg.wait_for_timeout(1500)
        print(await pg.evaluate("[window.frames.length, document.querySelectorAll('iframe').length]"))
        print([f.url for f in pg.frames])
        await ctx.close()
asyncio.run(m())
