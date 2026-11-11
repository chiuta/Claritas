"""Run every Chromium test under the current BROWSER_* env; write results/<label>.json."""
import sys, os, subprocess, json, time, glob
os.chdir(os.path.dirname(os.path.abspath(__file__)))
label = sys.argv[1] if len(sys.argv) > 1 else 'browser'
only = sys.argv[2:]
res = {}
for f in sorted(glob.glob('t*.py')):
    if only and f not in only: continue
    code = "import bt,runpy,sys;sys.argv=['%s'];runpy.run_path('%s',run_name='__main__')" % (f, f)
    t = time.time()
    try:
        r = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, timeout=420)
        out, rc = r.stdout + r.stderr, r.returncode
    except subprocess.TimeoutExpired as e:
        o = e.stdout or ''
        out, rc = (o.decode() if isinstance(o, bytes) else o), -9
    fl = [l for l in out.splitlines() if l.startswith('FAIL')]
    res[f] = {'pass': out.count('PASS '), 'fail': len(fl), 'rc': rc, 'secs': round(time.time()-t), 'fails': fl[:15], 'tail': out[-700:] if (fl or rc) else ''}
    print(f, res[f]['pass'], 'pass', res[f]['fail'], 'fail rc', rc, flush=True)
os.makedirs('results', exist_ok=True)
json.dump(res, open('results/%s.json' % label, 'w'), indent=1, ensure_ascii=False)
