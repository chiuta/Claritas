"""Diagnostic Vivaldi: ce ținte expune și unde se blochează Playwright connect_over_cdp."""
import asyncio, os, subprocess, tempfile, time, urllib.request, json, sys
exe = os.environ['BROWSER_EXE']; port = 9555; prof = tempfile.mkdtemp()
ext = os.path.abspath('dist/chromium')
extra = sys.argv[1:] 
cmd = [exe, f'--user-data-dir={prof}', f'--remote-debugging-port={port}', '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check', '--no-sandbox',
       *([] if os.environ.get('NOEXT') else [f'--load-extension={ext}']), 'about:blank'] + extra
log = open('/tmp/viv.log', 'w'); proc = subprocess.Popen(cmd, stdout=log, stderr=log, start_new_session=True)
for _ in range(60):
    try: urllib.request.urlopen(f'http://127.0.0.1:{port}/json/version', timeout=1); break
    except Exception: time.sleep(0.5)
time.sleep(4)
print('TARGETS', json.dumps([(t['type'], t['url'][:70]) for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list'))], indent=0))
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        t = time.time()
        try:
            br = await p.chromium.connect_over_cdp(f'http://127.0.0.1:{port}', timeout=40000)
            print('CONNECTED in', round(time.time() - t, 1), 'contexts', len(br.contexts), 'pages', [pg.url[:50] for pg in br.contexts[0].pages], 'sw', [w.url[:60] for w in br.contexts[0].service_workers])
            pg = await br.contexts[0].new_page(); await pg.goto('about:blank'); print('new_page ok')
        except Exception as e: print('CONNECT FAIL', str(e)[:300])
try: asyncio.run(asyncio.wait_for(main(), 60))
except BaseException as e: print("TIMEOUT/ERR", type(e).__name__, str(e)[:200])
os.killpg(os.getpgid(proc.pid), 9); os._exit(0)
