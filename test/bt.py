"""Patch Playwright so the existing tests run on any Chromium-family browser.
Env: BROWSER_EXE (path) | BROWSER_CHANNEL (chrome, msedge, ...), HEADED=1 (use with xvfb-run)."""
import os, tempfile
from playwright.async_api import BrowserType
_orig = BrowserType.launch_persistent_context
async def _patched(self, user_data_dir, **kw):
    kw.pop('channel', None)
    exe = os.environ.get('BROWSER_EXE'); ch = os.environ.get('BROWSER_CHANNEL')
    if exe: kw['executable_path'] = exe
    elif ch and ch != 'chromium': kw['channel'] = ch
    elif not ch: kw['channel'] = 'chrome'
    headed = bool(os.environ.get('HEADED'))
    kw['headless'] = not headed
    args = [a for a in kw.get('args', []) if not (a == '--headless=new' and headed)]
    args.append('--disable-features=DisableLoadExtensionCommandLineSwitch')
    kw['args'] = args
    return await _orig(self, tempfile.mkdtemp(prefix='clr-prof-'), **kw)
BrowserType.launch_persistent_context = _patched
