/* CLARITAS — funcții suplimentare v1.4 (cod propriu, clean-room; 100 % local, fără rețea):
   fonturi încorporate, mod calm, bare fixe, etichete numerotate, scanare cu comutator, lipire deblocată,
   buton plutitor, text alternativ vizibil, GIF înghețat, simulări, audit continuu, AI local opțional (Chrome).
   Fonturile se încarcă în toate cadrele; restul rulează doar în cadrul principal. */
(() => {
  'use strict';
  if (window.__claritasX) return;
  window.__claritasX = true;

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const doc = document;
  const isTop = window.top === window;
  const { t } = CLR;
  let S = null, active = false;
  const T = (k, v) => t((S && S.lang) || 'auto', k, v);
  const alive = () => { try { return !!(api.runtime && api.runtime.id); } catch (e) { return false; } };
  const clamp = (v, lo, hi, d) => { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };

  /* ================= fonturi încorporate (FontFace din octeți: nu depinde de CSP-ul paginii) ================= */
  const faces = {};
  async function ensureFont(key) {
    const list = CLR.FONT_FILES[key]; if (!list || !doc.fonts || typeof FontFace === 'undefined') return;
    for (const [fam, w, file] of list) {
      const id = fam + w + file; if (faces[id]) continue; faces[id] = true;
      const range = file.indexOf('-ext-') >= 0 ? CLR.UR_EXT : CLR.UR_LATIN;
      const url = api.runtime.getURL('fonts/' + file + '.woff2');
      try {
        let ff;
        try { const buf = await (await fetch(url)).arrayBuffer(); ff = new FontFace(fam, buf, { weight: String(w), unicodeRange: range }); }
        catch (e) { ff = new FontFace(fam, 'url("' + url + '") format("woff2")', { weight: String(w), unicodeRange: range }); }
        await ff.load(); doc.fonts.add(ff); faces[id] = ff;
      } catch (e) { delete faces[id]; }
    }
  }

  /* ================= unelte comune (doar cadrul principal) ================= */
  const XCSS = `
    *{box-sizing:border-box}
    button{font:600 14px/1.2 system-ui,Segoe UI,Arial,sans-serif;cursor:pointer;border:2px solid #ffeb3b;background:#111;color:#ffeb3b;border-radius:8px;padding:7px 10px;min-height:38px;min-width:38px}
    button:hover{background:#2a2a2a} button:focus-visible{outline:3px solid #fff;outline-offset:2px}
    button[aria-pressed=true]{background:#ffeb3b;color:#000}
    #fab{position:fixed;right:14px;bottom:14px;z-index:2147483640;width:48px;height:48px;border-radius:50%;padding:0;font-size:22px;box-shadow:0 4px 16px rgba(0,0,0,.5)}
    #panel{position:fixed;right:14px;bottom:70px;z-index:2147483640;display:none;flex-direction:column;gap:6px;background:#000;border:2px solid #ffeb3b;border-radius:10px;padding:8px;max-width:260px}
    .hb{position:fixed;z-index:2147483641;pointer-events:none;background:#ffeb3b;color:#000;font:700 13px/1 system-ui,Arial,sans-serif;padding:2px 5px;border:2px solid #000;border-radius:5px;box-shadow:0 0 0 2px #ffeb3b}
    .hb.dim{opacity:.25}
    #scanbox{position:fixed;z-index:2147483641;pointer-events:none;border:4px solid #ff1744;box-shadow:0 0 0 3px #fff,0 0 0 7px #000;border-radius:4px;display:none}
    #msg{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483642;background:#000;color:#ffeb3b;border:2px solid #ffeb3b;border-radius:8px;padding:6px 12px;font:600 14px system-ui,Arial,sans-serif;display:none}`;
  let host = null, sr = null, ux = {};
  function ui() {
    if (host && host.isConnected) return ux;
    host = doc.createElement('div'); host.id = 'clr-x';
    host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483640';
    sr = host.attachShadow({ mode: 'closed' });
    const st = doc.createElement('style'); st.textContent = XCSS; sr.appendChild(st);
    const mk = (tag, id) => { const e = doc.createElement(tag); if (id) e.id = id; sr.appendChild(e); return e; };
    ux = { scanbox: mk('div', 'scanbox'), msg: mk('div', 'msg'), hints: mk('div', 'hints'), panel: mk('div', 'panel'), fab: mk('button', 'fab') };
    ux.msg.setAttribute('role', 'status');
    (doc.body || doc.documentElement).appendChild(host);
    return ux;
  }
  const inUI = (e) => { try { return e.composedPath().includes(host); } catch (x) { return false; } };
  let msgT = null;
  function say(txt, ms) { const u = ui(); u.msg.textContent = txt; u.msg.style.display = 'block'; clearTimeout(msgT); msgT = setTimeout(() => { if (ux.msg) ux.msg.style.display = 'none'; }, ms || 3500); }
  const isOurs = (el) => !!(el && el.closest && el.closest('#clr-x,#clr-f,#clr-root'));
  const visible = (el) => { try { return !el.checkVisibility || el.checkVisibility({ checkVisibilityCSS: true }); } catch (e) { return true; } };

  /* ================= bare fixe: calm, dezlipire, focus ================= */
  const COOKIE_RE = /cookie|cookies|consent|gdpr|confiden[țt]ialitate|prelucr|preferin[țt]e|accept(?:[aă])? (?:toate|all)|newsletter|aboneaz|subscri|nu,? mul[țt]umesc|no,? thanks|notific[aă]ri|notifications/i;
  const CHAT_RE = /intercom|drift-|crisp-|tawk|zendesk|livechat|hubspot-messages|tidio|chat-widget|helpscout|olark|freshchat/i;
  let calmN = 0, topPad = 0, botPad = 0, scanTimer = null, fxMO = null, origPad = null;
  function fixedChain(el) {
    let out = null;
    for (let n = el; n && n !== doc.body && n !== doc.documentElement; n = n.parentElement) {
      let cs; try { cs = getComputedStyle(n); } catch (e) { return out; }
      if (cs.position === 'fixed' || cs.position === 'sticky') out = n;
    }
    return out;
  }
  function sampleFixed() {
    const vw = innerWidth, vh = innerHeight, set = new Set();
    for (const fx of [0.02, 0.25, 0.5, 0.75, 0.98]) for (const fy of [0.02, 0.08, 0.25, 0.5, 0.75, 0.92, 0.98]) {
      let els = []; try { els = doc.elementsFromPoint(fx * vw, fy * vh); } catch (e) { }
      for (const el of els) { if (el === doc.documentElement || el === doc.body || isOurs(el)) continue; const f = fixedChain(el); if (f) set.add(f); }
    }
    return Array.from(set).slice(0, 60);
  }
  function scanFixed() {
    if (!alive() || !active || !S) return;
    const wantCalm = S.calm, wantUn = S.unstick, wantFg = S.focusGuard;
    if (!wantCalm && !wantUn && !wantFg) return;
    const vw = innerWidth, vh = innerHeight; let tp = 0, bp = 0, hid = 0;
    sampleFixed().forEach((el) => {
      if (el.hasAttribute('data-clr-calm')) return;
      const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return;
      let z = 0; try { z = parseInt(getComputedStyle(el).zIndex, 10) || 0; } catch (e) { }
      if (wantCalm) {
        const txt = (el.textContent || '').slice(0, 1200);
        const modal = el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'alertdialog' || el.getAttribute('aria-modal') === 'true';
        const idc = (el.id + ' ' + (typeof el.className === 'string' ? el.className : '')).slice(0, 300);
        const risky = el.querySelector('input[type=password]') || el.localName === 'header' || el.localName === 'nav' || el.querySelector('nav,main,article');
        const looks = (COOKIE_RE.test(txt) || /cookie|consent|gdpr|newsletter|popup|modal|overlay/i.test(idc)) && txt.length < 1200 && (modal || z >= 10 || r.width >= vw * 0.5);
        const chat = CHAT_RE.test(idc) || (el.localName === 'iframe' && CHAT_RE.test(el.src || el.title || ''));
        const scrim = !txt.trim() && r.width >= vw * 0.95 && r.height >= vh * 0.95 && !el.querySelector('a,button,input,select,textarea') && z >= 10;
        if (((looks && !risky) || chat || (scrim && calmN > 0))) { el.setAttribute('data-clr-calm', '1'); calmN++; hid++; return; }
      }
      if (wantUn && r.height <= vh * 0.4 && !el.hasAttribute('data-clr-unstick')) { el.setAttribute('data-clr-unstick', '1'); return; }
      if (wantFg && !el.hasAttribute('data-clr-unstick')) {
        if (r.top <= 2 && r.height <= vh * 0.4) tp = Math.max(tp, r.bottom);
        if (r.bottom >= vh - 2 && r.height <= vh * 0.4) bp = Math.max(bp, vh - r.top);
      }
    });
    if (wantFg) {
      const de = doc.documentElement;
      if (origPad == null) origPad = [de.style.getPropertyValue('scroll-padding-top'), de.style.getPropertyValue('scroll-padding-bottom')];
      topPad = Math.max(topPad, tp); botPad = Math.max(botPad, bp);
      de.style.setProperty('scroll-padding-top', Math.ceil(topPad + 8) + 'px', 'important');
      de.style.setProperty('scroll-padding-bottom', Math.ceil(botPad + 8) + 'px', 'important');
    }
    if (hid && S.calm) say(T('calm_n', { n: calmN }), 2500);
  }
  function scheduleScan(ms) { if (scanTimer) return; scanTimer = setTimeout(() => { scanTimer = null; scanFixed(); }, ms || 400); }
  function undoFixed() {
    doc.querySelectorAll('[data-clr-calm],[data-clr-unstick]').forEach((e) => { e.removeAttribute('data-clr-calm'); e.removeAttribute('data-clr-unstick'); });
    calmN = 0; topPad = botPad = 0;
    if (origPad) { const de = doc.documentElement; de.style.removeProperty('scroll-padding-top'); de.style.removeProperty('scroll-padding-bottom'); if (origPad[0]) de.style.setProperty('scroll-padding-top', origPad[0]); if (origPad[1]) de.style.setProperty('scroll-padding-bottom', origPad[1]); origPad = null; }
  }

  /* media fără redare automată (mod calm) + viteză + subtitrări */
  const userActive = () => !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  function onPlay(e) {
    const m = e.target; if (!m || !m.localName || !/^(video|audio)$/.test(m.localName)) return;
    if (S && S.calm && active && !userActive()) { try { m.pause(); } catch (x) { } return; }
    if (S && active && S.playRate !== 1) { try { m.playbackRate = S.playRate; } catch (x) { } }
  }
  function applyCaptions() {
    if (!S || !S.capStyle) return;
    doc.querySelectorAll('video').forEach((v) => {
      try {
        const tr = Array.from(v.textTracks || []).filter((x) => x.kind === 'subtitles' || x.kind === 'captions');
        if (tr.length && !tr.some((x) => x.mode === 'showing')) tr[0].mode = 'showing';
      } catch (e) { }
    });
  }
  function applyRate() { if (S && S.playRate !== 1) doc.querySelectorAll('video,audio').forEach((m) => { try { m.playbackRate = S.playRate; } catch (e) { } }); }

  /* ================= lipire deblocată ================= */
  const pasteBlock = (e) => { if (active && S && S.unblockPaste) e.stopImmediatePropagation(); };
  ['paste', 'copy', 'cut', 'drop'].forEach((ev) => window.addEventListener(ev, pasteBlock, true));

  /* ================= GIF înghețat ================= */
  const frozen = [];
  function freezeGifs() {
    doc.querySelectorAll('img').forEach((img) => {
      if (frozen.length > 80 || img.hasAttribute('data-clr-gifhid') || img.hasAttribute('data-clr-gifkeep')) return;
      const src = img.currentSrc || img.src || ''; if (!/\.gif(\?|#|$)/i.test(src) && !/^data:image\/gif/i.test(src)) return;
      if (!img.complete || !img.naturalWidth) return;
      try {
        const c = doc.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        const r = img.getBoundingClientRect(); c.style.cssText = 'width:' + (r.width || img.naturalWidth) + 'px;height:' + (r.height || img.naturalHeight) + 'px';
        c.setAttribute('data-clr-gifbox', '1'); c.setAttribute('role', 'button'); c.tabIndex = 0; c.setAttribute('aria-label', 'GIF – ' + (img.alt || ''));
        const back = () => { c.remove(); img.removeAttribute('data-clr-gifhid'); img.setAttribute('data-clr-gifkeep', '1'); };
        c.addEventListener('click', back); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); back(); } });
        img.setAttribute('data-clr-gifhid', '1'); img.parentNode.insertBefore(c, img); frozen.push({ img, c });
      } catch (e) { /* imagine din altă origine fără CORS: lăsată neatinsă */ }
    });
  }
  function unfreezeGifs() { frozen.splice(0).forEach((f) => { f.c.remove(); f.img.removeAttribute('data-clr-gifhid'); }); doc.querySelectorAll('[data-clr-gifkeep]').forEach((i) => i.removeAttribute('data-clr-gifkeep')); }

  /* ================= text alternativ vizibil ================= */
  function revealAlt() {
    let n = 0;
    doc.querySelectorAll('img:not([data-clr-altd])').forEach((img) => {
      if (n++ > 400 || isOurs(img)) return;
      const alt = img.getAttribute('alt'); img.setAttribute('data-clr-altd', '1');
      if (alt === '' || (alt == null && img.getAttribute('role') === 'presentation')) return;
      const b = doc.createElement('span'); b.setAttribute('data-clr-altb', alt == null ? 'miss' : 'ok');
      b.textContent = alt == null ? T('alt_missing') : 'ALT: ' + alt.slice(0, 200);
      try { img.insertAdjacentElement('afterend', b); } catch (e) { }
    });
  }
  function hideAlt() { doc.querySelectorAll('[data-clr-altb]').forEach((e) => e.remove()); doc.querySelectorAll('[data-clr-altd]').forEach((e) => e.removeAttribute('data-clr-altd')); }

  /* ================= simulare dislexie (litere amestecate) ================= */
  let dys = null; const dysSaved = [];
  const SKIPT = new Set(['script', 'style', 'noscript', 'textarea', 'input', 'select', 'option', 'code', 'pre']);
  function shuffleWord(w) {
    if (w.length < 4) return w; const a = w.split(''), mid = a.slice(1, -1);
    for (let i = mid.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = mid[i]; mid[i] = mid[j]; mid[j] = x; }
    return a[0] + mid.join('') + a[a.length - 1];
  }
  function dysTick() {
    if (!alive() || !active || !S || S.sim !== 'dyslexia') return stopDys();
    const tw = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_TEXT); let n, seen = 0;
    while ((n = tw.nextNode()) && seen < 700) {
      const p = n.parentElement; if (!p || SKIPT.has(p.localName) || p.isContentEditable || isOurs(p)) continue;
      if (!/\p{L}{4,}/u.test(n.nodeValue)) continue;
      const r = p.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue;
      seen++;
      let rec = dysSaved.find((x) => x.n === n);
      if (!rec) { if (dysSaved.length > 3000) continue; rec = { n, o: n.nodeValue }; dysSaved.push(rec); }
      else if (Math.random() > 0.3) continue;
      n.nodeValue = rec.o.replace(/\p{L}{4,}/gu, shuffleWord);
    }
  }
  function startDys() { if (!dys) { dys = setInterval(dysTick, 900); dysTick(); } }
  function stopDys() { if (dys) { clearInterval(dys); dys = null; } dysSaved.splice(0).forEach((r) => { try { r.n.nodeValue = r.o; } catch (e) { } }); }

  /* ================= etichete numerotate ================= */
  const TARGETS = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=switch],[onclick],[tabindex]:not([tabindex="-1"])';
  function targets() {
    const out = [], vw = innerWidth, vh = innerHeight;
    doc.querySelectorAll(TARGETS).forEach((el) => {
      if (out.length >= 300 || isOurs(el) || el.disabled || !visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
      if (out.length && out[out.length - 1].el.contains(el) && el.localName !== 'input') { const pr = out[out.length - 1].r; if (Math.abs(pr.width - r.width) < 3 && Math.abs(pr.height - r.height) < 3) return; }
      out.push({ el, r });
    });
    return out;
  }
  function activate(el) {
    try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { }
    const ln = el.localName;
    if (ln === 'input' || ln === 'textarea' || ln === 'select') { el.focus(); if (/^(checkbox|radio|button|submit|reset|file)$/.test(el.type || '')) el.click(); }
    else { el.focus({ preventScroll: true }); el.click(); }
  }
  let hint = null;
  function renderHints() {
    if (!hint) return; const u = ui(); u.hints.textContent = '';
    hint.list = targets();
    hint.list.forEach((tg, i) => {
      const num = String(i + 1);
      const b = doc.createElement('span'); b.className = 'hb' + (hint.typed && !num.startsWith(hint.typed) ? ' dim' : '');
      b.textContent = num; b.style.left = Math.max(0, tg.r.left) + 'px'; b.style.top = Math.max(0, tg.r.top) + 'px'; u.hints.appendChild(b);
    });
  }
  function hintKey(e) {
    if (!hint) return;
    if (inUI(e) && e.key !== 'Escape') return;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); stopHints(); return; }
    if (/^[0-9]$/.test(k)) {
      e.preventDefault(); e.stopPropagation();
      hint.typed += k; renderHints();
      const m = hint.list.map((x, i) => String(i + 1)).filter((n) => n.startsWith(hint.typed));
      clearTimeout(hint.t);
      if (m.length === 1) hint.t = setTimeout(() => pickHint(), 450);
      else if (!m.length) { hint.typed = ''; renderHints(); }
    } else if (k === 'Backspace') { e.preventDefault(); e.stopPropagation(); hint.typed = hint.typed.slice(0, -1); renderHints(); }
    else if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); pickHint(); }
  }
  function pickHint() {
    if (!hint) return; const idx = parseInt(hint.typed, 10) - 1; const tg = hint.list[idx]; stopHints();
    if (tg && tg.el.isConnected) activate(tg.el);
  }
  const hintRedraw = () => { if (hint) { cancelAnimationFrame(hint.raf); hint.raf = requestAnimationFrame(renderHints); } };
  function startHints() {
    if (hint) return stopHints(); stopScan();
    hint = { typed: '', list: [], t: 0, raf: 0 }; renderHints();
    say(T('hint_on'), 4000);
    doc.addEventListener('keydown', hintKey, true); addEventListener('scroll', hintRedraw, true); addEventListener('resize', hintRedraw);
  }
  function stopHints() {
    if (!hint) return; clearTimeout(hint.t); cancelAnimationFrame(hint.raf); hint = null;
    if (ux.hints) ux.hints.textContent = '';
    doc.removeEventListener('keydown', hintKey, true); removeEventListener('scroll', hintRedraw, true); removeEventListener('resize', hintRedraw);
  }

  /* ================= scanare cu un singur comutator ================= */
  let scan = null;
  function scanStep() {
    if (!scan || !alive()) return stopScan();
    scan.list = targets().filter((x) => !x.el.closest('[data-clr-calm]'));
    if (!scan.list.length) { scan.i = -1; ux.scanbox.style.display = 'none'; return; }
    scan.i = (scan.i + 1) % scan.list.length;
    const { el } = scan.list[scan.i]; try { el.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (e) { }
    const r = el.getBoundingClientRect(), b = ux.scanbox.style;
    b.display = 'block'; b.left = r.left + 'px'; b.top = r.top + 'px'; b.width = r.width + 'px'; b.height = r.height + 'px';
  }
  function scanKey(e) {
    if (!scan) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stopScan(); return; }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) { if (!scan.hold) scan.hold = setTimeout(stopScan, 1500); return; }   // apăsare lungă = ieșire
      scan.hold = setTimeout(stopScan, 1500);
      const cur = scan.list[scan.i]; clearInterval(scan.t); scan.t = 0;
      if (cur && cur.el.isConnected) activate(cur.el);
      setTimeout(() => { if (scan && !scan.t) { scan.t = setInterval(scanStep, S.scanMs); } }, 1200);
    }
  }
  function scanKeyUp(e) { if (scan && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); e.stopPropagation(); clearTimeout(scan.hold); scan.hold = 0; } }
  function startScan() {
    if (scan) return stopScan(); stopHints(); ui();
    scan = { i: -1, list: [], t: 0, hold: 0 }; say(T('scan_on'), 4000);
    scanStep(); scan.t = setInterval(scanStep, clamp(S.scanMs, 600, 4000, 1500));
    doc.addEventListener('keydown', scanKey, true); doc.addEventListener('keyup', scanKeyUp, true);
  }
  function stopScan() {
    if (!scan) return; clearInterval(scan.t); clearTimeout(scan.hold); scan = null;
    if (ux.scanbox) ux.scanbox.style.display = 'none';
    doc.removeEventListener('keydown', scanKey, true); doc.removeEventListener('keyup', scanKeyUp, true);
  }

  /* ================= scurtături globale + buton plutitor ================= */
  function globalKey(e) {
    if (!active || !S || !e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
    const k = (e.code || '').toUpperCase();
    if (k === 'KEYH' && S.hints) { e.preventDefault(); startHints(); }
    else if (k === 'KEYS' && S.scan) { e.preventDefault(); startScan(); }
  }
  function buildFab() {
    const u = ui(); u.fab.textContent = '◐'; u.fab.setAttribute('aria-label', T('fab_open')); u.fab.title = T('fab_open'); u.fab.setAttribute('aria-expanded', 'false');
    u.fab.style.display = 'block';
    u.panel.textContent = '';
    const c = CLR.ctx || {};
    const add = (label, fn) => { const b = doc.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => { u.panel.style.display = 'none'; u.fab.setAttribute('aria-expanded', 'false'); fn(); }); u.panel.appendChild(b); };
    add(T('t_reader'), () => CLR.feat && CLR.feat.run({ cmd: 'reader' }));
    add(T('tts_page'), () => CLR.feat && CLR.feat.tts('toggle'));
    add(T('th_wb') + ' / ' + T('theme'), () => c.command && c.command('cycle-theme'));
    if (S.hints) add(T('hints'), startHints);
    if (S.scan) add(T('scan'), startScan);
    add(T('calm'), () => c.write && c.write({ calm: !S.calm }));
    if (!u.fab.__b) {
      u.fab.__b = true;
      u.fab.addEventListener('click', () => { const open = u.panel.style.display !== 'flex'; u.panel.style.display = open ? 'flex' : 'none'; u.fab.setAttribute('aria-expanded', String(open)); if (open) { const f = u.panel.querySelector('button'); if (f) f.focus(); } });
      u.panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { u.panel.style.display = 'none'; u.fab.setAttribute('aria-expanded', 'false'); u.fab.focus(); } });
    }
  }
  function removeFab() { if (ux.fab) { ux.fab.style.display = 'none'; ux.panel.style.display = 'none'; } }

  /* ================= focus acoperit + audit continuu ================= */
  const liveIssues = new Map(); let liveInfo = { total: 0, err: 0, warn: 0, added: 0 }; let liveT = null, liveMO = null, prevKeys = new Set();
  const lbl = (el) => el.localName + (el.id ? '#' + el.id : '') + (el.classList && el.classList.length ? '.' + el.classList[0] : '');
  function onFocusIn(e) {
    if (!active || !S || !(S.focusGuard || S.liveAudit)) return;
    const el = e.target; if (!el || el === doc.body || isOurs(el) || !el.getBoundingClientRect) return;
    requestAnimationFrame(() => {
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
      const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const top = doc.elementFromPoint(x, y);
      if (top && top !== el && !el.contains(top) && !top.contains(el) && fixedChain(top)) {
        liveIssues.set('fo:' + lbl(el), { rule: 'focus_obscured', sev: 'err', el });
        if (S.focusGuard) { try { el.scrollIntoView({ block: 'center' }); } catch (x2) { } }
      }
    });
  }
  function liveRun() {
    liveT = null; if (!alive() || !active || !S || !S.liveAudit || !CLR.feat) return;
    const r = CLR.feat.run({ cmd: 'audit' }); if (!r || !r.items) return;
    const items = r.items.filter((i) => i.sev !== 'info');
    const keys = new Set(items.map((i) => i.rule + '|' + i.label));
    let added = 0; keys.forEach((k) => { if (!prevKeys.has(k)) added++; });
    const first = prevKeys.size === 0 && liveInfo.total === 0;
    prevKeys = keys;
    liveInfo = { total: items.length, err: items.filter((i) => i.sev === 'err').length, warn: items.filter((i) => i.sev === 'warn').length, added: first ? 0 : added };
  }
  function liveSchedule() { if (!liveT) liveT = setTimeout(liveRun, 1500); }
  function auditExtra(add) {
    liveIssues.forEach((v) => { if (v.el && v.el.isConnected) add(v.rule, v.sev, v.el); });
    doc.querySelectorAll('input[type=password]').forEach((el) => {
      const ac = (el.getAttribute('autocomplete') || '').toLowerCase(), op = el.getAttribute('onpaste') || '';
      if (ac === 'off' || /return\s+false|preventDefault/.test(op)) add('auth_ac', 'warn', el);
    });
    /* 1.4.12: spațiere text */
    const cand = [];
    doc.querySelectorAll('p,li,td,th,div,span,a,button,label,h1,h2,h3,h4,h5,h6').forEach((el) => {
      if (cand.length >= 300 || isOurs(el) || !el.firstChild) return;
      let cs; try { cs = getComputedStyle(el); } catch (e) { return; }
      if (!(cs.overflowY === 'hidden' || cs.overflowX === 'hidden' || cs.overflow === 'hidden') || !el.clientHeight || (el.textContent || '').trim().length < 4) return;
      cand.push([el, el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1]);
    });
    if (cand.length) {
      const st = doc.createElement('style');
      st.textContent = ':root:root:root *:not(#clr-x):not(#clr-f){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}:root:root:root p{margin-bottom:2em!important}';
      doc.documentElement.appendChild(st);
      try { cand.forEach(([el, was]) => { if (!was && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) add('spacing_clip', 'warn', el); }); }
      finally { st.remove(); }
    }
  }

  /* ================= AI local din Chrome (opțional, doar dacă modelul e deja disponibil) ================= */
  async function aiSummarize(text) {
    if (!S || !S.aiLocal) return { err: 'off' };
    try {
      if (typeof Summarizer === 'undefined') return { err: 'na' };
      if ((await Summarizer.availability()) !== 'available') return { err: 'na' };
      const sm = await Summarizer.create({ type: 'tldr', format: 'plain-text', length: 'medium' });
      const out = await sm.summarize(String(text).slice(0, 12000)); try { sm.destroy(); } catch (e) { }
      return { text: String(out) };
    } catch (e) { return { err: 'na' }; }
  }
  async function aiTranslate(text) {
    if (!S || !S.aiLocal) return { err: 'off' };
    try {
      if (typeof Translator === 'undefined') return { err: 'na' };
      const src = CLR.detectLang(text) || (doc.documentElement.lang || 'en').slice(0, 2).toLowerCase();
      const dst = (S.lang && S.lang !== 'auto' ? S.lang : (navigator.language || 'en').slice(0, 2)).toLowerCase();
      if (src === dst) return { text: String(text) };
      if ((await Translator.availability({ sourceLanguage: src, targetLanguage: dst })) !== 'available') return { err: 'na' };
      const tr = await Translator.create({ sourceLanguage: src, targetLanguage: dst });
      const out = await tr.translate(String(text).slice(0, 8000)); try { tr.destroy(); } catch (e) { }
      return { text: String(out) };
    } catch (e) { return { err: 'na' }; }
  }

  /* ================= cârlig către content.js ================= */
  let listening = false, mo2 = null;
  function onMut() { if (S && (S.calm || S.unstick || S.focusGuard)) scheduleScan(500); if (S && S.altReveal) { clearTimeout(onMut.a); onMut.a = setTimeout(revealAlt, 600); } if (S && S.noFlash) { clearTimeout(onMut.g); onMut.g = setTimeout(freezeGifs, 800); } if (S && S.liveAudit) liveSchedule(); }
  function teardownTop() {
    stopHints(); stopScan(); undoFixed(); hideAlt(); unfreezeGifs(); stopDys(); removeFab();
    if (mo2) { mo2.disconnect(); mo2 = null; }
    if (listening) { doc.removeEventListener('focusin', onFocusIn, true); doc.removeEventListener('keydown', globalKey, true); doc.removeEventListener('play', onPlay, true); removeEventListener('scroll', onScrollX, true); removeEventListener('resize', onScrollX); listening = false; }
    if (host) { host.remove(); host = null; ux = {}; }
    liveInfo = { total: 0, err: 0, warn: 0, added: 0 }; prevKeys = new Set(); liveIssues.clear();
  }
  const onScrollX = () => { if (S && (S.calm || S.unstick || S.focusGuard)) scheduleScan(300); };
  function onApply(s, act) {
    S = s; active = !!act;
    if (!active) { if (isTop) teardownTop(); return; }
    if (S.font === 'dyslexic' || S.font === 'lexend' || S.font === 'atkinson') ensureFont(S.font);
    doc.addEventListener('play', onPlay, true);
    if (!isTop) return;
    if (!listening) { doc.addEventListener('focusin', onFocusIn, true); doc.addEventListener('keydown', globalKey, true); addEventListener('scroll', onScrollX, true); addEventListener('resize', onScrollX); listening = true; }
    if (!mo2 && typeof MutationObserver !== 'undefined') { mo2 = new MutationObserver(onMut); mo2.observe(doc.documentElement, { childList: true, subtree: true }); }
    if (S.fab) buildFab(); else removeFab();
    if (!S.hints) stopHints(); if (!S.scan) stopScan();
    if (S.calm || S.unstick || S.focusGuard) { scheduleScan(100); setTimeout(scanFixed, 1500); setTimeout(scanFixed, 4000); }
    if (!S.calm && !S.unstick && !S.focusGuard) undoFixed();
    else if (!S.calm || !S.unstick) {
      if (!S.calm) doc.querySelectorAll('[data-clr-calm]').forEach((e) => e.removeAttribute('data-clr-calm'));
      if (!S.unstick) doc.querySelectorAll('[data-clr-unstick]').forEach((e) => e.removeAttribute('data-clr-unstick'));
    }
    if (S.altReveal) revealAlt(); else hideAlt();
    if (S.noFlash) freezeGifs(); else unfreezeGifs();
    if (S.sim === 'dyslexia') startDys(); else stopDys();
    applyCaptions(); applyRate();
    if (S.liveAudit) liveSchedule(); else { liveInfo = { total: 0, err: 0, warn: 0, added: 0 }; prevKeys = new Set(); }
  }

  CLR.x = {
    onApply, font: ensureFont, auditExtra, aiSummarize, aiTranslate,
    live: () => (S && S.liveAudit ? liveInfo : null),
    hints: startHints, scan: startScan,
    state: () => ({ calm: calmN, hints: !!hint, scan: !!scan })
  };
  if (CLR.ctx) onApply(CLR.ctx.S, CLR.ctx.active);
})();
