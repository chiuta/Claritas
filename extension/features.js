/* CLARITAS — funcții suplimentare (v1.3): voce cu evidențiere, mod lectură, evidențiator, bară pe selecție,
   ascundere elemente, audit/structură, derulare automată, dwell-click, mute media.
   Cod scris de la zero (clean-room): doar specificațiile publice ale funcționalităților au servit ca inspirație.
   Rulează 100 % local; nu face cereri de rețea. Activ doar în cadrul principal al paginii. */
(() => {
  'use strict';
  if (window.top !== window || window.__claritasFeat) return;
  window.__claritasFeat = true;

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const doc = document;
  const { FONTS, t } = CLR;
  let S = null, active = false;
  const L = () => (S && S.lang) || 'auto';
  const T = (k, v) => t(L(), k, v);
  const alive = () => { try { return !!(api.runtime && api.runtime.id); } catch (e) { return false; } };
  const hasHL = () => typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
  const clamp = (v, lo, hi, d) => { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  const prefersReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ================= rădăcină de interfață (shadow închis) ================= */
  const UI_CSS = `
    *{box-sizing:border-box}
    button{font:600 14px/1.2 system-ui,Segoe UI,Arial,sans-serif;cursor:pointer;border:2px solid #ffeb3b;background:#111;color:#ffeb3b;border-radius:8px;padding:7px 10px;min-height:36px;min-width:36px}
    button:hover{background:#2a2a2a} button:focus-visible{outline:3px solid #fff;outline-offset:2px}
    button[aria-pressed=true]{background:#ffeb3b;color:#000}
    .fl{position:fixed;z-index:2147483647;display:flex;gap:6px;align-items:center;background:#000;border:2px solid #ffeb3b;border-radius:10px;padding:6px;box-shadow:0 6px 24px rgba(0,0,0,.55);font:600 14px system-ui,Arial,sans-serif;color:#ffeb3b}
    .dot{width:26px;height:26px;min-width:26px;min-height:26px;padding:0;border-radius:50%;border:2px solid #fff}
    #sel{display:none} #player{left:50%;bottom:16px;transform:translateX(-50%);display:none}
    #chip{left:50%;top:12px;transform:translateX(-50%);display:none}
    #box{position:fixed;z-index:2147483646;pointer-events:none;border:3px solid #ff1744;background:rgba(255,23,68,.15);display:none}
    #loc{position:fixed;z-index:2147483646;pointer-events:none;border:4px solid #ff1744;box-shadow:0 0 0 4px #fff,0 0 0 8px #000;display:none;border-radius:4px}
    #dwell{position:fixed;z-index:2147483646;pointer-events:none;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;display:none;background:conic-gradient(#00e676 var(--p,0deg),rgba(0,0,0,.25) 0);-webkit-mask:radial-gradient(circle,transparent 15px,#000 16px);mask:radial-gradient(circle,transparent 15px,#000 16px)}
    #rd{position:fixed;inset:0;z-index:2147483645;display:none;flex-direction:column;overflow:hidden}
    #rd .bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#000;border-bottom:2px solid #ffeb3b}
    #rd .scroller{flex:1;overflow:auto;padding:24px 12px 80px}
    #rdc{margin:0 auto;outline:none}
    #rdc img{max-width:100%;height:auto} #rdc a{text-decoration:underline}
    #rdc table{border-collapse:collapse} #rdc td,#rdc th{border:1px solid currentColor;padding:4px 8px}
    #rdc pre{white-space:pre-wrap} #rdc blockquote{margin-left:0;padding-left:1em;border-left:4px solid currentColor}
    #rdc b.bn{font-weight:800}
    #rdc .w[data-p=n]{border-bottom:2px solid currentColor} #rdc .w[data-p=v]{border-bottom:2px dashed currentColor} #rdc .w[data-p=a]{border-bottom:2px dotted currentColor} #rdc .w[data-p=r]{border-bottom:3px double currentColor}
    #rsvp{position:absolute;inset:0;background:#000;color:#fff;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;z-index:2}
    #rsvp .word{display:grid;grid-template-columns:1fr auto 1fr;width:min(92vw,900px);font:600 clamp(32px,8vw,72px)/1.2 Georgia,serif;border-top:2px solid #444;border-bottom:2px solid #444;padding:22px 0}
    #rsvp .l{text-align:right} #rsvp .p{color:#ff5252} #rsvp .r{text-align:left}
    #rsvp progress{width:min(92vw,600px)} #rsvp .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}`;
  let host = null, sr = null, els = {};
  function ui() {
    if (host && host.isConnected) return els;
    host = doc.createElement('div');
    host.id = 'clr-f';
    host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483645';
    sr = host.attachShadow({ mode: 'closed' });
    const st = doc.createElement('style'); st.textContent = UI_CSS; sr.appendChild(st);
    const mk = (tag, id, cls) => { const e = doc.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; sr.appendChild(e); return e; };
    els = { sel: mk('div', 'sel', 'fl'), player: mk('div', 'player', 'fl'), chip: mk('div', 'chip', 'fl'), box: mk('div', 'box'), loc: mk('div', 'loc'), dwell: mk('div', 'dwell'), rd: mk('div', 'rd') };
    els.sel.setAttribute('role', 'toolbar'); els.player.setAttribute('role', 'toolbar'); els.chip.setAttribute('role', 'status');
    doc.documentElement.appendChild(host);
    return els;
  }
  const btn = (txt, label, fn, extra) => {
    const b = doc.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.title = label;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(e); });
    if (extra) Object.assign(b, extra);
    return b;
  };
  const inUI = (e) => { try { return e.composedPath().includes(host); } catch (x) { return false; } };

  /* ================= extragere text cu hartă de poziții ================= */
  const NOREAD = new Set(['script', 'style', 'noscript', 'template', 'svg', 'canvas', 'textarea', 'select', 'option', 'head', 'title']);
  function collect(root, rng) {
    const vis = new Map(), blk = new Map();
    const visible = (p) => {
      if (vis.has(p)) return vis.get(p);
      let ok = !NOREAD.has(p.localName) && !p.closest('#clr-f,#clr-root,[hidden],[aria-hidden="true"]');
      if (ok && p.checkVisibility) { try { ok = p.checkVisibility({ checkVisibilityCSS: true }); } catch (e) { } }
      vis.set(p, ok); return ok;
    };
    const blockOf = (p) => {
      if (blk.has(p)) return blk.get(p);
      let b = p;
      while (b && b.parentElement && getComputedStyle(b).display.startsWith('inline')) b = b.parentElement;
      blk.set(p, b); return b;
    };
    const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const map = []; let text = '', lastBlock = null, n;
    while ((n = tw.nextNode())) {
      const p = n.parentElement;
      if (!p || !visible(p)) continue;
      if (rng && !rng.intersectsNode(n)) continue;
      let a = 0, b = n.nodeValue.length;
      if (rng) { if (n === rng.startContainer) a = rng.startOffset; if (n === rng.endContainer) b = rng.endOffset; }
      const piece = n.nodeValue.slice(a, b);
      if (!piece) continue;
      const bk = blockOf(p);
      if (lastBlock && bk !== lastBlock && text && !/\s$/.test(text)) text += ' ';
      lastBlock = bk;
      map.push({ node: n, start: a, len: piece.length, off: text.length });
      text += piece;
      if (text.length > 400000) break;
    }
    return { text, map };
  }
  function toRange(c, off, len) {
    const m = c.map; let lo = 0, hi = m.length - 1, i = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (m[mid].off <= off) { i = mid; lo = mid + 1; } else hi = mid - 1; }
    if (i < 0) return null;
    let a = m[i]; if (off >= a.off + a.len) { if (!m[i + 1]) return null; a = m[i + 1]; off = a.off; }
    const end = off + len; let j = i; while (j < m.length - 1 && m[j].off + m[j].len < end) j++;
    const z = m[j]; const r = doc.createRange();
    try { r.setStart(a.node, a.start + (off - a.off)); r.setEnd(z.node, z.start + Math.max(0, Math.min(z.len, end - z.off))); } catch (e) { return null; }
    return r;
  }
  function sentences(text) {
    const out = []; const re = /[^.!?…\n]+[.!?…]*\s*/g; let m;
    while ((m = re.exec(text))) {
      const raw = m[0], lead = raw.length - raw.trimStart().length, s = raw.trim();
      if (!s) continue;
      let o = m.index + lead, rest = s;
      while (rest.length > 240) { let i = rest.lastIndexOf(' ', 240); if (i < 80) i = 240; out.push({ off: o, text: rest.slice(0, i) }); o += i; const sp = rest.slice(i).length - rest.slice(i).trimStart().length; o += sp; rest = rest.slice(i).trimStart(); }
      if (rest) out.push({ off: o, text: rest });
    }
    return out;
  }

  /* ================= voce (TTS) ================= */
  const hasTTS = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  const tts = { segs: [], idx: 0, token: 0, col: null, paused: false, on: false, lang: '' };
  function pickVoice() {
    if (!hasTTS()) return null;
    const vs = speechSynthesis.getVoices();
    if (S && S.ttsVoice) { const v = vs.find((x) => x.voiceURI === S.ttsVoice || x.name === S.ttsVoice); if (v) return v; }
    if (S && S.autoLang && tts.lang) {
      const pool = vs.filter((x) => (x.lang || '').toLowerCase().startsWith(tts.lang));
      const anyLocal = vs.some((x) => x.localService);
      const pick = S.localVoices ? (pool.find((x) => x.localService) || (anyLocal ? null : pool[0])) : pool[0]; if (pick) return pick;
    }
    if (S && S.localVoices) { const l = pageLang().toLowerCase().slice(0, 2); const v = vs.find((x) => x.localService && (x.lang || '').toLowerCase().startsWith(l)) || vs.find((x) => x.localService); if (v) return v; }
    return null;
  }
  function pageLang() { const l = doc.documentElement.lang; return /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(l || '') ? l : (navigator.language || 'en'); }
  const HL = { sp: null, wd: null };
  function hl(name, range, prio) {
    if (!hasHL()) return;
    if (!range) { CSS.highlights.delete(name); return; }
    const h = new Highlight(range); h.priority = prio || 0; CSS.highlights.set(name, h);
  }
  function inView(r) { const b = r.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight; }
  function speakAt(i, token) {
    if (token !== tts.token) return;
    if (i >= tts.segs.length || i < 0) return ttsStop();
    tts.idx = i;
    const seg = tts.segs[i], u = new SpeechSynthesisUtterance(seg.text);
    const v = pickVoice(); if (v) u.voice = v;
    u.lang = v ? v.lang : (tts.lang || pageLang()); u.rate = S ? S.ttsRate : 1; u.pitch = S ? S.ttsPitch : 1;
    u.onstart = () => {
      if (token !== tts.token || !tts.col) return;
      const r = toRange(tts.col, seg.off, seg.text.length);
      hl('clr-speak', r, 0);
      if (r && !inView(r)) { try { r.startContainer.parentElement.scrollIntoView({ block: 'center', behavior: prefersReduced() ? 'auto' : 'smooth' }); } catch (e) { } }
    };
    u.onboundary = (e) => {
      if (token !== tts.token || !tts.col || (e.name && e.name !== 'word')) return;
      const m = /^\S+/.exec(seg.text.slice(e.charIndex));
      if (m) hl('clr-word', toRange(tts.col, seg.off + e.charIndex, m[0].length), 1);
    };
    u.onend = () => { if (token === tts.token && !tts.paused) speakAt(i + 1, token); };
    u.onerror = (e) => { if (token === tts.token && e.error !== 'interrupted' && e.error !== 'canceled') ttsStop(); };
    speechSynthesis.speak(u);
  }
  function ttsStart(col, hlOn) {
    ttsStop(true);
    if (!hasTTS() || !col || !col.text.trim()) return;
    tts.col = hlOn ? col : null;
    tts.segs = sentences(col.text); if (!tts.segs.length) return;
    tts.lang = (S && S.autoLang && CLR.detectLang) ? (CLR.detectLang(col.text.slice(0, 3000)) || '') : '';
    tts.on = true; tts.paused = false; const token = ++tts.token;
    showPlayer(true);
    setTimeout(() => speakAt(0, token), 60); // Chrome: speak() imediat după cancel() poate fi ignorat
  }
  function ttsStop(quiet) {
    tts.token++; tts.on = false; tts.paused = false;
    try { if (hasTTS()) speechSynthesis.cancel(); } catch (e) { }
    hl('clr-speak', null); hl('clr-word', null);
    if (!quiet) showPlayer(false);
  }
  function ttsJump(d) { if (!tts.on) return; const token = ++tts.token; try { speechSynthesis.cancel(); } catch (e) { } tts.paused = false; setTimeout(() => speakAt(Math.max(0, tts.idx + d), token), 60); }
  function ttsPause() { if (!tts.on) return; if (tts.paused) { tts.paused = false; speechSynthesis.resume(); } else { tts.paused = true; speechSynthesis.pause(); } syncPlayer(); }
  function mainRoot() { return doc.querySelector('main,article,[role=main]') || doc.body || doc.documentElement; }
  function selRange() { const s = window.getSelection(); return s && s.rangeCount && !s.isCollapsed && String(s).trim() ? s.getRangeAt(0).cloneRange() : null; }
  function ttsMode(mode) {
    if (mode === 'stop') return ttsStop();
    if (mode === 'pause') return ttsPause();
    if (mode === 'next') return ttsJump(1);
    if (mode === 'prev') return ttsJump(-1);
    if (mode === 'toggle' && tts.on) return ttsStop();
    if (rdOpen()) return ttsStart(readerCollect(), false);
    const r = (mode === 'page') ? null : selRange();
    if (r) ttsStart(collect(r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement, r), true);
    else ttsStart(collect(mainRoot()), true);
  }
  let pb = {};
  function showPlayer(on) {
    const u = ui();
    if (!on) { u.player.style.display = 'none'; return; }
    if (!u.player.firstChild) {
      pb.prev = btn('⏮', T('tts_prev'), () => ttsJump(-1));
      pb.pause = btn('⏯', T('tts_pause'), ttsPause);
      pb.next = btn('⏭', T('tts_next'), () => ttsJump(1));
      pb.stop = btn('⏹', T('tts_stop'), () => ttsStop());
      u.player.append(pb.prev, pb.pause, pb.next, pb.stop);
    }
    u.player.style.display = 'flex'; syncPlayer();
  }
  function syncPlayer() { if (pb.pause) pb.pause.setAttribute('aria-pressed', String(tts.paused)); }

  /* citire la trecerea mouse-ului (hover speech) */
  let hoverT = null, hoverOn = false, lastHover = null;
  function onHover(e) {
    if (inUI(e)) return;
    clearTimeout(hoverT);
    const el = e.target;
    hoverT = setTimeout(() => {
      if (!S || !S.hoverSpeech || !el || el === lastHover || !el.isConnected) return;
      const txt = (el.innerText || el.getAttribute('aria-label') || el.alt || '').trim();
      if (!txt || txt.length > 600) return;
      lastHover = el;
      ttsStart({ text: txt, map: [] }, false);
    }, 450);
  }

  /* ================= evidențiator persistent ================= */
  const HL_COL = { 1: '#fff176', 2: '#a5d6a7', 3: '#81d4fa', 4: '#f8bbd0' };
  let HLS = {}, HIDDEN = {}, RD = null;
  const pageKey = () => location.origin + location.pathname;
  const cleanHL = (a) => (Array.isArray(a) ? a : []).filter((x) => x && typeof x.t === 'string' && x.t.length > 0 && x.t.length <= 600)
    .slice(0, 200).map((x) => ({ id: String(x.id || '').slice(0, 24), t: x.t, p: String(x.p || '').slice(0, 60), s: String(x.s || '').slice(0, 60), c: [1, 2, 3, 4].includes(x.c) ? x.c : 1, d: Number(x.d) || 0 }));
  const cleanHidden = (a) => (Array.isArray(a) ? a : []).filter((x) => typeof x === 'string' && x.length > 0 && x.length <= 300).slice(0, 100);
  let hlCol = null;
  function renderHL() {
    if (!hasHL()) return;
    for (let c = 1; c <= 4; c++) CSS.highlights.delete('clr-h' + c);
    if (!active) return;
    const list = cleanHL(HLS[pageKey()]); if (!list.length) return;
    hlCol = collect(doc.body || doc.documentElement);
    const buckets = { 1: [], 2: [], 3: [], 4: [] };
    list.forEach((h) => {
      let i = hlCol.text.indexOf(h.p + h.t + h.s), off;
      if (i >= 0) off = i + h.p.length; else { i = hlCol.text.indexOf(h.t); off = i; }
      if (i < 0) return;
      const r = toRange(hlCol, off, h.t.length); if (r) buckets[h.c].push(r);
    });
    for (let c = 1; c <= 4; c++) if (buckets[c].length) { const h = new Highlight(...buckets[c]); CSS.highlights.set('clr-h' + c, h); }
  }
  function saveHL() {
    const keys = Object.keys(HLS); if (keys.length > 400) delete HLS[keys[0]];
    if (!alive()) return; try { api.storage.local.set({ highlights: HLS }); } catch (e) { }
  }
  function addHL(color) {
    const r = selRange(); if (!r || !hasHL()) return false;
    const root = doc.body || doc.documentElement, col = collect(root);
    const pre = doc.createRange(); pre.setStart(root, 0); pre.setEnd(r.startContainer, r.startOffset);
    const preC = collect(root, pre), before = preC.text.length;
    const tx = String(r.toString()).replace(/\s+/g, ' ').trim().slice(0, 600);
    if (!tx) return false;
    const idx = col.text.indexOf(tx, Math.max(0, before - 2));
    const p = idx >= 0 ? col.text.slice(Math.max(0, idx - 40), idx) : '', s = idx >= 0 ? col.text.slice(idx + tx.length, idx + tx.length + 40) : '';
    const k = pageKey(); HLS[k] = cleanHL(HLS[k]).concat([{ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: tx, p, s, c: color, d: Date.now() }]);
    saveHL(); renderHL(); window.getSelection().removeAllRanges();
    return true;
  }

  /* ================= bara pe selecție ================= */
  let selOn = false, selTimer = null;
  let chipT = null;
  function flashChip(msg) { const u = ui(); u.chip.textContent = ''; const m = doc.createElement('span'); m.textContent = msg; u.chip.append(m, btn('✕', T('close'), () => { u.chip.style.display = 'none'; })); u.chip.style.display = 'flex'; clearTimeout(chipT); chipT = setTimeout(() => { u.chip.style.display = 'none'; }, 12000); }
  function defineUrl(w) {
    const l = (L() === 'auto' ? (navigator.language || 'en').slice(0, 2) : L());
    return l === 'ro' ? 'https://dexonline.ro/definitie/' + encodeURIComponent(w) : 'https://' + (l.length === 2 ? l : 'en') + '.wiktionary.org/wiki/' + encodeURIComponent(w);
  }
  function showSel() {
    if (!S || !S.selBar || !active || rdOpen()) return hideSel();
    const r = selRange(); const u = ui();
    if (!r) return hideSel();
    const anc = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
    if (anc && anc.closest && anc.closest('input,textarea,[contenteditable=""],[contenteditable=true],#clr-f')) return hideSel();
    const text = String(r).trim(); if (text.length < 2) return hideSel();
    if (!u.sel.firstChild) {
      u.sel.append(btn('🔊', T('tts_sel'), () => { ttsMode('selection'); hideSel(); }));
      [1, 2, 3, 4].forEach((c) => { const b = btn('', T('hl_color', { n: c }), () => { addHL(c); hideSel(); }); b.className = 'dot'; b.style.background = HL_COL[c]; u.sel.appendChild(b); });
      u.sel.append(btn('📖', T('define'), async () => { const w = String(window.getSelection()).trim().split(/\s+/)[0]; if (w) { let d = null; if (S && S.modDict && CLR.mod && CLR.mod.dictLookup) { try { d = await CLR.mod.dictLookup(w); } catch (e) { } } if (d) flashChip(w + ' — ' + d); else window.open(defineUrl(w), '_blank', 'noopener'); } hideSel(); }));
      u.sel.append(btn('📋', T('copy'), () => { try { navigator.clipboard.writeText(String(window.getSelection())); } catch (e) { } hideSel(); }));
    }
    const rects = r.getClientRects(), b = rects.length ? rects[rects.length - 1] : r.getBoundingClientRect();
    u.sel.style.display = 'flex';
    const w = u.sel.offsetWidth || 260;
    u.sel.style.left = Math.max(6, Math.min(innerWidth - w - 6, b.right - w / 2)) + 'px';
    u.sel.style.top = Math.min(innerHeight - 52, b.bottom + 8) + 'px';
  }
  function hideSel() { if (els.sel) els.sel.style.display = 'none'; }
  const onSelUp = (e) => { if (inUI(e)) return; clearTimeout(selTimer); selTimer = setTimeout(showSel, 30); };
  const onSelDown = (e) => { if (!inUI(e)) hideSel(); };

  /* ================= ascundere elemente (alege cu clic) ================= */
  const cssPath = (el) => {
    const parts = [];
    for (let n = el, d = 0; n && n.nodeType === 1 && n !== doc.documentElement && d < 6; n = n.parentElement, d++) {
      if (n === doc.body) { parts.unshift('body'); break; }
      let seg = n.localName;
      if (n.id && !/\d{3,}/.test(n.id) && doc.querySelectorAll('#' + CSS.escape(n.id)).length === 1) { parts.unshift('#' + CSS.escape(n.id)); break; }
      const cls = Array.from(n.classList).filter((c) => !/\d{3,}|^(clr-)/.test(c) && c.length < 40).slice(0, 2);
      if (cls.length) seg += cls.map((c) => '.' + CSS.escape(c)).join('');
      const sib = n.parentElement ? Array.from(n.parentElement.children).filter((x) => x.localName === n.localName) : [];
      if (sib.length > 1) seg += ':nth-of-type(' + (sib.indexOf(n) + 1) + ')';
      parts.unshift(seg);
      try { if (doc.querySelectorAll(parts.join(' > ')).length === 1) break; } catch (e) { }
    }
    return parts.join(' > ');
  };
  let fstyle = null;
  function renderHidden() {
    if (!fstyle) { fstyle = doc.createElement('style'); fstyle.id = 'clr-fstyle'; }
    let css = '';
    if (active) {
      for (let c = 1; c <= 4; c++) css += `::highlight(clr-h${c}){background-color:${HL_COL[c]};color:#000}\n`;
      css += '::highlight(clr-speak){background-color:#ffeb3b;color:#000}\n::highlight(clr-word){background-color:#ff9800;color:#000;text-decoration:underline}\n';
      cleanHidden(HIDDEN[location.hostname]).forEach((sel) => { try { doc.querySelector(sel); css += sel + '{display:none!important}\n'; } catch (e) { } });
    }
    fstyle.textContent = css;
    if (!fstyle.isConnected) doc.documentElement.appendChild(fstyle);
  }
  let picking = false, pickEl = null;
  const pickMove = (e) => {
    const el = doc.elementFromPoint(e.clientX, e.clientY); pickEl = el;
    const b = els.box; if (!el || el === doc.documentElement || el === doc.body) { b.style.display = 'none'; return; }
    const r = el.getBoundingClientRect(); Object.assign(b.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  };
  const pickClick = (e) => {
    if (inUI(e)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (!pickEl || pickEl === doc.documentElement || pickEl === doc.body) return;
    const sel = cssPath(pickEl); if (!sel) return;
    const h = location.hostname; HIDDEN[h] = cleanHidden(HIDDEN[h]).concat([sel]).slice(-100);
    try { api.storage.local.set({ hidden: HIDDEN }); } catch (x) { }
    renderHidden(); els.box.style.display = 'none';
  };
  const pickKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); stopPick(); } };
  function startPick() {
    if (picking) return; picking = true; const u = ui();
    u.chip.textContent = ''; const m = doc.createElement('span'); m.textContent = T('pick_hint'); u.chip.append(m, btn('✓', T('done'), stopPick));
    u.chip.style.display = 'flex';
    doc.addEventListener('mousemove', pickMove, true); doc.addEventListener('click', pickClick, true); doc.addEventListener('keydown', pickKey, true);
    ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart'].forEach((ev) => doc.addEventListener(ev, pickBlock, true));
  }
  const pickBlock = (e) => { if (!inUI(e)) { e.preventDefault(); e.stopPropagation(); } };
  function stopPick() {
    if (!picking) return; picking = false;
    doc.removeEventListener('mousemove', pickMove, true); doc.removeEventListener('click', pickClick, true); doc.removeEventListener('keydown', pickKey, true);
    ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart'].forEach((ev) => doc.removeEventListener(ev, pickBlock, true));
    if (els.chip) els.chip.style.display = 'none'; if (els.box) els.box.style.display = 'none';
  }

  /* ================= audit și structură ================= */
  let reg = [];
  const regEl = (el) => { reg.push(el); return reg.length - 1; };
  const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  function accName(el) {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) { const s = lb.split(/\s+/).map((i) => { const x = doc.getElementById(i); return x ? txt(x) : ''; }).join(' ').trim(); if (s) return s; }
    const al = (el.getAttribute('aria-label') || '').trim(); if (al) return al;
    if (el.localName === 'img') return (el.getAttribute('alt') || '').trim();
    if (el.labels && el.labels.length) { const s = Array.from(el.labels).map(txt).join(' ').trim(); if (s) return s; }
    if (el.localName === 'input' && /^(button|submit|reset)$/i.test(el.type)) return (el.value || '').trim();
    if (el.localName === 'input' && el.type === 'image') return (el.alt || '').trim();
    let s = txt(el); if (s) return s;
    const im = el.querySelector('img[alt]:not([alt=""]),svg title,[aria-label]'); if (im) return (im.getAttribute('alt') || im.getAttribute('aria-label') || im.textContent || '').trim();
    return (el.getAttribute('title') || '').trim();
  }
  const short = (el) => { const s = el.localName + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + el.classList[0] : ''); const x = txt(el).slice(0, 40); return x ? s + ' “' + x + '”' : s; };
  const VAGUE = /^(click here|here|read more|more|learn more|details|link|aici|mai mult|detalii|citește mai mult|click|apasă aici|vezi mai mult|…|\.\.\.)$/i;
  function audit() {
    reg = []; const out = [];
    const add = (rule, sev, el, extra) => { if (out.length < 400) out.push({ rule, sev, id: el ? regEl(el) : -1, label: el ? short(el) : (extra || '') }); };
    const vis = (e) => !e.closest('[hidden],[aria-hidden="true"],#clr-f,#clr-root') && (!e.checkVisibility || e.checkVisibility());
    const html = doc.documentElement;
    if (!html.getAttribute('lang')) add('lang', 'err', html);
    if (!txt(doc.querySelector('title') || { textContent: '' })) add('title', 'err', null, location.href);
    const vp = doc.querySelector('meta[name=viewport]');
    if (vp && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*(1(\.0)?|0?\.\d+)\b/i.test(vp.content)) add('zoom', 'err', vp);
    doc.querySelectorAll('img,input[type=image],area').forEach((el) => {
      if (!vis(el) || el.getAttribute('role') === 'presentation') return;
      const alt = el.getAttribute('alt');
      if (alt == null && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) add('img_alt', 'err', el);
      else if (alt && /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(alt.trim())) add('img_alt_file', 'warn', el);
    });
    doc.querySelectorAll('a[href],button,[role=button],[role=link]').forEach((el) => {
      if (!vis(el)) return; const n = accName(el);
      if (!n) add('name', 'err', el); else if (el.localName === 'a' && VAGUE.test(n)) add('vague', 'warn', el);
    });
    doc.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea').forEach((el) => {
      if (!vis(el)) return; const lbl = accName(el);
      if (!lbl) add(el.placeholder ? 'label_ph' : 'label', 'err', el);
    });
    const hs = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')).filter(vis);
    const h1 = hs.filter((h) => h.localName === 'h1');
    if (!h1.length) add('h1_none', 'warn', null, ''); else if (h1.length > 1) add('h1_many', 'warn', h1[1]);
    let prev = 0;
    hs.forEach((h) => {
      const lv = h.localName.length === 2 ? +h.localName[1] : +(h.getAttribute('aria-level') || 2);
      if (!txt(h)) add('h_empty', 'err', h); else if (prev && lv > prev + 1) add('h_skip', 'warn', h);
      prev = lv;
    });
    const seen = new Set();
    doc.querySelectorAll('[id]').forEach((el) => { if (seen.has(el.id)) add('dup_id', 'err', el); seen.add(el.id); });
    doc.querySelectorAll('iframe').forEach((el) => { if (vis(el) && !el.title && !el.getAttribute('aria-label')) add('iframe_title', 'warn', el); });
    doc.querySelectorAll('[tabindex]').forEach((el) => { if (+el.getAttribute('tabindex') > 0) add('tabindex', 'warn', el); });
    doc.querySelectorAll('table').forEach((el) => { if (vis(el) && el.rows.length > 1 && !el.querySelector('th') && el.getAttribute('role') !== 'presentation') add('table_th', 'warn', el); });
    doc.querySelectorAll('marquee,blink').forEach((el) => add('blink', 'err', el));
    doc.querySelectorAll('video[autoplay],audio[autoplay]').forEach((el) => add('autoplay', 'warn', el));
    let small = 0;
    doc.querySelectorAll('a[href],button,input:not([type=hidden]),select').forEach((el) => {
      if (small > 40 || !vis(el)) return; const r = el.getBoundingClientRect();
      if (r.width && r.height && (r.width < 24 || r.height < 24) && getComputedStyle(el).display !== 'inline') { small++; add('target_small', 'warn', el); }
    });
    if (CLR.x && CLR.x.auditExtra) { try { CLR.x.auditExtra(add); } catch (e) { } }
    const fx = doc.querySelectorAll('[data-clr-c]').length;
    if (fx) out.push({ rule: 'contrast_fixed', sev: 'info', id: -1, label: String(fx) });
    return out;
  }
  function stats() {
    const c = collect(mainRoot()); const words = (c.text.match(/\p{L}[\p{L}\p{N}'’-]*/gu) || []).length;
    const sents = sentences(c.text); const long = sents.filter((s) => (s.text.match(/\S+/g) || []).length > 25).length;
    const rb = CLR.readability ? CLR.readability(c.text.slice(0, 60000)) : null;
    return { words, minutes: Math.max(1, Math.round(words / 200)), sentences: sents.length, longSentences: long, avg: sents.length ? Math.round(words / sents.length) : 0, lix: rb ? rb.lix : null, level: rb ? rb.level : null };
  }
  function outline() {
    reg = []; const out = [];
    doc.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading],main,nav,aside,header,footer,form[aria-label],[role=main],[role=navigation],[role=banner],[role=contentinfo],[role=complementary],[role=search],section[aria-label]').forEach((el) => {
      if (out.length > 300 || el.closest('#clr-f,#clr-root,[hidden],[aria-hidden="true"]') || (el.checkVisibility && !el.checkVisibility())) return;
      const isH = /^h[1-6]$/.test(el.localName) || el.getAttribute('role') === 'heading';
      const role = el.getAttribute('role') || ({ main: 'main', nav: 'navigation', aside: 'complementary', header: 'banner', footer: 'contentinfo', form: 'form', section: 'region' })[el.localName] || el.localName;
      out.push({ kind: isH ? 'h' : 'lm', level: isH ? (el.localName.length === 2 ? +el.localName[1] : +(el.getAttribute('aria-level') || 2)) : 0, text: (isH ? txt(el) : (role + (el.getAttribute('aria-label') ? ': ' + el.getAttribute('aria-label') : ''))).slice(0, 90), id: regEl(el) });
    });
    return out;
  }
  let locT = null;
  function locate(id) {
    const el = reg[id]; if (!el || !el.isConnected) return false;
    try { el.scrollIntoView({ block: 'center', behavior: prefersReduced() ? 'auto' : 'smooth' }); } catch (e) { }
    const u = ui(); clearTimeout(locT);
    const place = () => { const r = el.getBoundingClientRect(); Object.assign(u.loc.style, { display: 'block', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' }); };
    setTimeout(place, 350); locT = setTimeout(() => { u.loc.style.display = 'none'; }, 3500);
    if (!/^(a|button|input|select|textarea)$/.test(el.localName) && el.tabIndex < 0) { el.setAttribute('tabindex', '-1'); }
    try { el.focus({ preventScroll: true }); } catch (e) { }
    return true;
  }

  /* ================= derulare automată ================= */
  let asOn = false, asRaf = 0, asLast = 0, asAcc = 0;
  function asFrame(ts) {
    if (!asOn) return;
    const dt = Math.min(100, ts - (asLast || ts)); asLast = ts;
    asAcc += (S ? S.scrollSpeed : 40) * dt / 1000;
    const px = Math.floor(asAcc); if (px) { asAcc -= px; const y = scrollY; window.scrollBy(0, px); if (Math.abs(scrollY - y) < 1 && px > 0) return autoscroll(false); }
    asRaf = requestAnimationFrame(asFrame);
  }
  const asStopEv = (e) => { if (e.type === 'keydown' && !/^(Escape| |ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(e.key)) return; autoscroll(false); };
  function autoscroll(on) {
    if (on === undefined) on = !asOn;
    if (on === asOn) return asOn;
    asOn = on; cancelAnimationFrame(asRaf); asLast = 0; asAcc = 0;
    const ev = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    if (on) { ev.forEach((x) => doc.addEventListener(x, asStopEv, { capture: true, passive: true })); asRaf = requestAnimationFrame(asFrame); }
    else ev.forEach((x) => doc.removeEventListener(x, asStopEv, { capture: true }));
    return asOn;
  }

  /* ================= dwell click ================= */
  let dwOn = false, dwT = null, dwStart = null, dwDone = false, dwEl = null, dwRaf = 0, dwT0 = 0;
  const CLICKABLE = 'a[href],button,summary,label,[role=button],[role=link],[role=tab],[role=menuitem],input[type=button],input[type=submit],input[type=checkbox],input[type=radio],select';
  function dwFrame() {
    const p = Math.min(1, (performance.now() - dwT0) / (S ? S.dwellMs : 1200));
    els.dwell.style.setProperty('--p', (p * 360) + 'deg');
    if (p >= 1) {
      els.dwell.style.display = 'none'; dwDone = true;
      if (dwEl && dwEl.isConnected) { try { dwEl.click(); } catch (e) { } }
      return;
    }
    dwRaf = requestAnimationFrame(dwFrame);
  }
  function dwMove(e) {
    if (inUI(e)) return;
    const el = e.target && e.target.closest ? e.target.closest(CLICKABLE) : null;
    if (dwStart && Math.hypot(e.clientX - dwStart.x, e.clientY - dwStart.y) > 8) {
      cancelAnimationFrame(dwRaf); if (els.dwell) els.dwell.style.display = 'none';
      if (Math.hypot(e.clientX - dwStart.x, e.clientY - dwStart.y) > 40) dwDone = false;
      dwStart = null;
    }
    if (!el || dwDone || dwStart) return;
    dwStart = { x: e.clientX, y: e.clientY }; dwEl = el; dwT0 = performance.now();
    const u = ui(); Object.assign(u.dwell.style, { display: 'block', left: e.clientX + 'px', top: e.clientY + 'px' });
    cancelAnimationFrame(dwRaf); dwRaf = requestAnimationFrame(dwFrame);
  }
  function setDwell(on) {
    if (on === dwOn) return; dwOn = on;
    if (on) doc.addEventListener('mousemove', dwMove, { capture: true, passive: true });
    else { doc.removeEventListener('mousemove', dwMove, { capture: true }); cancelAnimationFrame(dwRaf); if (els.dwell) els.dwell.style.display = 'none'; dwStart = null; dwDone = false; }
  }

  /* ================= mute media ================= */
  const muteEv = (e) => { const m = e.target; if (m && m.localName && /^(video|audio)$/.test(m.localName) && !m.__clrUnmuted) { m.muted = true; } };
  let muteOn = false;
  function setMute(on) {
    if (on === muteOn) return; muteOn = on;
    if (on) { doc.addEventListener('play', muteEv, true); doc.querySelectorAll('video[autoplay],audio[autoplay]').forEach((m) => { m.muted = true; }); }
    else doc.removeEventListener('play', muteEv, true);
  }

  /* ================= mod lectură ================= */
  const RD_DEF = { theme: 'light', size: 20, width: 68, lh: 1.7, font: 'sans', bionic: false, gradient: false, wpm: 300, syl: false, lf: false, pos: false };
  const RD_THEMES = {
    light: { bg: '#ffffff', fg: '#1b1b1b', pal: ['#1b1b1b', '#0b3a8f', '#1b1b1b', '#8a1111'] },
    sepia: { bg: '#f4ecd8', fg: '#2b2118', pal: ['#2b2118', '#0b3a8f', '#2b2118', '#8a1111'] },
    dark: { bg: '#121212', fg: '#e8e8e8', pal: ['#f0f0f0', '#8cc8ff', '#f0f0f0', '#ffb59e'] },
    yellow: { bg: '#000000', fg: '#ffeb3b', pal: ['#ffeb3b', '#7fffd4', '#ffeb3b', '#ffb3ff'] }
  };
  const RD_FONTS = ['default', 'sans', 'serif', 'mono', 'dyslexic', 'lexend', 'atkinson'];
  function cleanRD(o) {
    o = o && typeof o === 'object' ? o : {};
    return {
      theme: RD_THEMES[o.theme] ? o.theme : RD_DEF.theme, size: clamp(o.size, 14, 48, RD_DEF.size), width: clamp(o.width, 30, 120, RD_DEF.width),
      lh: clamp(o.lh, 1.2, 2.6, RD_DEF.lh), font: RD_FONTS.includes(o.font) ? o.font : RD_DEF.font, bionic: o.bionic === true, gradient: o.gradient === true, syl: o.syl === true, lf: o.lf === true, pos: o.pos === true, wpm: clamp(o.wpm, 100, 1000, RD_DEF.wpm)
    };
  }
  const BAD_CLS = /(^|[-_\s])(ad|ads|advert|advertisement|banner|cookie|cookies|consent|share|sharing|social|comment|comments|sidebar|related|newsletter|promo|popup|modal|breadcrumb|breadcrumbs|menu|navbar|nav)([-_\s]|$)/i;
  const SKIPR = new Set(['script', 'style', 'noscript', 'nav', 'aside', 'footer', 'form', 'button', 'input', 'select', 'textarea', 'iframe', 'svg', 'canvas', 'video', 'audio', 'dialog', 'template', 'object', 'embed']);
  const BLOCKT = new Set(['p', 'div', 'section', 'article', 'main', 'ul', 'ol', 'li', 'blockquote', 'pre', 'figure', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'dl', 'dd', 'dt', 'figcaption', 'hr']);
  function pickMainEl() {
    const sc = new Map();
    doc.querySelectorAll('p').forEach((p) => {
      if (p.closest('#clr-f,nav,aside,footer,[hidden]') || (p.checkVisibility && !p.checkVisibility())) return;
      const n = txt(p).length; if (n < 50) return;
      const v = Math.min(n, 400) + (txt(p).split(',').length - 1) * 8;
      for (let el = p.parentElement, w = 1, d = 0; el && d < 3; el = el.parentElement, w /= 2, d++) sc.set(el, (sc.get(el) || 0) + v * w);
    });
    let best = null, bs = 0;
    sc.forEach((v, el) => {
      const all = txt(el).length || 1, links = Array.from(el.querySelectorAll('a')).reduce((a, x) => a + txt(x).length, 0);
      const s = v * (1 - Math.min(0.9, links / all));
      if (s > bs) { bs = s; best = el; }
    });
    const named = doc.querySelector('article,main,[role=main]');
    if (named && (!best || named.contains(best) || (sc.get(named) || 0) >= bs * 0.6)) return named;
    return best || doc.body;
  }
  function safeUrl(u, imgOk) { try { const x = new URL(u, location.href); return (x.protocol === 'http:' || x.protocol === 'https:' || x.protocol === 'mailto:' || (imgOk && x.protocol === 'data:' && /^data:image\//.test(u))) ? x.href : ''; } catch (e) { return ''; } }
  function buildClean(root) {
    const frag = doc.createDocumentFragment(); let count = 0;
    const hasBlock = (el) => Array.from(el.children).some((c) => BLOCKT.has(c.localName));
    const inline = (src, dst) => {
      src.childNodes.forEach((n) => {
        if (++count > 8000) return;
        if (n.nodeType === 3) dst.appendChild(doc.createTextNode(n.nodeValue));
        else if (n.nodeType === 1) {
          const tg = n.localName; if (SKIPR.has(tg) || (n.checkVisibility && !n.checkVisibility())) return;
          if (tg === 'br') dst.appendChild(doc.createElement('br'));
          else if (tg === 'a') { const h = safeUrl(n.getAttribute('href') || ''); if (h) { const a = doc.createElement('a'); a.href = h; a.rel = 'noopener noreferrer'; a.target = '_blank'; inline(n, a); dst.appendChild(a); } else inline(n, dst); }
          else if (/^(strong|b|em|i|code|sub|sup|mark|u|s|kbd|abbr)$/.test(tg)) { const e = doc.createElement(tg); inline(n, e); dst.appendChild(e); }
          else if (tg === 'img') img(n, dst);
          else inline(n, dst);
        }
      });
    };
    const img = (n, dst) => {
      const u = safeUrl(n.currentSrc || n.getAttribute('src') || '', true); if (!u) return;
      const w = n.naturalWidth || +n.getAttribute('width') || 0; if (w && w < 48) return;
      const i = doc.createElement('img'); i.src = u; i.alt = n.getAttribute('alt') || ''; i.loading = 'lazy'; dst.appendChild(i);
    };
    const walk = (src, dst) => {
      src.childNodes.forEach((n) => {
        if (++count > 8000) return;
        if (n.nodeType === 3) { if (n.nodeValue.trim()) { const p = doc.createElement('p'); p.textContent = n.nodeValue.trim(); dst.appendChild(p); } return; }
        if (n.nodeType !== 1) return;
        const tg = n.localName;
        if (SKIPR.has(tg) || BAD_CLS.test((n.className && n.className.baseVal === undefined ? n.className : '') + ' ' + (n.id || '')) || (n.checkVisibility && !n.checkVisibility()) || n.id === 'clr-f') return;
        if (/^h[1-6]$/.test(tg) || tg === 'p' || tg === 'blockquote' || tg === 'pre' || tg === 'figcaption' || tg === 'dt' || tg === 'dd') {
          if (tg === 'blockquote' && hasBlock(n)) { const b = doc.createElement('blockquote'); walk(n, b); dst.appendChild(b); return; }
          const e = doc.createElement(tg === 'figcaption' || tg === 'dt' || tg === 'dd' ? 'p' : tg); inline(n, e); if (txt(e) || e.querySelector('img')) dst.appendChild(e);
        } else if (tg === 'ul' || tg === 'ol') { const l = doc.createElement(tg); walk(n, l); if (l.children.length) dst.appendChild(l); }
        else if (tg === 'li') { const li = doc.createElement('li'); if (hasBlock(n)) walk(n, li); else inline(n, li); if (txt(li)) dst.appendChild(li); }
        else if (tg === 'table') { const tb = doc.createElement('table'); n.querySelectorAll('tr').forEach((r) => { const tr = doc.createElement('tr'); r.querySelectorAll('th,td').forEach((c) => { const cell = doc.createElement(c.localName); inline(c, cell); tr.appendChild(cell); }); if (tr.children.length) tb.appendChild(tr); }); if (tb.rows.length) dst.appendChild(tb); }
        else if (tg === 'img') { const f = doc.createDocumentFragment(); img(n, f); if (f.firstChild) { const p = doc.createElement('p'); p.appendChild(f); dst.appendChild(p); } }
        else if (tg === 'hr') dst.appendChild(doc.createElement('hr'));
        else if (tg === 'figure' || hasBlock(n)) walk(n, dst);
        else { const p = doc.createElement('p'); inline(n, p); if (txt(p) || p.querySelector('img')) dst.appendChild(p); }
      });
    };
    walk(root, frag);
    return frag;
  }
  let rdState = null;
  const rdOpen = () => !!(rdState && rdState.open);
  function rdTitle() { const h = doc.querySelector('article h1, main h1, h1'); return (h && txt(h)) || doc.title || location.hostname; }
  function applyRD() {
    const st = rdState, th = RD_THEMES[st.p.theme], u = els;
    u.rd.style.background = th.bg; u.rd.style.color = th.fg;
    const art = st.art; const ff = st.p.font === 'default' ? 'Georgia,"Times New Roman",serif' : FONTS[st.p.font];
    art.style.cssText = `max-width:${st.p.width}ch;font:${st.p.size}px/${st.p.lh} ${ff};color:${th.fg}`;
    art.textContent = ''; art.appendChild(st.clean.cloneNode(true));
    if (!art.querySelector('h1')) { const h = doc.createElement('h1'); h.textContent = st.title; art.prepend(h); }
    const h1 = art.querySelector('h1'); if (h1) h1.style.cssText = 'font-size:1.6em;line-height:1.25;margin:0 0 .8em';
    if (CLR.x && CLR.x.font && /^(dyslexic|lexend|atkinson)$/.test(st.p.font)) CLR.x.font(st.p.font);
    if (st.p.bionic || st.p.gradient || st.p.syl || (st.p.pos && S && S.modPos)) wrapWords(art, st.p.bionic, st.p.gradient, st.p.syl, st.p.pos && S && S.modPos);
    lineFocus();
    if (st.p.gradient) { requestAnimationFrame(() => gradientLines(art, th.pal)); }
  }
  function wrapWords(root, bionic, grad, syl, pos) {
    const plang = pos && CLR.mod && CLR.mod.posLang ? CLR.mod.posLang(doc.documentElement.lang || (L() === 'auto' ? (navigator.language || 'en') : L())) : null;
    const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; let n, words = 0;
    while ((n = tw.nextNode())) { if (n.parentElement.closest('pre,h1')) continue; nodes.push(n); }
    nodes.forEach((tn) => {
      const parts = tn.nodeValue.split(/(\s+)/), f = doc.createDocumentFragment();
      parts.forEach((w) => {
        if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(doc.createTextNode(w)); return; }
        words++;
        const ptag = plang ? CLR.mod.pos(w, plang) : '';
        if (syl && CLR.syllabify) w = w.replace(/\p{L}{6,}/gu, (x) => CLR.syllabify(x).join('\u00B7'));
        const sp = doc.createElement('span'); sp.className = 'w'; if (ptag && ptag !== 'f') sp.setAttribute('data-p', ptag);
        if (bionic && /\p{L}{2,}/u.test(w)) {
          const m = /^([^\p{L}]*)(\p{L}+)(.*)$/su.exec(w);
          if (m) { const k = Math.ceil(m[2].length / 2); const b = doc.createElement('b'); b.className = 'bn'; b.textContent = m[2].slice(0, k); sp.append(doc.createTextNode(m[1]), b, doc.createTextNode(m[2].slice(k) + m[3])); }
          else sp.textContent = w;
        } else sp.textContent = w;
        f.appendChild(sp);
      });
      tn.parentNode.replaceChild(f, tn);
    });
    root.__words = words;
  }
  const mixHex = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  function gradientLines(root, pal) {
    if (!root.isConnected || root.__words > 9000) return;
    root.querySelectorAll('p,li,blockquote,td,th').forEach((blk) => {
      if (blk.querySelector('p,li,blockquote')) return;
      const sp = Array.from(blk.querySelectorAll('span.w')); if (!sp.length) return;
      const br = blk.getBoundingClientRect(), rects = sp.map((s) => s.getBoundingClientRect());
      let line = 0, lastTop = rects[0].top;
      sp.forEach((s, i) => {
        const r = rects[i]; if (r.top - lastTop > r.height * 0.6) { line++; lastTop = r.top; }
        const tt = Math.max(0, Math.min(1, ((r.left + r.width / 2) - br.left) / (br.width || 1)));
        s.style.color = mixHex(pal[line % pal.length], pal[(line + 1) % pal.length], tt);
      });
    });
  }
  function openReader() {
    if (rdOpen()) return true;
    hideSel(); if (els.loc) els.loc.style.display = 'none';
    const u = ui(); const main = pickMainEl(); const clean = buildClean(main);
    const prevFocus = doc.activeElement;
    u.rd.textContent = '';
    const bar = doc.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', T('reader'));
    const sc = doc.createElement('div'); sc.className = 'scroller';
    const art = doc.createElement('article'); art.id = 'rdc'; art.tabIndex = -1; sc.appendChild(art);
    const rs = doc.createElement('div'); rs.id = 'rsvp'; rs.setAttribute('role', 'dialog'); rs.setAttribute('aria-modal', 'true'); rs.setAttribute('aria-label', T('rsvp'));
    u.rd.append(bar, sc, rs);
    rdState = { open: true, clean, art, p: cleanRD(RD_DEF), prevFocus, title: rdTitle(), bar, rs, scrollLock: doc.documentElement.style.overflow };
    RD_LOAD().then((p) => { if (rdState) { rdState.p = p; applyRD(); syncBar(); } });
    const upd = (k, f) => () => { rdState.p[k] = f(rdState.p[k]); applyRD(); syncBar(); saveRD(); };
    const bs = {
      sm: btn('A−', T('rd_smaller'), upd('size', (v) => clamp(v - 2, 14, 48, 20))), lg: btn('A+', T('rd_larger'), upd('size', (v) => clamp(v + 2, 14, 48, 20))),
      nw: btn('↔−', T('rd_narrower'), upd('width', (v) => clamp(v - 6, 30, 120, 68))), wd: btn('↔+', T('rd_wider'), upd('width', (v) => clamp(v + 6, 30, 120, 68))),
      lh: btn('↕', T('rd_spacing'), upd('lh', (v) => (v >= 2.2 ? 1.4 : v + 0.2))),
      th: btn('◐', T('rd_theme'), upd('theme', (v) => { const k = Object.keys(RD_THEMES); return k[(k.indexOf(v) + 1) % k.length]; })),
      ft: btn('Aa', T('font'), upd('font', (v) => RD_FONTS[(RD_FONTS.indexOf(v) + 1) % RD_FONTS.length])),
      bi: btn('𝗕', T('rd_bionic'), upd('bionic', (v) => !v)), gr: btn('🌈', T('rd_gradient'), upd('gradient', (v) => !v)),
      sy: btn('sil·abe', T('rd_syl'), upd('syl', (v) => !v)), ...(S && S.modPos ? { po: btn('N/V', T('rd_pos'), upd('pos', (v) => !v)) } : {}), lf: btn('▭', T('rd_linefocus'), upd('lf', (v) => !v)), tl: btn('TL;DR', T('rd_tldr'), tldr),
      rd: btn('🔊', T('tts_page'), () => ttsMode('page')), rv: btn('⚡', T('rsvp'), startRSVP), cl: btn('✕', T('close'), closeReader)
    };
    rdState.bs = bs; Object.values(bs).forEach((b) => bar.appendChild(b));
    u.rd.style.display = 'flex'; doc.documentElement.style.overflow = 'hidden';
    applyRD(); syncBar(); art.focus({ preventScroll: true });
    doc.addEventListener('keydown', rdKey, true);
    if (typeof ResizeObserver !== 'undefined') { let tm; rdState.ro = new ResizeObserver(() => { clearTimeout(tm); tm = setTimeout(() => { if (rdState && rdState.p.gradient) gradientLines(rdState.art, RD_THEMES[rdState.p.theme].pal); }, 150); }); rdState.ro.observe(art); }
    return true;
  }
  function lineFocus() {
    const st = rdState; if (!st) return; const rd = els.rd;
    if (!st.lfEls) {
      const mk = () => { const d = doc.createElement('div'); d.style.cssText = 'position:absolute;left:0;right:0;background:rgba(0,0,0,.62);pointer-events:none;display:none;z-index:2'; rd.appendChild(d); return d; };
      st.lfEls = [mk(), mk()]; st.lfY = -1;
      st.lfMove = (e) => { st.lfY = e.clientY; lineFocus(); };
      rd.addEventListener('mousemove', st.lfMove);
    }
    const [a, b] = st.lfEls;
    if (!st.p.lf) { a.style.display = b.style.display = 'none'; return; }
    const R = rd.getBoundingClientRect(), y = (st.lfY < 0 ? R.top + R.height / 2 : st.lfY) - R.top, h = Math.round(st.p.size * st.p.lh * 2.4);
    a.style.display = b.style.display = 'block';
    a.style.top = '0'; a.style.height = Math.max(0, y - h / 2) + 'px';
    b.style.top = (y + h / 2) + 'px'; b.style.height = Math.max(0, R.height - y - h / 2) + 'px';
  }
  async function tldr() {
    if (!rdOpen()) return; const x = CLR.x; const note = (m) => { const a = rdState.art; let n = a.querySelector('.tldr'); if (!n) { n = doc.createElement('p'); n.className = 'tldr'; n.style.cssText = 'border:2px solid currentColor;padding:.6em;border-radius:6px'; a.prepend(n); } n.textContent = m; };
    if (!S.aiLocal) return note(T('ai_off'));
    if (!x || !x.aiSummarize) return note(T('ai_na'));
    const r = await x.aiSummarize(readerCollect().text);
    note(r.text ? 'TL;DR: ' + r.text : (r.err === 'off' ? T('ai_off') : T('ai_na')));
  }
  function syncBar() { if (!rdState) return; rdState.bs.bi.setAttribute('aria-pressed', String(rdState.p.bionic)); rdState.bs.gr.setAttribute('aria-pressed', String(rdState.p.gradient)); rdState.bs.sy.setAttribute('aria-pressed', String(rdState.p.syl)); rdState.bs.lf.setAttribute('aria-pressed', String(rdState.p.lf)); if (rdState.bs.po) rdState.bs.po.setAttribute('aria-pressed', String(rdState.p.pos)); }
  const RD_LOAD = () => new Promise((res) => { try { api.storage.local.get('reader').then((r) => res(cleanRD(r && r.reader)), () => res(cleanRD())); } catch (e) { res(cleanRD()); } });
  const saveRD = () => { if (rdState && alive()) try { api.storage.local.set({ reader: rdState.p }); } catch (e) { } };
  function rdKey(e) {
    if (!rdOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (rdState.rsvp) stopRSVP(); else closeReader(); }
  }
  function closeReader() {
    if (!rdOpen()) return;
    stopRSVP(); ttsStop();
    doc.removeEventListener('keydown', rdKey, true);
    if (rdState.ro) rdState.ro.disconnect();
    if (rdState.lfMove) els.rd.removeEventListener('mousemove', rdState.lfMove);
    els.rd.style.display = 'none'; els.rd.textContent = '';
    doc.documentElement.style.overflow = rdState.scrollLock || '';
    const pf = rdState.prevFocus; rdState.open = false; rdState = null;
    try { if (pf && pf.focus) pf.focus({ preventScroll: true }); } catch (e) { }
  }
  function readerCollect() {
    const art = rdState && rdState.art; return art ? collect(art) : { text: '', map: [] };
  }

  /* ---- RSVP (citire rapidă, un cuvânt pe ecran) ---- */
  const orp = (n) => (n <= 1 ? 0 : n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4);
  function startRSVP() {
    if (!rdOpen() || rdState.rsvp) return;
    const words = (collect(rdState.art).text.match(/\S+/g) || []);
    if (!words.length) return;
    const rs = rdState.rs; rs.textContent = ''; rs.style.display = 'flex';
    const w = doc.createElement('div'); w.className = 'word'; w.setAttribute('aria-hidden', 'true');
    const l = doc.createElement('span'); l.className = 'l'; const p = doc.createElement('span'); p.className = 'p'; const r = doc.createElement('span'); r.className = 'r'; w.append(l, p, r);
    const pr = doc.createElement('progress'); pr.max = words.length; pr.value = 0; pr.setAttribute('aria-label', T('progress'));
    const live = doc.createElement('div'); live.className = 'sr'; live.style.cssText = 'position:absolute;left:-9999px'; live.setAttribute('role', 'status');
    const row = doc.createElement('div'); row.className = 'row';
    const st = rdState.rsvp = { words, i: 0, playing: true, tm: 0 };
    const wpmOut = doc.createElement('span'); wpmOut.style.cssText = 'color:#fff;align-self:center';
    const show = () => {
      const x = words[st.i] || ''; const core = x.replace(/^[^\p{L}\p{N}]+/u, ''); const lead = x.length - core.length; const k = lead + orp(core.replace(/[^\p{L}\p{N}]+$/u, '').length);
      l.textContent = x.slice(0, k); p.textContent = x.slice(k, k + 1); r.textContent = x.slice(k + 1); pr.value = st.i; wpmOut.textContent = rdState.p.wpm + ' wpm';
    };
    const tick = () => {
      if (!rdState || rdState.rsvp !== st || !st.playing) return;
      show(); const x = words[st.i] || ''; let ms = 60000 / rdState.p.wpm;
      if (/[.!?…]$/.test(x)) ms *= 2; else if (/[,;:]$/.test(x)) ms *= 1.5; if (x.length > 9) ms *= 1.3;
      st.i++; if (st.i >= words.length) { st.playing = false; syncPP(); return; }
      st.tm = setTimeout(tick, ms);
    };
    const pp = btn('⏯', T('tts_pause'), () => { st.playing = !st.playing; clearTimeout(st.tm); if (st.playing) tick(); syncPP(); });
    const syncPP = () => pp.setAttribute('aria-pressed', String(!st.playing));
    const jump = (d) => () => { st.i = Math.max(0, Math.min(words.length - 1, st.i + d)); clearTimeout(st.tm); show(); if (st.playing) st.tm = setTimeout(tick, 200); };
    const sp = (d) => () => { rdState.p.wpm = clamp(rdState.p.wpm + d, 100, 1000, 300); wpmOut.textContent = rdState.p.wpm + ' wpm'; saveRD(); };
    row.append(btn('−10', T('rsvp_back'), jump(-10)), pp, btn('+10', T('rsvp_fwd'), jump(10)), btn('−50', T('slower'), sp(-50)), wpmOut, btn('+50', T('faster'), sp(50)), btn('✕', T('close'), stopRSVP));
    rs.append(w, pr, row, live); live.textContent = T('rsvp_started'); pp.focus(); tick();
  }
  function stopRSVP() { if (!rdState || !rdState.rsvp) return; clearTimeout(rdState.rsvp.tm); rdState.rsvp = null; rdState.rs.style.display = 'none'; rdState.rs.textContent = ''; try { rdState.art.focus({ preventScroll: true }); } catch (e) { } }

  /* ================= stocare (ascuns / evidențieri) ================= */
  async function loadStore() {
    try {
      const r = await api.storage.local.get(['hidden', 'highlights']);
      HIDDEN = (r.hidden && typeof r.hidden === 'object' && !Array.isArray(r.hidden)) ? r.hidden : {};
      HLS = (r.highlights && typeof r.highlights === 'object' && !Array.isArray(r.highlights)) ? r.highlights : {};
    } catch (e) { }
    HIDDEN = Object.assign({}, HIDDEN); HLS = Object.assign({}, HLS);
    ['__proto__', 'constructor', 'prototype'].forEach((k) => { delete HIDDEN[k]; delete HLS[k]; });
    renderHidden(); renderHL();
  }
  try {
    api.storage.onChanged.addListener((ch, area) => {
      if (area !== 'local' || !alive()) return;
      if (ch.hidden) { HIDDEN = Object.assign({}, ch.hidden.newValue || {}); renderHidden(); }
      if (ch.highlights) { HLS = Object.assign({}, ch.highlights.newValue || {}); renderHL(); }
    });
  } catch (e) { }
  let storeLoaded = false;

  /* ================= cârlige către content.js ================= */
  function onApply(s, act) {
    S = s; active = !!act;
    if (!storeLoaded) { storeLoaded = true; loadStore().then(() => { setTimeout(renderHL, 1500); }); }
    else { renderHidden(); renderHL(); }
    if (!active) {
      ttsStop(); closeReader(); stopPick(); autoscroll(false); setDwell(false); setMute(false); hideSel();
      if (selOn) { doc.removeEventListener('mouseup', onSelUp, true); doc.removeEventListener('keyup', onSelUp, true); doc.removeEventListener('mousedown', onSelDown, true); selOn = false; }
      if (hoverOn) { doc.removeEventListener('mouseover', onHover, true); hoverOn = false; }
      if (host) { host.remove(); host = null; els = {}; pb = {}; }
      return;
    }
    const wantSel = !!S.selBar;
    if (wantSel && !selOn) { doc.addEventListener('mouseup', onSelUp, true); doc.addEventListener('keyup', onSelUp, true); doc.addEventListener('mousedown', onSelDown, true); selOn = true; }
    else if (!wantSel && selOn) { doc.removeEventListener('mouseup', onSelUp, true); doc.removeEventListener('keyup', onSelUp, true); doc.removeEventListener('mousedown', onSelDown, true); selOn = false; hideSel(); }
    if (S.hoverSpeech && !hoverOn) { doc.addEventListener('mouseover', onHover, true); hoverOn = true; }
    else if (!S.hoverSpeech && hoverOn) { doc.removeEventListener('mouseover', onHover, true); hoverOn = false; }
    if (S.dwell) ui();
    setDwell(!!S.dwell); setMute(!!S.muteMedia);
  }

  function run(msg) {
    if (!active && msg.cmd !== 'ping') return { ok: false, inactive: true };
    switch (msg.cmd) {
      case 'ping': return { ok: true, hl: hasHL(), tts: hasTTS() };
      case 'readerStats': return rdOpen() && rdState && rdState.art ? { open: true, words: rdState.art.querySelectorAll('span.w').length, pos: rdState.art.querySelectorAll('[data-p]').length, noun: rdState.art.querySelectorAll('[data-p=n]').length } : { open: false };
      case 'reader': if (rdOpen()) closeReader(); else openReader(); return { ok: true, open: rdOpen() };
      case 'rsvp': openReader(); setTimeout(startRSVP, 120); return { ok: true };
      case 'picker': if (picking) stopPick(); else startPick(); return { ok: true, on: picking };
      case 'autoscroll': return { ok: true, on: autoscroll() };
      case 'audit': return { ok: true, items: audit(), stats: stats() };
      case 'outline': return { ok: true, items: outline() };
      case 'locate': return { ok: locate(msg.id | 0) };
      case 'hlList': return { ok: true, supported: hasHL(), items: cleanHL(HLS[pageKey()]) };
      case 'hlDelete': { const k = pageKey(); HLS[k] = cleanHL(HLS[k]).filter((h) => h.id !== msg.id); if (!HLS[k].length) delete HLS[k]; saveHL(); renderHL(); return { ok: true }; }
      case 'hlClear': delete HLS[pageKey()]; saveHL(); renderHL(); return { ok: true };
      case 'hiddenList': return { ok: true, items: cleanHidden(HIDDEN[location.hostname]) };
      case 'hiddenClear': delete HIDDEN[location.hostname]; try { api.storage.local.set({ hidden: HIDDEN }); } catch (e) { } renderHidden(); return { ok: true };
      case 'm2': return CLR.m2 ? CLR.m2.run(msg) : { ok: false };
      case 'ttsState': return { ok: true, on: tts.on, paused: tts.paused };
    }
    return { ok: false };
  }

  CLR.feat = { onApply, run, tts: ttsMode };
  /* apply() din content.js poate fi deja executat înainte ca acest script să fie evaluat: cere o re-aplicare */
  if (CLR.ctx) onApply(CLR.ctx.S, CLR.ctx.active);
})();
