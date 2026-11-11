"""Patch Playwright so the existing tests run on any Chromium-family browser.
Env: BROWSER_EXE (path) | BROWSER_CHANNEL (chrome, msedge, ...), HEADED=1 (use with xvfb-run)."""
import os, tempfile
from playwright.async_api import BrowserType
CH = 'Chrome/131.0.0.0'
MOB = dict(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True, device_scale_factor=2.625)
PROFILES = {
  'samsung':        dict(user_agent='Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36', **MOB),
  'chrome-android': dict(user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36', **MOB),
  'edge-android':   dict(user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0', **MOB),
  'kiwi':           dict(user_agent='Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36', **MOB),
  'opera-android':  dict(user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 OPR/85.0.0.0', **MOB),
  'chrome-win':     dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36'),
  'chrome-mac':     dict(user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36'),
  'chrome-linux':   dict(user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36'),
  'chromeos':       dict(user_agent='Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36'),
  'opera':          dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36 OPR/115.0.0.0'),
  'opera-gx':       dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36 OPR/115.0.0.0 (Edition Yx GX)'),
  'vivaldi':        dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36 Vivaldi/7.0'),
  'yandex':         dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' YaBrowser/24.12.0 Yowser/2.5 Safari/537.36'),
  'brave':          dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36'),
  'arc':            dict(user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Safari/537.36'),
  'whale':          dict(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' + CH + ' Whale/3.28.0.0 Safari/537.36'),
  'dark-scheme':    dict(color_scheme='dark'),
  'forced-colors':  dict(forced_colors='active'),
  'reduced-motion': dict(reduced_motion='reduce'),
  'zoom-200':       dict(viewport={'width': 640, 'height': 480}, device_scale_factor=2),
}
_orig = BrowserType.launch_persistent_context
async def _cdp_launch(self, kw):
    import subprocess, socket, time, urllib.request
    exe = os.environ['BROWSER_EXE']; port = 9333; prof = tempfile.mkdtemp(prefix='clr-cdp-')
    args = [a for a in kw.get('args', []) if not a.startswith('--headless')]
    cmd = [exe, f'--user-data-dir={prof}', f'--remote-debugging-port={port}', '--no-first-run', '--no-default-browser-check', '--no-sandbox',
           '--disable-features=DisableLoadExtensionCommandLineSwitch'] + (['--headless=new'] if not os.environ.get('HEADED') else []) + args + ['about:blank']
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try: urllib.request.urlopen(f'http://127.0.0.1:{port}/json/version', timeout=1); break
        except Exception: time.sleep(0.5)
    br = await self.connect_over_cdp(f'http://127.0.0.1:{port}')
    ctx = br.contexts[0]
    import hashlib
    ext = [a.split('=', 1)[1] for a in args if a.startswith('--load-extension=')]
    if ext:
        h = hashlib.sha256(os.path.realpath(ext[0]).encode()).hexdigest()[:32]
        eid = ''.join(chr(ord('a') + int(c, 16)) for c in h)
        from playwright.async_api import BrowserContext
        _orig_sw = BrowserContext.service_workers
        BrowserContext.service_workers = property(lambda self: [w for w in _orig_sw.fget(self) if eid in w.url])
    _close = ctx.close
    async def close():
        try: await br.close()
        except Exception: pass
        proc.kill()
    ctx.close = close
    return ctx
async def _patched(self, user_data_dir, **kw):
    if os.environ.get('BROWSER_CDP'): return await _cdp_launch(self, kw)
    kw.pop('channel', None)
    exe = os.environ.get('BROWSER_EXE'); ch = os.environ.get('BROWSER_CHANNEL')
    if exe: kw['executable_path'] = exe
    elif ch: kw['channel'] = ch  # 'chromium' = Chromium cu headless nou (suportă extensii)
    elif not ch: kw['channel'] = 'chrome'
    headed = bool(os.environ.get('HEADED'))
    kw['headless'] = not headed
    args = [a for a in kw.get('args', []) if not (a == '--headless=new' and headed)]
    args.append('--disable-features=DisableLoadExtensionCommandLineSwitch')
    kw['args'] = args
    prof = PROFILES.get(os.environ.get('EMULATE', ''))
    if prof:
        kw.update(prof)
    return await _orig(self, tempfile.mkdtemp(prefix='clr-prof-'), **kw)
BrowserType.launch_persistent_context = _patched
