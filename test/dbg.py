import asyncio,pathlib,threading,sys
sys.argv=['x']
exec(open('t10_adversarial.py').read().split("async def main")[0])
async def m():
    async with async_playwright() as p:
        ctx=await p.chromium.launch_persistent_context('/tmp/prof11',channel='chrome',headless=True,args=[f'--disable-extensions-except={EXT}',f'--load-extension={EXT}','--headless=new','--no-sandbox'],viewport={'width':900,'height':700})
        sw=ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker',timeout=8000)
        pg=await ctx.new_page(); await sw.evaluate("async()=>{await chrome.storage.local.set({settings:{enabled:true}})}")
        await pg.goto(U+'/hostile.html'); await pg.wait_for_timeout(1500)
        await sw.evaluate("""async()=>{const [t]=await chrome.tabs.query({active:true,url:'http://localhost:8765/*'});await chrome.tabs.sendMessage(t.id,{type:'cap',cmd:'visible'});}""")
        await pg.wait_for_timeout(3000)
        print(await pg.evaluate("(()=>{const h=document.getElementById('clr-cap');if(!h)return 'no host';const c=getComputedStyle(h);return [h.localName,c.display,c.visibility,c.opacity,c.width,h.parentElement&&h.parentElement.localName,getComputedStyle(document.body).display].join(' ')})()"))
        await pg.screenshot(path='/tmp/h2.png'); await ctx.close()
asyncio.run(m())
