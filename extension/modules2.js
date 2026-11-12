/* Claritas v1.7 — module opționale (inerte până nu sunt activate din popup → „Module opționale”):
   modKeys     navigare rapidă (titluri / repere / listă), focus mărit, spotlight pe paragraf
   modVoice    control vocal (Web Speech API; în Chrome sunetul e prelucrat de serviciul browserului)
   modSimplify rezumat, text simplificat (euristic), glosar de abrevieri și cuvinte grele
   modImgAlt   descrieri sugerate pentru imagini fără alt (din legendă/titlu/nume de fișier), marcate „generat automat”
   modCaps     subtitrări live din microfon
   Funcțiile pure (parseVoice, summarize, simplify, glossary, altFromName) sunt exportate în CLR.m2 pentru teste. */
try { (function () {
  'use strict';
  const CLR = (typeof CLR !== 'undefined' ? CLR : (window.CLR = window.CLR || {}));
  const MAXTXT = 60000;
  let S = null, active = false, ctx = null, doc = document;
  const T = (k, v) => CLR.t(S && S.lang, k, v);

  /* ---------- funcții pure ---------- */
  const strip = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const VOICE = [
    ['nh', /\b(urmatorul titlu|titlul urmator|next heading)\b/],
    ['ph', /\b(titlul anterior|titlu anterior|previous heading|last heading)\b/],
    ['nl', /\b(urmatoarea zona|zona urmatoare|next landmark|next region)\b/],
    ['pl', /\b(zona anterioara|previous landmark|previous region)\b/],
    ['list', /\b(lista|arata lista|navigheaza|show list|navigation list)\b/],
    ['summary', /\b(rezumat|rezuma|summary|summarize)\b/],
    ['reader', /\b(cititor|mod citire|reader|reading mode)\b/],
    ['dark', /\b(tema intunecata|mod intunecat|dark mode|dark theme)\b/],
    ['zin', /\b(mareste|zoom in|bigger|larger)\b/],
    ['zout', /\b(micsoreaza|zoom out|smaller)\b/],
    ['read', /\b(citeste|read page|read)\b/],
    ['stop', /\b(opreste|taci|stop|quiet)\b/],
    ['down', /\b(deruleaza jos|scroll down|jos|down)\b/],
    ['up', /\b(deruleaza sus|scroll up|sus|up)\b/],
    ['help', /\b(ajutor|help|comenzi|commands)\b/]
  ];
  function parseVoice(text) { const s = strip(text); if (!s) return null; for (const [id, re] of VOICE) if (re.test(s)) return id; return null; }

  function sentences(text) {
    return String(text).replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=[\p{Lu}„"'(\d])/u).map((x) => x.trim()).filter((x) => x.length > 1);
  }
  const words = (s) => (String(s).toLowerCase().match(/[\p{L}]{3,}/gu) || []);
  function summarize(text, lang, n) {
    n = n || 5; const M = CLR.mod, ss = sentences(text);
    if (ss.length <= n) return ss;
    const L = M && M.posLang ? M.posLang(lang || CLR.detectLang(text) || '') : null;
    const freq = Object.create(null);
    ss.forEach((s) => words(s).forEach((w) => { if (L && M.pos(w, L) === 'f') return; freq[w] = (freq[w] || 0) + 1; }));
    const scored = ss.map((s, i) => {
      const ws = words(s); if (ws.length < 5 || ws.length > 60) return { i, s, v: 0 };
      let v = 0; ws.forEach((w) => { v += freq[w] || 0; }); v = v / Math.sqrt(ws.length);
      if (i === 0) v *= 1.3; else if (i < 3) v *= 1.1;
      return { i, s, v };
    });
    return scored.slice().sort((a, b) => b.v - a.v).slice(0, n).sort((a, b) => a.i - b.i).map((x) => x.s);
  }
  const SPLIT = /(;\s+|:\s+(?=[\p{L}])|,\s+(?=(?:iar|dar|însă|totuși|deoarece|pentru că|ceea ce|care|unde|când|but|which|because|although|whereas|however|while|so that)\b))/iu;
  function simplify(text) {
    const out = [];
    sentences(text).forEach((s) => {
      if (words(s).length <= 22) { out.push(s); return; }
      const parts = s.split(SPLIT).filter((p, i) => i % 2 === 0 || !/^[;:,]\s*$/.test(p));
      let cur = '';
      parts.forEach((p) => {
        p = p.trim().replace(/^[;:,]\s*/, ''); if (!p) return;
        if (!cur) { cur = p; return; }
        if (words(cur).length >= 8) { out.push(/[.!?…]$/.test(cur) ? cur : cur + '.'); cur = p.charAt(0).toUpperCase() + p.slice(1); } else cur += ', ' + p;
      });
      if (cur) out.push(/[.!?…]$/.test(cur) ? cur : cur + '.');
    });
    return out;
  }
  function initialsMatch(ws, abbr) {
    const a = abbr.replace(/s$/, '').toUpperCase();
    const caps = ws.filter((w) => /^\p{Lu}/u.test(w)).map((w) => w[0].toUpperCase()).join('');
    const all = ws.filter((w) => w.length >= 3 || /^\p{Lu}/u.test(w)).map((w) => w[0].toUpperCase()).join('');
    const fold = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return fold(caps) === fold(a) || fold(all) === fold(a);
  }
  function glossary(text) {
    const defs = Object.create(null), t = String(text).replace(/\s+/g, ' ');
    let m;
    const re1 = /((?:[\p{L}\-']+\s+){1,9}[\p{L}\-']+)\s*\(\s*([\p{Lu}][\p{Lu}0-9]{1,7}s?)\s*\)/gu;
    while ((m = re1.exec(t))) {
      const ws = m[1].split(' ');
      for (let i = Math.max(0, ws.length - 9); i < ws.length; i++) { const cand = ws.slice(i); if (initialsMatch(cand, m[2])) { defs[m[2]] = cand.join(' '); break; } }
    }
    const re2 = /\b([\p{Lu}][\p{Lu}0-9]{1,7})\s*\(\s*((?:[\p{L}\-']+\s+){1,9}[\p{L}\-']+)\s*\)/gu;
    while ((m = re2.exec(t))) { if (!defs[m[1]] && initialsMatch(m[2].split(' '), m[1])) defs[m[1]] = m[2]; }
    const cnt = Object.create(null); (t.match(/\b[\p{Lu}]{2,8}\b/gu) || []).forEach((a) => { cnt[a] = (cnt[a] || 0) + 1; });
    const undef = Object.keys(cnt).filter((a) => cnt[a] >= 2 && !defs[a] && !/^[IVXLCDM]+$/.test(a)).slice(0, 20);
    const hard = Object.create(null); (t.match(/[\p{L}]{13,}/gu) || []).forEach((w) => { const k = w.toLowerCase(); hard[k] = (hard[k] || 0) + 1; });
    const hardList = Object.keys(hard).sort((a, b) => hard[b] - hard[a] || a.length - b.length).slice(0, 15);
    return { defs, undef, hard: hardList };
  }
  const JUNK = /^(img|image|images|dsc|dscn|photo|foto|poza|pic|picture|screenshot|scaled|resized|thumb|thumbnail|copy|final|new|untitled|banner|file|download|unnamed)$/i;
  function altFromName(src) {
    let seg = String(src || '').split('?')[0].split('#')[0].split('/').pop() || '';
    try { seg = decodeURIComponent(seg); } catch (e) { }
    seg = seg.replace(/\.[a-z0-9]{2,5}$/i, '');
    const toks = seg.split(/[-_.+\s]+/).filter(Boolean).filter((x) => !/^\d+$/.test(x) && !/^\d+x\d+$/i.test(x) && !/^[0-9a-f]{8,}$/i.test(x) && !JUNK.test(x));
    const letters = toks.join('').replace(/[^\p{L}]/gu, '').length;
    if (!toks.length || letters < 4 || toks.filter((x) => /\p{L}{2,}/u.test(x)).length < toks.length / 2) return '';
    const s = toks.join(' '); return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---------- interfață (shadow DOM propriu, id cu prefix clr-) ---------- */
  let host = null, root = null, live = null, chip = null, panel = null, prevFocus = null;
  const CSS = `:host{all:initial}*{box-sizing:border-box;font-family:system-ui,sans-serif}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .chip{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#111;color:#fff;border:2px solid #fff;border-radius:10px;padding:8px 14px;font-size:15px;z-index:2147483646;max-width:90vw}
  .pnl{position:fixed;inset:5vh 5vw;max-width:820px;margin:0 auto;background:#fff;color:#111;border:3px solid #111;border-radius:12px;padding:14px;z-index:2147483647;overflow:auto;font-size:16px;line-height:1.5;box-shadow:0 8px 40px rgba(0,0,0,.5)}
  .pnl h2{margin:0 0 8px;font-size:20px}.pnl h3{margin:14px 0 4px;font-size:16px}.pnl button,.pnl input{font-size:16px;padding:6px 10px;border:2px solid #111;border-radius:8px;background:#fff;color:#111;cursor:pointer}
  .pnl button:focus-visible,.pnl input:focus-visible{outline:4px solid #ffbf00;outline-offset:2px}
  .pnl ul{list-style:none;padding:0;margin:6px 0}.pnl li{margin:2px 0}.pnl li button{width:100%;text-align:left;border-width:1px}
  .pnl .x{float:right}.pnl .tag{font-weight:700;margin-right:6px}.pnl p{margin:4px 0}.pnl dt{font-weight:700}.pnl dd{margin:0 0 4px 12px}
  .flash{position:fixed;border:4px solid #ffbf00;box-shadow:0 0 0 3px #000;border-radius:4px;pointer-events:none;z-index:2147483645}
  .spot{position:fixed;pointer-events:none;border-radius:6px;box-shadow:0 0 0 100vmax rgba(0,0,0,.62);z-index:2147483640}
  .caps{position:fixed;left:3vw;right:3vw;bottom:10px;background:#000;color:#fff;border:2px solid #fff;border-radius:10px;padding:10px 16px;z-index:2147483646;line-height:1.35;text-align:center;min-height:2em}`;
  function ensureUI() {
    if (host && host.isConnected) return;
    host = doc.createElement('div'); host.id = 'clr-m2'; host.style.cssText = 'all:initial';
    root = host.attachShadow({ mode: 'open' });
    const st = doc.createElement('style'); st.textContent = CSS; root.appendChild(st);
    live = doc.createElement('div'); live.className = 'sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.appendChild(live);
    chip = doc.createElement('div'); chip.className = 'chip'; chip.hidden = true; root.appendChild(chip);
    doc.documentElement.appendChild(host);
  }
  let chipT = 0;
  function say(msg, visual) {
    ensureUI(); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30);
    if (visual !== false) { chip.textContent = msg; chip.hidden = false; clearTimeout(chipT); chipT = setTimeout(() => { chip.hidden = true; }, 2600); }
  }
  const vis = (e) => { try { return e.checkVisibility ? e.checkVisibility() : e.getClientRects().length > 0; } catch (x) { return false; } };
  const ours = (e) => !!(e.closest && e.closest('[id^="clr-"]'));
  const txt = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim();

  /* ---------- navigare ---------- */
  const LM_SEL = 'main,nav,header,footer,aside,search,[role=main],[role=navigation],[role=banner],[role=contentinfo],[role=complementary],[role=search],[role=region][aria-label],[role=form][aria-label],section[aria-label],form[aria-label]';
  const LM_NAME = { MAIN: 'main', NAV: 'navigation', HEADER: 'banner', FOOTER: 'contentinfo', ASIDE: 'complementary', SEARCH: 'search', SECTION: 'region', FORM: 'form' };
  function nameOf(e) {
    let n = e.getAttribute('aria-label');
    if (!n) { const id = e.getAttribute('aria-labelledby'); if (id) n = id.split(/\s+/).map((i) => { const x = doc.getElementById(i); return x ? txt(x) : ''; }).join(' ').trim(); }
    return n || '';
  }
  function collect(kind) {
    const out = [];
    if (kind === 'h') doc.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]').forEach((e) => { if (!ours(e) && vis(e) && txt(e)) out.push({ el: e, kind: 'h', level: +(e.tagName[1]) || +e.getAttribute('aria-level') || 2, label: txt(e).slice(0, 120) }); });
    else if (kind === 'l') doc.querySelectorAll(LM_SEL).forEach((e) => {
      if (ours(e) || !vis(e)) return;
      const role = e.getAttribute('role') || LM_NAME[e.tagName] || '';
      if ((e.tagName === 'HEADER' || e.tagName === 'FOOTER') && e.closest('article,section,aside,main,[role=article]') && !e.getAttribute('role')) return;
      out.push({ el: e, kind: 'l', label: (role + (nameOf(e) ? ': ' + nameOf(e) : '')).slice(0, 120) });
    });
    else if (kind === 'a') doc.querySelectorAll('a[href]').forEach((e) => { if (!ours(e) && vis(e) && (txt(e) || e.getAttribute('aria-label')) && out.length < 400) out.push({ el: e, kind: 'a', label: (txt(e) || e.getAttribute('aria-label')).slice(0, 100) }); });
    return out;
  }
  let cursor = null;
  function cur() { const a = doc.activeElement; return cursor && cursor.isConnected ? cursor : (a && a !== doc.body ? a : null); }
  function jump(item, quiet) {
    const el = item.el; if (!el || !el.isConnected) return;
    const focusable = el.matches('a[href],button,input,select,textarea,[tabindex]');
    let added = false;
    if (!focusable) { el.setAttribute('tabindex', '-1'); added = true; }
    try { el.focus({ preventScroll: true }); } catch (e) { }
    if (added) el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
    const calm = S && S.noMotion;
    try { el.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' }); } catch (e) { el.scrollIntoView(); }
    cursor = el; flash(el);
    if (!quiet) say((item.kind === 'h' ? 'H' + item.level + ' · ' : '') + item.label, true);
  }
  function step(kind, dir) {
    const list = collect(kind); if (!list.length) { say(T('kn_none')); return false; }
    const c = cur(); let idx;
    if (!c) idx = dir > 0 ? 0 : list.length - 1;
    else {
      const after = list.findIndex((x) => x.el !== c && (c.compareDocumentPosition(x.el) & Node.DOCUMENT_POSITION_FOLLOWING) && !x.el.contains(c));
      if (dir > 0) idx = after >= 0 ? after : 0;
      else { let b = -1; list.forEach((x, i) => { if (x.el !== c && (c.compareDocumentPosition(x.el) & Node.DOCUMENT_POSITION_PRECEDING) && !x.el.contains(c)) b = i; }); idx = b >= 0 ? b : list.length - 1; }
    }
    jump(list[idx]); return true;
  }
  let flashEl = null, flashT = 0;
  function flash(el) {
    ensureUI(); if (!flashEl) { flashEl = doc.createElement('div'); flashEl.className = 'flash'; root.appendChild(flashEl); }
    const place = () => { const r = el.getBoundingClientRect(); Object.assign(flashEl.style, { left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px', display: 'block' }); };
    place(); setTimeout(place, 350); clearTimeout(flashT); flashT = setTimeout(() => { flashEl.style.display = 'none'; }, 1800);
  }

  /* ---------- panouri (dialog) ---------- */
  function closePanel() { if (panel) { panel.remove(); panel = null; if (prevFocus && prevFocus.isConnected) { try { prevFocus.focus(); } catch (e) { } } prevFocus = null; } }
  function openPanel(title) {
    ensureUI(); closePanel(); prevFocus = doc.activeElement;
    panel = doc.createElement('div'); panel.className = 'pnl'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', title);
    const x = doc.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '✕'; x.setAttribute('aria-label', CLR.t(S && S.lang, 'close')); x.addEventListener('click', closePanel);
    const h = doc.createElement('h2'); h.textContent = title; panel.append(x, h);
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closePanel(); return; }
      if (e.key === 'Tab') {
        const f = Array.from(panel.querySelectorAll('button,input')).filter((n) => !n.disabled); if (!f.length) return;
        const a = root.activeElement, i = f.indexOf(a);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    root.appendChild(panel); x.focus(); return panel;
  }
  const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  function openList() {
    const p = openPanel(T('kn_title'));
    const inp = doc.createElement('input'); inp.type = 'search'; inp.setAttribute('aria-label', T('kn_filter')); inp.placeholder = T('kn_filter'); inp.style.width = '100%';
    const ul = el('ul'); p.append(inp, ul);
    const all = [].concat(collect('l'), collect('h'), collect('a')).slice(0, 700);
    const draw = () => {
      ul.textContent = ''; const q = strip(inp.value); let n = 0;
      all.forEach((it) => {
        if (q && strip(it.label).indexOf(q) < 0) return; if (n++ > 150) return;
        const li = el('li'), b = el('button', null); b.type = 'button';
        const tag = it.kind === 'h' ? 'H' + it.level : it.kind === 'l' ? '◆' : '→';
        b.append(el('span', tag, 'tag'), doc.createTextNode(it.label));
        if (it.kind === 'h') li.style.paddingLeft = (it.level - 1) * 10 + 'px';
        b.addEventListener('click', () => { closePanel(); jump(it); });
        li.appendChild(b); ul.appendChild(li);
      });
      if (!n) ul.appendChild(el('li', T('kn_none')));
    };
    inp.addEventListener('input', draw);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = ul.querySelector('button'); if (b) b.click(); } });
    draw(); inp.focus();
  }

  /* ---------- extragere text ---------- */
  function pageText() {
    const rootEl = doc.querySelector('main,[role=main],article') || doc.body; const out = []; let total = 0;
    rootEl.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dd').forEach((e) => {
      if (ours(e) || !vis(e) || e.closest('nav,aside,footer,form,script,style,[aria-hidden=true],[hidden]')) return;
      const s = txt(e); if (!s || (!/^H\d$/.test(e.tagName) && s.length < 25)) return;
      if (total + s.length > MAXTXT) return; total += s.length; out.push({ tag: e.tagName, s });
    });
    return out;
  }

  /* ---------- rezumat / simplificare / glosar ---------- */
  async function openSimplify() {
    const paras = pageText(), full = paras.map((p) => p.s).join(' ');
    const p = openPanel(T('sm_title'));
    if (full.length < 80) { p.appendChild(el('p', T('sm_none'))); return { ok: true, empty: true }; }
    const lang = (CLR.detectLang(full) || (doc.documentElement.lang || 'en')).slice(0, 2);
    p.appendChild(el('h3', T('sm_sum')));
    const sumBox = el('div'); p.appendChild(sumBox);
    let sumTxt = null, ai = false;
    try { if (S.aiLocal && CLR.x && CLR.x.aiSummarize) { const r = await CLR.x.aiSummarize(full); if (r && r.text) { sumTxt = r.text; ai = true; } } } catch (e) { }
    if (!sumTxt) sumTxt = summarize(full, lang, 5).map((x) => '• ' + x).join('\n');
    sumTxt.split('\n').forEach((l) => sumBox.appendChild(el('p', l)));
    sumBox.appendChild(el('p', ai ? T('sm_ai') : T('sm_heur')));
    p.appendChild(el('h3', T('sm_simple')));
    const simp = paras.filter((x) => !/^H\d$/.test(x.tag)).slice(0, 14).map((x) => simplify(x.s).join(' '));
    const sb = el('div'); simp.forEach((s) => sb.appendChild(el('p', s))); p.appendChild(sb);
    const cp = el('button', T('sm_copy')); cp.type = 'button'; cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(simp.join('\n\n')); say(T('sm_copied')); } catch (e) { say(T('sm_copy_err')); } });
    p.appendChild(cp);
    p.appendChild(el('h3', T('sm_gloss')));
    const g = glossary(full), dl = el('dl'); let nGl = 0;
    Object.keys(g.defs).forEach((a) => { dl.append(el('dt', a), el('dd', g.defs[a])); nGl++; });
    for (const w of g.hard) {
      let m = null; try { if (S.modDict && CLR.mod && CLR.mod.dictLookup) m = await CLR.mod.dictLookup(w); } catch (e) { }
      dl.append(el('dt', w), el('dd', m || '—')); nGl++;
    }
    g.undef.forEach((a) => { dl.append(el('dt', a), el('dd', T('sm_undef'))); nGl++; });
    p.appendChild(nGl ? dl : el('p', T('sm_none')));
    return { ok: true, summary: sumTxt, ai, simplified: simp.length, glossary: nGl };
  }

  /* ---------- alt pentru imagini ---------- */
  const GENERIC_ALT = /^(image|img|photo|picture|imagine|poza|fotografie|foto|graphic|icon|untitled|\d+)$/i;
  const autoImgs = new Set();
  function altCandidate(img) {
    const fig = img.closest('figure'); const cap = fig && fig.querySelector('figcaption'); if (cap && txt(cap)) return txt(cap).slice(0, 140);
    const ti = img.getAttribute('title'); if (ti && ti.trim().length > 2) return ti.trim().slice(0, 140);
    const a = img.closest('a[href]'); if (a) { const al = a.getAttribute('aria-label') || a.getAttribute('title') || (txt(a) ? txt(a) : ''); if (al && al.length > 2) return al.slice(0, 140); }
    return altFromName(img.currentSrc || img.src || img.getAttribute('src'));
  }
  function scanImgs() {
    if (!S || !S.modImgAlt || !active) return 0; let n = 0;
    doc.querySelectorAll('img').forEach((img) => {
      if (ours(img) || img.hasAttribute('data-clr-alt') || img.getAttribute('role') === 'presentation' || img.getAttribute('aria-label') || img.getAttribute('aria-labelledby')) return;
      const alt = img.getAttribute('alt');
      if (alt != null && alt !== '' && !GENERIC_ALT.test(alt.trim()) && !altFromNameIsSame(alt, img)) return;
      if (alt === '') return;
      const c = altCandidate(img); if (!c) return;
      img.setAttribute('data-clr-alt', alt == null ? '' : alt); img.setAttribute('alt', T('im_auto') + ' ' + c); autoImgs.add(img); n++;
    });
    return n;
  }
  function altFromNameIsSame(alt, img) { const f = (img.getAttribute('src') || '').split('?')[0].split('/').pop() || ''; return !!f && (alt === f || alt.toLowerCase() === f.replace(/\.[a-z0-9]+$/i, '').toLowerCase()); }
  function undoImgs() {
    autoImgs.forEach((img) => { if (!img.isConnected) return; const was = img.getAttribute('data-clr-alt'); if (img.hasAttribute('data-clr-alt')) { if (was === '') img.removeAttribute('alt'); else img.setAttribute('alt', was); img.removeAttribute('data-clr-alt'); } });
    autoImgs.clear();
  }

  /* ---------- recunoaștere vocală (voce + subtitrări) ---------- */
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const BCP = { ro: 'ro-RO', en: 'en-US', de: 'de-DE', es: 'es-ES', fr: 'fr-FR', hu: 'hu-HU', it: 'it-IT', pt: 'pt-PT' };
  function recLang() { return BCP[CLR.langCode(S && S.lang)] || 'en-US'; }
  function makeRec(onText, interim) {
    const R = SR(); if (!R) return null;
    const r = new R(); r.lang = recLang(); r.continuous = true; r.interimResults = !!interim;
    r.onresult = (ev) => { for (let i = ev.resultIndex; i < ev.results.length; i++) onText(ev.results[i][0].transcript, ev.results[i].isFinal); };
    return r;
  }
  let voice = null, caps = null, capsEl = null, capsT = 0;
  function voiceToggle() {
    if (voice) { voice.stopped = true; try { voice.r.stop(); } catch (e) { } voice = null; say(T('vc_off')); return { ok: true, on: false }; }
    const r = makeRec((tx, fin) => { if (fin) execVoice(tx); }, false);
    if (!r) { say(T('vc_na')); return { ok: false, na: true }; }
    voice = { r, stopped: false };
    r.onend = () => { if (voice && !voice.stopped) { try { r.start(); } catch (e) { } } };
    r.onerror = (e) => { if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) { voice = null; say(T('vc_denied')); } };
    try { r.start(); } catch (e) { voice = null; return { ok: false }; }
    say(T('vc_on')); return { ok: true, on: true };
  }
  function execVoice(text) {
    const id = parseVoice(text); if (!id) { say(T('vc_unk', { w: String(text).slice(0, 40) })); return null; }
    const w = (v) => ctx && ctx.write && ctx.write(v);
    switch (id) {
      case 'nh': step('h', 1); break; case 'ph': step('h', -1); break;
      case 'nl': step('l', 1); break; case 'pl': step('l', -1); break;
      case 'list': openList(); break; case 'summary': openSimplify(); break;
      case 'reader': if (CLR.feat) CLR.feat.run({ cmd: 'reader' }); break;
      case 'dark': w({ theme: 'dark' }); break;
      case 'zin': w({ textScale: Math.min(300, (S.textScale || 100) + 10) }); break;
      case 'zout': w({ textScale: Math.max(50, (S.textScale || 100) - 10) }); break;
      case 'read': if (CLR.feat) CLR.feat.tts('page'); break;
      case 'stop': if (CLR.feat) CLR.feat.tts('stop'); closePanel(); break;
      case 'down': scrollBy({ top: innerHeight * 0.8, behavior: S.noMotion ? 'auto' : 'smooth' }); break;
      case 'up': scrollBy({ top: -innerHeight * 0.8, behavior: S.noMotion ? 'auto' : 'smooth' }); break;
      case 'help': say(T('vc_help'), true); break;
    }
    if (id !== 'help') say('✓ ' + id);
    return id;
  }
  function capsToggle() {
    if (caps) { caps.stopped = true; try { caps.r.stop(); } catch (e) { } caps = null; if (capsEl) { capsEl.remove(); capsEl = null; } say(T('cp_off')); return { ok: true, on: false }; }
    let committed = '';
    const r = makeRec((tx, fin) => {
      if (!capsEl) return; const shown = (committed + ' ' + tx).trim().split(/\s+/).slice(-40).join(' ');
      capsEl.textContent = shown; if (fin) committed = shown;
      clearTimeout(capsT); capsT = setTimeout(() => { committed = ''; if (capsEl) capsEl.textContent = ''; }, 7000);
    }, true);
    if (!r) { say(T('cp_na')); return { ok: false, na: true }; }
    ensureUI(); capsEl = el('div', '', 'caps'); capsEl.setAttribute('role', 'log'); capsEl.setAttribute('aria-live', 'off');
    capsEl.style.fontSize = Math.round(20 * ((S.cueSize || 120) / 100)) + 'px'; root.appendChild(capsEl);
    caps = { r, stopped: false };
    r.onend = () => { if (caps && !caps.stopped) { try { r.start(); } catch (e) { } } };
    r.onerror = (e) => { if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) { capsToggle(); say(T('vc_denied')); } };
    try { r.start(); } catch (e) { return { ok: false }; }
    say(T('cp_on')); return { ok: true, on: true };
  }

  /* ---------- spotlight + focus mărit ---------- */
  let spot = null, spotEl = null, spotRaf = 0;
  const BLOCK = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,dd,dt,figcaption,pre,summary,label';
  function spotPlace() {
    if (!spot || !spotEl || !spotEl.isConnected) return; const r = spotEl.getBoundingClientRect();
    Object.assign(spot.style, { left: r.left - 6 + 'px', top: r.top - 4 + 'px', width: r.width + 12 + 'px', height: r.height + 8 + 'px', display: 'block' });
  }
  const spotMove = (e) => { const t = e.target && e.target.closest ? e.target.closest(BLOCK) : null; if (t && !ours(t) && t !== spotEl) { spotEl = t; cancelAnimationFrame(spotRaf); spotRaf = requestAnimationFrame(spotPlace); } };
  const spotScroll = () => { cancelAnimationFrame(spotRaf); spotRaf = requestAnimationFrame(spotPlace); };
  function spotToggle(force) {
    const on = force != null ? force : !spot;
    if (on && !spot) {
      ensureUI(); spot = el('div', '', 'spot'); spot.style.display = 'none'; root.appendChild(spot);
      doc.addEventListener('mousemove', spotMove, true); doc.addEventListener('focusin', spotMove, true); addEventListener('scroll', spotScroll, true); addEventListener('resize', spotScroll);
      const a = doc.activeElement; if (a && a !== doc.body) spotMove({ target: a });
      say(T('kn_spot_on')); return true;
    }
    if (!on && spot) {
      doc.removeEventListener('mousemove', spotMove, true); doc.removeEventListener('focusin', spotMove, true); removeEventListener('scroll', spotScroll, true); removeEventListener('resize', spotScroll);
      spot.remove(); spot = null; spotEl = null; say(T('kn_spot_off')); return false;
    }
    return !!spot;
  }
  function focusCss(on) {
    let st = doc.getElementById('clr-m2-focus');
    if (!on) { if (st) st.remove(); return; }
    if (!st) { st = doc.createElement('style'); st.id = 'clr-m2-focus'; (doc.head || doc.documentElement).appendChild(st); }
    st.textContent = ':focus-visible{outline:4px solid #ffbf00!important;outline-offset:3px!important;box-shadow:0 0 0 7px #000!important}';
  }

  /* ---------- taste ---------- */
  function onKey(e) {
    if (!active || !S || !e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
    const k = e.code; let h = true;
    if (S.modKeys && k === 'KeyJ') step('h', 1);
    else if (S.modKeys && k === 'KeyK') step('h', -1);
    else if (S.modKeys && k === 'KeyM') step('l', 1);
    else if (S.modKeys && k === 'KeyN') step('l', -1);
    else if (S.modKeys && k === 'KeyL') openList();
    else if (S.modKeys && k === 'KeyG') spotToggle();
    else if (S.modSimplify && k === 'KeyY') openSimplify();
    else if (S.modVoice && k === 'KeyV') voiceToggle();
    else if (S.modCaps && k === 'KeyC') capsToggle();
    else h = false;
    if (h) { e.preventDefault(); e.stopPropagation(); }
  }

  /* ---------- cârlig către content.js ---------- */
  let listening = false, imgT = [];
  function teardown() {
    closePanel(); spotToggle(false); focusCss(false); undoImgs(); imgT.forEach(clearTimeout); imgT = [];
    if (voice) { voice.stopped = true; try { voice.r.stop(); } catch (e) { } voice = null; }
    if (caps) { caps.stopped = true; try { caps.r.stop(); } catch (e) { } caps = null; capsEl = null; }
    if (listening) { doc.removeEventListener('keydown', onKey, true); listening = false; }
    if (host) { host.remove(); host = null; flashEl = null; spot = null; }
  }
  function onApply(s, act) {
    S = s; active = !!act; ctx = CLR.ctx || ctx; doc = (ctx && ctx.doc) || document;
    if (!ctx || !ctx.isTop) return;
    if (!active || !S || !(S.modKeys || S.modVoice || S.modSimplify || S.modImgAlt || S.modCaps)) { teardown(); return; }
    if (!listening) { doc.addEventListener('keydown', onKey, true); listening = true; }
    focusCss(!!S.modKeys); if (!S.modKeys) spotToggle(false);
    if (!S.modVoice && voice) voiceToggle(); if (!S.modCaps && caps) capsToggle();
    if (S.modImgAlt) { scanImgs(); imgT.forEach(clearTimeout); imgT = [setTimeout(scanImgs, 1500), setTimeout(scanImgs, 4500)]; } else undoImgs();
  }
  function run(msg) {
    if (!active || !S) return { ok: false, inactive: true };
    switch (msg.what) {
      case 'diag': return { url: String(doc.location && doc.location.href), h: collect('h').length, hAll: doc.querySelectorAll('h1,h2,h3').length, vis: [].map.call(doc.querySelectorAll('h1,h2'), (e) => [vis(e), !!e.checkVisibility, e.getClientRects().length]), imgs: doc.querySelectorAll('img').length, ours0: ours(doc.querySelector('img')), im: !!S.modImgAlt, keys: !!S.modKeys, auto: autoImgs.size, scan: scanImgs() };
      case 'nextH': return { ok: step('h', 1) }; case 'prevH': return { ok: step('h', -1) };
      case 'nextL': return { ok: step('l', 1) }; case 'prevL': return { ok: step('l', -1) };
      case 'list': openList(); return { ok: true };
      case 'spot': return { ok: true, on: spotToggle() };
      case 'panel': if (!S.modSimplify) return { ok: false, off: true }; openSimplify(); return { ok: true };
      case 'voice': return S.modVoice ? voiceToggle() : { ok: false, off: true };
      case 'caps': return S.modCaps ? capsToggle() : { ok: false, off: true };
      case 'imgs': return { ok: true, n: scanImgs() };
      case 'voiceCmd': return { ok: true, id: execVoice(String(msg.text || '')) };
      case 'state': return { ok: true, voice: !!voice, caps: !!caps, spot: !!spot, panel: !!panel, imgs: autoImgs.size };
    }
    return { ok: false };
  }

  CLR.m2 = { onApply, run, parseVoice, summarize, simplify, glossary, altFromName, sentences, supported: () => ({ speech: !!SR() }) };
  if (CLR.ctx) onApply(CLR.ctx.S, CLR.ctx.active);
})(); } catch (e) { (typeof CLR !== 'undefined' ? CLR : {}).m2err = String(e && e.stack || e); }
