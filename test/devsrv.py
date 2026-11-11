"""Server + pagină de test pentru browsere reale (Safari macOS, Mobile Safari în Simulator, Fenix, Chrome/Samsung Internet pe Android).
Pagina încarcă scripturile de conținut ale extensiei cu un API WebExtension simulat, rulează verificările în browserul real și trimite
rezultatele înapoi (POST /report). Usage: python devsrv.py <port> <tag> <out.json> [timeout_s]"""
import sys, json, pathlib, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
ROOT = pathlib.Path(__file__).resolve().parent.parent / 'extension'
PORT = int(sys.argv[1]); TAG = sys.argv[2]; OUT = sys.argv[3]; TMO = int(sys.argv[4]) if len(sys.argv) > 4 else 240
SCEN = {'on': {'enabled': True, 'autoFix': True, 'target': 7}, 'yb': {'enabled': True, 'theme': 'yb'}, 'off': {'enabled': False}}
ORDER = ['on', 'yb', 'off']
MOCK = """(()=>{const S={settings:%s};const L=[];const mk=()=>({addListener(f){L.push(f)}});
const store={get:async(k)=>{const o={};(Array.isArray(k)?k:[k]).forEach(x=>{if(x in S)o[x]=JSON.parse(JSON.stringify(S[x]))});return o},
set:async(o)=>{const ch={};for(const k in o){ch[k]={newValue:o[k]};S[k]=o[k]}L.forEach(f=>{try{f(ch,'local')}catch(e){}})}};
const api={id:'shim',storage:{local:store,onChanged:mk(),managed:{get:async()=>({})}},runtime:{id:'shim',sendMessage:async()=>({}),onMessage:mk(),getURL:p=>'/ext/'+p,lastError:null},i18n:{getMessage:()=>''}};
window.chrome=api;window.browser=api})();"""
TEST = """
const q=new URLSearchParams(location.search);const sc=q.get('s');const next=%s;
const errs=[];addEventListener('error',e=>errs.push(String(e.message)));
const lum=c=>{const [r,g,b]=c.match(/[\\d.]+/g).slice(0,3).map(Number);const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
const cs=(id)=>getComputedStyle(document.getElementById(id));
setTimeout(async()=>{const R=[];const ok=(n,c,d)=>R.push({name:n,ok:!!c,detail:d===undefined?'':String(d)});
 try{
  ok('CLR încărcat',typeof CLR==='object',typeof CLR);
  ok('fără erori JS',errs.length===0,errs.slice(0,2).join('|'));
  if(sc==='on'){const p=cs('p'),d=cs('d');
    ok('contrast text pal corectat',ratio(p.color,p.backgroundColor)>=4.5,p.color+' pe '+p.backgroundColor+' = '+ratio(p.color,p.backgroundColor).toFixed(1));
    ok('contrast câmp dezactivat corectat',ratio(d.color,d.backgroundColor)>=4.5,d.color+' pe '+d.backgroundColor+' = '+ratio(d.color,d.backgroundColor).toFixed(1));}
  if(sc==='yb'){const bg=getComputedStyle(document.body).backgroundColor;ok('temă galben pe negru',/rgba?\\(0, 0, 0(, 1)?\\)/.test(bg),bg);}
  if(sc==='off'){const c=cs('p').color;ok('extensie oprită: pagină neschimbată',c==='rgb(187, 187, 187)',c);}
  ok('probă CSS de autor (control)',(()=>{const st=document.createElement('style');st.textContent='#ctl{color:rgb(1,2,3)!important}';document.head.appendChild(st);const v=getComputedStyle(document.getElementById('ctl')).color;st.remove();return v==='rgb(1, 2, 3)'})(),'');
 }catch(e){ok('excepție',false,e&&e.message)}
 await fetch('/report',{method:'POST',body:JSON.stringify({scenario:sc,ua:navigator.userAgent,dpr:devicePixelRatio,w:innerWidth,results:R,done:!next})});
 if(next)location.href='/?s='+next;
},3000);
"""
def page(sc):
    nxt = ORDER[ORDER.index(sc) + 1] if ORDER.index(sc) + 1 < len(ORDER) else None
    s = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claritas test</title></head><body>'
    s += '<h1>Test</h1><p id="p" style="color:#bbbbbb;background:#ffffff">Text pal pe alb</p><input id="d" disabled value="Camp" style="color:#c8c8c8;background:#f0f0f0"><span id="ctl">control</span><button id="b1">Buton</button>'
    s += '<script>' + MOCK % json.dumps(SCEN[sc]) + '</script>'
    for f in ['shared.js', 'content.js', 'features.js', 'extras.js']:
        s += f'<script src="/ext/{f}"></script>'
    s += '<script>' + TEST % (json.dumps(nxt)) + '</script></body></html>'
    return s
got = {}; fin = threading.Event()
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith('/ext/'):
            f = ROOT / u.path[5:]
            if f.is_file(): self.send_response(200); self.send_header('Content-Type', 'application/javascript; charset=utf-8'); self.end_headers(); self.wfile.write(f.read_bytes()); return
            self.send_response(404); self.end_headers(); return
        sc = parse_qs(u.query).get('s', ['on'])[0]
        sc = sc if sc in SCEN else 'on'
        print('GET', self.headers.get('User-Agent', '')[:140], flush=True)
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(page(sc).encode())
    def do_POST(self):
        d = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or b'{}')
        got[d['scenario']] = d; print('REPORT', d['scenario'], d['ua'][:120], flush=True)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
        if d.get('done'): fin.set()
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(('0.0.0.0', PORT), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
print('READY', PORT, flush=True)
fin.wait(TMO); time.sleep(0.5)
fails = 0
for sc in ORDER:
    d = got.get(sc)
    if not d: print(f'FAIL [{TAG}] scenariu {sc}: fără raport (pagina nu a rulat)'); fails += 1; continue
    for r in d['results']:
        print(('PASS ' if r['ok'] else 'FAIL ') + f"[{TAG}] {sc}: {r['name']} {r['detail']}")
        fails += 0 if r['ok'] else 1
pathlib.Path(OUT).write_text(json.dumps({'tag': TAG, 'reports': got}, ensure_ascii=False, indent=1))
print('UA:', next((d['ua'] for d in got.values()), 'necunoscut'))
print('ERORI:', fails or 'niciuna'); sys.exit(1 if fails else 0)
