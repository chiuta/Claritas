/* CLARITAS — content script. Rulează local în pagină; nu trimite nimic în rețea. */
(() => {
  'use strict';
  if (window.__claritasLoaded) return;
  window.__claritasLoaded = true;

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const { THEMES, THEME_ORDER, FONTS, parseColor, hexToRgb, lum, ratio, over, rgbStr, fixColor, cbMatrix, resolve, applyPatch } = CLR;
  const isTop = window.top === window;
  const HOST = (() => {
    let h = location.hostname;
    if (window.top !== window) { try { const ao = location.ancestorOrigins; if (ao && ao.length) h = new URL(ao[ao.length - 1]).hostname || h; } catch (e) { } }
    return h || 'local';
  })();
  const alive = () => { try { return !!(api.runtime && api.runtime.id); } catch (e) { return false; } };
  const MAX_NODES = 250000;
  let nodeCount = 0;
  const doc = document;

  let G = {}, SITES = {}, S = null, active = false;
  let styleEl = null, svgEl = null, ov = null, mo = null;
  const shadowStyles = [];
  let walkers = [], scheduled = false, bgCache = new WeakMap(), origFs = new WeakMap();
  let engineSig = '', fixOn = false, tsOn = false, outlineOn = false, themeOn = false;

  /* ================= CSS ================= */
  const CURSOR = (fill) => 'url("data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'><path d='M3 2l16 9-7 2 4 8-3 1.5-4-8-6 5z' fill='${fill}' stroke='white' stroke-width='1.6' stroke-linejoin='round'/><path d='M3 2l16 9-7 2 4 8-3 1.5-4-8-6 5z' fill='none' stroke='black' stroke-width='.6' stroke-linejoin='round'/></svg>`) + '") 5 3';

  function themeColors(s) {
    if (s.theme === 'custom') {
      const c = s.custom;
      return { bg: c.bg, fg: c.fg, link: c.link, vis: c.link };
    }
    return THEMES[s.theme] || null;
  }

  function buildCSS(s, scope) {
    const docScope = scope === 'doc';
    const R = docScope ? ':root:root:root' : '';
    const NM = ':where(:not(img,video,canvas,picture,iframe,svg,svg *))';
    const ICON = ':where(:not(i,[class*="icon" i],[class*="fa-"],[class*="material" i],[class*="glyph" i],[role="img"]))';
    const out = [];
    const th = themeColors(s);

    if (th) {
      const dark = lum(hexToRgb(th.bg)) < 0.35;
      if (docScope) out.push(`:root:root:root{background:${th.bg}!important;color:${th.fg}!important;color-scheme:${dark ? 'dark' : 'light'}!important}`);
      out.push(`${R} ${NM}{background-color:${th.bg}!important;color:${th.fg}!important;border-color:${th.fg}!important;text-shadow:none!important;box-shadow:none!important}`);
      out.push(`${R} ${NM}${ICON}{background-image:none!important}`);
      out.push(`${R} a,${R} a *{color:${th.link}!important;text-decoration:underline!important}`);
      out.push(`${R} a:visited,${R} a:visited *{color:${th.vis}!important}`);
      out.push(`${R} :where(input:not([type=checkbox],[type=radio],[type=range],[type=color]),select,textarea,button){border:2px solid ${th.fg}!important}`);
      out.push(`${R} :where(input,select,textarea,button):disabled{border-style:dashed!important;opacity:1!important}`);
      out.push(`${R} ::placeholder{color:${th.fg}!important;opacity:.8!important}`);
      out.push(`${R} ::selection{background:${th.fg}!important;color:${th.bg}!important}`);
      out.push(`${R} :where(input,select,textarea,progress,meter){accent-color:${th.link}}`);
    }

    /* filtre la nivel de pagină (doar în cadrul principal) */
    if (docScope && isTop) {
      const fp = [];
      const dk = s.theme === 'dark';
      if (dk) fp.push('invert(1) hue-rotate(180deg)');
      if (s.brightness !== 100) fp.push(`brightness(${s.brightness / 100})`);
      if (s.contrast !== 100) fp.push(`contrast(${s.contrast / 100})`);
      if (s.saturate !== 100) fp.push(`saturate(${s.saturate / 100})`);
      if (s.sepia > 0) fp.push(`sepia(${s.sepia / 100})`);
      if (s.hue) fp.push(`hue-rotate(${s.hue}deg)`);
      if (s.gray) fp.push('grayscale(1)');
      if (s.sim === 'blur') fp.push('blur(2.5px)');
      if (s.sim === 'cataract') fp.push('blur(1.6px) contrast(.62) brightness(1.18) sepia(.3)');
      if (s.sim === 'glare') fp.push('brightness(1.45) contrast(.78) blur(.7px)');
      if (s.sim === 'astig') fp.push('url(#clr-ast)');
      if (s.cb && s.cb !== 'none') fp.push('url(#clr-cb)');
      if (fp.length) out.push(`:root:root:root{filter:${fp.join(' ')}!important}`);
      if (dk) out.push(`:root:root:root :where(img,video,canvas,picture,embed,object){filter:invert(1) hue-rotate(180deg)!important}`);
    }

    /* tipografie */
    const tx = [];
    if (s.lineHeight > 0) tx.push(`line-height:${s.lineHeight}!important`);
    if (s.letter > 0) tx.push(`letter-spacing:${s.letter}em!important`);
    if (s.word > 0) tx.push(`word-spacing:${s.word}em!important`);
    if (s.font !== 'default' && FONTS[s.font]) tx.push(`font-family:${FONTS[s.font]}!important`);
    if (s.alignLeft) tx.push('text-align:left!important');
    if (tx.length) out.push(`${R} :where(:not(i,svg,svg *,code,pre,kbd,[class*="icon" i],[class*="fa-"],[class*="material" i],[class*="glyph" i])){${tx.join(';')}}`);

    if (s.maxWidth > 0) out.push(`${R} :where(p,li,dd,blockquote,figcaption){max-width:${s.maxWidth}ch!important}`);
    if (s.noTransform) out.push(`${R} *{text-transform:none!important;font-variant-caps:normal!important}`);
    if (s.bigTargets) {
      out.push(`${R} :where(button,input:not([type=hidden],[type=checkbox],[type=radio]),select,summary,[role=button],[role=tab],[role=menuitem]){min-height:44px!important;min-width:44px!important;box-sizing:border-box!important}`);
      out.push(`${R} :where(input[type=checkbox],input[type=radio]){width:24px!important;height:24px!important}`);
      out.push(`${R} a[href]{padding-block:.3em!important}`);
    }
    if (s.links) out.push(`${R} a[href]{text-decoration:underline!important;text-decoration-thickness:2px!important;text-underline-offset:3px!important}`);
    if (s.focus) out.push(`${R} :focus-visible{outline:3px solid #ff9800!important;outline-offset:2px!important;box-shadow:0 0 0 6px #000!important}`);
    if (s.cursor) {
      out.push(`${R} *{cursor:${CURSOR('black')},auto!important}`);
      out.push(`${R} :where(a,button,summary,select,label,[role=button],input[type=submit],input[type=button],input[type=checkbox],input[type=radio]){cursor:${CURSOR('#ffd600')},pointer!important}`);
    }
    if (s.noMotion) out.push(`${R} *,${R} *::before,${R} *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}`);
    if (s.hideImages) out.push(`${R} :where(img,picture,video){visibility:hidden!important}`);


    /* ---- v1.4 ---- */
    if (s.noTransp) out.push(`${R} *,${R} *::before,${R} *::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}`);
    if (s.linkInfo) {
      out.push(`${R} a[target=_blank]:not([data-clr-nli])::after{content:" ↗"!important;font-size:.85em}`);
      out.push(`${R} a[download]::after{content:" ⬇"!important;font-size:.85em}`);
      out.push(`${R} a[href$=".pdf" i]::after,${R} a[href$=".docx" i]::after,${R} a[href$=".doc" i]::after,${R} a[href$=".xlsx" i]::after,${R} a[href$=".zip" i]::after{content:" (" attr(href) ")"!important;font-size:0}`);
      out.push(`${R} a[href$=".pdf" i]::before{content:"[PDF] "!important;font-size:.8em;font-weight:700}`);
      out.push(`${R} a[href$=".docx" i]::before,${R} a[href$=".doc" i]::before{content:"[DOC] "!important;font-size:.8em;font-weight:700}`);
      out.push(`${R} a[href$=".xlsx" i]::before{content:"[XLS] "!important;font-size:.8em;font-weight:700}`);
      out.push(`${R} a[href$=".zip" i]::before{content:"[ZIP] "!important;font-size:.8em;font-weight:700}`);
    }
    if (s.reflow) {
      out.push(`${R} body{min-width:0!important;width:auto!important;max-width:100vw!important}`);
      out.push(`${R} :where(div,section,main,article,header,footer,nav,aside,form,ul,ol,li,p,figure,dl,dd,dt,h1,h2,h3,h4,h5,h6,span,label,fieldset){min-width:0!important;max-width:100%!important;float:none!important}`);
      out.push(`${R} :where(img,video,canvas,iframe,embed,object,svg){max-width:100%!important;height:auto}`);
      out.push(`${R} :where(pre,code){white-space:pre-wrap!important;overflow-wrap:anywhere!important}`);
      out.push(`${R} table{display:block!important;max-width:100%!important;overflow-x:auto!important}`);
      out.push(`${R} :where(p,li,td,th,dd,dt,h1,h2,h3,h4,h5,h6,a,span,label){overflow-wrap:anywhere!important}`);
      out.push(`${R} :where(div,section,article,main,header,footer,nav,aside)[style*="width"]{width:auto!important}`);
    }
    if (s.capStyle) {
      out.push(`${R} video::cue{font-size:${s.cueSize}%!important;color:#fff!important;background-color:rgba(0,0,0,.88)!important;font-family:Verdana,Arial,sans-serif!important;text-shadow:none!important}`);
    }
    out.push(`${R} [data-clr-calm],${R} [data-clr-calm] *{display:none!important}`);
    out.push(`${R} [data-clr-unstick]{position:static!important;inset:auto!important;transform:none!important}`);
    if (s.calm) out.push(`${R}:has([data-clr-calm]),${R} body:has([data-clr-calm]){overflow:auto!important;position:static!important}`);
    out.push(`${R} [data-clr-gifbox]{display:inline-block!important;cursor:pointer;outline:2px dashed #888;outline-offset:-2px}`);
    out.push(`${R} [data-clr-altb]{display:block!important;font:700 12px/1.3 system-ui,Arial,sans-serif!important;background:#000!important;color:#ffeb3b!important;padding:2px 6px!important;margin:0!important;max-width:100%!important;border:1px solid #ffeb3b!important;text-align:left!important;letter-spacing:0!important;white-space:normal!important}`);
    out.push(`${R} [data-clr-altb="miss"]{background:#b00020!important;color:#fff!important;border-color:#fff!important}`);

    /* reguli pentru atributele puse de motorul de contrast */
    out.push(`${R} [data-clr-c]{color:var(--clr-c)!important}`);
    out.push(`${R} [data-clr-o]{opacity:1!important}`);
    out.push(`${R} [data-clr-fs]{font-size:var(--clr-fs)!important}`);
    out.push(`${R} [data-clr-b]{box-shadow:inset 0 0 0 2px var(--clr-b)!important}`);
    out.push(`${R} [data-clr-p]::placeholder{color:var(--clr-ph)!important;opacity:1!important}`);
    return out.join('\n');
  }

  function ensureStyle() {
    if (!styleEl) { styleEl = doc.createElement('style'); styleEl.id = 'clr-style'; }
    if (!styleEl.isConnected) doc.documentElement.appendChild(styleEl);
    return styleEl;
  }
  function ensureSvg() {
    const wantCb = S && S.cb && S.cb !== 'none', wantAst = S && S.sim === 'astig';
    const want = (wantCb || wantAst) && isTop;
    if (!want) { if (svgEl) { svgEl.remove(); svgEl = null; } return; }
    const m = cbMatrix(S.cb);
    if (!svgEl) {
      svgEl = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.id = 'clr-svg';
      svgEl.setAttribute('aria-hidden', 'true');
      svgEl.setAttribute('width', '0'); svgEl.setAttribute('height', '0');
      svgEl.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
      const NS = 'http://www.w3.org/2000/svg';
      const fl = doc.createElementNS(NS, 'filter');
      fl.id = 'clr-cb'; fl.setAttribute('color-interpolation-filters', 'sRGB');
      const fm = doc.createElementNS(NS, 'feColorMatrix'); fm.setAttribute('type', 'matrix');
      fl.appendChild(fm); svgEl.appendChild(fl);
      const fa = doc.createElementNS(NS, 'filter'); fa.id = 'clr-ast';
      const gb = doc.createElementNS(NS, 'feGaussianBlur'); gb.setAttribute('stdDeviation', '3 0.4');
      fa.appendChild(gb); svgEl.appendChild(fa);
    }
    svgEl.querySelector('feColorMatrix').setAttribute('values', m || '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    if (!svgEl.isConnected) doc.documentElement.appendChild(svgEl);
  }

  /* ================= motor de contrast ================= */
  const SKIP = new Set(['script', 'style', 'noscript', 'template', 'option', 'optgroup', 'head', 'title', 'meta', 'link', 'svg', 'canvas', 'textarea', 'select', 'button']);
  const CONTROL = new Set(['input', 'textarea', 'select', 'button']);
  const NOTEXT_INPUT = new Set(['checkbox', 'radio', 'range', 'color', 'file', 'hidden', 'image']);

  let cvProbe = null, cvKey = '', cvVal = null;
  function canvasBase() {
    const dark = !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    const cs = getComputedStyle(doc.documentElement).colorScheme || '';
    const key = cs + '|' + dark;
    if (cvVal && key === cvKey) return cvVal;
    let v = null;
    try {
      if (!cvProbe) { cvProbe = doc.createElement('div'); cvProbe.id = 'clr-probe'; cvProbe.style.cssText = 'display:none!important;background-color:Canvas'; }
      doc.documentElement.appendChild(cvProbe);
      const c2 = parseColor(getComputedStyle(cvProbe).backgroundColor);
      cvProbe.remove();
      if (c2 && c2.a > 0) v = { r: c2.r, g: c2.g, b: c2.b, a: 1 };
    } catch (e) { }
    if (!v) v = /dark/.test(cs) && !/light/.test(cs) ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    cvKey = key; cvVal = v; return v;
  }
  function gradientStops(img) {
    if (/url\(/.test(img) || !/gradient/.test(img)) return null;
    const m = img.match(/rgba?\([^)]+\)/g);
    const st = m ? m.map(parseColor).filter(Boolean) : [];
    return st.length ? st : null;
  }
  function bgStep(el, pb) {
    const cs = getComputedStyle(el);
    const c = parseColor(cs.backgroundColor);
    let res = pb;
    if (cs.backgroundImage !== 'none') {
      const gs = gradientStops(cs.backgroundImage);
      if (gs) { const stops = gs.map((g) => over(g, pb.c)); res = { c: stops[0], stops, img: false }; }
      else { const cc = c && c.a > 0 ? over(c, pb.c) : pb.c; res = { c: cc, stops: [cc], img: true }; }
    } else if (c && c.a > 0) {
      const stops = c.a >= 1 ? [over(c, pb.c)] : pb.stops.map((x) => over(c, x));
      res = { c: stops[0], stops, img: pb.img };
    }
    return res;
  }
  /* iterativ: DOM-uri foarte adânci nu pot depăși stiva */
  function effBg(el) {
    const chain = [];
    let n = el, base = null;
    while (n) {
      const hit = bgCache.get(n);
      if (hit) { base = hit; break; }
      chain.push(n);
      n = n.parentElement || (n.parentNode && n.parentNode.host) || null;
    }
    if (!base) { const cb = canvasBase(); base = { c: cb, stops: [cb], img: false }; }
    for (let i = chain.length - 1; i >= 0; i--) { base = bgStep(chain[i], base); bgCache.set(chain[i], base); }
    return base;
  }

  function clearFix(el) {
    if (el.hasAttribute('data-clr-c')) el.removeAttribute('data-clr-c');
    if (el.hasAttribute('data-clr-o')) el.removeAttribute('data-clr-o');
  }

  function fixText(el, control) {
    if (el.hasAttribute('data-clr-c')) el.removeAttribute('data-clr-c'); // citim culoarea originală
    if (el.hasAttribute('data-clr-o')) el.removeAttribute('data-clr-o');   // și opacitatea originală (altfel decizia alternează la fiecare trecere)
    const cs = getComputedStyle(el);
    /* tranziții CSS (color/opacity): după scoaterea atributului, valoarea calculată rămâne la cea corectată până la prima cadră → decizia ar fi greșită și corecția pierdută */
    try { if (el.getAnimations) el.getAnimations().forEach((an) => { if (an.transitionProperty === 'color' || an.transitionProperty === 'opacity') { try { an.finish(); } catch (e) {} } }); } catch (e) {}
    const fg = parseColor(cs.color);
    if (!fg) return;
    /* text transparent intenționat (gradient cu background-clip:text, straturi de editor, înlocuire cu imagine): nu se atinge */
    const fill = parseColor(cs.webkitTextFillColor);
    if (fg.a === 0 || (fill && fill.a === 0) || /text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '')) { clearFix(el); return; }
    const bi = effBg(el);
    if (bi.img) { clearFix(el); return; }
    const op = parseFloat(cs.opacity);
    const dimmed = op < 1 && op >= 0.3;
    const a = fg.a * (dimmed ? op : 1);
    const fs = parseFloat(cs.fontSize) || 16;
    const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = S.target >= 7 ? (large ? 4.5 : 7) : (large ? 3 : 4.5);
    const worst = (col, alpha) => Math.min(...bi.stops.map((st) => ratio(over({ r: col.r, g: col.g, b: col.b, a: alpha }, st), st)));
    if (worst(fg, a) >= need) { if (el.hasAttribute('data-clr-o')) el.removeAttribute('data-clr-o'); return; }
    if (dimmed) el.setAttribute('data-clr-o', '1');
    const cands = bi.stops.map((st) => fixColor({ r: fg.r, g: fg.g, b: fg.b }, st, need + 0.15));
    cands.push({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    const dist = (x) => (x.r - fg.r) ** 2 + (x.g - fg.g) ** 2 + (x.b - fg.b) ** 2;
    const ok = cands.filter((x) => worst(x, 1) >= need).sort((x, y) => dist(x) - dist(y));
    const nc = ok.length ? ok[0] : cands.sort((x, y) => worst(y, 1) - worst(x, 1))[0];
    el.style.setProperty('--clr-c', rgbStr(nc));
    el.setAttribute('data-clr-c', control ? 'f' : '1');
  }

  function scaleText(el) {
    let o = origFs.get(el);
    if (o === undefined) {
      if (el.hasAttribute('data-clr-fs')) el.removeAttribute('data-clr-fs');
      o = parseFloat(getComputedStyle(el).fontSize);
      if (!o) return;
      origFs.set(el, o);
    }
    el.style.setProperty('--clr-fs', (o * S.textScale / 100).toFixed(2) + 'px');
    el.setAttribute('data-clr-fs', '1');
  }

  function handleText(p) {
    const tag = p.localName;
    if (SKIP.has(tag) || p.id === 'clr-root') return;
    if (p.checkVisibility && !p.checkVisibility()) return;
    if (fixOn) fixText(p, false);
    if (tsOn) scaleText(p);
  }

  function handleControl(c) {
    const t = c.localName;
    const type = (c.type || '').toLowerCase();
    if (t === 'input' && NOTEXT_INPUT.has(type)) return;
    if (c.checkVisibility && !c.checkVisibility()) return;
    if (fixOn) fixText(c, true);
    if (tsOn) scaleText(c);
    if (!fixOn && !outlineOn) return;
    const bi = effBg(c);
    if (bi.img) return;
    const light = lum(bi.c) > 0.4;
    if (fixOn && c.placeholder) {
      const need = S.target >= 7 ? 7 : 4.5;
      const ph = fixColor(light ? { r: 117, g: 117, b: 117 } : { r: 170, g: 170, b: 170 }, bi.c, need + 0.15);
      c.style.setProperty('--clr-ph', rgbStr(ph));
      c.setAttribute('data-clr-p', '1');
    }
    if (outlineOn) {
      c.style.setProperty('--clr-b', light ? '#2b2b2b' : '#e6e6e6');
      c.setAttribute('data-clr-b', '1');
    }
  }

  function attachShadow(sr) {
    if (sr.__clr) return;
    sr.__clr = true;
    const st = doc.createElement('style');
    st.textContent = S ? buildCSS(S, 'shadow') : '';
    sr.appendChild(st);
    shadowStyles.push(st);
  }

  function visit(n) {
    if (n.nodeType === 3) {
      if (!n.nodeValue || !n.nodeValue.trim()) return;
      const p = n.parentElement;
      if (p) handleText(p);
    } else if (n.nodeType === 1) {
      if (n.id && n.id.startsWith('clr-')) return;
      if (CONTROL.has(n.localName)) handleControl(n);
      if (n.shadowRoot) { attachShadow(n.shadowRoot); enqueue(n.shadowRoot); }
    }
  }

  const later = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 250 }) : setTimeout(fn, 30));
  function enqueue(root) {
    if (!root || !(fixOn || tsOn || outlineOn || themeOn)) return;
    if (root.nodeType === 3) root = root.parentElement;
    if (!root) return;
    if (nodeCount > MAX_NODES) return;
    for (const w of walkers) if (!w.started && (w.root === root || (w.root.contains && w.root.contains(root)))) return;
    if (walkers.length > 300) { walkers = walkers.filter((w) => w.started); root = doc.documentElement; }
    walkers.push({ root, tw: doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), started: false });
    schedule();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    later(run);
  }
  function run() {
    scheduled = false;
    if (!active || !(fixOn || tsOn || outlineOn || themeOn)) { walkers = []; return; }
    if (!alive()) { teardown(); return; }
    bgCache = new WeakMap();
    const t0 = performance.now();
    try {
      while (walkers.length && performance.now() - t0 < 14) {
        const w = walkers[0];
        if (!w.started) { w.started = true; if (w.root.nodeType !== 11) visit(w.root); }
        const n = w.tw.nextNode();
        if (!n) { walkers.shift(); continue; }
        if (++nodeCount > MAX_NODES) { walkers = []; break; }
        try { visit(n); } catch (e) { /* nod dispărut sau inaccesibil: îl săr */ }
      }
    } catch (e) { walkers.shift(); }
    if (doc.querySelector('video[autoplay]') && S.noMotion) doc.querySelectorAll('video[autoplay]').forEach((v) => { try { v.autoplay = false; v.pause(); } catch (e) { } });
    if (walkers.length) schedule();
  }

  function onMutations(records) {
    for (const r of records) {
      if (r.type === 'childList') {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === 1 && n.id && n.id.startsWith('clr-')) return;
          if (n.nodeType === 1 || n.nodeType === 3) enqueue(n);
        });
      } else if (r.type === 'attributes') enqueue(r.target);
    }
    if (styleEl && !styleEl.isConnected) doc.documentElement.appendChild(styleEl);
  }
  function startObserver() {
    if (mo) return;
    mo = new MutationObserver(onMutations);
    mo.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'hidden', 'aria-disabled', 'open', 'data-theme', 'data-bs-theme', 'data-color-mode', 'data-mode'] });
  }
  function stopObserver() { if (mo) { mo.disconnect(); mo = null; } }

  function resetEngine() {
    walkers = [];
    const roots = [doc, ...shadowStyles.map((s) => s.getRootNode())];
    roots.forEach((root) => {
      root.querySelectorAll('[data-clr-c],[data-clr-fs],[data-clr-o],[data-clr-b],[data-clr-p]').forEach((e) => {
        ['data-clr-c', 'data-clr-fs', 'data-clr-o', 'data-clr-b', 'data-clr-p'].forEach((a) => e.removeAttribute(a));
        ['--clr-c', '--clr-fs', '--clr-b', '--clr-ph'].forEach((p) => e.style.removeProperty(p));
      });
    });
    origFs = new WeakMap(); nodeCount = 0;
  }

  /* ================= suprapuneri (riglă, mască, lupă, filtru cald) ================= */
  const OV_CSS = `
    .layer{position:fixed;pointer-events:none;display:none;z-index:2147483647}
    #warm{inset:0;mix-blend-mode:multiply}
    #guide{left:0;right:0;height:34px;border-top:3px solid #d50000;border-bottom:3px solid #d50000;background:rgba(255,235,59,.22)}
    #mT,#mB{left:0;right:0;background:rgba(0,0,0,.74)}
    #mag{max-width:min(640px,90vw);background:#000;color:#ffeb3b;font:600 28px/1.35 Verdana,Arial,sans-serif;padding:12px 16px;border:3px solid #ffeb3b;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.55);word-wrap:break-word}
    #tint{inset:0;mix-blend-mode:multiply}
    #sim{inset:0}
    #ring{width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:4px solid #ff1744;box-shadow:0 0 0 3px #fff,0 0 12px 4px rgba(0,0,0,.45)}
    .inv{filter:invert(1) hue-rotate(180deg)}`;
  function ensureOverlay() {
    if (!isTop) return null;
    if (ov && ov.host.isConnected) return ov;
    const host = doc.createElement('div');
    host.id = 'clr-root';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
    const sr = host.attachShadow({ mode: 'closed' });
    const st = doc.createElement('style'); st.textContent = OV_CSS; sr.appendChild(st);
    ['warm', 'tint', 'sim', 'mT', 'mB', 'guide', 'ring', 'mag'].forEach((id) => { const d = doc.createElement('div'); d.className = 'layer'; d.id = id; sr.appendChild(d); });
    doc.documentElement.appendChild(host);
    ov = { host, tint: sr.querySelector('#tint'), sim: sr.querySelector('#sim'), ring: sr.querySelector('#ring'), warm: sr.querySelector('#warm'), mT: sr.querySelector('#mT'), mB: sr.querySelector('#mB'), guide: sr.querySelector('#guide'), mag: sr.querySelector('#mag') };
    return ov;
  }
  let lastX = 0, lastY = Math.round(innerHeight * 0.4), magTick = false, moveBound = false;
  function placeBands() {
    if (!ov) return;
    ov.guide.style.top = (lastY - 17) + 'px';
    ov.mT.style.top = '0'; ov.mT.style.height = Math.max(0, lastY - 46) + 'px';
    ov.mB.style.top = (lastY + 46) + 'px'; ov.mB.style.bottom = '0';
  }
  function textAtPoint(x, y) {
    let node = null, off = 0;
    if (doc.caretPositionFromPoint) { const p = doc.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
    else if (doc.caretRangeFromPoint) { const r = doc.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
    if (!node || node.nodeType !== 3) {
      const el = doc.elementFromPoint(x, y);
      if (!el || el.id === 'clr-root') return '';
      if (el.localName === 'input' && /^(password|hidden|file)$/i.test(el.type)) return '';
      const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
      if (/cc-|password|one-time-code|otp/.test(ac)) return '';
      const v = el.localName === 'select' ? (el.selectedOptions[0] ? el.selectedOptions[0].text : '') : el.value;
      return String(v || el.placeholder || el.alt || el.getAttribute('aria-label') || el.title || '').slice(0, 200);
    }
    const txt = node.nodeValue || '';
    try {
      const rg = doc.createRange();
      rg.setStart(node, Math.max(0, off - 1)); rg.setEnd(node, Math.min(txt.length, off + 1));
      const rc = rg.getBoundingClientRect();
      if (x < rc.left - 12 || x > rc.right + 12 || y < rc.top - 12 || y > rc.bottom + 12) return '';
    } catch (e) { return ''; }
    let a = Math.max(0, off - 50), b = Math.min(txt.length, off + 90);
    if (a > 0) { const i = txt.indexOf(' ', a); if (i > -1 && i < off) a = i + 1; }
    if (b < txt.length) { const i = txt.lastIndexOf(' ', b); if (i > off) b = i; }
    return txt.slice(a, b).trim();
  }
  function onMove(e) {
    lastX = e.clientX; lastY = e.clientY;
    if (S.guide || S.mask) placeBands();
    if (S.pointerRing && ov) { ov.ring.style.display = 'block'; ov.ring.style.left = lastX + 'px'; ov.ring.style.top = lastY + 'px'; }
    if (S.magnifier && !magTick) {
      magTick = true;
      requestAnimationFrame(() => {
        magTick = false;
        if (!S || !S.magnifier || !ov) return;
        const txt = textAtPoint(lastX, lastY);
        if (!txt) { ov.mag.style.display = 'none'; return; }
        ov.mag.textContent = txt;
        ov.mag.style.display = 'block';
        const w = ov.mag.offsetWidth, h = ov.mag.offsetHeight;
        ov.mag.style.left = Math.min(Math.max(8, lastX + 14), innerWidth - w - 8) + 'px';
        ov.mag.style.top = (lastY + 26 + h > innerHeight ? Math.max(8, lastY - h - 16) : lastY + 26) + 'px';
      });
    }
  }
  function updateOverlay() {
    if (!isTop) return;
    const simOv = S.sim === 'tunnel' || S.sim === 'central';
    const need = S.guide || S.mask || S.magnifier || S.warm > 0 || S.tint !== 'none' || simOv || S.pointerRing;
    if (!need) { if (ov) { ov.host.remove(); ov = null; } unbindMove(); return; }
    const o = ensureOverlay();
    const dk = S.theme === 'dark';
    [o.warm, o.mT, o.mB, o.guide, o.mag].forEach((l) => l.classList.toggle('inv', dk));
    o.warm.style.display = S.warm > 0 ? 'block' : 'none';
    const al = (S.warm / 100) * 0.38;
    o.warm.style.background = dk ? `rgba(0,110,255,${al})` : `rgba(255,140,0,${al})`;
    o.tint.style.display = S.tint !== 'none' ? 'block' : 'none';
    if (S.tint !== 'none') o.tint.style.background = CLR.TINTS[S.tint] + Math.round(S.tintStrength / 100 * 255).toString(16).padStart(2, '0');
    o.sim.style.display = simOv ? 'block' : 'none';
    o.sim.style.background = S.sim === 'tunnel' ? 'radial-gradient(circle at 50% 50%,transparent 0,transparent 16%,rgba(0,0,0,.92) 34%)'
      : S.sim === 'central' ? 'radial-gradient(circle at 50% 50%,rgba(120,120,120,.96) 0,rgba(120,120,120,.9) 12%,transparent 30%)' : '';
    if (!S.pointerRing) o.ring.style.display = 'none';
    o.guide.style.display = S.guide ? 'block' : 'none';
    o.mT.style.display = o.mB.style.display = S.mask ? 'block' : 'none';
    if (!S.magnifier) o.mag.style.display = 'none';
    placeBands();
    if (S.guide || S.mask || S.magnifier || S.pointerRing) bindMove(); else unbindMove();
  }
  function bindMove() { if (!moveBound) { doc.addEventListener('mousemove', onMove, { passive: true, capture: true }); moveBound = true; } }
  function unbindMove() { if (moveBound) { doc.removeEventListener('mousemove', onMove, { capture: true }); moveBound = false; } }

  const stopSpeak = () => { try { if (CLR.feat) CLR.feat.tts('stop'); } catch (e) { } };

  /* ================= aplicare ================= */
  function teardown() {
    if (styleEl) { styleEl.remove(); }
    if (svgEl) { svgEl.remove(); svgEl = null; }
    if (ov) { ov.host.remove(); ov = null; }
    unbindMove(); stopObserver(); resetEngine(); stopSpeak();
    shadowStyles.forEach((s) => { try { const r = s.getRootNode(); if (r) r.__clr = false; } catch (e) { } s.remove(); }); shadowStyles.length = 0;
    engineSig = '';
  }

  function autoNight(s) {
    if (s.autoMode === 'system') return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    const m = (v) => { const [h, mi] = v.split(':'); return +h * 60 + +mi; };
    const now = new Date(), cur = now.getHours() * 60 + now.getMinutes(), a = m(s.autoFrom), b = m(s.autoTo);
    return a === b ? false : a < b ? (cur >= a && cur < b) : (cur >= a || cur < b);
  }
  let autoT = null;
  function autoTimer() {
    const want = S && S.autoMode !== 'off';
    if (want && !autoT) autoT = setInterval(() => { if (alive()) apply(); else { clearInterval(autoT); autoT = null; } }, 60000);
    else if (!want && autoT) { clearInterval(autoT); autoT = null; }
  }
  const mq = (q) => { try { return !!(window.matchMedia && matchMedia(q).matches); } catch (e) { return false; } };
  const osMedia = () => ({ fc: mq('(forced-colors: active)'), more: mq('(prefers-contrast: more)'), reduce: mq('(prefers-reduced-motion: reduce)'), transp: mq('(prefers-reduced-transparency: reduce)') });
  ['(forced-colors: active)', '(prefers-contrast: more)', '(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)'].forEach((q) => {
    try { const m = matchMedia(q); const f = () => { if (alive() && S) apply(); }; m.addEventListener ? m.addEventListener('change', f) : m.addListener(f); } catch (e) { }
  });
  function apply() {
    const r = resolve(G, SITES[CLR.siteKey(SITES, HOST)]);
    S = r.s; active = r.active;
    if (isTop) { const lc = CLR.langCode(S.lang); if (!CLR.I18N[lc]) CLR.loadLang(lc).then(() => { if (alive() && S) { if (CLR.feat) CLR.feat.onApply(S, active); if (CLR.x) CLR.x.onApply(S, active); if (CLR.m2) CLR.m2.onApply(S, active); } }); }
    if (S.autoMode !== 'off' && autoNight(S)) S = Object.assign({}, S, { theme: S.autoTheme });
    S = CLR.osAdjust(S, osMedia());
    autoTimer();
    if (!active) { teardown(); CLR.ctx = { S, active, HOST, isTop, doc, alive, api, write, command }; if (CLR.feat) CLR.feat.onApply(S, false); if (CLR.x) CLR.x.onApply(S, false); if (CLR.m2) CLR.m2.onApply(S, false); return; }
    ensureStyle().textContent = buildCSS(S, 'doc');
    const sc = buildCSS(S, 'shadow');
    shadowStyles.forEach((s) => { s.textContent = sc; });
    ensureSvg();
    updateOverlay();
    CLR.ctx = { S, active, HOST, isTop, doc, alive, api, write, command };
    if (CLR.feat) CLR.feat.onApply(S, active);
    if (CLR.x) CLR.x.onApply(S, active); if (CLR.m2) CLR.m2.onApply(S, active);

    fixOn = !!S.autoFix && (S.theme === 'none' || S.theme === 'dark');
    tsOn = S.textScale !== 100;
    outlineOn = !!S.outline && (S.theme === 'none' || S.theme === 'dark');
    themeOn = S.theme !== 'none';   // temele fixe au nevoie de parcurgere ca să ajungă și în shadow DOM
    const sig = [fixOn, S.target, tsOn, S.textScale, outlineOn, themeOn].join();
    if (sig !== engineSig) {
      engineSig = sig;
      resetEngine();
      if (fixOn || tsOn || outlineOn || themeOn) { startObserver(); enqueue(doc.documentElement); } else stopObserver();
    }
  }

  /* politică de administrare (opțională): storage.managed; absentă = comportament neschimbat */
  let RAW = { settings: undefined, sites: undefined }, MANAGED = null;
  async function loadManaged() {
    try { if (api.storage.managed) MANAGED = await Promise.race([api.storage.managed.get(["defaults", "enforce", "sites"]), new Promise((r) => setTimeout(() => r(null), 3000))]); } catch (e) { MANAGED = null; }
  }
  function mergeAll() {
    const m = CLR.mergeManaged(RAW.settings, RAW.sites, MANAGED);
    G = m.G; SITES = m.SITES;
  }
  async function load() {
    try {
      const r = await api.storage.local.get(['settings', 'sites']);
      RAW = { settings: r.settings, sites: r.sites };
      mergeAll();
    } catch (e) { /* storage indisponibil */ }
    apply();
    /* politica de administrare se aplică când sosește; absența/blocarea ei nu întârzie pornirea */
    loadManaged().then(() => { if (MANAGED && alive()) { mergeAll(); apply(); } });
  }
  api.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (!alive()) { teardown(); return; }
    if (!ch.settings && !ch.sites) return;   // recSession, chk:*, highlights etc. nu schimbă aspectul paginii
    if (ch.settings) RAW.settings = ch.settings.newValue;
    if (ch.sites) RAW.sites = ch.sites.newValue;
    mergeAll();
    apply();
  });

  function write(patch) {
    if (!alive()) return;
    try { api.storage.local.set(applyPatch(RAW.settings && typeof RAW.settings === 'object' ? RAW.settings : {}, SITES, CLR.siteKey(SITES, HOST), patch)); } catch (e) { }
  }
  function command(cmd) {
    if (!alive()) return;
    if (cmd === 'toggle') api.storage.local.set({ settings: Object.assign({}, RAW.settings && typeof RAW.settings === 'object' ? RAW.settings : {}, { enabled: G.enabled === false }) });
    else if (!S) return;
    else if (cmd === 'cycle-theme') { const i = THEME_ORDER.indexOf(S.theme); write({ theme: THEME_ORDER[(i + 1) % THEME_ORDER.length] }); }
    else if (cmd === 'guide') write({ guide: !S.guide });
    else if (cmd === 'read') CLR.feat && CLR.feat.tts('toggle');
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !isTop) return;
    if (msg.type === 'host') { sendResponse({ host: HOST, active }); }
    else if (msg.type === 'stats') { sendResponse({ fixed: doc.querySelectorAll('[data-clr-c]').length }); }
    else if (msg.type === 'tts') {
      if (CLR.feat) CLR.feat.tts(msg.mode);
      sendResponse({ ok: true });
    } else if (msg.type === 'feat') {
      sendResponse(CLR.feat ? CLR.feat.run(msg) : { ok: false });
    } else if (msg.type === 'command') command(msg.cmd);
  });

  doc.addEventListener('DOMContentLoaded', () => { if (active && (fixOn || tsOn || outlineOn || themeOn)) enqueue(doc.documentElement); });
  window.addEventListener('load', () => {
    if (active && (fixOn || tsOn || outlineOn || themeOn)) { enqueue(doc.documentElement); setTimeout(() => active && enqueue(doc.documentElement), 1500); }
  });

  load();
})();
