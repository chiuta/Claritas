import json,re,sys,os
d=os.path.dirname(os.path.abspath(__file__))
def load(f):
    o={}
    for l in open(f,encoding='utf8').read().split('\n'):
        if '=' in l:
            k,v=l.split('=',1); o[k]=v
    return o
en=load('/tmp/en.txt'); ok=True
ph=lambda s:sorted(re.findall(r'\{\w+\}',s))
os.makedirs(os.path.join(d,'..','extension','lang'),exist_ok=True)
for c in ['fr','it','es','pt','de','hu']:
    t=load(os.path.join(d,c+'.txt'))
    miss=[k for k in en if k not in t]; extra=[k for k in t if k not in en]
    bad=[k for k in en if k in t and ph(en[k])!=ph(t[k])]
    emp=[k for k in en if k!='sev_tip' and k in t and not t[k].strip()]
    print(c,len(t),'lipsă',miss,'extra',extra,'placeholdere',bad,'goale',emp)
    if miss or extra or bad or emp: ok=False
    json.dump({k:t[k] for k in en},open(os.path.join(d,'..','extension','lang',c+'.json'),'w',encoding='utf8'),ensure_ascii=False,indent=0)
sys.exit(0 if ok else 1)
