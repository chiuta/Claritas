"""Găsește și descarcă Firefox Nightly pentru Android (x86_64) din archive.mozilla.org. Folosit doar în CI."""
import re, sys, urllib.request, datetime
BASE = 'https://archive.mozilla.org/pub/fenix/nightly/'
def ls(u):
    try: return urllib.request.urlopen(u, timeout=30).read().decode('utf-8', 'replace')
    except Exception as e: print('  ls fail', u, e); return ''
def dirs(u): return re.findall(r'href="([^"]+/)"', ls(u))
today = datetime.date.today()
for back in range(0, 3):
    d = (today.replace(day=1) - datetime.timedelta(days=30*back)); u = f'{BASE}{d.year}/{d.month:02d}/'
    items = [x for x in dirs(u) if 'x86_64' in x and 'fenix' in x]
    print(u, len(items), 'dirs x86_64'); 
    for it in sorted(items, reverse=True)[:6]:
        full = it if it.startswith('http') else ('https://archive.mozilla.org' + it if it.startswith('/') else u + it)
        files = re.findall(r'href="([^"]+\.apk)"', ls(full))
        print(' ', full, files[:2])
        if files:
            f = files[0]; furl = f if f.startswith('http') else ('https://archive.mozilla.org' + f if f.startswith('/') else full + f)
            urllib.request.urlretrieve(furl, '/tmp/fenix.apk'); print('OK', furl); sys.exit(0)
print('NOT FOUND'); sys.exit(1)
