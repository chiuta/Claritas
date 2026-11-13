"""Run every Chromium test under the current BROWSER_* env; write results/<label>.json."""
import sys, os, subprocess, json, time, glob
os.chdir(os.path.dirname(os.path.abspath(__file__)))
label = sys.argv[1] if len(sys.argv) > 1 else 'browser'
only = sys.argv[2:]
res = {}
for f in sorted([x for x in glob.glob('t*.py') if x not in ('t1.py', 't2.py')]):
    if only and f not in only: continue
    if not only and f in ('t16_budget.py', 't17_shadow.py', 't18_upgrade.py'): continue  # rulate doar în jobul dedicat (build livrat)
    code = "import bt,runpy,sys;sys.argv=['%s'];runpy.run_path('%s',run_name='__main__')" % (f, f)
    t = time.time()
    for attempt in (1, 2):
        try:
            r = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, timeout=300)
            out, rc = r.stdout + r.stderr, r.returncode
        except subprocess.TimeoutExpired as e:
            o = e.stdout or ''
            out, rc = (o.decode() if isinstance(o, bytes) else o), -9
        # a doua încercare doar pentru căderi de infrastructură (timeout/descărcare/conectare), nu pentru aserțiuni picate
        if rc == 0 or any(l.startswith('FAIL') for l in out.splitlines()): break
        print('  reîncerc', f, '(rc', rc, ')', flush=True)
    fl = [l for l in out.splitlines() if l.startswith('FAIL')]
    res[f] = {'pass': out.count('PASS '), 'fail': len(fl) + (1 if (rc != 0 or not (out.count('PASS ') or out.count('SKIP '))) and not fl else 0), 'rc': rc, 'secs': round(time.time()-t), 'fails': fl[:15], 'tail': out[-700:] if (fl or rc) else ''}
    print(f, res[f]['pass'], 'pass', res[f]['fail'], 'fail rc', rc, flush=True)
    for l in fl: print('   ', l, flush=True)
    if res[f]['tail']: print('   TAIL:', res[f]['tail'].replace('\n', '\n   | '), flush=True)
os.makedirs('results', exist_ok=True)
json.dump(res, open('results/%s.json' % label, 'w'), indent=1, ensure_ascii=False)

bad = [k for k, v in res.items() if v['fail'] or v['rc'] != 0]
if bad:
    print('EȘEC:', ', '.join(bad), flush=True)
    sys.exit(1)
