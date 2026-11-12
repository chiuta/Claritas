/* Claritas v1.8 — module opționale (inerte până nu sunt activate din popup → „Module opționale (v1.8)”):
   modInspect   inspector de contrast interactiv (culori reale, raport, AA/AAA, sugestie de corecție) – Alt+Shift+I
   modOrder     hartă a ordinii de tab + nume accesibile și probleme – Alt+Shift+T
   modReadList  listă de citit cu note, în stocarea locală; export/import – Alt+Shift+B
   modSiteCss   reguli CSS proprii pe site (stocate local, fără @import / url externe) – Alt+Shift+U
   modMath      descrieri vorbite pentru formule MathML (aria-label) + citire cu voce – Alt+Shift+Q
   modAI        IA locală din browser (Prompt API; clasa B: pe dispozitiv, doar cu acordul tău) – Alt+Shift+A
   Totul rulează local. Funcțiile pure (accName, roleOf, contrastInfo, mathSpeech, cleanCss, tabOrder) sunt exportate în CLR.m3. */
(function (GCLR) {
  'use strict';
  const CLR = GCLR || (window.CLR = window.CLR || {});
  const api = typeof browser !== 'undefined' ? browser : chrome;
  let S = null, active = false, ctx = null, doc = document;
  const T = (k, v) => CLR.t(S && S.lang, k, v);
  const txt = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim();
  const vis = (e) => { try { return e.checkVisibility ? e.checkVisibility({ visibilityProperty: true }) : e.getClientRects().length > 0; } catch (x) { return false; } };
  const ours = (e) => !!(e && e.closest && e.closest('[id^="clr-"]'));

  /* ================= nume accesibil + rol (aproximare a algoritmului accname) ================= */
  const IMPLICIT = { A: 'link', BUTTON: 'button', SELECT: 'combobox', TEXTAREA: 'textbox', SUMMARY: 'button', IMG: 'img', NAV: 'navigation', MAIN: 'main', H1: 'heading', H2: 'heading', H3: 'heading', H4: 'heading', H5: 'heading', H6: 'heading', DIALOG: 'dialog', TABLE: 'table', UL: 'list', OL: 'list', LI: 'listitem' };
  const INPUT_ROLE = { checkbox: 'checkbox', radio: 'radio', range: 'slider', number: 'spinbutton', search: 'searchbox', button: 'button', submit: 'button', reset: 'button', image: 'button', email: 'textbox', tel: 'textbox', url: 'textbox', text: 'textbox', password: 'textbox' };
  function roleOf(e) {
    const r = (e.getAttribute('role') || '').trim().split(/\s+/)[0];
    if (r) return r;
    if (e.localName === 'input') return INPUT_ROLE[(e.getAttribute('type') || 'text').toLowerCase()] || 'textbox';
    if (e.localName === 'a' && !e.hasAttribute('href')) return 'generic';
    return IMPLICIT[e.tagName] || 'generic';
  }
  function byIds(e, attr, d) {
    const v = e.getAttribute(attr); if (!v) return '';
    return v.trim().split(/\s+/).map((i) => { const x = (d || doc).getElementById(i); return x ? (x.getAttribute('aria-label') || txt(x)) : ''; }).filter(Boolean).join(' ').trim();
  }
  function accName(e, d) {
    let n = byIds(e, 'aria-labelledby', d); if (n) return n;
    n = (e.getAttribute('aria-label') || '').trim(); if (n) return n;
    const tag = e.localName, type = (e.getAttribute('type') || '').toLowerCase();
    if (tag === 'img' || (tag === 'input' && type === 'image')) { n = (e.getAttribute('alt') || '').trim(); if (n) return n; }
    if (e.labels && e.labels.length) { n = Array.from(e.labels).map(txt).join(' ').trim(); if (n) return n; }
    if (tag === 'input' && /^(button|submit|reset)$/.test(type)) { n = (e.getAttribute('value') || (type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : '')).trim(); if (n) return n; }
    if (tag === 'svg') { const t = e.querySelector('title'); if (t) return txt(t); }
    if (/^(a|button|summary|h[1-6])$/.test(tag) || /^(link|button|tab|menuitem|option|heading|checkbox|radio|switch|cell|gridcell|treeitem)$/.test(e.getAttribute('role') || '')) {
      n = txt(e); if (!n) { const im = e.querySelector('img[alt]:not([alt=""]),svg[aria-label],[aria-label]'); if (im) n = (im.getAttribute('alt') || im.getAttribute('aria-label') || '').trim(); }
      if (n) return n;
    }
    n = (e.getAttribute('title') || '').trim(); if (n) return n;
    if (tag === 'input' || tag === 'textarea') n = (e.getAttribute('placeholder') || '').trim();
    return n;
  }
  const FOCUSABLE = 'a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,iframe,[tabindex],[contenteditable=""],[contenteditable=true]';
  function tabOrder(d) {
    d = d || doc; const all = [];
    d.querySelectorAll(FOCUSABLE).forEach((e) => {
      if (ours(e) || e.disabled || e.closest('[inert]')) return;
      const ti = e.hasAttribute('tabindex') ? parseInt(e.getAttribute('tabindex'), 10) : NaN;
      if (ti < 0) return; if (!vis(e)) return;
      all.push({ el: e, ti: isNaN(ti) ? 0 : ti, i: all.length });
    });
    all.sort((a, b) => (a.ti > 0 && b.ti > 0 ? a.ti - b.ti || a.i - b.i : a.ti > 0 ? -1 : b.ti > 0 ? 1 : a.i - b.i));
    return all;
  }

  /* ================= contrast ================= */
  function effBg(e) {
    const layers = []; let n = e, img = false;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n), c = CLR.parseColor(cs.backgroundColor);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') img = true;
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      n = n.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = CLR.over(layers[i], base);
    return { c: base, img };
  }
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  function contrastInfo(e) {
    const cs = getComputedStyle(e), fg0 = CLR.parseColor(cs.color); if (!fg0) return null;
    const bgI = effBg(e), bg = bgI.c, fg = CLR.over(fg0, bg), r = CLR.ratio(fg, bg);
    const px = parseFloat(cs.fontSize) || 16, bold = (parseInt(cs.fontWeight, 10) || 400) >= 700, large = px >= 24 || (bold && px >= 18.66);
    const aa = large ? 3 : 4.5, aaa = large ? 4.5 : 7;
    let sug = null; if (r < aa) { try { const f = CLR.fixColor(fg, bg, aa); if (f) sug = hex(f); } catch (x) { } }
    return { fg: hex(fg), bg: hex(bg), ratio: Math.round(r * 100) / 100, large, aa: r >= aa, aaa: r >= aaa, need: aa, image: bgI.img, size: Math.round(px * 10) / 10, suggest: sug };
  }

  /* ================= formule matematice → text vorbit ================= */
  const MO = {
    en: { '+': 'plus', '-': 'minus', '−': 'minus', '×': 'times', '·': 'times', '*': 'times', '÷': 'divided by', '/': 'divided by', '=': 'equals', '≠': 'is not equal to', '≈': 'is approximately', '<': 'is less than', '>': 'is greater than', '≤': 'is less than or equal to', '≥': 'is greater than or equal to', '±': 'plus or minus', '∞': 'infinity', '∑': 'sum', '∏': 'product', '∫': 'integral', '∂': 'partial', '√': 'square root of', '→': 'tends to', '∈': 'belongs to', '∉': 'does not belong to', '⊂': 'is a subset of', '∪': 'union', '∩': 'intersection', '∀': 'for all', '∃': 'there exists', '°': 'degrees', '%': 'percent', '!': 'factorial', '∥': 'is parallel to', '⊥': 'is perpendicular to', 'Δ': 'delta', '∇': 'nabla', '⇒': 'implies', '⇔': 'if and only if', '(': 'open parenthesis', ')': 'close parenthesis', ',': 'comma', ':': 'colon' },
    ro: { '+': 'plus', '-': 'minus', '−': 'minus', '×': 'ori', '·': 'ori', '*': 'ori', '÷': 'împărțit la', '/': 'împărțit la', '=': 'egal', '≠': 'diferit de', '≈': 'aproximativ egal cu', '<': 'mai mic decât', '>': 'mai mare decât', '≤': 'mai mic sau egal cu', '≥': 'mai mare sau egal cu', '±': 'plus sau minus', '∞': 'infinit', '∑': 'suma', '∏': 'produsul', '∫': 'integrala', '∂': 'derivata parțială', '√': 'rădăcina pătrată din', '→': 'tinde la', '∈': 'aparține lui', '∉': 'nu aparține lui', '⊂': 'inclus în', '∪': 'reunit cu', '∩': 'intersectat cu', '∀': 'oricare ar fi', '∃': 'există', '°': 'grade', '%': 'la sută', '!': 'factorial', '∥': 'paralel cu', '⊥': 'perpendicular pe', 'Δ': 'delta', '∇': 'nabla', '⇒': 'implică', '⇔': 'dacă și numai dacă', '(': 'deschide paranteză', ')': 'închide paranteză', ',': 'virgulă', ':': 'două puncte' }
  };
  const GREEK = { 'α': ['alpha', 'alfa'], 'β': ['beta', 'beta'], 'γ': ['gamma', 'gama'], 'δ': ['delta', 'delta'], 'ε': ['epsilon', 'epsilon'], 'θ': ['theta', 'theta'], 'λ': ['lambda', 'lambda'], 'μ': ['mu', 'mi'], 'π': ['pi', 'pi'], 'ρ': ['rho', 'ro'], 'σ': ['sigma', 'sigma'], 'τ': ['tau', 'tau'], 'φ': ['phi', 'fi'], 'ω': ['omega', 'omega'], 'Ω': ['omega', 'omega'], 'Σ': ['sigma', 'sigma'], 'Π': ['pi', 'pi'] };
  function mathSpeech(m, lang) {
    const L = String(lang || 'en').slice(0, 2) === 'ro' ? 'ro' : 'en', ro = L === 'ro', ops = MO[L];
    const W = { frac: ro ? ['fracția', 'supra', 'sfârșit de fracție'] : ['the fraction', 'over', 'end fraction'], sq: ro ? 'la pătrat' : 'squared', cu: ro ? 'la cub' : 'cubed', pw: ro ? 'la puterea' : 'to the power', sub: ro ? 'indice' : 'sub', root: ro ? 'rădăcina pătrată din' : 'the square root of', rootN: ro ? 'rădăcina de ordin' : 'the root of order', of: ro ? 'din' : 'of', from: ro ? 'de la' : 'from', to: ro ? 'la' : 'to', end: ro ? 'sfârșit' : 'end' };
    const kids = (n) => Array.from(n.children);
    function go(n) {
      if (!n || n.nodeType !== 1) return '';
      const t = n.localName, c = kids(n), j = (a) => a.map(go).filter(Boolean).join(' ');
      switch (t) {
        case 'mi': case 'mn': { const s = txt(n); return GREEK[s] ? GREEK[s][ro ? 1 : 0] : s; }
        case 'mtext': return txt(n);
        case 'mo': { const s = txt(n); return ops[s] || s; }
        case 'mfrac': return W.frac[0] + ' ' + go(c[0]) + ' ' + W.frac[1] + ' ' + go(c[1]) + ' ' + W.frac[2];
        case 'msup': { const p = txt(c[1] || n).trim(); const b = go(c[0]); return p === '2' ? b + ' ' + W.sq : p === '3' ? b + ' ' + W.cu : b + ' ' + W.pw + ' ' + go(c[1]); }
        case 'msub': return go(c[0]) + ' ' + W.sub + ' ' + go(c[1]);
        case 'msubsup': return go(c[0]) + ' ' + W.sub + ' ' + go(c[1]) + ' ' + W.pw + ' ' + go(c[2]);
        case 'msqrt': return W.root + ' ' + j(c) + ' ' + W.end;
        case 'mroot': return W.rootN + ' ' + go(c[1]) + ' ' + W.of + ' ' + go(c[0]) + ' ' + W.end;
        case 'munderover': case 'msubsup_': return go(c[0]) + ' ' + W.from + ' ' + go(c[1]) + ' ' + W.to + ' ' + go(c[2]);
        case 'munder': return go(c[0]) + ' ' + W.sub + ' ' + go(c[1]);
        case 'mover': return go(c[0]) + ' ' + (txt(c[1] || n) === '¯' ? (ro ? 'cu bară' : 'bar') : go(c[1]));
        case 'mfenced': return ops['('] + ' ' + j(c) + ' ' + ops[')'];
        case 'mtable': return kids(n).map((r, i) => (ro ? 'rândul ' : 'row ') + (i + 1) + ': ' + kids(r).map(go).join(', ')).join('; ');
        case 'semantics': return go(c[0]);
        case 'annotation': case 'annotation-xml': return '';
        default: return j(c) || (c.length ? '' : txt(n));
      }
    }
    return go(m).replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
  }

  /* ================= CSS propriu pe site ================= */
  /* Curăță CSS-ul scris/importat de utilizator: fără @import, fără orice funcție de imagine/URL (url, image-set, src, cross-fade, element, paint, image),
     fără escape-uri CSS în valori (\75rl( = url( ar ocoli filtrul). Selectorii păstrează escape-urile (ex. .md\:flex). */
  const FN = '(?:-webkit-|-moz-)?(?:url|image-set|src|cross-fade|element|paint|image)';
  const unesc = (v) => v.replace(/\\([0-9a-f]{1,6})\s?|\\([^\n])/gi, (m, h, c) => h ? String.fromCodePoint(Math.min(parseInt(h, 16) || 0xfffd, 0x10ffff)) : c);
  function cleanCss(css) {
    let s = String(css || '').slice(0, 60000);
    s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;?/gi, '').replace(/<\/?style[^>]*>/gi, '');
    s = s.replace(/\{[^{}]*\}/g, (blk) => unesc(blk));
    s = s.replace(/expression\s*\(/gi, '(').replace(/javascript\s*:/gi, '').replace(/behavior\s*:[^;}]*/gi, '').replace(/-moz-binding\s*:[^;}]*/gi, '');
    for (let i = 0; i < 4; i++) s = s.replace(new RegExp(FN + '\\s*\\((?:[^()]|\\([^()]*\\))*\\)', 'gi'), 'none');
    return s.trim();
  }
  const hostKey = () => (doc.location && doc.location.hostname || '').replace(/^www\./, '');
  const TPL = {
    nosticky: '/* bare lipite */\nheader, nav, footer, [style*="position: fixed"] { position: static !important; }',
    underline: '/* linkuri subliniate */\na { text-decoration: underline !important; }',
    lh: '/* spațiere */\nbody, p, li { line-height: 1.7 !important; letter-spacing: 0.02em !important; }',
    hidebanner: '/* ascunde bannere */\n[id*="cookie" i], [class*="cookie" i], [class*="popup" i] { display: none !important; }'
  };
  let cssEl = null, cssAll = {};
  function pickCss(all) { const h = hostKey(); return all && (all[h] != null ? all[h] : all['*.' + h.split('.').slice(-2).join('.')]) || ''; }
  function applyCss() {
    const on = active && S && S.modSiteCss, css = on ? cleanCss(pickCss(cssAll)) : '';
    if (!css) { if (cssEl) { cssEl.remove(); cssEl = null; } return; }
    if (!cssEl || !cssEl.isConnected) { cssEl = doc.createElement('style'); cssEl.id = 'clr-m3-css'; (doc.head || doc.documentElement).appendChild(cssEl); }
    if (cssEl.textContent !== css) cssEl.textContent = css;
  }
  async function loadCss() { try { const r = await api.storage.local.get('siteCss'); cssAll = r && r.siteCss && typeof r.siteCss === 'object' ? r.siteCss : {}; } catch (e) { cssAll = {}; } applyCss(); }
  try { api.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.siteCss) { cssAll = ch.siteCss.newValue || {}; applyCss(); } if (area === 'local' && ch.readList && panelKind === 'rl') renderRL(); }); } catch (e) { }

  /* ================= interfață (shadow DOM propriu) ================= */
  let host = null, root = null, live = null, panel = null, panelKind = '', prevFocus = null;
  const CSS = `:host{all:initial}*{box-sizing:border-box;font-family:system-ui,sans-serif}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .pnl{position:fixed;inset:5vh 5vw;max-width:860px;margin:0 auto;background:#fff;color:#111;border:3px solid #111;border-radius:12px;padding:14px;z-index:2147483647;overflow:auto;font-size:16px;line-height:1.5;box-shadow:0 8px 40px rgba(0,0,0,.5)}
  .pnl h2{margin:0 0 8px;font-size:20px}.pnl h3{margin:12px 0 4px;font-size:16px}
  .pnl button,.pnl input,.pnl textarea,.pnl select{font-size:16px;padding:6px 10px;border:2px solid #111;border-radius:8px;background:#fff;color:#111}
  .pnl button{cursor:pointer}.pnl textarea{width:100%;min-height:7em;font-family:ui-monospace,monospace}
  .pnl button:focus-visible,.pnl input:focus-visible,.pnl textarea:focus-visible,.pnl a:focus-visible{outline:4px solid #ffbf00;outline-offset:2px}
  .pnl ul{list-style:none;padding:0;margin:6px 0}.pnl li{margin:4px 0;padding:6px;border:1px solid #888;border-radius:8px}
  .pnl .x{float:right}.pnl .row{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0}.pnl .err{color:#a00000;font-weight:700}.pnl .warn{color:#7a4b00;font-weight:700}.pnl .ok{color:#006100;font-weight:700}
  .pnl small{display:block;color:#333}.pnl code{background:#eee;padding:0 4px;border-radius:4px}
  .tip{position:fixed;z-index:2147483646;background:#111;color:#fff;border:2px solid #fff;border-radius:8px;padding:6px 10px;font-size:14px;line-height:1.35;max-width:300px;pointer-events:none}
  .tip.pin{pointer-events:auto}.tip b{display:inline-block;min-width:1.4em}.sw{display:inline-block;width:14px;height:14px;border:1px solid #fff;vertical-align:-2px;margin-right:4px}
  .bdg{position:fixed;z-index:2147483644;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:#0b3d91;color:#fff;border:2px solid #fff;font-size:12px;font-weight:700;line-height:18px;text-align:center;pointer-events:none;box-shadow:0 0 0 1px #000}
  .bdg.err{background:#a00000}.bdg.warn{background:#7a4b00}
  .hl{position:fixed;border:3px solid #ffbf00;box-shadow:0 0 0 2px #000;border-radius:4px;pointer-events:none;z-index:2147483643}`;
  function ensureUI() {
    if (host && host.isConnected) return;
    host = doc.createElement('div'); host.id = 'clr-m3'; host.style.cssText = 'all:initial';
    root = host.attachShadow({ mode: 'closed' /*@SH*/ });
    const st = doc.createElement('style'); st.textContent = CSS; root.appendChild(st);
    live = doc.createElement('div'); live.className = 'sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.appendChild(live);
    doc.documentElement.appendChild(host);
  }
  function say(m) { ensureUI(); live.textContent = ''; setTimeout(() => { live.textContent = m; }, 30); }
  function el(tag, cls, text, attrs) { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function btn(label, fn, cls) { const b = el('button', cls || '', label, { type: 'button' }); b.addEventListener('click', fn); return b; }
  function closePanel() { if (panel) { panel.remove(); panel = null; panelKind = ''; if (prevFocus && prevFocus.isConnected) { try { prevFocus.focus(); } catch (e) { } } prevFocus = null; } }
  function openPanel(kind, title) {
    ensureUI(); const same = panel && panelKind === kind; closePanel(); if (same) return null;
    prevFocus = doc.activeElement; panelKind = kind;
    panel = el('div', 'pnl', null, { role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1' });
    const x = btn(T('m3_close'), closePanel, 'x'); panel.appendChild(x); panel.appendChild(el('h2', '', title));
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closePanel(); }
      else if (e.key === 'Tab') { const f = Array.from(panel.querySelectorAll('button,input,textarea,select,a[href]')).filter((n) => !n.disabled); if (!f.length) return; const a = root.activeElement, first = f[0], last = f[f.length - 1]; if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); } }
      e.stopPropagation();
    });
    ['keyup', 'keypress'].forEach((ev) => panel.addEventListener(ev, (e) => e.stopPropagation()));
    root.appendChild(panel); setTimeout(() => x.focus(), 30); return panel;
  }
  function download(name, mime, text) { const u = URL.createObjectURL(new Blob([text], { type: mime })); const a = doc.createElement('a'); a.href = u; a.download = name; doc.documentElement.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }

  /* ---------- 1. inspector de contrast ---------- */
  let insp = false, tip = null, pinned = false, inspEl = null, inspRaf = 0;
  function tipFill(e, info) {
    tip.textContent = '';
    if (!info) { tip.textContent = T('m3_ci_none'); return; }
    const l1 = el('div'); const s1 = el('span', 'sw'); s1.style.background = info.fg; const s2 = el('span', 'sw'); s2.style.background = info.bg;
    l1.append(s1, info.fg + '  ', s2, info.bg); tip.appendChild(l1);
    tip.appendChild(el('div', '', info.ratio + ' : 1  ·  ' + (info.large ? T('m3_ci_large') : T('m3_ci_normal')) + ' ' + info.size + 'px'));
    tip.appendChild(el('div', '', 'AA ' + (info.aa ? '✓' : '✗') + '   AAA ' + (info.aaa ? '✓' : '✗')));
    if (info.image) tip.appendChild(el('div', '', T('m3_ci_image')));
    if (info.suggest) tip.appendChild(el('div', '', T('m3_ci_sug', { c: info.suggest, r: info.need })));
    if (pinned) tip.appendChild(el('div', '', T('m3_ci_pinned')));
  }
  function tipPlace(e, x, y) {
    tip.style.left = Math.max(4, Math.min(innerWidth - 310, x + 14)) + 'px'; tip.style.top = Math.max(4, Math.min(innerHeight - 140, y + 16)) + 'px';
  }
  const inspMove = (ev) => {
    if (pinned || !ev.target || ours(ev.target) || ev.target === doc.documentElement) return;
    cancelAnimationFrame(inspRaf); inspRaf = requestAnimationFrame(() => {
      inspEl = ev.target; const info = contrastInfo(inspEl); tipFill(inspEl, info); tipPlace(inspEl, ev.clientX, ev.clientY);
      if (info) live.textContent = info.ratio + ' : 1, AA ' + (info.aa ? 'ok' : 'fail');
    });
  };
  const inspClick = (ev) => { if (!insp || ours(ev.target)) return; ev.preventDefault(); ev.stopPropagation(); pinned = !pinned; inspEl = ev.target; tipFill(inspEl, contrastInfo(inspEl)); tipPlace(inspEl, ev.clientX, ev.clientY); tip.classList.toggle('pin', pinned); say(pinned ? T('m3_ci_pinned') : ''); };
  const inspFocus = (ev) => { if (!insp || pinned || !ev.target || ours(ev.target) || ev.target === doc.body) return; const r = ev.target.getBoundingClientRect(); inspEl = ev.target; const info = contrastInfo(inspEl); tipFill(inspEl, info); tipPlace(inspEl, r.left, r.bottom); if (info) say(info.ratio + ' : 1, AA ' + (info.aa ? 'ok' : 'fail')); };
  function inspToggle(force) {
    const on = force != null ? force : !insp;
    if (on && !insp) { ensureUI(); insp = true; pinned = false; tip = el('div', 'tip'); tip.textContent = T('m3_ci_hint'); tip.style.left = '12px'; tip.style.top = '12px'; root.appendChild(tip); doc.addEventListener('mousemove', inspMove, true); doc.addEventListener('click', inspClick, true); doc.addEventListener('focusin', inspFocus, true); say(T('m3_ci_on')); return true; }
    if (!on && insp) { insp = false; pinned = false; doc.removeEventListener('mousemove', inspMove, true); doc.removeEventListener('click', inspClick, true); doc.removeEventListener('focusin', inspFocus, true); if (tip) { tip.remove(); tip = null; } say(T('m3_ci_off')); }
    return insp;
  }

  /* ---------- 2. ordine de tab + nume ---------- */
  let ordLayer = null, ordItems = [], ordRaf = 0;
  function ordIssues(it, prev) {
    const out = [], e = it.el, nm = accName(e), role = roleOf(e);
    if (!nm && role !== 'generic' && !/^(iframe)$/.test(e.localName)) out.push(['err', T('m3_or_noname')]);
    if (it.ti > 0) out.push(['warn', T('m3_or_postab')]);
    if (e.closest('[aria-hidden="true"]')) out.push(['err', T('m3_or_hidden')]);
    if (prev) { const a = prev.el.getBoundingClientRect(), b = e.getBoundingClientRect(); if (b.bottom < a.top - 160 && b.width > 0) out.push(['warn', T('m3_or_jump')]); }
    if (role === 'generic' && e.hasAttribute('tabindex')) out.push(['warn', T('m3_or_generic')]);
    return out;
  }
  function ordPlace() {
    if (!ordLayer) return; Array.from(ordLayer.children).forEach((b, i) => { const it = ordItems[i]; if (!it) return; const r = it.el.getBoundingClientRect(); const v = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0; b.style.display = v ? 'block' : 'none'; b.style.left = Math.max(0, r.left - 6) + 'px'; b.style.top = Math.max(0, r.top - 8) + 'px'; });
  }
  const ordSched = () => { cancelAnimationFrame(ordRaf); ordRaf = requestAnimationFrame(ordPlace); };
  function ordOff() { if (ordLayer) { ordLayer.remove(); ordLayer = null; removeEventListener('scroll', ordSched, true); removeEventListener('resize', ordSched); } ordItems = []; }
  function ordToggle() {
    if (ordLayer || (panel && panelKind === 'or')) { ordOff(); if (panelKind === 'or') closePanel(); say(T('m3_or_off')); return false; }
    const list = tabOrder(); ordItems = list.slice(0, 400); ensureUI();
    ordLayer = el('div'); let prev = null, nErr = 0, nWarn = 0; const rows = [];
    ordItems.forEach((it, i) => {
      const iss = ordIssues(it, prev); prev = it; const sev = iss.some((x) => x[0] === 'err') ? 'err' : iss.length ? 'warn' : '';
      if (sev === 'err') nErr++; else if (sev) nWarn++;
      ordLayer.appendChild(el('div', 'bdg ' + sev, String(i + 1))); rows.push({ it, iss, i });
    });
    root.appendChild(ordLayer); addEventListener('scroll', ordSched, true); addEventListener('resize', ordSched); ordPlace();
    const p = openPanel('or', T('m3_or_title')); if (!p) return false;
    p.appendChild(el('p', '', T('m3_or_sum', { n: ordItems.length, e: nErr, w: nWarn })));
    const ul = el('ul'); rows.forEach((r) => {
      const li = el('li'); const nm = accName(r.it.el) || '—';
      li.appendChild(el('b', '', (r.i + 1) + '. ' + roleOf(r.it.el) + ': '));
      li.appendChild(doc.createTextNode(nm.slice(0, 120)));
      r.iss.forEach((x) => li.appendChild(el('small', x[0], x[1])));
      const go = btn(T('m3_or_go'), () => { closePanel(); try { r.it.el.scrollIntoView({ block: 'center' }); r.it.el.focus({ preventScroll: true }); } catch (e) { } }, ''); li.appendChild(go);
      ul.appendChild(li);
    });
    p.appendChild(ul); return true;
  }

  /* ---------- 3. listă de citit cu note ---------- */
  const RL_MAX = 300;
  async function rlGet() { try { const r = await api.storage.local.get('readList'); return Array.isArray(r && r.readList) ? r.readList : []; } catch (e) { return []; } }
  async function rlSet(a) { await api.storage.local.set({ readList: a.slice(0, RL_MAX) }); }
  const rlClean = (x) => x && typeof x.url === 'string' && /^https?:|^file:/i.test(x.url) ? { id: String(x.id || Date.now() + Math.random()).slice(0, 40), url: x.url.slice(0, 2000), title: String(x.title || '').slice(0, 300), note: String(x.note || '').slice(0, 4000), sel: String(x.sel || '').slice(0, 2000), ts: +x.ts || Date.now(), read: !!x.read } : null;
  function rlMarkdown(l, title) {
    return '# ' + title + '\n\n' + l.map((x) => '- [' + (x.read ? 'x' : ' ') + '] [' + (x.title || x.url).replace(/[\[\]]/g, '') + '](' + x.url + ')' + (x.note ? '\n  - ' + x.note.replace(/\n/g, '\n    ') : '') + (x.sel ? '\n  - > ' + x.sel.replace(/\n/g, ' ') : '')).join('\n') + '\n';
  }
  let rlBox = null;
  async function renderRL() {
    if (!panel || panelKind !== 'rl' || !rlBox) return; const list = await rlGet(); rlBox.textContent = '';
    if (!list.length) rlBox.appendChild(el('p', '', T('m3_rl_empty')));
    const ul = el('ul');
    list.forEach((it) => {
      const li = el('li'); const a = el('a', '', it.title || it.url, { href: it.url, target: '_blank', rel: 'noopener noreferrer' }); a.style.color = '#0b3d91'; li.appendChild(a);
      li.appendChild(el('small', '', new Date(it.ts).toLocaleDateString(CLR.langCode(S && S.lang)) + (it.read ? ' · ' + T('m3_rl_isread') : '')));
      if (it.sel) li.appendChild(el('small', '', '„' + it.sel.slice(0, 240) + '”'));
      const ta = el('textarea', '', null, { 'aria-label': T('m3_rl_note') }); ta.style.minHeight = '3.5em'; ta.value = it.note || ''; li.appendChild(ta);
      const row = el('div', 'row');
      row.appendChild(btn(T('m3_rl_save'), async () => { const l = await rlGet(); const i = l.findIndex((x) => x.id === it.id); if (i >= 0) { l[i].note = ta.value.slice(0, 4000); await rlSet(l); say(T('m3_rl_saved')); } }));
      row.appendChild(btn(it.read ? T('m3_rl_unread') : T('m3_rl_markread'), async () => { const l = await rlGet(); const i = l.findIndex((x) => x.id === it.id); if (i >= 0) { l[i].read = !l[i].read; await rlSet(l); renderRL(); } }));
      row.appendChild(btn(T('m3_rl_del'), async () => { await rlSet((await rlGet()).filter((x) => x.id !== it.id)); renderRL(); }));
      li.appendChild(row); ul.appendChild(li);
    });
    rlBox.appendChild(ul);
  }
  async function rlAdd(note) {
    const list = await rlGet(), url = doc.location.href.split('#')[0]; const sel = String(getSelection ? getSelection().toString() : '').trim().slice(0, 2000);
    const i = list.findIndex((x) => x.url === url);
    if (i >= 0) { if (note) list[i].note = (list[i].note ? list[i].note + '\n' : '') + note; if (sel) list[i].sel = sel; list[i].ts = Date.now(); }
    else list.unshift({ id: String(Date.now()), url, title: (doc.title || url).slice(0, 300), note: note || '', sel, ts: Date.now(), read: false });
    await rlSet(list); say(T('m3_rl_added')); renderRL();
  }
  async function openRL() {
    const p = openPanel('rl', T('m3_rl_title')); if (!p) return;
    const nt = el('textarea', '', null, { 'aria-label': T('m3_rl_note') }); nt.style.minHeight = '4em'; nt.placeholder = T('m3_rl_note');
    p.append(nt, (() => { const r = el('div', 'row'); r.appendChild(btn(T('m3_rl_add'), async () => { await rlAdd(nt.value.trim()); nt.value = ''; }));
      r.appendChild(btn(T('m3_rl_md'), async () => { download('claritas-reading-list.md', 'text/markdown', rlMarkdown(await rlGet(), T('m3_rl_title'))); }));
      r.appendChild(btn(T('m3_rl_json'), async () => download('claritas-reading-list.json', 'application/json', JSON.stringify({ claritas: 'readlist', v: 1, items: await rlGet() }, null, 2))));
      const f = el('input', '', null, { type: 'file', accept: '.json', 'aria-label': T('m3_rl_import') });
      f.addEventListener('change', async () => { const file = f.files && f.files[0]; if (!file || file.size > 2e6) return; let j; try { j = JSON.parse(await file.text()); } catch (x) { say(T('m3_rl_bad')); return; } const add = (Array.isArray(j) ? j : j && j.items || []).map(rlClean).filter(Boolean); const cur = await rlGet(); const have = new Set(cur.map((x) => x.url)); await rlSet(cur.concat(add.filter((x) => !have.has(x.url)))); say(T('m3_rl_imported', { n: add.length })); renderRL(); });
      r.appendChild(f); return r; })());
    rlBox = el('div'); p.appendChild(rlBox); renderRL();
  }

  /* ---------- 4. CSS pe site ---------- */
  async function openCss() {
    const p = openPanel('css', T('m3_css_title')); if (!p) return; const h = hostKey();
    p.appendChild(el('p', '', T('m3_css_for', { h })));
    p.appendChild(el('small', '', T('m3_css_note')));
    const ta = el('textarea', '', null, { 'aria-label': T('m3_css_title'), spellcheck: 'false' }); ta.value = (cssAll && cssAll[h]) || ''; p.appendChild(ta);
    const r = el('div', 'row');
    Object.keys(TPL).forEach((k) => r.appendChild(btn(T('m3_css_t_' + k), () => { ta.value += (ta.value ? '\n\n' : '') + TPL[k]; ta.focus(); })));
    p.appendChild(r);
    const r2 = el('div', 'row');
    r2.appendChild(btn(T('m3_css_save'), async () => { const all = Object.assign({}, cssAll), c = cleanCss(ta.value); if (c) all[h] = c; else delete all[h]; await api.storage.local.set({ siteCss: all }); cssAll = all; applyCss(); ta.value = c; say(T('m3_css_saved')); }));
    r2.appendChild(btn(T('m3_css_clear'), async () => { const all = Object.assign({}, cssAll); delete all[h]; await api.storage.local.set({ siteCss: all }); cssAll = all; ta.value = ''; applyCss(); say(T('m3_css_cleared')); }));
    r2.appendChild(btn(T('m3_css_export'), () => download('claritas-site-css.json', 'application/json', JSON.stringify({ claritas: 'sitecss', v: 1, css: cssAll }, null, 2))));
    const f = el('input', '', null, { type: 'file', accept: '.json', 'aria-label': T('m3_css_import') });
    f.addEventListener('change', async () => { const file = f.files && f.files[0]; if (!file || file.size > 2e6) return; let j; try { j = JSON.parse(await file.text()); } catch (x) { say(T('m3_rl_bad')); return; } const src = j && j.css && typeof j.css === 'object' ? j.css : j; const all = Object.assign({}, cssAll); let n = 0; for (const k of Object.keys(src || {})) { if (!/^(\*\.)?[a-z0-9.-]{1,120}$/i.test(k) || typeof src[k] !== 'string') continue; const c = cleanCss(src[k]); if (c) { all[k.toLowerCase()] = c; n++; } } await api.storage.local.set({ siteCss: all }); cssAll = all; applyCss(); say(T('m3_rl_imported', { n })); });
    r2.appendChild(f); p.appendChild(r2);
  }

  /* ---------- 5. matematică ---------- */
  let mathDone = [];
  function mathScan() {
    if (!(active && S && S.modMath)) { mathUndo(); return 0; }
    let n = 0; doc.querySelectorAll('math').forEach((m) => {
      if (ours(m) || m.hasAttribute('aria-label') || m.hasAttribute('aria-labelledby') || n > 300) return;
      const s = mathSpeech(m, S.lang); if (!s) return; m.setAttribute('aria-label', s); m.setAttribute('data-clr-math', '1'); if (!m.hasAttribute('role')) { m.setAttribute('role', 'math'); m.setAttribute('data-clr-mathrole', '1'); } mathDone.push(m); n++;
    });
    return n;
  }
  function mathUndo() { mathDone.forEach((m) => { if (m.getAttribute('data-clr-math')) { m.removeAttribute('aria-label'); m.removeAttribute('data-clr-math'); } if (m.getAttribute('data-clr-mathrole')) { m.removeAttribute('role'); m.removeAttribute('data-clr-mathrole'); } }); mathDone = []; }
  function mathSpeak() {
    const a = doc.activeElement, c = (a && a.closest && a.closest('math')) || (inspEl && inspEl.closest && inspEl.closest('math')) || doc.querySelector('math'); if (!c) { say(T('m3_ma_none')); return false; }
    const s = c.getAttribute('aria-label') || mathSpeech(c, S.lang); say(s);
    try { if (typeof speechSynthesis !== 'undefined') { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(s); u.lang = CLR.langCode(S.lang); speechSynthesis.speak(u); } } catch (e) { }
    return true;
  }

  /* ---------- 6. IA locală (clasa B: pe dispozitiv, cu acordul tău) ---------- */
  const LM = () => (typeof LanguageModel !== 'undefined' ? LanguageModel : null);
  const aiPage = () => { const m = doc.querySelector('main,article,[role=main]') || doc.body; return (m ? m.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 12000); };
  async function aiSession(opts) { const L = LM(); if (!L) return { err: 'na' }; let av; try { av = await L.availability(opts); } catch (e) { return { err: 'na' }; } if (av === 'unavailable') return { err: 'na' }; try { return { s: await L.create(opts) }; } catch (e) { return { err: 'create:' + (e && e.name) }; } }
  /* Imaginea se citește din pagină (canvas); dacă browserul o consideră din altă origine, nu o descărcăm din nou – nicio cerere de rețea. */
  async function imgBlob(img) {
    const c = doc.createElement('canvas'); c.width = Math.min(1024, img.naturalWidth || 512); c.height = Math.round(c.width * (img.naturalHeight || 1) / (img.naturalWidth || 1));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res, rej) => c.toBlob((b) => b ? res(b) : rej(new Error('tainted')), 'image/png'));
  }
  async function openAI() {
    const p = openPanel('ai', T('m3_ai_title')); if (!p) return;
    p.appendChild(el('p', '', T('m3_ai_consent')));
    const out = el('div', '', null, { 'aria-live': 'polite' });
    if (!LM()) { p.appendChild(el('p', 'warn', T('m3_ai_na'))); return; }
    const q = el('input', '', null, { type: 'text', 'aria-label': T('m3_ai_q') }); q.placeholder = T('m3_ai_q'); q.style.width = '100%';
    const row = el('div', 'row');
    let sess = null;
    row.appendChild(btn(T('m3_ai_ask'), async () => {
      const v = q.value.trim(); if (!v) return; out.textContent = T('m3_ai_work');
      if (!sess) { const r = await aiSession({ initialPrompts: [{ role: 'system', content: T('m3_ai_sys') + '\n\n' + aiPage() }] }); if (r.err) { out.textContent = T('m3_ai_err', { e: r.err }); return; } sess = r.s; }
      try { out.textContent = ''; const st = sess.promptStreaming(v); let acc = ''; for await (const ch of st) { acc += ch; out.textContent = acc; } out.appendChild(el('small', '', T('m3_ai_auto'))); } catch (e) { out.textContent = T('m3_ai_err', { e: e && e.name }); }
    }));
    row.appendChild(btn(T('m3_ai_img'), async () => {
      const imgs = Array.from(doc.images).filter((i) => !ours(i) && vis(i) && i.naturalWidth > 60 && !(i.getAttribute('alt') || '').trim()).slice(0, 8);
      if (!imgs.length) { out.textContent = T('m3_ai_noimg'); return; }
      out.textContent = T('m3_ai_work'); const r = await aiSession({ expectedInputs: [{ type: 'text' }, { type: 'image' }], initialPrompts: [{ role: 'system', content: T('m3_ai_sys_img') }] });
      if (r.err) { out.textContent = T('m3_ai_err', { e: r.err }); return; }
      out.textContent = ''; const ul = el('ul');
      for (const im of imgs) {
        const li = el('li'); try { const b = await imgBlob(im); const d = await r.s.prompt([{ role: 'user', content: [{ type: 'text', value: T('m3_ai_img_q') }, { type: 'image', value: b }] }]); li.appendChild(doc.createTextNode(d)); li.appendChild(el('small', '', T('m3_ai_auto')));
          li.appendChild(btn(T('m3_ai_apply'), () => { im.setAttribute('alt', d.slice(0, 250)); im.setAttribute('data-clr-ai', '1'); say(T('m3_ai_applied')); })); }
        catch (e) { li.appendChild(el('span', 'warn', T('m3_ai_err', { e: (e && e.name) || 'img' }))); }
        ul.appendChild(li); out.appendChild(ul);
      }
    }));
    p.append(q, row, out);
  }

  /* ---------- axe-core opțional (doar în varianta „-axe”) ---------- */
  async function axeRun() {
    if (typeof axe === 'undefined') { say(T('m3_axe_na')); return null; }
    const p = openPanel('axe', T('m3_axe_title')); if (!p) return null; p.appendChild(el('p', '', T('m3_ai_work')));
    let res; try { res = await axe.run(doc, { resultTypes: ['violations'] }); } catch (e) { p.appendChild(el('p', 'err', String(e && e.message || e))); return null; }
    p.textContent = ''; p.appendChild(btn(T('m3_close'), closePanel, 'x')); p.appendChild(el('h2', '', T('m3_axe_title')));
    p.appendChild(el('p', '', T('m3_axe_sum', { n: res.violations.length, v: axe.version || '' })));
    const ul = el('ul'); res.violations.forEach((v) => { const li = el('li'); li.appendChild(el('b', v.impact === 'critical' || v.impact === 'serious' ? 'err' : 'warn', v.impact + ' · ' + v.id + ' (' + v.nodes.length + ')')); li.appendChild(el('small', '', v.help)); const a = el('a', '', v.helpUrl, { href: v.helpUrl, target: '_blank', rel: 'noopener noreferrer' }); li.appendChild(a); ul.appendChild(li); });
    p.appendChild(ul); return res;
  }

  /* ---------- taste + cârlig către content.js ---------- */
  function onKey(e) {
    if (!active || !S || !e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return; const k = e.code; let h = true;
    if (S.modInspect && k === 'KeyI') inspToggle();
    else if (S.modOrder && k === 'KeyT') ordToggle();
    else if (S.modReadList && k === 'KeyB') openRL();
    else if (S.modSiteCss && k === 'KeyU') openCss();
    else if (S.modMath && k === 'KeyQ') mathSpeak();
    else if (S.modAI && k === 'KeyA') openAI();
    else h = false;
    if (h) { e.preventDefault(); e.stopPropagation(); }
  }
  let listening = false, mathT = [];
  function teardown() {
    closePanel(); inspToggle(false); ordOff(); mathUndo(); mathT.forEach(clearTimeout); mathT = [];
    if (cssEl) { cssEl.remove(); cssEl = null; }
    if (listening) { doc.removeEventListener('keydown', onKey, true); listening = false; }
    if (host) { host.remove(); host = null; }
  }
  const ANY = (s) => s.modInspect || s.modOrder || s.modReadList || s.modSiteCss || s.modMath || s.modAI;
  function onApply(s, act) {
    S = s; active = !!act; ctx = CLR.ctx || ctx; doc = (ctx && ctx.doc) || document;
    if (!active || !S || !ANY(S)) { teardown(); return; }
    if (S.modSiteCss) loadCss(); else applyCss();
    if (!ctx || !ctx.isTop) { if (!S.modMath) mathUndo(); else { mathScan(); } return; }
    if (!listening) { doc.addEventListener('keydown', onKey, true); listening = true; }
    if (!S.modInspect) inspToggle(false);
    if (S.modMath) { mathScan(); mathT.forEach(clearTimeout); mathT = [setTimeout(mathScan, 1500), setTimeout(mathScan, 5000)]; } else mathUndo();
  }
  function run(msg) {
    if (!active || !S) return { ok: false, inactive: true };
    const need = { inspect: 'modInspect', order: 'modOrder', readlist: 'modReadList', css: 'modSiteCss', math: 'modMath', ai: 'modAI', axe: 'modAI' };
    if (need[msg.what] && msg.what !== 'axe' && !S[need[msg.what]]) return { ok: false, off: true };
    switch (msg.what) {
      case 'inspect': return { ok: true, on: inspToggle() };
      case 'order': return { ok: true, on: ordToggle() };
      case 'readlist': openRL(); return { ok: true };
      case 'css': openCss(); return { ok: true };
      case 'math': return { ok: true, n: mathScan(), spoke: mathSpeak() };
      case 'ai': openAI(); return { ok: true, na: !LM() };
      case 'axe': axeRun(); return { ok: true, na: typeof axe === 'undefined' };
      case 'pageText': return { ok: true, text: aiPage() };
      case 'state': return { ok: true, insp, order: !!ordLayer, panel: panelKind, css: !!cssEl, math: mathDone.length };
    }
    return { ok: false };
  }
  CLR.m3 = { onApply, run, accName, roleOf, tabOrder, contrastInfo, mathSpeech, cleanCss, rlClean, rlMarkdown };
  if (CLR.ctx) onApply(CLR.ctx.S, CLR.ctx.active);
})(typeof CLR !== 'undefined' ? CLR : null);
