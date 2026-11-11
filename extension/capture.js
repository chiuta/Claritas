/* CLARITAS — captură de ecran și ajutor pentru înregistrare (v1.5). 100 % local: nicio cerere de rețea, nicio încărcare.
   Captură: zona vizibilă / regiune / toată pagina (se derulează și se lipesc cadrele) / element / cu întârziere.
   Editor: săgeată, dreptunghi, evidențiere, neclaritate, acoperire neagră, text, pași numerotați, creion; tastatură completă.
   Acoperire automată a datelor personale (e-mail, telefon, CNP, IBAN, card, parole) înainte de salvare.
   Export: PNG, clipboard, sau PNG + fișier .md cu descriere alternativă, titluri vizibile și pașii adnotați.
   Înregistrare: partea din pagină (inele la clic, taste afișate, marcaje, parole estompate) + jurnal de acțiuni pentru recorder.html. */
(() => {
  'use strict';
  if (window.__claritasCap) return;
  window.__claritasCap = true;
  const IS_TOP = window.top === window;
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const doc = document;
  const T = (k, v) => CLR.t((CLR.ctx && CLR.ctx.S && CLR.ctx.S.lang) || 'auto', k, v);
  const alive = () => { try { return !!(api.runtime && api.runtime.id); } catch (e) { return false; } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  /* ---------------- interfață (shadow închis, exclusă din capturi) ---------------- */
  const CSS = `
    *{box-sizing:border-box} :host{all:initial}
    button,select,input,textarea{font:600 14px/1.2 system-ui,Segoe UI,Arial,sans-serif}
    button{cursor:pointer;border:2px solid #ffeb3b;background:#111;color:#ffeb3b;border-radius:8px;padding:7px 10px;min-height:38px}
    button:hover{background:#2a2a2a} button:focus-visible,input:focus-visible,textarea:focus-visible,canvas:focus-visible{outline:3px solid #fff;outline-offset:2px}
    button[aria-pressed=true]{background:#ffeb3b;color:#000}
    #hub{position:fixed;right:16px;top:16px;z-index:2147483646;background:#000;border:2px solid #ffeb3b;border-radius:10px;padding:10px;display:none;flex-direction:column;gap:6px;min-width:230px;color:#ffeb3b}
    #hub h2{margin:0 0 4px;font:700 15px system-ui,Arial,sans-serif}
    #sel{position:fixed;inset:0;z-index:2147483646;display:none;cursor:crosshair;background:rgba(0,0,0,.35)}
    #box{position:fixed;border:3px solid #ffeb3b;box-shadow:0 0 0 2px #000,0 0 0 9999px rgba(0,0,0,.45);display:none;pointer-events:none;z-index:2147483647}
    #tip{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;background:#000;color:#ffeb3b;border:2px solid #ffeb3b;border-radius:8px;padding:8px 14px;font:600 14px system-ui,Arial,sans-serif;display:none;max-width:90vw;text-align:center}
    #ed{position:fixed;inset:0;z-index:2147483647;background:#1a1a1a;display:none;flex-direction:column;color:#ffeb3b}
    #ed .bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#000;border-bottom:2px solid #ffeb3b;align-items:center}
    #ed .bar label{display:flex;gap:6px;align-items:center;font:600 13px system-ui,Arial,sans-serif}
    #ed .bar input[type=text]{background:#111;color:#ffeb3b;border:2px solid #ffeb3b;border-radius:6px;padding:6px;min-width:160px}
    #ed .bar input[type=color]{width:38px;height:34px;padding:0;border:2px solid #ffeb3b;background:#111}
    #ed .stage{flex:1;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:12px}
    #cv{background:#fff;max-width:100%;height:auto;touch-action:none;cursor:crosshair;box-shadow:0 0 0 2px #ffeb3b}
    #ed .foot{padding:8px;background:#000;border-top:2px solid #ffeb3b;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    #ed textarea{flex:1;min-width:240px;height:54px;background:#111;color:#ffeb3b;border:2px solid #ffeb3b;border-radius:6px;padding:6px}
    #ed .hint{font:500 12px system-ui,Arial,sans-serif;opacity:.9;flex-basis:100%}
    #toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;background:#000;color:#ffeb3b;border:2px solid #ffeb3b;border-radius:8px;padding:8px 14px;font:600 14px system-ui,Arial,sans-serif;display:none}
    .ring{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border:4px solid #ff1744;border-radius:50%;pointer-events:none;z-index:2147483645;animation:rg .7s ease-out forwards}
    @keyframes rg{from{transform:scale(.4);opacity:1}to{transform:scale(1.5);opacity:0}}
    #keys{position:fixed;left:14px;bottom:14px;z-index:2147483645;display:none;background:#000;color:#fff;border:2px solid #ffeb3b;border-radius:8px;padding:6px 12px;font:700 20px system-ui,Arial,sans-serif;pointer-events:none}`;
  let host = null, sr = null, U = {};
  function ui() {
    if (host && host.isConnected) return U;
    host = doc.createElement('claritas-capture'); host.id = 'clr-cap';
    [['display', 'block'], ['visibility', 'visible'], ['opacity', '1'], ['position', 'fixed'], ['left', '0'], ['top', '0'], ['width', '0'], ['height', '0'], ['z-index', '2147483646'], ['transform', 'none'], ['filter', 'none'], ['pointer-events', 'auto']].forEach(([k, v]) => host.style.setProperty(k, v, 'important'));
    sr = host.attachShadow({ mode: 'closed' });
    const st = doc.createElement('style'); st.textContent = CSS; sr.appendChild(st);
    const mk = (tag, id) => { const e = doc.createElement(tag); e.id = id; sr.appendChild(e); return e; };
    U = { hub: mk('div', 'hub'), sel: mk('div', 'sel'), box: mk('div', 'box'), tip: mk('div', 'tip'), ed: mk('div', 'ed'), toast: mk('div', 'toast'), keys: mk('div', 'keys') };
    U.tip.setAttribute('role', 'status'); U.toast.setAttribute('role', 'status'); U.keys.setAttribute('aria-hidden', 'true');
    U.hub.setAttribute('role', 'dialog'); U.hub.setAttribute('aria-label', T('cap_title'));
    U.ed.setAttribute('role', 'dialog'); U.ed.setAttribute('aria-modal', 'true'); U.ed.setAttribute('aria-label', T('cap_title'));
    doc.documentElement.appendChild(host);
    return U;
  }
  const btn = (label, fn, extra) => { const b = doc.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', (e) => { e.stopPropagation(); fn(e); }); if (extra) Object.assign(b, extra); return b; };
  let toastT = null;
  function toast(msg, ms) { const u = ui(); u.toast.textContent = msg; u.toast.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { u.toast.style.display = 'none'; }, ms || 2600); }
  let tipT = null;
  function tip(msg, ms) { const u = ui(); u.tip.textContent = msg; u.tip.style.display = msg ? 'block' : 'none'; clearTimeout(tipT); if (msg && ms) tipT = setTimeout(() => { u.tip.style.display = 'none'; }, ms); }

  /* ---------------- captură ---------------- */
  let lastCap = 0, masked = false;
  const unmask = () => { if (masked) { masked = false; try { api.runtime.sendMessage({ type: 'cap-mask', on: false }); } catch (e) { } } };
  async function grab() {
    const wait = 620 - (Date.now() - lastCap); if (wait > 0) await sleep(wait);   // Chrome: max. 2 capturi/s
    /* masca cadrelor rămâne pornită pe toată durata fluxului (o singură dată), oprită în finally-ul fluxului */
    if (!masked) { masked = true; try { await api.runtime.sendMessage({ type: 'cap-mask', on: true }); } catch (e) { } await sleep(160); }
    let r; try { r = await api.runtime.sendMessage({ type: 'cap-visible' }); } finally { lastCap = Date.now(); }
    if (!r || !r.url) throw new Error((r && r.err) || 'capture');
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = r.url; });
  }
  const hideUi = () => { if (host) host.style.setProperty('display', 'none', 'important'); doc.querySelectorAll('#clr-x').forEach((e) => { e.style.visibility = 'hidden'; }); };
  const showUi = () => { if (host) host.style.setProperty('display', 'block', 'important'); doc.querySelectorAll('#clr-x').forEach((e) => { e.style.visibility = ''; }); };
  async function shotVisible() { hideUi(); await nextFrame(); await sleep(140); try { const im = await grab(); const sx = im.width / innerWidth, sy = im.height / innerHeight; if (Math.abs(sx - sy) / sx > 0.03) setTimeout(() => toast(T('cap_ios'), 7000), 300); return im; } finally { showUi(); } }

  function bigScroller() {
    const se = doc.scrollingElement || doc.documentElement;
    if (se.scrollHeight > innerHeight * 1.08) return { el: se, rect: { left: 0, top: 0, width: innerWidth, height: innerHeight }, root: true };
    let best = null, area = 0;
    doc.querySelectorAll('div,main,section,article,ul,ol,table,[role=main]').forEach((e) => {
      if (e.id === 'clr-cap') return;
      if (e.scrollHeight <= e.clientHeight + 60 || e.clientHeight < innerHeight * 0.4) return;
      let ov; try { ov = getComputedStyle(e).overflowY; } catch (x) { return; }
      if (ov !== 'auto' && ov !== 'scroll') return;
      const r = e.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { el: e, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, root: false }; }
    });
    return best || { el: se, rect: { left: 0, top: 0, width: innerWidth, height: innerHeight }, root: true };
  }
  function freezeFixed() {
    let n = 0;
    doc.querySelectorAll('body *').forEach((e) => {
      if (n > 400 || e.closest('#clr-cap,#clr-x')) return;
      let p; try { p = getComputedStyle(e).position; } catch (x) { return; }
      if (p === 'fixed' || p === 'sticky') { e.setAttribute('data-clr-capfix', '1'); n++; }
    });
    return n;
  }
  async function fullPage(sc, progress, redactFn) {
    const st = doc.createElement('style');
    st.textContent = 'html,body,*{scroll-behavior:auto!important}[data-clr-capfix]{visibility:hidden!important}';
    doc.documentElement.appendChild(st);
    const el = sc.el, root = sc.root;
    const getY = () => (root ? scrollY : el.scrollTop), setY = (y) => { if (root) scrollTo(scrollX, y); else el.scrollTop = y; };
    const y0 = getY(); let canvas = null, scale = 1, total = 0, rects = [];
    try {
      setY(0); await sleep(200);
      total = Math.max(root ? el.scrollHeight : el.scrollHeight, sc.rect.height);
      const H = sc.rect.height;
      rects = redactFn ? redactFn(sc) : [];
      let y = 0, first = true, frames = Math.ceil(total / H), i = 0;
      while (true) {
        setY(y); await sleep(first ? 120 : 260); const ay = getY();
        hideUi(); await nextFrame(); await sleep(90);
        let img; try { img = await grab(); } finally { showUi(); }
        if (first) {
          scale = img.width / innerWidth;
          if (total * scale > 30000) total = Math.floor(30000 / scale);
          canvas = doc.createElement('canvas'); canvas.width = Math.round(sc.rect.width * scale); canvas.height = Math.round(total * scale);
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, Math.round(sc.rect.left * scale), Math.round(sc.rect.top * scale), Math.round(sc.rect.width * scale), Math.round(H * scale), 0, Math.round(ay * scale), Math.round(sc.rect.width * scale), Math.round(H * scale));
        i++; progress(Math.min(99, Math.round((i / frames) * 100)));
        if (first) { freezeFixed(); first = false; }
        if (ay + H >= total - 1 || i > 60) break;
        y = Math.min(ay + H, total - H);
        if (y <= ay) break;
      }
    } finally {
      doc.querySelectorAll('[data-clr-capfix]').forEach((e) => e.removeAttribute('data-clr-capfix')); st.remove(); setY(y0);
    }
    return { canvas, scale, rects };
  }

  /* ---------------- date personale ---------------- */
  const luhn = (s) => { const d = s.replace(/\D/g, ''); if (d.length < 13 || d.length > 19) return false; let sum = 0, alt = false; for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; };
  const PATS = [
    { re: /[\w.+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63}){1,8}/g },
    { re: /(?:\+?40|\b0)[\s.-]?7\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g },
    { re: /\b[1-8]\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{6}\b/g },
    { re: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,4})?\b/g, test: (s) => /\d/.test(s) && s.replace(/\s/g, '').length >= 15 },
    { re: /\b(?:\d[ -]?){13,19}\b/g, test: luhn }
  ];
  const SENS = /(cnp|iban|card|cvv|cvc|parol|password|pass|secret|token|api[-_]?key)/i;
  function findSensitive(sc) {
    const out = [], rt = sc ? sc.rect : { left: 0, top: 0 }, root = !sc || sc.root;
    const ox = root ? scrollX - 0 : (sc.el.scrollLeft - rt.left), oy = root ? scrollY : (sc.el.scrollTop - rt.top);
    const push = (r) => { if (r.width > 2 && r.height > 2 && out.length < 500) out.push({ x: r.left + ox, y: r.top + oy, w: r.width, h: r.height }); };
    const OK_EL = (p) => p && !/^(script|style|noscript|textarea)$/i.test(p.localName) && !(p.closest && p.closest('#clr-cap,#clr-x,#clr-f'));
    const scanText = (v, mk) => {
      if (v.length > 20000) v = v.slice(0, 20000);
      for (const p of PATS) {
        p.re.lastIndex = 0; let m;
        while ((m = p.re.exec(v))) { if (p.test && !p.test(m[0])) continue; mk(m.index, m[0].length); }
      }
    };
    let guard = 0;
    const roots = [doc.body || doc.documentElement];
    for (let ri = 0; ri < roots.length && ri < 200; ri++) {
      const root = roots[ri];
      const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (OK_EL(n.parentElement) && n.nodeValue.length > 5 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
      let n;
      while ((n = tw.nextNode()) && guard++ < 6000) {
        scanText(n.nodeValue, (i, len) => { try { const r = doc.createRange(); r.setStart(n, i); r.setEnd(n, i + len); Array.from(r.getClientRects()).forEach(push); } catch (e) { } });
      }
      /* shadow DOM deschis: adaugă rădăcinile și câmpurile lor */
      const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (let i = 0; i < all.length && i < 20000; i++) if (all[i].shadowRoot && roots.length < 200) roots.push(all[i].shadowRoot);
    }
    const FIELD_SENS = /^(email|tel)$/;
    roots.forEach((root) => root.querySelectorAll('input,textarea').forEach((e) => {
      const t = (e.type || '').toLowerCase(); if (t === 'hidden' || t === 'checkbox' || t === 'radio' || t === 'button' || t === 'submit' || t === 'range' || t === 'color') return;
      if (e.closest && e.closest('#clr-cap,#clr-x,#clr-f')) return;
      const meta = ((e.name || '') + ' ' + (e.id || '') + ' ' + (e.getAttribute('autocomplete') || '') + ' ' + (e.getAttribute('aria-label') || '')).toLowerCase();
      const v = e.value || '';
      let hit = t === 'password' || (v && (FIELD_SENS.test(t) || SENS.test(meta) || /^cc-/.test(e.getAttribute('autocomplete') || '')));
      if (!hit && v) scanText(v, () => { hit = true; });
      if (hit) push(e.getBoundingClientRect());
    }));
    return out;
  }

  /* ---------------- fluxuri de captură ---------------- */
  let busy = false;
  const stampName = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return (location.hostname || 'pagina').replace(/[^\w.-]/g, '_') + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); };
  function toCanvas(img) { const c = doc.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; }
  function crop(canvas, x, y, w, h) { x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y)); w = Math.min(canvas.width - x, Math.round(w)); h = Math.min(canvas.height - y, Math.round(h)); const c = doc.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); c.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h); return c; }

  async function flow(kind) {
    if (busy) return; busy = true; closeHub(); ui();
    try {
      if (kind === 'delay') { for (let i = 5; i > 0; i--) { tip(T('cap_countdown', { n: i })); await sleep(1000); } tip(''); kind = 'visible'; }
      if (kind === 'visible') {
        const sens = findSensitive(null); const img = await shotVisible(); const c = toCanvas(img); const s = img.width / innerWidth;
        return openEditor(c, sens.map((r) => ({ x: r.x - scrollX, y: r.y - scrollY, w: r.w, h: r.h })).map((r) => ({ x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s })).filter((r) => r.x + r.w > 0 && r.y + r.h > 0 && r.x < c.width && r.y < c.height));
      }
      if (kind === 'region') {
        const sel = await pickRegion(); if (!sel) return;
        const sens = findSensitive(null); const img = await shotVisible(); const s = img.width / innerWidth; const full = toCanvas(img);
        const c = crop(full, sel.x * s, sel.y * s, sel.w * s, sel.h * s);
        const rs = sens.map((r) => ({ x: (r.x - scrollX - sel.x) * s, y: (r.y - scrollY - sel.y) * s, w: r.w * s, h: r.h * s })).filter((r) => r.x + r.w > 0 && r.y + r.h > 0 && r.x < c.width && r.y < c.height);
        return openEditor(c, rs);
      }
      if (kind === 'full') {
        const sc = bigScroller(); tip(T('cap_busy', { n: 0 }));
        const r = await fullPage(sc, (n) => tip(T('cap_busy', { n })), findSensitive); tip('');
        return openEditor(r.canvas, r.rects.map((q) => ({ x: q.x * r.scale, y: q.y * r.scale, w: q.w * r.scale, h: q.h * r.scale })));
      }
      if (kind === 'element') {
        const el = await pickElement(); if (!el) return;
        el.scrollIntoView({ block: 'center', inline: 'nearest' }); await sleep(250);
        const rect = el.getBoundingClientRect();
        if (rect.height <= innerHeight && rect.width <= innerWidth + 2) {
          const sens = findSensitive(null); const img = await shotVisible(); const s = img.width / innerWidth; const full = toCanvas(img);
          const c = crop(full, rect.left * s, rect.top * s, rect.width * s, rect.height * s);
          const rs = sens.map((r) => ({ x: (r.x - scrollX - rect.left) * s, y: (r.y - scrollY - rect.top) * s, w: r.w * s, h: r.h * s })).filter((r) => r.x + r.w > 0 && r.y + r.h > 0 && r.x < c.width && r.y < c.height);
          return openEditor(c, rs);
        }
        const sc = bigScroller(); tip(T('cap_busy', { n: 0 }));
        const docTop = rect.top + scrollY, docLeft = rect.left + scrollX;
        const r = await fullPage(sc, (n) => tip(T('cap_busy', { n })), findSensitive); tip('');
        const c = crop(r.canvas, docLeft * r.scale, docTop * r.scale, rect.width * r.scale, rect.height * r.scale);
        return openEditor(c, r.rects.map((q) => ({ x: (q.x - docLeft) * r.scale, y: (q.y - docTop) * r.scale, w: q.w * r.scale, h: q.h * r.scale })).filter((q) => q.x + q.w > 0 && q.y + q.h > 0 && q.x < c.width && q.y < c.height));
      }
    } catch (e) { tip(''); showUi(); toast(T('cap_fail'), 5000); }
    finally { unmask(); busy = false; }
  }

  /* ---------------- alegere regiune / element ---------------- */
  function pickRegion() {
    return new Promise((resolve) => {
      const u = ui(); u.sel.style.display = 'block'; tip(T('cap_hint_region'));
      let x0 = 0, y0 = 0, drag = false, cur = null;
      const done = (v) => { u.sel.style.display = 'none'; u.box.style.display = 'none'; tip(''); u.sel.removeEventListener('pointerdown', dn); removeEventListener('pointermove', mv, true); removeEventListener('pointerup', up, true); doc.removeEventListener('keydown', kd, true); resolve(v); };
      const rectOf = (x, y) => ({ x: Math.min(x0, x), y: Math.min(y0, y), w: Math.abs(x - x0), h: Math.abs(y - y0) });
      const dn = (e) => { e.preventDefault(); drag = true; x0 = e.clientX; y0 = e.clientY; cur = null; };
      const mv = (e) => { if (!drag) return; cur = rectOf(e.clientX, e.clientY); Object.assign(u.box.style, { display: 'block', left: cur.x + 'px', top: cur.y + 'px', width: cur.w + 'px', height: cur.h + 'px' }); };
      const up = () => { if (!drag) return; drag = false; if (cur && cur.w > 8 && cur.h > 8) done(cur); };
      const kd = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); } else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done({ x: 0, y: 0, w: innerWidth, h: innerHeight }); } };
      u.sel.addEventListener('pointerdown', dn); addEventListener('pointermove', mv, true); addEventListener('pointerup', up, true); doc.addEventListener('keydown', kd, true);
    });
  }
  function pickElement() {
    return new Promise((resolve) => {
      const u = ui(); u.sel.style.display = 'block'; u.sel.style.cursor = 'pointer'; tip(T('cap_hint_element'));
      let el = (doc.activeElement && doc.activeElement !== doc.body) ? doc.activeElement : null;
      const show = () => { if (!el) { u.box.style.display = 'none'; return; } const r = el.getBoundingClientRect(); Object.assign(u.box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); };
      const under = (x, y) => { u.sel.style.pointerEvents = 'none'; let e = doc.elementFromPoint(x, y); u.sel.style.pointerEvents = ''; return e && e !== host && e !== doc.documentElement ? e : null; };
      const done = (v) => { u.sel.style.display = 'none'; u.sel.style.cursor = 'crosshair'; u.box.style.display = 'none'; tip(''); u.sel.removeEventListener('pointermove', mv); u.sel.removeEventListener('click', ck); doc.removeEventListener('keydown', kd, true); resolve(v); };
      const mv = (e) => { const x = under(e.clientX, e.clientY); if (x) { el = x; show(); } };
      const ck = (e) => { e.preventDefault(); e.stopPropagation(); const x = under(e.clientX, e.clientY) || el; done(x); };
      const kd = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(el || doc.body); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); if (!el) el = doc.body; else if (el.parentElement && el.parentElement !== doc.documentElement) el = el.parentElement; show(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); if (el && el.firstElementChild) el = el.firstElementChild; show(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); const s = el && (e.key === 'ArrowRight' ? el.nextElementSibling : el.previousElementSibling); if (s) { el = s; show(); } }
      };
      u.sel.addEventListener('pointermove', mv); u.sel.addEventListener('click', ck); doc.addEventListener('keydown', kd, true); show();
    });
  }

  /* ---------------- editor ---------------- */
  const COLORS = { arrow: '#ff1744' };
  let ED = null;
  function openEditor(base, suggest) {
    const u = ui(); closeHub();
    const prevFocus = doc.activeElement;
    ED = { base, ann: [], tool: 'arrow', color: '#ff1744', step: 1, auto: true, stamp: false, suggest: suggest || [], cur: null, vx: 40, vy: 40, vdrag: false, prevFocus };
    u.ed.textContent = '';
    const bar = doc.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', T('cap_title'));
    const tools = [['arrow', '➜', 'ed_arrow'], ['rect', '▭', 'ed_rect'], ['hl', '🖍', 'ed_hl'], ['blur', '▒', 'ed_blur'], ['redact', '■', 'ed_redact'], ['text', 'T', 'ed_text'], ['step', '①', 'ed_step'], ['pen', '✎', 'ed_pen']];
    ED.tb = {};
    tools.forEach(([k, g, lab]) => { const b = btn(g + ' ' + T(lab), () => { ED.tool = k; syncTools(); }); b.setAttribute('aria-pressed', 'false'); ED.tb[k] = b; bar.appendChild(b); });
    const col = doc.createElement('input'); col.type = 'color'; col.value = ED.color; col.setAttribute('aria-label', T('ed_color')); col.addEventListener('input', () => { ED.color = col.value; });
    const lab = doc.createElement('input'); lab.type = 'text'; lab.setAttribute('aria-label', T('ed_label')); lab.placeholder = T('ed_label'); ED.lab = lab;
    const lc = (txt, fn, on) => { const l = doc.createElement('label'); const i = doc.createElement('input'); i.type = 'checkbox'; i.checked = !!on; i.addEventListener('change', () => fn(i.checked)); l.append(i, doc.createTextNode(txt)); return l; };
    bar.append(col, lab, btn('↶ ' + T('ed_undo'), undo), btn('✕ ' + T('ed_clear'), () => { ED.ann = []; ED.step = 1; render(); }),
      lc(T('ed_auto'), (v) => { ED.auto = v; render(); }, true), lc(T('ed_stamp'), (v) => { ED.stamp = v; render(); }, false));
    const stage = doc.createElement('div'); stage.className = 'stage';
    const cv = doc.createElement('canvas'); cv.id = 'cv'; cv.tabIndex = 0; cv.setAttribute('aria-label', T('ed_kb')); stage.appendChild(cv); ED.cv = cv;
    const foot = doc.createElement('div'); foot.className = 'foot';
    const alt = doc.createElement('textarea'); alt.setAttribute('aria-label', T('ed_alt')); alt.placeholder = T('ed_alt'); ED.alt = alt;
    foot.append(alt, btn('💾 ' + T('ed_save'), () => save(false)), btn('📝 ' + T('ed_doc'), () => save(true)), btn('📋 ' + T('ed_copy'), copy), btn('✕ ' + T('ed_close'), closeEditor));
    const hint = doc.createElement('div'); hint.className = 'hint'; hint.textContent = T('ed_kb'); foot.appendChild(hint);
    u.ed.append(bar, stage, foot); u.ed.style.display = 'flex';
    cv.width = base.width; cv.height = base.height;
    bindCanvas(); syncTools(); render(); cv.focus();
    if (ED.suggest.length) toast(T('ed_redacted', { n: ED.suggest.length }), 3500);
    doc.addEventListener('keydown', edKey, true);
  }
  function syncTools() { Object.keys(ED.tb).forEach((k) => ED.tb[k].setAttribute('aria-pressed', String(k === ED.tool))); }
  function undo() { if (!ED) return; const a = ED.ann.pop(); if (a && a.t === 'step') ED.step = Math.max(1, ED.step - 1); render(); }
  function closeEditor() { if (!ED) return; doc.removeEventListener('keydown', edKey, true); ui().ed.style.display = 'none'; ui().ed.textContent = ''; const pf = ED.prevFocus; ED = null; try { if (pf && pf.focus) pf.focus({ preventScroll: true }); } catch (e) { } }
  function edKey(e) {
    if (!ED) return;
    const inField = e.composedPath()[0] && /^(input|textarea)$/i.test(e.composedPath()[0].localName || '');
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeEditor(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopPropagation(); undo(); return; }
    if (inField || e.composedPath()[0] !== ED.cv) return;
    const stp = e.shiftKey ? 50 : 10, cv = ED.cv;
    if (/^Arrow/.test(e.key)) { e.preventDefault(); e.stopPropagation(); if (e.key === 'ArrowLeft') ED.vx -= stp; if (e.key === 'ArrowRight') ED.vx += stp; if (e.key === 'ArrowUp') ED.vy -= stp; if (e.key === 'ArrowDown') ED.vy += stp; ED.vx = Math.max(0, Math.min(cv.width, ED.vx)); ED.vy = Math.max(0, Math.min(cv.height, ED.vy)); if (ED.vdrag) onMove(ED.vx, ED.vy); render(); }
    else if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (!ED.vdrag) { ED.vdrag = true; onDown(ED.vx, ED.vy); } else { ED.vdrag = false; onUp(ED.vx, ED.vy); } render(); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (ED.tool === 'text' || ED.tool === 'step') { onDown(ED.vx, ED.vy); onUp(ED.vx, ED.vy); } render(); }
  }
  function bindCanvas() {
    const cv = ED.cv;
    const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = pt(e); ED.vx = x; ED.vy = y; onDown(x, y); });
    cv.addEventListener('pointermove', (e) => { if (!ED.cur) return; const [x, y] = pt(e); onMove(x, y); });
    cv.addEventListener('pointerup', (e) => { const [x, y] = pt(e); onUp(x, y); });
  }
  const sizeUnit = () => Math.max(2, Math.round(ED.base.width / 400));
  function onDown(x, y) {
    const t = ED.tool, c = ED.color;
    if (t === 'text' || t === 'step') {
      if (t === 'step') { ED.ann.push({ t: 'step', x, y, n: ED.step++, c, label: ED.lab.value.trim() }); ED.lab.value = ''; }
      else { const s = ED.lab.value.trim(); if (!s) { toast(T('ed_label')); return; } ED.ann.push({ t: 'text', x, y, s, c }); ED.lab.value = ''; }
      render(); return;
    }
    ED.cur = { t, x0: x, y0: y, x1: x, y1: y, c, pts: [[x, y]] }; ED.ann.push(ED.cur); render();
  }
  function onMove(x, y) { const a = ED.cur; if (!a) return; a.x1 = x; a.y1 = y; if (a.t === 'pen') a.pts.push([x, y]); render(); }
  function onUp(x, y) {
    const a = ED.cur; if (!a) return; a.x1 = x; a.y1 = y; ED.cur = null;
    const small = Math.abs(a.x1 - a.x0) < 4 && Math.abs(a.y1 - a.y0) < 4 && a.t !== 'pen';
    if (small) ED.ann.splice(ED.ann.indexOf(a), 1);
    render();
  }
  function drawAnn(ctx, a, base) {
    const u = sizeUnit(); ctx.save(); ctx.lineWidth = u * 1.6; ctx.strokeStyle = a.c; ctx.fillStyle = a.c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const x = Math.min(a.x0, a.x1), y = Math.min(a.y0, a.y1), w = Math.abs(a.x1 - a.x0), h = Math.abs(a.y1 - a.y0);
    if (a.t === 'rect') ctx.strokeRect(x, y, w, h);
    else if (a.t === 'hl') { ctx.globalAlpha = 0.35; ctx.fillStyle = a.c === '#ff1744' ? '#ffeb3b' : a.c; ctx.fillRect(x, y, w, h); }
    else if (a.t === 'redact') { ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); }
    else if (a.t === 'blur') {
      const bs = Math.max(10, u * 5), tw = Math.max(1, Math.ceil(w / bs)), th = Math.max(1, Math.ceil(h / bs)), t = doc.createElement('canvas'); t.width = tw; t.height = th;
      const tc = t.getContext('2d'); tc.imageSmoothingEnabled = true; tc.drawImage(base, x, y, w, h, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(t, 0, 0, tw, th, x, y, w, h); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, y, w, h);
    } else if (a.t === 'arrow') {
      const ang = Math.atan2(a.y1 - a.y0, a.x1 - a.x0), hd = u * 9;
      ctx.beginPath(); ctx.moveTo(a.x0, a.y0); ctx.lineTo(a.x1, a.y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x1 - hd * Math.cos(ang - 0.45), a.y1 - hd * Math.sin(ang - 0.45)); ctx.lineTo(a.x1 - hd * Math.cos(ang + 0.45), a.y1 - hd * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
    } else if (a.t === 'pen') { ctx.beginPath(); a.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
    else if (a.t === 'text') { const fs = u * 9; ctx.font = '700 ' + fs + 'px system-ui,Arial,sans-serif'; ctx.textBaseline = 'top'; const m = ctx.measureText(a.s); ctx.fillStyle = '#fff'; ctx.fillRect(a.x - 4, a.y - 2, m.width + 8, fs + 6); ctx.strokeStyle = a.c; ctx.lineWidth = 2; ctx.strokeRect(a.x - 4, a.y - 2, m.width + 8, fs + 6); ctx.fillStyle = '#000'; ctx.fillText(a.s, a.x, a.y); }
    else if (a.t === 'step') { const r = u * 7; ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 7); ctx.fill(); ctx.lineWidth = u; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '800 ' + r * 1.2 + 'px system-ui,Arial,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(a.n), a.x, a.y + 1); }
    ctx.restore();
  }
  function compose(forExport) {
    const base = ED.base, c = doc.createElement('canvas'), pad = ED.stamp ? Math.round(sizeUnit() * 16) : 0;
    c.width = base.width; c.height = base.height + pad; const ctx = c.getContext('2d');
    ctx.drawImage(base, 0, 0);
    if (ED.auto) { ctx.fillStyle = '#000'; ED.suggest.forEach((r) => ctx.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4)); }
    ED.ann.forEach((a) => drawAnn(ctx, a, base));
    if (pad) { ctx.fillStyle = '#111'; ctx.fillRect(0, base.height, c.width, pad); ctx.fillStyle = '#ffeb3b'; ctx.font = '600 ' + Math.round(pad * 0.5) + 'px system-ui,Arial,sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText(location.origin + location.pathname + '  ·  ' + new Date().toLocaleString(), 10, base.height + pad / 2); }
    if (!forExport && ED.vdrag !== undefined && doc.activeElement === host) { /* cursor virtual desenat separat în render() */ }
    return c;
  }
  function render() {
    if (!ED) return; const cv = ED.cv, c = compose(false);
    cv.width = c.width; cv.height = c.height; const ctx = cv.getContext('2d'); ctx.drawImage(c, 0, 0);
    const u = sizeUnit(); ctx.save(); ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = Math.max(1, u * 0.8); ctx.setLineDash([u * 3, u * 2]);
    ctx.beginPath(); ctx.moveTo(ED.vx - u * 6, ED.vy); ctx.lineTo(ED.vx + u * 6, ED.vy); ctx.moveTo(ED.vx, ED.vy - u * 6); ctx.lineTo(ED.vx, ED.vy + u * 6); ctx.stroke(); ctx.restore();
  }
  /* Brave „farbling”: re-codarea prin canvas poate adăuga zgomot. Dacă imaginea nu a fost modificată, exportăm PNG-ul original al browserului, octet cu octet. */
  async function exportBlob() {
    if (ED && ED.base && ED.base.localName === 'img' && !ED.ann.length && !ED.stamp && !(ED.auto && ED.suggest.length) && /^data:image\/png/.test(ED.base.src || '')) {
      try { const b = await (await fetch(ED.base.src)).blob(); if (b && b.size) return b; } catch (e) { }
    }
    return blobOf(compose(true));
  }
  function blobOf(canvas) { return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png')); }
  function download(blob, name) { const a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener'; a.style.display = 'none'; doc.documentElement.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  const vis = (e) => { try { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!e.checkVisibility || e.checkVisibility()); } catch (x) { return false; } };
  function sidecar(name) {
    const hs = Array.from(doc.querySelectorAll('h1,h2,h3')).filter((h) => vis(h) && !h.closest('#clr-cap,#clr-f')).slice(0, 25).map((h) => '- ' + h.localName.toUpperCase() + ': ' + (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140));
    const im = Array.from(doc.images).filter((i) => vis(i) && i.getAttribute('alt')).slice(0, 25).map((i) => '- ' + i.getAttribute('alt').trim().slice(0, 140));
    const steps = ED.ann.filter((a) => a.t === 'step').map((a) => a.n + '. ' + (a.label || '(fără etichetă)'));
    const notes = ED.ann.filter((a) => a.t === 'text').map((a) => '- ' + a.s);
    return ['# ' + (doc.title || location.hostname), '', '- Imagine: ' + name + '.png (' + ED.base.width + '×' + ED.base.height + ' px)', '- Pagină: ' + location.origin + location.pathname, '- Data: ' + new Date().toLocaleString(), '- Creat local cu Claritas; nimic nu a fost trimis în rețea.', '',
      '## Descriere alternativă', '', (ED.alt.value.trim() || '(necompletată)'), '', ...(steps.length ? ['## Pași adnotați', '', ...steps, ''] : []), ...(notes.length ? ['## Note din imagine', '', ...notes, ''] : []),
      ...(ED.auto && ED.suggest.length ? ['## Confidențialitate', '', ED.suggest.length + ' zone cu date personale acoperite automat (e-mail, telefon, CNP, IBAN, card, parole).', ''] : []),
      ...(hs.length ? ['## Titluri vizibile în pagină', '', ...hs, ''] : []), ...(im.length ? ['## Text alternativ al imaginilor vizibile', '', ...im, ''] : [])].join('\n');
  }
  /* ZIP „stored” (fără comprimare) pentru a livra PNG + .md într-o singură descărcare */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let v = n; for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1; t[n] = v >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function makeZip(files) {
    const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
    const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)), dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
    for (const f of files) {
      const nm = enc.encode(f.name), data = new Uint8Array(await f.blob.arrayBuffer()), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, nm, data);
      const e = new DataView(new ArrayBuffer(46)); e.setUint32(0, 0x02014b50, true); e.setUint16(4, 20, true); e.setUint16(6, 20, true); e.setUint16(8, 0x0800, true); e.setUint16(10, 0, true); e.setUint16(12, dt, true); e.setUint16(14, dd, true); e.setUint32(16, crc, true); e.setUint32(20, data.length, true); e.setUint32(24, data.length, true); e.setUint16(28, nm.length, true); e.setUint32(42, off, true);
      cd.push(e.buffer, nm); off += 30 + nm.length + data.length;
    }
    const cdLen = cd.reduce((a, b) => a + (b.byteLength || b.length), 0);
    const eo = new DataView(new ArrayBuffer(22)); eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, files.length, true); eo.setUint16(10, files.length, true); eo.setUint32(12, cdLen, true); eo.setUint32(16, off, true);
    return new Blob([...parts, ...cd, eo.buffer], { type: 'application/zip' });
  }
  async function save(withDoc) {
    if (!ED) return; const name = stampName(), blob = await exportBlob(); if (!blob) return toast(T('cap_fail'));
    if (withDoc) download(await makeZip([{ name: name + '.png', blob }, { name: name + '.md', blob: new Blob([sidecar(name)], { type: 'text/markdown;charset=utf-8' }) }]), name + '.zip');
    else download(blob, name + '.png');
    toast(T('ed_saved'));
  }
  async function copy() {
    if (!ED) return; try { const blob = await exportBlob(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast(T('ed_copied')); } catch (e) { toast(T('cap_fail')); }
  }

  /* ---------------- hub (Alt+Shift+P) ---------------- */
  function openHub() {
    const u = ui(); if (u.hub.style.display === 'flex') return closeHub(); u.hub.textContent = '';
    const h = doc.createElement('h2'); h.textContent = T('cap_title'); u.hub.appendChild(h);
    [['visible', 'cap_visible'], ['region', 'cap_region'], ['full', 'cap_full'], ['element', 'cap_element'], ['delay', 'cap_delay']].forEach(([k, l]) => u.hub.appendChild(btn(T(l), () => flow(k))));
    u.hub.appendChild(btn('⏺ ' + T('rec_open'), () => { closeHub(); try { api.runtime.sendMessage({ type: 'rec-open' }); } catch (e) { } }));
    u.hub.appendChild(btn(T('ed_close'), closeHub));
    u.hub.style.display = 'flex'; u.hub.querySelector('button').focus();
    u.hub.onkeydown = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeHub(); } };
  }
  function closeHub() { if (host && U.hub) U.hub.style.display = 'none'; }

  /* ---------------- partea din pagină pentru înregistrare ---------------- */
  let rec = null, recStyle = null;
  const send = (ev) => { try { api.runtime.sendMessage({ type: 'rec-ev', ev: Object.assign({ t: Date.now(), url: location.origin + location.pathname }, ev) }); } catch (e) { } };
  const nameOf = (el) => { if (!el || !el.closest) return ''; const b = el.closest('a,button,input,select,textarea,[role=button],[role=link],[role=tab],[role=menuitem],label') || el; const t = (b.getAttribute('aria-label') || b.getAttribute('title') || b.value && b.type !== 'password' && b.type !== 'text' && b.value || b.textContent || b.placeholder || '').trim().replace(/\s+/g, ' '); return (b.localName + (t ? ' „' + t.slice(0, 50) + '”' : '')); };
  let keysT = null;
  function showKey(txt) { const u = ui(); u.keys.textContent = txt; u.keys.style.display = 'block'; clearTimeout(keysT); keysT = setTimeout(() => { u.keys.style.display = 'none'; }, 1400); }
  const combo = (e) => { const p = []; if (e.ctrlKey) p.push('Ctrl'); if (e.altKey) p.push('Alt'); if (e.shiftKey && (e.key.length > 1 || e.ctrlKey || e.altKey)) p.push('Shift'); if (e.metaKey) p.push('Meta'); if (!/^(Control|Alt|Shift|Meta)$/.test(e.key)) p.push(e.key === ' ' ? 'Space' : (e.key.length === 1 ? e.key.toUpperCase() : e.key)); return p.join('+'); };
  const onRecClick = (e) => {
    if (!rec || !rec.fx) { if (rec) send({ k: 'click', text: nameOf(e.target) }); return; }
    const u = ui(), r = doc.createElement('div'); r.className = 'ring'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; u.keys.after(r); setTimeout(() => r.remove(), 800);
    send({ k: 'click', text: nameOf(e.target) });
  };
  const onRecKey = (e) => {
    if (!rec) return;
    if (e.altKey && e.shiftKey && e.code === 'KeyM') { e.preventDefault(); send({ k: 'mark', text: '' }); showKey('★ ' + T('rec_mark_ev')); return; }
    const t = e.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.localName || ''));
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) return;   // niciodată caractere simple (parole în câmpuri personalizate, text tastat)
    if (/^(Control|Alt|Shift|Meta)$/.test(e.key)) return;
    const c = combo(e); send({ k: 'key', text: c }); if (rec.keys) showKey(c);
  };
  function recOn(s) {
    rec = { fx: s.fx !== false, keys: s.keys !== false };
    if (!recStyle) { recStyle = doc.createElement('style'); recStyle.id = 'clr-rec-style'; doc.documentElement.appendChild(recStyle); }
    recStyle.textContent = s.blur !== false ? 'input[type=password],input[autocomplete*="cc-"]{filter:blur(7px)!important}' : '';
    ui(); doc.addEventListener('pointerdown', onRecClick, true); doc.addEventListener('keydown', onRecKey, true);
    send({ k: 'nav', text: doc.title || location.hostname });
  }
  function recOff() { rec = null; if (recStyle) { recStyle.remove(); recStyle = null; } doc.removeEventListener('pointerdown', onRecClick, true); doc.removeEventListener('keydown', onRecKey, true); if (host && U.keys) U.keys.style.display = 'none'; }
  const recSync = (v, initial) => { if (v && v.on && !(initial && v.beat && Date.now() - v.beat > 30000)) { if (rec) { rec.fx = v.fx !== false; rec.keys = v.keys !== false; } else recOn(v); } else if (rec) recOff(); };
  if (IS_TOP) try { api.storage.local.get('recSession').then((r) => recSync(r && r.recSession, true), () => { }); } catch (e) { }
  if (IS_TOP) try { api.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.recSession) recSync(ch.recSession.newValue); }); } catch (e) { }

  /* ---------------- mesaje și scurtături ---------------- */
  /* Cadre (iframe) din alte origini: fiecare cadru își acoperă singur datele personale cât timp pagina de sus face captura. */
  let maskEl = null;
  function maskFrame(on) {
    if (maskEl) { maskEl.remove(); maskEl = null; }
    if (!on) return;
    const rects = findSensitive(null); if (!rects.length) return;
    maskEl = doc.createElement('claritas-mask');
    [['display', 'block'], ['position', 'absolute'], ['left', '0'], ['top', '0'], ['width', '0'], ['height', '0'], ['z-index', '2147483647'], ['visibility', 'visible'], ['opacity', '1'], ['forced-color-adjust', 'none']].forEach(([k, v]) => maskEl.style.setProperty(k, v, 'important'));
    rects.forEach((r) => { const d = doc.createElement('div'); d.style.cssText = 'forced-color-adjust:none;position:absolute;background:#000;left:' + Math.floor(r.x) + 'px;top:' + Math.floor(r.y) + 'px;width:' + Math.ceil(r.w) + 'px;height:' + Math.ceil(r.h) + 'px'; maskEl.appendChild(d); });
    doc.documentElement.appendChild(maskEl);
    setTimeout(() => { if (maskEl) { maskEl.remove(); maskEl = null; } }, 150000);   // plasă de siguranță (pagini foarte înalte)
  }
  api.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'cap-mask' && !IS_TOP) { try { maskFrame(!!msg.on); } catch (e) { } return; }
    if (!IS_TOP || msg.type !== 'cap') return;
    if (msg.cmd === 'hub') openHub(); else setTimeout(() => flow(msg.cmd), 250);
  });
  if (!IS_TOP) return;
  doc.addEventListener('keydown', (e) => { if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyP' && !ED) { e.preventDefault(); openHub(); } }, true);
  CLR.cap = { flow, hub: openHub };
})();
