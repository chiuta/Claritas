/* CLARITAS — cod comun (content script + popup). Fără rețea, fără telemetrie. */
var CLR = (function () {
  'use strict';

  const DEFAULTS = {
    enabled: true,
    autoFix: true, target: 7, outline: true,
    theme: 'none', custom: { bg: '#000000', fg: '#ffffff', link: '#ffff00' },
    brightness: 100, contrast: 100, saturate: 100, sepia: 0, gray: false, warm: 0,
    cb: 'none',
    textScale: 100, lineHeight: 0, letter: 0, word: 0, font: 'default', alignLeft: false,
    guide: false, mask: false, magnifier: false, focus: true, links: false, cursor: false,
    noMotion: false, hideImages: false, ttsRate: 1, lang: 'auto',
    /* v1.3 */
    hue: 0, tint: 'none', tintStrength: 25, maxWidth: 0, bigTargets: false, noTransform: false, muteMedia: false,
    pointerRing: false, hoverSpeech: false, dwell: false, dwellMs: 1200, sim: 'none',
    autoMode: 'off', autoFrom: '20:00', autoTo: '07:00', autoTheme: 'dark', onlyListed: false,
    ttsPitch: 1, ttsVoice: '', selBar: true, scrollSpeed: 40,
    /* v1.4 */
    osPrefs: true, calm: false, unstick: false, reflow: false, noFlash: false, focusGuard: false, liveAudit: false,
    hints: false, scan: false, scanMs: 1500, unblockPaste: false, fab: false,
    linkInfo: false, altReveal: false, capStyle: false, cueSize: 120, playRate: 1,
    localVoices: true, autoLang: true, aiLocal: false,
    modPos: false, modAuditPlus: false, modDict: false, syncProfiles: false,
    modKeys: false, modVoice: false, modSimplify: false, modImgAlt: false, modCaps: false,
    modInspect: false, modOrder: false, modReadList: false, modSiteCss: false, modMath: false, modAI: false
  };
  const TINTS = { blue: '#4aa3ff', yellow: '#ffe14a', green: '#5fe08a', pink: '#ff8ccf', peach: '#ffb27a', gray: '#808080' };
  const TINT_ORDER = ['none', 'blue', 'yellow', 'green', 'pink', 'peach', 'gray'];
  const SIMS = ['none', 'blur', 'cataract', 'tunnel', 'central', 'glare', 'astig', 'dyslexia'];
  const AUTO_MODES = ['off', 'system', 'time'];

  const THEMES = {
    wb:    { bg: '#000000', fg: '#ffffff', link: '#7fd7ff', vis: '#e2b0ff' },
    yb:    { bg: '#000000', fg: '#ffff00', link: '#00ffff', vis: '#ff9cff' },
    bw:    { bg: '#ffffff', fg: '#000000', link: '#0000cc', vis: '#5b1a9b' },
    by:    { bg: '#ffeb3b', fg: '#000000', link: '#0000b3', vis: '#4a148c' },
    gb:    { bg: '#000000', fg: '#33ff66', link: '#ffff00', vis: '#ff9cff' },
    night: { bg: '#0d1b2a', fg: '#f1f5f9', link: '#ffd166', vis: '#c9a7ff' }
  };
  const THEME_ORDER = ['none', 'wb', 'yb', 'bw', 'by', 'gb', 'night', 'dark', 'custom'];

  const FONTS = {
    sans: 'Verdana, Tahoma, "Segoe UI", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", Consolas, monospace',
    dyslexic: '"Claritas OpenDyslexic", "OpenDyslexic", "Claritas Lexend", "Comic Sans MS", "Trebuchet MS", Verdana, sans-serif',
    lexend: '"Claritas Lexend", "Lexend", "Trebuchet MS", Verdana, sans-serif',
    atkinson: '"Claritas Atkinson", "Atkinson Hyperlegible", "Trebuchet MS", Verdana, sans-serif'
  };
  /* fișiere de font incluse în extensie (licență SIL OFL 1.1, vezi fonts/LICENSE-*.txt) */
  const FONT_FILES = {
    dyslexic: [['Claritas OpenDyslexic', 400, 'opendyslexic-latin-400-normal'], ['Claritas OpenDyslexic', 700, 'opendyslexic-latin-700-normal'],
               ['Claritas Lexend', 400, 'lexend-latin-ext-400-normal'], ['Claritas Lexend', 400, 'lexend-latin-400-normal'],
               ['Claritas Lexend', 700, 'lexend-latin-ext-700-normal'], ['Claritas Lexend', 700, 'lexend-latin-700-normal']],
    lexend: [['Claritas Lexend', 400, 'lexend-latin-ext-400-normal'], ['Claritas Lexend', 400, 'lexend-latin-400-normal'],
             ['Claritas Lexend', 700, 'lexend-latin-ext-700-normal'], ['Claritas Lexend', 700, 'lexend-latin-700-normal']],
    atkinson: [['Claritas Atkinson', 400, 'atkinson-hyperlegible-latin-ext-400-normal'], ['Claritas Atkinson', 400, 'atkinson-hyperlegible-latin-400-normal'],
               ['Claritas Atkinson', 700, 'atkinson-hyperlegible-latin-ext-700-normal'], ['Claritas Atkinson', 700, 'atkinson-hyperlegible-latin-700-normal']]
  };
  /* unicode-range pentru subseturile latin / latin-ext (la fel ca în Google Fonts) */
  const UR_LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const UR_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

  const PRESETS = {
    lowvision:   { theme: 'none', autoFix: true, target: 7, outline: true, textScale: 150, focus: true, links: true, cursor: true },
    darkcomfort: { theme: 'dark', brightness: 90, warm: 12, autoFix: true },
    dyslexia:    { theme: 'none', autoFix: true, font: 'dyslexic', textScale: 115, lineHeight: 1.8, letter: 0.08, word: 0.16, alignLeft: true, guide: true },
    colorblind:  { cb: 'deut-fix', outline: true, links: true },
    sensitive:   { noMotion: true, brightness: 88, saturate: 75, warm: 25, contrast: 95 },
    focus:       { mask: true, textScale: 120, lineHeight: 1.7, alignLeft: true, noMotion: true, maxWidth: 70 },
    motor:       { bigTargets: true, dwell: false, pointerRing: true, cursor: true, focus: true, links: true },
    calm:        { calm: true, noFlash: true, noMotion: true, muteMedia: true, unstick: true, maxWidth: 70, saturate: 85 },
    elderly:     { textScale: 140, lineHeight: 1.7, bigTargets: true, autoFix: true, target: 7, outline: true, focus: true, links: true, cursor: true, maxWidth: 75, noMotion: true },
    tremor:      { bigTargets: true, dwell: true, dwellMs: 1500, pointerRing: true, cursor: true, unblockPaste: true, focus: true, noMotion: true, links: true },
    photosens:   { noFlash: true, noMotion: true, calm: true, brightness: 85, saturate: 70, warm: 15, muteMedia: true },
    adhd:        { calm: true, unstick: true, mask: true, noMotion: true, maxWidth: 68, lineHeight: 1.7, guide: true, focusGuard: true, muteMedia: true },
    reading:     { maxWidth: 70, lineHeight: 1.7, textScale: 115, alignLeft: true, tint: 'yellow', tintStrength: 18, guide: true }
  };

  /* ---------- culori ---------- */
  function parseColor(str) {
    if (!str) return null;
    let m = /rgba?\(([^)]+)\)/i.exec(str);
    if (m) {
      const p = m[1].split(/[\s,\/]+/).filter(Boolean);
      if (p.length < 3) return null;
      const ch = (v) => v.endsWith('%') ? parseFloat(v) * 2.55 : parseFloat(v);
      const a = p.length > 3 ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
      return { r: ch(p[0]), g: ch(p[1]), b: ch(p[2]), a: isNaN(a) ? 1 : a };
    }
    m = /color\(srgb\s+([^)]+)\)/i.exec(str);
    if (m) {
      const p = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat);
      if (p.length < 3) return null;
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
    }
    if (/^(oklch|oklab|lab|lch|color)\(/i.test(str) && typeof document !== 'undefined') return canvasColor(str);
    return null;
  }
  let _cvx = null; const _cvc = new Map();
  function canvasColor(str) {
    if (_cvc.has(str)) return _cvc.get(str);
    let r = null;
    try {
      if (!_cvx) { const cv = document.createElement('canvas'); cv.width = cv.height = 1; _cvx = cv.getContext('2d', { willReadFrequently: true }); }
      _cvx.clearRect(0, 0, 1, 1); _cvx.globalCompositeOperation = 'copy'; _cvx.fillStyle = '#010203'; _cvx.fillStyle = str; _cvx.fillRect(0, 0, 1, 1);
      const d = _cvx.getImageData(0, 0, 1, 1).data; r = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch (e) { }
    if (_cvc.size > 500) _cvc.clear(); _cvc.set(str, r); return r;
  }
  const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const isHex = (h) => typeof h === 'string' && HEX_RE.test(h);
  function hexToRgb(h) {
    h = isHex(h) ? h.slice(1) : '000000';
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  function ratio(a, b) {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function over(f, b) {
    const a = f.a == null ? 1 : f.a;
    return { r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a), a: 1 };
  }
  const rgbStr = (c) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

  function rgb2hsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (s === 0) { const v = l * 255; return { r: v, g: v, b: v, a: 1 }; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255, a: 1 };
  }

  /* Mută luminozitatea culorii text cât mai puțin, păstrând nuanța, până la raportul țintă. */
  function fixColor(fg, bg, target) {
    const [h, s, l] = rgb2hsl(fg);
    const search = (hi) => {
      if (ratio(hsl2rgb(h, s, hi), bg) < target) return null;
      let lo = l;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (ratio(hsl2rgb(h, s, mid), bg) >= target) hi = mid; else lo = mid;
      }
      return { c: hsl2rgb(h, s, hi), d: Math.abs(hi - l) };
    };
    const dk = search(0), lt = search(1);
    if (dk && lt) return (dk.d <= lt.d ? dk : lt).c;
    if (dk) return dk.c;
    if (lt) return lt.c;
    const black = { r: 0, g: 0, b: 0 }, white = { r: 255, g: 255, b: 255 };
    return ratio(black, bg) >= ratio(white, bg) ? black : white;
  }

  /* ---------- daltonism (matrici feColorMatrix) ---------- */
  const SIM = {
    prot: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deut: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    trit: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
    achro: [[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]]
  };
  const SHIFT = {
    prot: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
    deut: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
    trit: [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]]
  };
  const CB_MODES = ['none', 'prot-fix', 'deut-fix', 'trit-fix', 'sim-prot', 'sim-deut', 'sim-trit', 'sim-achro'];
  const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  function cbMatrix(mode) {
    if (typeof mode !== 'string' || !CB_MODES.includes(mode) || mode === 'none') return null;
    let M;
    if (mode.startsWith('sim-')) M = SIM[mode.slice(4)];
    else {
      const k = mode.slice(0, 4); // prot / deut / trit (validat mai sus)
      const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      const IminusS = I.map((r, i) => r.map((v, j) => v - SIM[k][i][j]));
      const corr = mul(SHIFT[k], IminusS);
      M = I.map((r, i) => r.map((v, j) => v + corr[i][j]));
    }
    if (!M) return null;
    return M.map((r) => r.map((v) => v.toFixed(5)).join(' ') + ' 0 0').join(' ') + ' 0 0 0 1 0';
  }

  /* ---------- setări ---------- */
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  const RANGES = {
    target: [4.5, 7], brightness: [50, 150], contrast: [50, 200], saturate: [0, 200], sepia: [0, 100], warm: [0, 100],
    textScale: [50, 300], lineHeight: [0, 3], letter: [0, 0.5], word: [0, 1], ttsRate: [0.5, 3],
    hue: [0, 360], tintStrength: [0, 60], dwellMs: [600, 3000], ttsPitch: [0.5, 2], scrollSpeed: [10, 300],
    scanMs: [600, 4000], cueSize: [50, 300], playRate: [0.5, 3]
  };
  const BOOLS = ['enabled', 'autoFix', 'outline', 'gray', 'alignLeft', 'guide', 'mask', 'magnifier', 'focus', 'links', 'cursor', 'noMotion', 'hideImages', 'bigTargets', 'noTransform', 'muteMedia', 'pointerRing', 'hoverSpeech', 'dwell', 'onlyListed', 'selBar',
    'osPrefs', 'calm', 'unstick', 'reflow', 'noFlash', 'focusGuard', 'liveAudit', 'hints', 'scan', 'unblockPaste', 'fab', 'linkInfo', 'altReveal', 'capStyle', 'localVoices', 'autoLang', 'aiLocal', 'modPos', 'modAuditPlus', 'modDict', 'syncProfiles', 'modKeys', 'modVoice', 'modSimplify', 'modImgAlt', 'modCaps', 'modInspect', 'modOrder', 'modReadList', 'modSiteCss', 'modMath', 'modAI'];
  /* Validează/limitează orice setări venite din storage, import sau popup: nimic nevalidat nu ajunge în CSS. */
  function sanitize(raw) {
    const o = isObj(raw) ? raw : {};
    const s = {};
    BOOLS.forEach((k) => { s[k] = typeof o[k] === 'boolean' ? o[k] : DEFAULTS[k]; });
    Object.keys(RANGES).forEach((k) => {
      const v = Number(o[k]);
      const [lo, hi] = RANGES[k];
      s[k] = (o[k] == null || o[k] === '' || !isFinite(v)) ? DEFAULTS[k] : Math.min(hi, Math.max(lo, v));
    });
    s.target = s.target >= 5.75 ? 7 : 4.5;
    s.maxWidth = (Number(o.maxWidth) >= 30 && Number(o.maxWidth) <= 140) ? Math.round(Number(o.maxWidth)) : 0;
    s.tint = TINT_ORDER.includes(o.tint) ? o.tint : 'none';
    s.sim = SIMS.includes(o.sim) ? o.sim : 'none';
    s.autoMode = AUTO_MODES.includes(o.autoMode) ? o.autoMode : 'off';
    const hhmm = (v, d) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)) ? v : d;
    s.autoFrom = hhmm(o.autoFrom, DEFAULTS.autoFrom); s.autoTo = hhmm(o.autoTo, DEFAULTS.autoTo);
    s.autoTheme = (THEME_ORDER.includes(o.autoTheme) && o.autoTheme !== 'none') ? o.autoTheme : DEFAULTS.autoTheme;
    s.ttsVoice = (typeof o.ttsVoice === 'string' && o.ttsVoice.length <= 160 && !/[\u0000-\u001f]/.test(o.ttsVoice)) ? o.ttsVoice : '';
    s.theme = THEME_ORDER.includes(o.theme) ? o.theme : DEFAULTS.theme;
    s.cb = CB_MODES.includes(o.cb) ? o.cb : DEFAULTS.cb;
    s.font = (o.font === 'default' || FONTS[o.font]) ? o.font : DEFAULTS.font;
    s.lang = (o.lang === 'auto' || LANGS.indexOf(o.lang) >= 0) ? o.lang : DEFAULTS.lang;
    const c = isObj(o.custom) ? o.custom : {};
    s.custom = {};
    ['bg', 'fg', 'link'].forEach((k) => { s.custom[k] = isHex(c[k]) ? c[k].toLowerCase() : DEFAULTS.custom[k]; });
    return s;
  }
  const hostOk = (h) => typeof h === 'string' && h.length > 0 && h.length < 256 && h !== '__proto__' && h !== 'constructor' && h !== 'prototype';
  /* Curăță obiectul `sites` (nume gazdă → {scoped,off,...setări}). */
  function sanitizeSites(raw) {
    const out = Object.create(null);
    if (!isObj(raw)) return {};
    Object.keys(raw).slice(0, 2000).forEach((h) => {
      if (!hostOk(h) || !isObj(raw[h])) return;
      const e = raw[h];
      const r = e.scoped === true ? Object.assign(sanitize(e), { scoped: true }) : {};
      if (e.off === true) r.off = true;
      if (e.on === true) r.on = true;
      if (Object.keys(r).length) out[h] = r;
    });
    return Object.assign({}, out);
  }
  function resolve(G, site) {
    site = isObj(site) ? site : {};
    const rest = Object.assign({}, site); delete rest.off; delete rest.scoped;
    const gs = sanitize(G);
    const s = site.scoped ? Object.assign({}, gs, sanitize(Object.assign({}, gs, rest)), { enabled: gs.enabled, lang: gs.lang }) : gs;
    const listed = gs.onlyListed ? site.on === true : site.off !== true;
    return { s, active: gs.enabled && listed, scoped: !!site.scoped, off: gs.onlyListed ? site.on !== true : !!site.off, only: gs.onlyListed };
  }
  /* Setarea unui domeniu se aplică și subdomeniilor (a.b.ro → b.ro). Întoarce cheia potrivită sau gazda exactă. */
  function siteKey(SITES, host) {
    if (!isObj(SITES) || !hostOk(host)) return host;
    if (Object.prototype.hasOwnProperty.call(SITES, host)) return host;
    const parts = host.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const k = parts.slice(i).join('.');
      if (Object.prototype.hasOwnProperty.call(SITES, k)) return k;
    }
    return host;
  }
  /* Întoarce ce trebuie scris în storage pentru o modificare de setări. */
  function applyPatch(G, SITES, host, patch) {
    const site = (SITES || {})[host];
    if (site && site.scoped) {
      return { sites: Object.assign({}, SITES, { [host]: Object.assign({}, site, patch) }) };
    }
    return { settings: Object.assign({}, G, patch) };
  }

  /* ---------- preferințe ale sistemului de operare (EN 301 549 v4.1.1: respectarea preferințelor platformei) ---------- */
  /* m = { fc: forced-colors, more: prefers-contrast:more, reduce: prefers-reduced-motion, transp: prefers-reduced-transparency } */
  function osAdjust(s, m) {
    if (!s || !s.osPrefs || !m) return s;
    const o = Object.assign({}, s);
    if (m.fc) {
      /* Windows High Contrast: sistemul impune paleta; Claritas nu o contrazice (rămân spațierea, fonturile, ghidajele) */
      Object.assign(o, { theme: 'none', autoFix: false, outline: false, cb: 'none', tint: 'none', warm: 0, brightness: 100, contrast: 100, saturate: 100, sepia: 0, hue: 0, gray: false, sim: 'none', forcedColors: true });
    } else if (m.more && o.theme === 'none') {
      Object.assign(o, { autoFix: true, target: 7, outline: true, focus: true, links: true });
    }
    if (m.reduce) o.noMotion = true;
    if (m.transp) o.noTransp = true;
    return o;
  }

  /* ---------- politică de administrare (storage.managed): valori JSON ca text, validate ca orice altă intrare ---------- */
  function parseJsonObj(v) {
    if (isObj(v)) return v;
    if (typeof v !== 'string' || v.length > 200000) return {};
    try { const j = JSON.parse(v); return isObj(j) ? j : {}; } catch (e) { return {}; }
  }
  /* Întoarce { G, SITES, locked: [chei impuse] }. defaults = valori inițiale (utilizatorul le poate schimba),
     enforce = valori impuse (utilizatorul nu le poate schimba), sites = presetări pe domenii (setările proprii ale utilizatorului au prioritate). */
  function mergeManaged(settings, sites, managed) {
    const mg = isObj(managed) ? managed : {};
    const def = parseJsonObj(mg.defaults), enf = parseJsonObj(mg.enforce), msites = parseJsonObj(mg.sites);
    const userSet = isObj(settings) ? settings : {};
    const base = Object.assign({}, def, userSet);
    const enforced = {}; const locked = [];
    Object.keys(enf).forEach((k) => { if (Object.prototype.hasOwnProperty.call(DEFAULTS, k) && k !== 'custom') { enforced[k] = enf[k]; locked.push(k); } });
    const merged = Object.assign({}, base, enforced);
    const enabled = !(merged.enabled === false);
    const G = sanitize(merged); G.enabled = enabled;
    const SITES = Object.assign({}, sanitizeSites(msites), sanitizeSites(sites));
    return { G, SITES, locked };
  }

  /* ---------- silabisire orientativă (română / engleză), reguli proprii ---------- */
  const VOW = 'aeiouyăâîàáäèéëìíïòóöùúü';
  const isV = (c) => VOW.indexOf(c) >= 0;
  const ONSET = /^[bcdfgptvk][lr]$|^[bcdfgptv]h$/;
  function syllabify(word) {
    const w = String(word);
    if (w.length < 4 || w.length > 40 || !/^\p{L}+$/u.test(w)) return [w];
    const lw = w.toLowerCase();
    /* unități: ch/gh/sh/th/ph + e/i, qu rămân împreună ca o singură consoană */
    const units = []; let i = 0;
    while (i < lw.length) {
      const two = lw.slice(i, i + 2);
      if (!isV(lw[i]) && (two === 'ch' || two === 'gh' || two === 'sh' || two === 'th' || two === 'ph' || two === 'qu')) { units.push({ s: w.slice(i, i + 2), v: false, c: two }); i += 2; }
      else { units.push({ s: w[i], v: isV(lw[i]), c: lw[i] }); i++; }
    }
    const cuts = [];
    let k = 0;
    while (k < units.length) {
      if (!units[k].v) { k++; continue; }
      while (k < units.length && units[k].v) k++;          // grup de vocale (diftong/triftong rămâne întreg)
      let j = k; while (j < units.length && !units[j].v) j++; // consoane până la următoarea vocală
      if (j >= units.length) break;                       // consoane finale rămân la silaba anterioară
      const n = j - k;
      let cut;
      if (n === 1) cut = k;
      else {
        const lastTwo = units[j - 2].c + units[j - 1].c;
        cut = (n >= 2 && ONSET.test(lastTwo)) ? j - 2 : j - 1;
      }
      if (cut > 0) cuts.push(cut);
      k = j;
    }
    if (!cuts.length) return [w];
    const out = []; let prev = 0;
    cuts.forEach((c) => { out.push(units.slice(prev, c).map((u) => u.s).join('')); prev = c; });
    out.push(units.slice(prev).map((u) => u.s).join(''));
    return out.filter(Boolean);
  }

  /* ---------- lizibilitate: LIX (Björnsson), independent de limbă ---------- */
  function readability(text) {
    const words = (String(text).match(/\p{L}[\p{L}\p{N}'’-]*/gu) || []);
    const sents = String(text).split(/[.!?…]+\s+|\n{2,}/).filter((x) => /\p{L}/u.test(x));
    const nW = words.length, nS = Math.max(1, sents.length);
    const longW = words.filter((x) => x.replace(/[^\p{L}]/gu, '').length > 6).length;
    const longS = sents.filter((x) => (x.match(/\S+/g) || []).length > 25).length;
    const lix = nW ? Math.round(nW / nS + (100 * longW) / nW) : 0;
    const level = lix < 30 ? 'very_easy' : lix < 40 ? 'easy' : lix < 50 ? 'medium' : lix < 60 ? 'hard' : 'very_hard';
    return { words: nW, sentences: sents.length, longSentences: longS, lix, level };
  }

  /* ---------- detectare orientativă a limbii (n-grame de litere / cuvinte frecvente), local ---------- */
  const LANG_WORDS = {
    ro: 'și de la în cu pe care este sunt pentru nu mai din că un o se lui au fost sau dar prin ca să această acest către între după',
    en: 'the and of to in is that for it with as was on are by this be from at or have an not but they which you',
    fr: 'le la les de des et un une est dans pour que qui pas sur au avec ce il elle nous vous sont plus par',
    de: 'der die das und ist nicht ein eine mit den von zu auf für sich dem im auch es an als wir sie nach',
    hu: 'a az és nem hogy is egy van meg de ez azt már még csak vagy mint volt lesz ki el fel',
    es: 'el la los las de que y en un una es se no por con para su al lo como más pero sus le ya o este'
  };
  const LANG_SETS = {}; Object.keys(LANG_WORDS).forEach((k) => { LANG_SETS[k] = new Set(LANG_WORDS[k].split(' ')); });
  function detectLang(text) {
    const ws = (String(text).toLowerCase().match(/\p{L}+/gu) || []).slice(0, 400);
    if (ws.length < 6) return null;
    const sc = {}; Object.keys(LANG_SETS).forEach((k) => { sc[k] = 0; });
    ws.forEach((w) => { Object.keys(LANG_SETS).forEach((k) => { if (LANG_SETS[k].has(w)) sc[k]++; }); });
    if (/[ăâîșț]/.test(text)) sc.ro += 3;
    if (/[őű]/.test(text)) sc.hu += 3;
    if (/[ßäöü]/.test(text)) sc.de += 2;
    if (/[ñ¿¡]/.test(text)) sc.es += 3;
    if (/[çœ]/.test(text)) sc.fr += 2;
    const best = Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
    return sc[best[0]] >= 3 && sc[best[0]] > sc[best[1]] ? best[0] : null;
  }

  /* ---------- traduceri ---------- */
  const I18N = {
    ro: {
      tab_contrast: 'Contrast', tab_color: 'Culoare', tab_text: 'Text', tab_read: 'Citire', tab_prof: 'Profile',
      on_all: 'Activ peste tot', on_site: 'Activ pe acest site', site_only: 'Setări separate pentru acest site',
      unsupported: 'Această pagină nu poate fi modificată (pagină internă a browserului, pagină neîncărcată sau extensie fără acces).',
      fixed_n: '{n} elemente cu contrast corectat pe pagină',
      autofix: 'Corectează automat contrastul slab', autofix_hint: 'Păstrează designul paginii; ajustează doar textul cu contrast insuficient (inclusiv câmpurile dezactivate).',
      target: 'Nivel țintă WCAG', aa: 'AA (4,5 : 1)', aaa: 'AAA (7 : 1)',
      outline: 'Conturează câmpurile și butoanele', theme: 'Temă de culori',
      th_none: 'Originală', th_wb: 'Alb pe negru', th_yb: 'Galben pe negru', th_bw: 'Negru pe alb', th_by: 'Negru pe galben',
      th_gb: 'Verde pe negru', th_night: 'Noapte', th_dark: 'Întunecat (inversare)', th_custom: 'Personalizată',
      c_bg: 'Fundal', c_fg: 'Text', c_link: 'Linkuri',
      brightness: 'Luminozitate', contrast: 'Contrast', saturate: 'Saturație', sepia: 'Sepia', gray: 'Tonuri de gri', warm: 'Filtru lumină albastră',
      cb: 'Daltonism', cb_none: 'Dezactivat',
      cb_prot_fix: 'Corecție – protanopie (roșu)', cb_deut_fix: 'Corecție – deuteranopie (verde)', cb_trit_fix: 'Corecție – tritanopie (albastru)',
      cb_sim_prot: 'Simulare – protanopie', cb_sim_deut: 'Simulare – deuteranopie', cb_sim_trit: 'Simulare – tritanopie', cb_sim_achro: 'Simulare – acromatopsie',
      zoom: 'Zoom pagină', textScale: 'Mărime text', lineHeight: 'Spațiere rânduri', letter: 'Spațiere litere', word: 'Spațiere cuvinte',
      font: 'Font', f_default: 'Implicit (al paginii)', f_sans: 'Sans-serif clar', f_serif: 'Serif', f_mono: 'Monospațiat', f_dyslexic: 'Prietenos cu dislexia',
      alignLeft: 'Aliniază textul la stânga', auto: 'auto',
      guide: 'Riglă de citire', mask: 'Mască de citire', magnifier: 'Lupă de text sub mouse', focus: 'Contur puternic la focus',
      links: 'Evidențiază linkurile', cursor: 'Cursor mare', noMotion: 'Oprește animațiile', hideImages: 'Ascunde imaginile',
      tts: 'Citire cu voce', tts_sel: 'Citește selecția', tts_page: 'Citește pagina', tts_stop: 'Stop', tts_rate: 'Viteză voce',
      p_lowvision: 'Vedere slabă', p_darkcomfort: 'Confort la lumină slabă', p_dyslexia: 'Dislexie', p_colorblind: 'Daltonism',
      p_sensitive: 'Sensibilitate la lumină / mișcare', p_focus: 'Concentrare / ADHD', p_reset: 'Resetează tot',
      p_hint: 'Un profil aplică un set de setări peste cele curente.',
      export: 'Exportă', import: 'Importă', lang: 'Limbă', shortcuts: 'Scurtături: Alt+Shift+O (pornit/oprit), D (temă), L (citește), G (riglă). Se pot schimba din setările de scurtături ale browserului.',
      zoom_reset: 'Resetează zoom',
      show: 'Arată în pagină', tts_prev: 'Propoziția anterioară',
      tts_pause: 'Pauză / continuă',
      tts_next: 'Propoziția următoare',
      hl_color: 'Evidențiază culoarea {n}',
      define: 'Caută definiția',
      copy: 'Copiază',
      pick_hint: 'Click pe elementul de ascuns · Esc pentru a termina',
      done: 'Gata',
      reader: 'Mod lectură',
      rd_smaller: 'Text mai mic',
      rd_larger: 'Text mai mare',
      rd_narrower: 'Coloană mai îngustă',
      rd_wider: 'Coloană mai lată',
      rd_spacing: 'Spațiere rânduri',
      rd_theme: 'Schimbă tema',
      rd_bionic: 'Lectură bionică (început de cuvânt îngroșat)',
      rd_gradient: 'Fir de culoare pe rânduri',
      rsvp: 'Citire rapidă (un cuvânt pe ecran)',
      close: 'Închide',
      progress: 'Progres',
      rsvp_back: 'Înapoi 10 cuvinte',
      rsvp_fwd: 'Înainte 10 cuvinte',
      slower: 'Mai lent',
      faster: 'Mai rapid',
      rsvp_started: 'Citire rapidă pornită',
      tab_tools: 'Instrumente',
      t_reader: 'Mod lectură',
      t_rsvp: 'Citire rapidă',
      t_picker: 'Ascunde elemente (click)',
      t_hidden_clear: 'Restaurează elementele ascunse',
      t_autoscroll: 'Derulare automată',
      t_audit: 'Verifică accesibilitatea paginii',
      t_outline: 'Structura paginii (titluri, zone)',
      t_hl: 'Evidențieri pe această pagină',
      t_hl_export: 'Exportă evidențierile',
      t_hl_clear: 'Șterge toate',
      t_none: 'Nimic de afișat.',
      inactive: 'Funcția nu este activă pe această pagină.',
      no_issues: 'Nicio problemă detectată de verificările automate.',
      stats_line: '{w} cuvinte · ~{m} min de citit · {l} propoziții lungi (>25 cuvinte) din {s}',
      sev_err: 'Eroare',
      sev_warn: 'Atenție',
      sev_info: 'Info',
      tools_hint: 'Selectează text din pagină pentru bara de acțiuni (voce, evidențiere, definiție).',
      hue: 'Rotire nuanță',
      tint: 'Folie colorată (ex. pentru stres vizual)',
      tintStrength: 'Intensitate folie',
      th_tint_none: 'Fără folie',
      th_tint_blue: 'Albastru',
      th_tint_yellow: 'Galben',
      th_tint_green: 'Verde',
      th_tint_pink: 'Roz',
      th_tint_peach: 'Piersică',
      th_tint_gray: 'Gri',
      sim: 'Simulator de vedere (testare)',
      sim_none: 'Dezactivat',
      sim_blur: 'Vedere încețoșată',
      sim_cataract: 'Cataractă',
      sim_tunnel: 'Vedere tubulară (glaucom)',
      sim_central: 'Pierdere centrală (degenerescență maculară)',
      maxWidth: 'Lățime maximă paragraf (caractere)',
      bigTargets: 'Ținte de click mari (44 px)',
      noTransform: 'Fără MAJUSCULE forțate',
      muteMedia: 'Oprește sunetul la redare automată',
      pointerRing: 'Inel în jurul cursorului',
      hoverSpeech: 'Citește textul la trecerea mouse-ului',
      dwell: 'Click prin staționare (dwell)',
      dwellMs: 'Durată staționare',
      selBar: 'Bară de acțiuni la selecție',
      ttsPitch: 'Tonalitate voce',
      ttsVoice: 'Voce',
      voice_default: 'Automată (după limba paginii)',
      scrollSpeed: 'Viteză derulare',
      auto_title: 'Programare tema',
      autoMode: 'Temă automată',
      auto_off: 'Dezactivată',
      auto_system: 'Urmează sistemul',
      auto_time: 'După oră',
      autoFrom: 'De la',
      autoTo: 'Până la',
      autoTheme: 'Temă pe timpul nopții',
      site_listed: 'Doar site-urile din listă (mod listă albă)',
      p_motor: 'Abilități motorii',
      p_reading: 'Citire confortabilă',
      a_lang: 'Pagina nu declară limba (atributul lang)',
      a_title: 'Pagina nu are titlu',
      a_zoom: 'Mărirea paginii e blocată de meta viewport',
      a_img_alt: 'Imagine fără text alternativ',
      a_img_alt_file: 'Text alternativ care pare un nume de fișier',
      a_name: 'Link/buton fără nume accesibil',
      a_vague: 'Text de link neclar (ex. „aici”)',
      a_label: 'Câmp de formular fără etichetă',
      a_label_ph: 'Câmp fără etichetă (doar placeholder)',
      a_h1_none: 'Lipsește titlul principal (h1)',
      a_h1_many: 'Mai multe titluri h1',
      a_h_empty: 'Titlu gol',
      a_h_skip: 'Nivel de titlu sărit',
      a_dup_id: 'ID duplicat',
      a_iframe_title: 'Iframe fără titlu',
      a_tabindex: 'tabindex pozitiv (ordine de focus alterată)',
      a_table_th: 'Tabel fără celule de antet (th)',
      a_blink: 'Element care clipește/defilează (marquee/blink)',
      a_autoplay: 'Media care pornește automat',
      a_target_small: 'Țintă de click sub 24×24 px (WCAG 2.5.8)',
      a_contrast_fixed: 'Elemente cu contrast insuficient corectate de Claritas',
      cap_title: 'Captură de ecran',
      cap_visible: 'Zona vizibilă',
      cap_region: 'Regiune (trage cu mouse-ul)',
      cap_full: 'Toată pagina (cu derulare)',
      cap_element: 'Un element al paginii',
      cap_delay: 'Zona vizibilă, cu întârziere de 5 s',
      cap_hint_region: 'Trage cu mouse-ul pentru a alege zona. Enter = zona vizibilă întreagă, Esc = anulează.',
      cap_hint_element: 'Treci cu mouse-ul peste element și dă clic. Tastatură: ↑ părinte, ↓ copil, ←/→ vecin, Enter = alege, Esc = anulează.',
      cap_busy: 'Se capturează pagina… {n}%',
      cap_fail: 'Captura nu a reușit pe această pagină (pagini interne, fișiere locale fără acces permis sau browser fără suport).',
      cap_countdown: 'Captură în {n} s…',
      ed_arrow: 'Săgeată',
      ed_rect: 'Dreptunghi',
      ed_hl: 'Evidențiere',
      ed_blur: 'Neclaritate',
      ed_redact: 'Acoperire neagră',
      ed_text: 'Text',
      ed_step: 'Pas numerotat',
      ed_pen: 'Creion',
      ed_color: 'Culoare',
      ed_label: 'Text pentru „Text" / „Pas"',
      ed_undo: 'Anulează',
      ed_clear: 'Șterge tot',
      ed_auto: 'Acoperă automat datele personale',
      ed_stamp: 'Adaugă adresa și data',
      ed_alt: 'Descriere alternativă (alt) pentru imagine – se salvează în fișierul .md',
      ed_save: 'Salvează PNG',
      ed_doc: 'Salvează PNG + descriere (.md)',
      ed_copy: 'Copiază',
      ed_close: 'Închide',
      ed_kb: 'Tastatură în imagine: săgeți = mută cursorul (Shift = pas mare), Spațiu = începe/termină desenul, Enter = plasează text/pas, Ctrl+Z = anulează, Esc = închide.',
      ed_saved: 'Salvat în folderul de descărcări',
      ed_copied: 'Copiat în clipboard',
      ed_redacted: '{n} zone cu date personale acoperite (poți dezactiva opțiunea)',
      rec_title: 'Înregistrare ecran',
      rec_local: 'Totul se întâmplă în acest browser: nimic nu este trimis și nimic nu este încărcat.',
      rec_options: 'Opțiuni',
      rec_mic: 'Microfon',
      rec_sys: 'Sunet din filă/sistem (dacă browserul îl oferă)',
      rec_fx: 'Arată clicurile (inel roșu) și tastele apăsate în pagină',
      rec_blur: 'Estompează câmpurile de parolă',
      rec_count: 'Numărătoare inversă de 3 secunde',
      rec_quality: 'Calitate',
      rec_q_low: 'Economică (2,5 Mbps)',
      rec_q_mid: 'Normală (5 Mbps)',
      rec_q_high: 'Înaltă (8 Mbps)',
      rec_start: 'Începe înregistrarea',
      rec_mark: 'Adaugă marcaj',
      rec_stop: 'Oprește',
      rec_marked: 'Marcaj adăugat',
      rec_status_idle: 'Gata. Alege ce vrei să înregistrezi (filă, fereastră sau ecran) după ce apeși „Începe".',
      rec_recording: 'Se înregistrează… {t}. Folosește „Oprește" sau butonul browserului „Oprește partajarea".',
      rec_done: 'Înregistrare terminată ({size}).',
      rec_dl_video: 'Descarcă video',
      rec_dl_vtt: 'Descarcă jurnalul de acțiuni (.vtt)',
      rec_unsupported: 'Acest browser nu permite înregistrarea ecranului din extensie.',
      perm_need: 'Browserul limitează accesul la site-uri. Acordă accesul pentru ca Claritas să funcționeze pe toate paginile.',
      perm_grant: 'Acordă acces la toate site-urile',
      sc_open: 'Schimbă scurtăturile de tastatură',
      cap_ios: 'Captura pare decupată de browser (iOS/Safari). Folosește Captură regiune sau element, sau capturile native ale sistemului.',
      rec_denied: 'Înregistrare refuzată sau anulată.',
      rec_click: 'Clic',
      rec_key: 'Tastă',
      rec_mark_ev: 'Marcaj',
      rec_nav: 'Pagină',
      rec_open: 'Înregistrează ecranul',
      tab_more: 'Mai mult',
      m_motor: 'Motricitate și control',
      m_calm: 'Calm și stabilitate',
      m_media: 'Media și voce',
      m_sys: 'Sistem și AI local',
      osPrefs: 'Respectă preferințele sistemului (contrast ridicat, mișcare redusă)',
      calm: 'Mod calm: ascunde bannere cookie, pop-up-uri, chat; oprește redarea automată',
      unstick: 'Dezlipește barele fixe (header/footer) din pagină',
      reflow: 'Reflow: o singură coloană, fără derulare orizontală',
      noFlash: 'Înghețe GIF-urile animate (clic pentru a le porni)',
      focusGuard: 'Focusul nu rămâne ascuns sub bare fixe',
      liveAudit: 'Audit continuu (semnalează probleme noi apărute în pagină)',
      hints: 'Etichete numerotate pe elemente (Alt+Shift+H)',
      scan: 'Scanare cu un singur comutator (Alt+Shift+S; Spațiu = alege)',
      scanMs: 'Viteza scanării',
      unblockPaste: 'Permite lipirea/copierea unde site-ul o blochează',
      fab: 'Buton plutitor Claritas pe pagină',
      linkInfo: 'Marchează linkurile care se deschid în fereastră nouă sau descarcă fișiere',
      altReveal: 'Arată textul alternativ al imaginilor',
      capStyle: 'Subtitrări mari și lizibile; afișează subtitrările disponibile',
      cueSize: 'Mărime subtitrări',
      playRate: 'Viteză de redare media',
      localVoices: 'Preferă vocile locale (offline)',
      autoLang: 'Alege automat vocea după limba textului',
      aiLocal: 'Funcții AI locale din Chrome (rezumat, traducere) – opțional',
      m_modules: 'Module opționale',
      modPos: 'Părți de vorbire în Cititor (aproximativ; doar română și engleză)',
      modAuditPlus: 'Reguli suplimentare de audit (ARIA, formulare, zonă principală, zoom)',
      modDict: 'Dicționar local (importat de tine) înaintea celui online',
      syncProfiles: 'Sincronizează setările între dispozitive prin contul browserului (nu și dicționarul sau capturile)',
      m_modules2: 'Module opționale (v1.7)',
      modKeys: 'Navigare rapidă (titluri, repere, listă), focus mărit și spotlight – Alt+Shift+J/K/M/N/L/G',
      modVoice: 'Control vocal (Alt+Shift+V). În Chrome, sunetul este prelucrat de serviciul de recunoaștere al browserului; Firefox nu îl are',
      modSimplify: 'Rezumat, text simplificat și glosar de abrevieri – Alt+Shift+Y',
      modImgAlt: 'Descrieri sugerate pentru imagini fără text alternativ (din legendă, titlu sau nume de fișier; marcate „generat automat”)',
      modCaps: 'Subtitrări live din microfon (Alt+Shift+C); același serviciu de recunoaștere ca la controlul vocal',
      m2_list: 'Listă repere / titluri / linkuri',
      m2_spot: 'Spotlight paragraf',
      m2_panel: 'Rezumat / simplificare / glosar',
      m2_voice: 'Control vocal pornit/oprit',
      m2_caps: 'Subtitrări live pornite/oprite',
      m_modules3: "Module opționale (v1.8)",
      modInspect: "Inspector de contrast: arată cu mouse-ul sau focalizează un text și vezi culorile reale, raportul și AA/AAA – Alt+Shift+I",
      modOrder: "Hartă a ordinii de tab, cu nume accesibile și probleme – Alt+Shift+T",
      modReadList: "Listă de citit cu note, salvată local – Alt+Shift+B",
      modSiteCss: "CSS propriu pentru acest site (stocat local) – Alt+Shift+U",
      modMath: "Descrieri vorbite pentru formule MathML; citește o formulă cu voce – Alt+Shift+Q",
      modAI: "IA locală din browser (Prompt API): întrebări despre pagină, descrieri sugerate pentru imagini – Alt+Shift+A. Doar cu acordul tău; nimic nu pleacă de pe dispozitiv",
      m3b_inspect: "Inspector de contrast pornit/oprit",
      m3b_order: "Hartă ordine tab",
      m3b_readlist: "Listă de citit",
      m3b_css: "CSS pentru acest site",
      m3b_math: "Citește formula",
      m3b_ai: "IA locală",
      m3b_axe: "Audit axe-core",
      m3_close: "Închide",
      m3_ci_none: "Nu am găsit culoare de text aici.",
      m3_ci_large: "text mare",
      m3_ci_normal: "text normal",
      m3_ci_image: "Imagine sau gradient în fundal: raportul este o estimare.",
      m3_ci_sug: "Sugestie: textul {c} atinge {r} : 1",
      m3_ci_pinned: "Fixat. Clic din nou pentru a elibera.",
      m3_ci_hint: "Arată un text sau apasă Tab. Clic pentru a fixa. Alt+Shift+I închide.",
      m3_ci_on: "Inspector de contrast pornit",
      m3_ci_off: "Inspector de contrast oprit",
      m3_or_title: "Ordinea de tab și numele accesibile",
      m3_or_sum: "{n} elemente focalizabile · {e} cu erori · {w} avertismente",
      m3_or_noname: "Fără nume accesibil",
      m3_or_postab: "Tabindex pozitiv schimbă ordinea naturală",
      m3_or_hidden: "aria-hidden pe un element focalizabil",
      m3_or_jump: "Focalizarea sare înapoi în sus pe pagină",
      m3_or_generic: "tabindex pe un element fără rol",
      m3_or_go: "Mergi la element",
      m3_or_off: "Harta ordinii de tab închisă",
      m3_rl_title: "Listă de citit și note",
      m3_rl_empty: "Lista este goală.",
      m3_rl_note: "Notă",
      m3_rl_add: "Salvează această pagină (și textul selectat)",
      m3_rl_md: "Exportă .md",
      m3_rl_json: "Exportă .json",
      m3_rl_import: "Importă .json",
      m3_rl_save: "Salvează nota",
      m3_rl_saved: "Notă salvată.",
      m3_rl_added: "Pagină adăugată în listă.",
      m3_rl_full: "Lista a atins limita de {n} pagini: cea mai veche a fost eliminată. Exportă lista ca să păstrezi tot.",
      m3_rl_del: "Elimină",
      m3_rl_markread: "Marchează ca citit",
      m3_rl_unread: "Marchează ca necitit",
      m3_rl_isread: "citit",
      m3_rl_bad: "Fișier nevalid.",
      m3_rl_imported: "{n} elemente importate.",
      m3_css_title: "CSS pentru acest site",
      m3_css_for: "Site: {h}",
      m3_css_note: "Se stochează doar în acest browser. @import și adresele externe sunt eliminate. Folosește *.exemplu.ro pentru subdomenii.",
      m3_css_save: "Salvează",
      m3_css_saved: "CSS salvat.",
      m3_css_clear: "Șterge pentru acest site",
      m3_css_cleared: "CSS șters.",
      m3_css_export: "Exportă toate site-urile",
      m3_css_import: "Importă fișier CSS (.json)",
      m3_css_t_nosticky: "Bare statice",
      m3_css_t_underline: "Linkuri subliniate",
      m3_css_t_lh: "Spațiere mai largă",
      m3_css_t_hidebanner: "Ascunde bannere",
      m3_ma_none: "Nu am găsit formule pe această pagină.",
      m3_ai_title: "IA locală pe dispozitiv",
      m3_ai_consent: "Folosește modelul integrat în browser (Prompt API din Chrome). Rulează pe acest dispozitiv, iar Claritas nu trimite nimic nicăieri. Răspunsurile pot fi greșite și sunt marcate „generat automat”.",
      m3_ai_na: "Indisponibil: necesită Chrome 148+ cu modelul local descărcat (chrome://on-device-internals).",
      m3_ai_q: "Pune o întrebare despre această pagină",
      m3_ai_ask: "Întreabă",
      m3_ai_work: "Lucrez…",
      m3_ai_sys: "Answer briefly, in the same language as the question, using only the page text below.",
      m3_ai_sys_img: "You describe images briefly and factually for people with low vision.",
      m3_ai_img: "Sugerează descrieri pentru imagini",
      m3_ai_img_q: "Describe this image in one or two sentences, to be used as alt text.",
      m3_ai_noimg: "Nu am găsit imagini fără text alternativ.",
      m3_ai_err: "Eroare: {e}",
      m3_ai_auto: "Generat automat; verifică înainte să te bazezi pe el.",
      m3_ai_apply: "Folosește ca text alternativ",
      m3_ai_applied: "Text alternativ aplicat imaginii.",
      m3_axe_na: "axe-core nu este în această versiune (folosește pachetul „-axe”).",
      m3_axe_title: "Audit axe-core (WCAG)",
      m3_axe_sum: "{n} tipuri de încălcări găsite (axe-core {v})",
      vg_btn: "Ghid de voci",
      vg_title: "Cele mai bune voci pentru limba ta",
      vg_local: "locală (offline)",
      vg_online: "online (textul poate pleca pe un server)",
      vg_test: "Ascultă",
      vg_use: "Folosește vocea",
      vg_none: "Nu am găsit voci pentru această limbă.",
      vg_sample: "Acesta este un exemplu al vocii cu care Claritas îți citește paginile.",
      vg_used: "Voce setată.",
      pdf_open: "Deschide un PDF în cititorul local",
      pdf_title: "Cititor PDF Claritas (local)",
      pdf_choose: "Fișier PDF:",
      pdf_theme: "Temă",
      pdf_fs: "Mărime text",
      pdf_lh: "Spațiere rânduri",
      pdf_font: "Font",
      pdf_search: "Caută",
      pdf_read: "Citește cu voce",
      pdf_stop: "Oprește",
      pdf_save: "Salvează textul (.txt)",
      pdf_outline: "Cuprins",
      pdf_drop: "Alege un PDF sau trage-l aici. Este citit în acest browser și nu este trimis nicăieri.",
      pdf_t_light: "Deschisă",
      pdf_t_dark: "Întunecată",
      pdf_t_sepia: "Sepia",
      pdf_t_yellow: "Galbenă",
      pdf_loading: "Citesc PDF-ul…",
      pdf_pass: "Acest PDF este protejat cu parolă și nu poate fi deschis aici.",
      pdf_err: "Nu am putut deschide PDF-ul: {e}",
      pdf_page: "Pagina {n} din {t}",
      pdf_empty: "Nu există text pe această pagină.",
      pdf_scanned: "Aproape niciun text găsit: PDF-ul este probabil o scanare. Folosește „Citește text dintr-o imagine (OCR local)” pe paginile lui.",
      pdf_done: "Gata: {n} pagini.",
      pdf_found: "{n} rezultate",
      pdf_novoice: "Sinteza vocală nu este disponibilă în acest browser.",
      p_elderly: 'Vârstnici',
      p_tremor: 'Tremor / mobilitate',
      p_photosens: 'Fotosensibilitate',
      p_adhd: 'ADHD / concentrare',
      sites_export: 'Exportă regulile pe site',
      sites_import: 'Importă reguli (JSON sau listă de domenii de dezactivat)',
      sites_ok: '{n} site-uri importate',
      sites_bad: 'Fișier necunoscut',
      rep_html: 'Raport HTML',
      rep_csv: 'Raport CSV',
      rep_json: 'Raport JSON',
      rep_base: 'Salvează ca referință',
      rep_diff: 'Compară cu referința',
      rep_base_ok: 'Referință salvată ({n} probleme)',
      rep_base_none: 'Nu există referință pentru această pagină. Rulează auditul și salvează una.',
      rep_diff_line: 'Față de referință: {a} noi, {f} rezolvate, {k} rămase',
      rep_title: 'Raport de accesibilitate',
      rep_errors: 'erori',
      rep_warnings: 'avertismente',
      rep_issues: 'Probleme',
      rep_sev: 'Severitate',
      rep_rule: 'Regulă',
      rep_target: 'Element',
      rep_fix: 'Reparare sugerată',
      rep_note: 'Verificările automate acoperă doar o parte din WCAG 2.2; rămâne necesară revizuirea manuală. Corespondența cu EN 301 549 v3.2.1 (capitolul 9).',
      priv_btn: 'Ce părăsește browserul?',
      priv_perm: 'Permisiuni: {p}',
      priv_urls: 'Adrese externe scrise în cod: {u}',
      priv_net: 'Apeluri de rețea către exterior găsite în cod: {n}',
      priv_local: 'Citiri de fișiere din interiorul extensiei: {n}',
      priv_note: 'Adresele externe sunt folosite doar când apeși 📖 (dexonline/Wiktionary) sau pornești sincronizarea prin contul browserului. Nu există telemetrie.',
      kn_none: 'Nimic găsit',
      kn_title: 'Repere, titluri și linkuri',
      kn_filter: 'Filtrează…',
      kn_spot_on: 'Spotlight pornit',
      kn_spot_off: 'Spotlight oprit',
      sm_title: 'Rezumat și simplificare',
      sm_none: 'Nu am găsit destul text pe pagină.',
      sm_sum: 'Rezumat',
      sm_ai: 'Generat de modelul local din Chrome.',
      sm_heur: 'Selecție automată a propozițiilor cele mai reprezentative (metodă statistică, nu AI); poate omite nuanțe.',
      sm_simple: 'Text simplificat (propoziții lungi împărțite)',
      sm_copy: 'Copiază textul simplificat',
      sm_copied: 'Copiat',
      sm_copy_err: 'Nu s-a putut copia',
      sm_gloss: 'Glosar: abrevieri și cuvinte lungi',
      sm_undef: 'abreviere nedefinită în pagină',
      im_auto: '[descriere generată automat]',
      vc_on: 'Ascult… spune „ajutor” pentru comenzi',
      vc_off: 'Control vocal oprit',
      vc_na: 'Recunoașterea vocală nu e disponibilă în acest browser',
      vc_denied: 'Accesul la microfon a fost refuzat',
      vc_unk: 'Nu am înțeles: {w}',
      vc_help: 'Comenzi: următorul/anteriorul titlu, următoarea/anterioara zonă, listă, rezumat, cititor, citește, oprește, mărește, micșorează, temă întunecată, jos, sus',
      cp_on: 'Subtitrări live pornite',
      cp_off: 'Subtitrări live oprite',
      cp_na: 'Recunoașterea vocală nu e disponibilă în acest browser',
      rd_pos: 'Părți de vorbire: substantiv ─, verb ╌, adjectiv ┈, adverb ═',
      dict_import: 'Importă dicționar (JSON sau TSV)',
      dict_clear: 'Șterge dicționarul',
      dict_words: 'cuvinte în dicționarul local',
      dict_big: 'Fișier prea mare (maxim 4 MB)',
      dict_bad: 'Nu am găsit intrări valide (JSON {"cuvânt":"definiție"} sau linii „cuvânt⇥definiție”)',
      sync_ok: 'Sincronizare: la zi',
      sync_err: 'Sincronizare eșuată (setări prea mari sau browser fără cont)',
      ocr_open: 'Citește text din imagine (OCR local)',
      ocr_title: 'OCR local — text din imagine',
      ocr_priv: 'Imaginea este procesată în acest browser și nu este trimisă nicăieri.',
      ocr_drop: 'Trage o imagine aici, lipește-o (Ctrl+V) sau alege un fișier:',
      ocr_lang: 'Limba textului din imagine:',
      ocr_run: 'Recunoaște textul',
      ocr_out: 'Text recunoscut',
      ocr_read: 'Citește cu voce',
      ocr_save: 'Salvează .txt',
      ocr_notimg: 'Fișierul nu este o imagine.',
      ocr_ready: 'Imagine încărcată. Apasă „Recunoaște textul”.',
      ocr_load: 'Se încarcă motorul OCR…',
      ocr_work: 'Se recunoaște textul',
      ocr_done: 'Gata.',
      ocr_none: 'Nu am găsit text în imagine.',
      ocr_err: 'Eroare OCR:',
      a_aria_role: 'Rol ARIA inexistent',
      a_aria_ref: 'Referință ARIA către un id inexistent',
      a_form_label: 'Câmp de formular fără etichetă',
      a_main_missing: 'Lipsește zona principală (main)',
      a_main_many: 'Mai multe zone principale (main)',
      a_aria_hidden_focus: 'Element focalizabil în interiorul aria-hidden',
      a_viewport_zoom: 'Zoom blocat prin meta viewport',
      a_video_captions: 'Video fără subtitrări',
      a_svg_name: 'SVG cu rol de imagine fără nume',
      a_nested_interactive: 'Elemente interactive imbricate',
      a_skip_link: 'Fără link „sari la conținut”',
      sim_glare: 'Sensibilitate la strălucire',
      sim_astig: 'Astigmatism',
      sim_dyslexia: 'Simulare dislexie (litere amestecate)',
      f_lexend: 'Lexend (lizibilitate)',
      f_atkinson: 'Atkinson Hyperlegible',
      p_calm: 'Calm / sensibilitate senzorială',
      a_focus_obscured: 'Elementul cu focus este acoperit de un element fix (WCAG 2.4.11)',
      a_spacing_clip: 'Text tăiat la spațierea WCAG 1.4.12',
      a_auth_ac: 'Câmp de parolă cu autocomplete oprit (WCAG 3.3.8)',
      chk_title: 'Verificări manuale WCAG 2.2 (nu se pot automatiza)',
      chk_help: '3.2.6 Ajutorul (contact, chat) apare în același loc pe toate paginile',
      chk_redundant: '3.3.7 Nu cere aceleași date de două ori în același proces',
      chk_drag: '2.5.7 Orice acțiune prin tragere are alternativă cu clic',
      chk_auth: '3.3.8 Autentificarea nu cere memorare/transcriere (se poate lipi, are alternativă la CAPTCHA)',
      chk_focus: '2.4.11 Parcurge pagina cu Tab: focusul nu dispare sub bare fixe',
      summary_line: '{e} erori · {w} atenționări',
      lix_line: 'Lizibilitate (LIX): {n} – {lvl}',
      lvl_very_easy: 'foarte ușor',
      lvl_easy: 'ușor',
      lvl_medium: 'mediu',
      lvl_hard: 'dificil',
      lvl_very_hard: 'foarte dificil',
      managed_note: 'Unele setări sunt impuse de administrator și nu pot fi schimbate.',
      rd_syl: 'Silabe',
      rd_linefocus: 'Focus pe rânduri',
      rd_tldr: 'Rezumat local',
      rd_tr: 'Traduce selecția',
      ai_na: 'Funcția AI locală nu este disponibilă în acest browser sau modelul nu este descărcat.',
      ai_off: 'Activează „Funcții AI locale" în fila Mai mult.',
      hint_on: 'Etichete: scrie numărul, Enter alege, Esc iese',
      scan_on: 'Scanare: Spațiu alege, Esc iese',
      calm_n: '{n} elemente ascunse în modul calm',
      fab_open: 'Claritas – acces rapid',
      alt_missing: 'LIPSĂ ALT',
      sev_tip: ''
    },
    en: {
      tab_contrast: 'Contrast', tab_color: 'Color', tab_text: 'Text', tab_read: 'Reading', tab_prof: 'Profiles',
      on_all: 'Enabled everywhere', on_site: 'Enabled on this site', site_only: 'Separate settings for this site',
      unsupported: 'This page cannot be modified (internal browser page, page not loaded, or no access).',
      fixed_n: '{n} low-contrast elements fixed on this page',
      autofix: 'Automatically fix low contrast', autofix_hint: 'Keeps the page design; only adjusts text with insufficient contrast (including disabled fields).',
      target: 'WCAG target level', aa: 'AA (4.5 : 1)', aaa: 'AAA (7 : 1)',
      outline: 'Outline fields and buttons', theme: 'Color theme',
      th_none: 'Original', th_wb: 'White on black', th_yb: 'Yellow on black', th_bw: 'Black on white', th_by: 'Black on yellow',
      th_gb: 'Green on black', th_night: 'Night', th_dark: 'Dark (inversion)', th_custom: 'Custom',
      c_bg: 'Background', c_fg: 'Text', c_link: 'Links',
      brightness: 'Brightness', contrast: 'Contrast', saturate: 'Saturation', sepia: 'Sepia', gray: 'Grayscale', warm: 'Blue-light filter',
      cb: 'Color blindness', cb_none: 'Off',
      cb_prot_fix: 'Correction – protanopia (red)', cb_deut_fix: 'Correction – deuteranopia (green)', cb_trit_fix: 'Correction – tritanopia (blue)',
      cb_sim_prot: 'Simulation – protanopia', cb_sim_deut: 'Simulation – deuteranopia', cb_sim_trit: 'Simulation – tritanopia', cb_sim_achro: 'Simulation – achromatopsia',
      zoom: 'Page zoom', textScale: 'Text size', lineHeight: 'Line spacing', letter: 'Letter spacing', word: 'Word spacing',
      font: 'Font', f_default: 'Default (page font)', f_sans: 'Clear sans-serif', f_serif: 'Serif', f_mono: 'Monospace', f_dyslexic: 'Dyslexia-friendly',
      alignLeft: 'Left-align text', auto: 'auto',
      guide: 'Reading ruler', mask: 'Reading mask', magnifier: 'Text magnifier under mouse', focus: 'Strong focus outline',
      links: 'Highlight links', cursor: 'Large cursor', noMotion: 'Stop animations', hideImages: 'Hide images',
      tts: 'Read aloud', tts_sel: 'Read selection', tts_page: 'Read page', tts_stop: 'Stop', tts_rate: 'Voice speed',
      p_lowvision: 'Low vision', p_darkcomfort: 'Low-light comfort', p_dyslexia: 'Dyslexia', p_colorblind: 'Color blindness',
      p_sensitive: 'Light / motion sensitivity', p_focus: 'Focus / ADHD', p_reset: 'Reset everything',
      p_hint: 'A profile applies a bundle of settings on top of the current ones.',
      export: 'Export', import: 'Import', lang: 'Language', shortcuts: 'Shortcuts: Alt+Shift+O (on/off), D (theme), L (read aloud), G (ruler). Editable in the browser’s extension shortcut settings.',
      zoom_reset: 'Reset zoom',
      show: 'Show on page', tts_prev: 'Previous sentence',
      tts_pause: 'Pause / resume',
      tts_next: 'Next sentence',
      hl_color: 'Highlight color {n}',
      define: 'Look up definition',
      copy: 'Copy',
      pick_hint: 'Click the element to hide · Esc to finish',
      done: 'Done',
      reader: 'Reader mode',
      rd_smaller: 'Smaller text',
      rd_larger: 'Larger text',
      rd_narrower: 'Narrower column',
      rd_wider: 'Wider column',
      rd_spacing: 'Line spacing',
      rd_theme: 'Change theme',
      rd_bionic: 'Bionic reading (bold word starts)',
      rd_gradient: 'Line color guide',
      rsvp: 'Speed reading (one word at a time)',
      close: 'Close',
      progress: 'Progress',
      rsvp_back: 'Back 10 words',
      rsvp_fwd: 'Forward 10 words',
      slower: 'Slower',
      faster: 'Faster',
      rsvp_started: 'Speed reading started',
      tab_tools: 'Tools',
      t_reader: 'Reader mode',
      t_rsvp: 'Speed reading',
      t_picker: 'Hide elements (click)',
      t_hidden_clear: 'Restore hidden elements',
      t_autoscroll: 'Auto-scroll',
      t_audit: 'Check page accessibility',
      t_outline: 'Page structure (headings, landmarks)',
      t_hl: 'Highlights on this page',
      t_hl_export: 'Export highlights',
      t_hl_clear: 'Delete all',
      t_none: 'Nothing to show.',
      inactive: 'This feature is not active on this page.',
      no_issues: 'No problems found by the automatic checks.',
      stats_line: '{w} words · ~{m} min read · {l} long sentences (>25 words) of {s}',
      sev_err: 'Error',
      sev_warn: 'Warning',
      sev_info: 'Info',
      tools_hint: 'Select text on the page to get the action bar (voice, highlight, definition).',
      hue: 'Hue rotation',
      tint: 'Color overlay (e.g. visual stress)',
      tintStrength: 'Overlay strength',
      th_tint_none: 'No overlay',
      th_tint_blue: 'Blue',
      th_tint_yellow: 'Yellow',
      th_tint_green: 'Green',
      th_tint_pink: 'Pink',
      th_tint_peach: 'Peach',
      th_tint_gray: 'Gray',
      sim: 'Vision simulator (testing)',
      sim_none: 'Off',
      sim_blur: 'Blurred vision',
      sim_cataract: 'Cataract',
      sim_tunnel: 'Tunnel vision (glaucoma)',
      sim_central: 'Central loss (macular degeneration)',
      maxWidth: 'Max paragraph width (characters)',
      bigTargets: 'Large click targets (44 px)',
      noTransform: 'Undo forced UPPERCASE',
      muteMedia: 'Mute autoplaying media',
      pointerRing: 'Ring around the pointer',
      hoverSpeech: 'Read text on mouse hover',
      dwell: 'Dwell click (hover to click)',
      dwellMs: 'Dwell time',
      selBar: 'Action bar on selection',
      ttsPitch: 'Voice pitch',
      ttsVoice: 'Voice',
      voice_default: 'Automatic (by page language)',
      scrollSpeed: 'Scroll speed',
      auto_title: 'Theme schedule',
      autoMode: 'Automatic theme',
      auto_off: 'Off',
      auto_system: 'Follow system',
      auto_time: 'By time of day',
      autoFrom: 'From',
      autoTo: 'To',
      autoTheme: 'Night-time theme',
      site_listed: 'Only listed sites (allow-list mode)',
      p_motor: 'Motor abilities',
      p_reading: 'Comfortable reading',
      a_lang: 'Page does not declare its language (lang attribute)',
      a_title: 'Page has no title',
      a_zoom: 'Zoom is blocked by the viewport meta tag',
      a_img_alt: 'Image without alternative text',
      a_img_alt_file: 'Alt text looks like a file name',
      a_name: 'Link/button without accessible name',
      a_vague: 'Vague link text (e.g. “here”)',
      a_label: 'Form field without a label',
      a_label_ph: 'Field without a label (placeholder only)',
      a_h1_none: 'No main heading (h1)',
      a_h1_many: 'Multiple h1 headings',
      a_h_empty: 'Empty heading',
      a_h_skip: 'Skipped heading level',
      a_dup_id: 'Duplicate ID',
      a_iframe_title: 'Iframe without a title',
      a_tabindex: 'Positive tabindex (alters focus order)',
      a_table_th: 'Table without header cells (th)',
      a_blink: 'Blinking/scrolling element (marquee/blink)',
      a_autoplay: 'Media that autoplays',
      a_target_small: 'Click target under 24×24 px (WCAG 2.5.8)',
      a_contrast_fixed: 'Elements with insufficient contrast fixed by Claritas',
      cap_title: 'Screenshot',
      cap_visible: 'Visible area',
      cap_region: 'Region (drag with the mouse)',
      cap_full: 'Whole page (scrolling)',
      cap_element: 'A page element',
      cap_delay: 'Visible area, 5 s delay',
      cap_hint_region: 'Drag with the mouse to choose the area. Enter = whole visible area, Esc = cancel.',
      cap_hint_element: 'Hover an element and click. Keyboard: ↑ parent, ↓ child, ←/→ sibling, Enter = choose, Esc = cancel.',
      cap_busy: 'Capturing the page… {n}%',
      cap_fail: 'Capture failed on this page (internal pages, local files without allowed access, or unsupported browser).',
      cap_countdown: 'Capture in {n} s…',
      ed_arrow: 'Arrow',
      ed_rect: 'Rectangle',
      ed_hl: 'Highlight',
      ed_blur: 'Blur',
      ed_redact: 'Black box',
      ed_text: 'Text',
      ed_step: 'Numbered step',
      ed_pen: 'Pen',
      ed_color: 'Colour',
      ed_label: 'Text for “Text” / “Step”',
      ed_undo: 'Undo',
      ed_clear: 'Clear all',
      ed_auto: 'Auto-cover personal data',
      ed_stamp: 'Add address and date',
      ed_alt: 'Alternative text (alt) for the image – saved in the .md file',
      ed_save: 'Save PNG',
      ed_doc: 'Save PNG + description (.md)',
      ed_copy: 'Copy',
      ed_close: 'Close',
      ed_kb: 'Keyboard on the image: arrows = move cursor (Shift = big step), Space = start/end drawing, Enter = place text/step, Ctrl+Z = undo, Esc = close.',
      ed_saved: 'Saved to your downloads folder',
      ed_copied: 'Copied to clipboard',
      ed_redacted: '{n} areas with personal data covered (you can turn this off)',
      rec_title: 'Screen recording',
      rec_local: 'Everything happens in this browser: nothing is sent and nothing is uploaded.',
      rec_options: 'Options',
      rec_mic: 'Microphone',
      rec_sys: 'Tab/system audio (if the browser offers it)',
      rec_fx: 'Show clicks (red ring) and pressed keys in the page',
      rec_blur: 'Blur password fields',
      rec_count: '3-second countdown',
      rec_quality: 'Quality',
      rec_q_low: 'Economy (2.5 Mbps)',
      rec_q_mid: 'Normal (5 Mbps)',
      rec_q_high: 'High (8 Mbps)',
      rec_start: 'Start recording',
      rec_mark: 'Add marker',
      rec_stop: 'Stop',
      rec_marked: 'Marker added',
      rec_status_idle: 'Ready. After you press “Start”, choose what to record (tab, window or screen).',
      rec_recording: 'Recording… {t}. Use “Stop” or the browser’s “Stop sharing” button.',
      rec_done: 'Recording finished ({size}).',
      rec_dl_video: 'Download video',
      rec_dl_vtt: 'Download action log (.vtt)',
      rec_unsupported: 'This browser does not allow screen recording from an extension.',
      perm_need: 'The browser limits site access. Grant access so Claritas works on every page.',
      perm_grant: 'Grant access to all sites',
      sc_open: 'Change keyboard shortcuts',
      cap_ios: 'The capture looks cropped by the browser (iOS/Safari). Use Region or Element capture, or the system screenshot.',
      rec_denied: 'Recording refused or cancelled.',
      rec_click: 'Click',
      rec_key: 'Key',
      rec_mark_ev: 'Marker',
      rec_nav: 'Page',
      rec_open: 'Record the screen',
      tab_more: 'More',
      m_motor: 'Motor and control',
      m_calm: 'Calm and stability',
      m_media: 'Media and voice',
      m_sys: 'System and local AI',
      osPrefs: 'Respect system preferences (high contrast, reduced motion)',
      calm: 'Calm mode: hide cookie banners, pop-ups, chat; stop autoplay',
      unstick: 'Unstick fixed bars (header/footer)',
      reflow: 'Reflow: single column, no horizontal scrolling',
      noFlash: 'Freeze animated GIFs (click to play)',
      focusGuard: 'Keep focus from hiding under fixed bars',
      liveAudit: 'Continuous audit (reports new issues that appear on the page)',
      hints: 'Numbered labels on elements (Alt+Shift+H)',
      scan: 'Single-switch scanning (Alt+Shift+S; Space = select)',
      scanMs: 'Scanning speed',
      unblockPaste: 'Allow paste/copy where the site blocks it',
      fab: 'Floating Claritas button on the page',
      linkInfo: 'Mark links that open a new window or download files',
      altReveal: 'Show image alternative text',
      capStyle: 'Large, readable captions; show available captions',
      cueSize: 'Caption size',
      playRate: 'Media playback speed',
      localVoices: 'Prefer local (offline) voices',
      autoLang: 'Pick the voice from the text language automatically',
      aiLocal: 'Local AI features in Chrome (summary, translation) – optional',
      m_modules: 'Optional modules',
      modPos: 'Parts of speech in Reader (approximate; Romanian and English only)',
      modAuditPlus: 'Extra audit rules (ARIA, forms, main landmark, zoom)',
      modDict: 'Local dictionary (imported by you) before the online one',
      syncProfiles: 'Sync settings between devices through the browser account (not the dictionary or captures)',
      m_modules2: 'Optional modules (v1.7)',
      modKeys: 'Quick navigation (headings, landmarks, list), larger focus and spotlight – Alt+Shift+J/K/M/N/L/G',
      modVoice: 'Voice control (Alt+Shift+V). In Chrome the audio is processed by the browser’s speech service; Firefox does not have it',
      modSimplify: 'Summary, simplified text and abbreviation glossary – Alt+Shift+Y',
      modImgAlt: 'Suggested descriptions for images without alt text (from caption, title or file name; marked “auto-generated”)',
      modCaps: 'Live captions from the microphone (Alt+Shift+C); same speech service as voice control',
      m2_list: 'List of landmarks / headings / links',
      m2_spot: 'Paragraph spotlight',
      m2_panel: 'Summary / simplify / glossary',
      m2_voice: 'Voice control on/off',
      m2_caps: 'Live captions on/off',
      m_modules3: "Optional modules (v1.8)",
      modInspect: "Contrast inspector: point at or focus any text to see real colors, ratio and AA/AAA – Alt+Shift+I",
      modOrder: "Tab-order map with accessible names and problems – Alt+Shift+T",
      modReadList: "Reading list with notes, saved locally – Alt+Shift+B",
      modSiteCss: "Your own CSS for this site (stored locally) – Alt+Shift+U",
      modMath: "Spoken descriptions for MathML formulas; read a formula aloud – Alt+Shift+Q",
      modAI: "On-device AI from the browser (Prompt API): ask about the page, suggest image descriptions – Alt+Shift+A. Only with your consent; nothing leaves the device",
      m3b_inspect: "Contrast inspector on/off",
      m3b_order: "Tab-order map",
      m3b_readlist: "Reading list",
      m3b_css: "CSS for this site",
      m3b_math: "Read formula aloud",
      m3b_ai: "On-device AI",
      m3b_axe: "axe-core audit",
      m3_close: "Close",
      m3_ci_none: "No text color found here.",
      m3_ci_large: "large text",
      m3_ci_normal: "normal text",
      m3_ci_image: "Background image or gradient: the ratio is an estimate.",
      m3_ci_sug: "Suggestion: text {c} reaches {r} : 1",
      m3_ci_pinned: "Pinned. Click again to unpin.",
      m3_ci_hint: "Point at text or press Tab. Click to pin. Alt+Shift+I closes.",
      m3_ci_on: "Contrast inspector on",
      m3_ci_off: "Contrast inspector off",
      m3_or_title: "Tab order and accessible names",
      m3_or_sum: "{n} focusable elements · {e} with errors · {w} warnings",
      m3_or_noname: "No accessible name",
      m3_or_postab: "Positive tabindex changes the natural order",
      m3_or_hidden: "aria-hidden on a focusable element",
      m3_or_jump: "Focus jumps back up the page",
      m3_or_generic: "tabindex on an element without a role",
      m3_or_go: "Go to element",
      m3_or_off: "Tab-order map off",
      m3_rl_title: "Reading list and notes",
      m3_rl_empty: "The list is empty.",
      m3_rl_note: "Note",
      m3_rl_add: "Save this page (and the selected text)",
      m3_rl_md: "Export .md",
      m3_rl_json: "Export .json",
      m3_rl_import: "Import .json",
      m3_rl_save: "Save note",
      m3_rl_saved: "Note saved.",
      m3_rl_added: "Page added to the list.",
      m3_rl_full: "The list reached its limit of {n} pages: the oldest was removed. Export the list to keep everything.",
      m3_rl_del: "Remove",
      m3_rl_markread: "Mark as read",
      m3_rl_unread: "Mark as unread",
      m3_rl_isread: "read",
      m3_rl_bad: "Invalid file.",
      m3_rl_imported: "{n} items imported.",
      m3_css_title: "CSS for this site",
      m3_css_for: "Site: {h}",
      m3_css_note: "Stored only in this browser. @import and external URLs are removed. Use *.example.com for subdomains.",
      m3_css_save: "Save",
      m3_css_saved: "CSS saved.",
      m3_css_clear: "Delete for this site",
      m3_css_cleared: "CSS deleted.",
      m3_css_export: "Export all sites",
      m3_css_import: "Import CSS file (.json)",
      m3_css_t_nosticky: "Static bars",
      m3_css_t_underline: "Underlined links",
      m3_css_t_lh: "Looser spacing",
      m3_css_t_hidebanner: "Hide banners",
      m3_ma_none: "No formula found on this page.",
      m3_ai_title: "On-device AI",
      m3_ai_consent: "This uses the model built into your browser (Chrome Prompt API). It runs on this device and Claritas sends nothing anywhere. Answers may be wrong and are marked auto-generated.",
      m3_ai_na: "Not available: needs Chrome 148+ with the local model downloaded (chrome://on-device-internals).",
      m3_ai_q: "Ask a question about this page",
      m3_ai_ask: "Ask",
      m3_ai_work: "Working…",
      m3_ai_sys: "Answer briefly, in the same language as the question, using only the page text below.",
      m3_ai_sys_img: "You describe images briefly and factually for people with low vision.",
      m3_ai_img: "Suggest image descriptions",
      m3_ai_img_q: "Describe this image in one or two sentences, to be used as alt text.",
      m3_ai_noimg: "No images without alt text found.",
      m3_ai_err: "Error: {e}",
      m3_ai_auto: "Auto-generated; check before relying on it.",
      m3_ai_apply: "Use as alt text",
      m3_ai_applied: "Alt text applied to the image.",
      m3_axe_na: "axe-core is not in this build (use the “-axe” package).",
      m3_axe_title: "axe-core audit (WCAG)",
      m3_axe_sum: "{n} violation types found (axe-core {v})",
      vg_btn: "Voice guide",
      vg_title: "Best voices for your language",
      vg_local: "local (offline)",
      vg_online: "online (text may go to a server)",
      vg_test: "Test",
      vg_use: "Use this voice",
      vg_none: "No voices found for this language.",
      vg_sample: "This is a sample of the voice Claritas will use to read pages aloud.",
      vg_used: "Voice set.",
      pdf_open: "Open a PDF in the local reader",
      pdf_title: "Claritas PDF reader (local)",
      pdf_choose: "PDF file:",
      pdf_theme: "Theme",
      pdf_fs: "Text size",
      pdf_lh: "Line spacing",
      pdf_font: "Font",
      pdf_search: "Search",
      pdf_read: "Read aloud",
      pdf_stop: "Stop",
      pdf_save: "Save text (.txt)",
      pdf_outline: "Contents",
      pdf_drop: "Choose a PDF or drop it here. It is read in this browser and is not sent anywhere.",
      pdf_t_light: "Light",
      pdf_t_dark: "Dark",
      pdf_t_sepia: "Sepia",
      pdf_t_yellow: "Yellow",
      pdf_loading: "Reading the PDF…",
      pdf_pass: "This PDF is password-protected and cannot be opened here.",
      pdf_err: "Could not open the PDF: {e}",
      pdf_page: "Page {n} of {t}",
      pdf_empty: "No text on this page.",
      pdf_scanned: "Almost no text found: the PDF is probably a scan. Use “Read text from an image (local OCR)” on its pages.",
      pdf_done: "Done: {n} pages.",
      pdf_found: "{n} matches",
      pdf_novoice: "Speech synthesis is not available in this browser.",
      p_elderly: 'Older adults',
      p_tremor: 'Tremor / motor',
      p_photosens: 'Photosensitivity',
      p_adhd: 'ADHD / focus',
      sites_export: 'Export site rules',
      sites_import: 'Import rules (JSON or a list of domains to disable)',
      sites_ok: '{n} sites imported',
      sites_bad: 'Unrecognised file',
      rep_html: 'HTML report',
      rep_csv: 'CSV report',
      rep_json: 'JSON report',
      rep_base: 'Save as baseline',
      rep_diff: 'Compare with baseline',
      rep_base_ok: 'Baseline saved ({n} issues)',
      rep_base_none: 'No baseline for this page. Run the audit and save one.',
      rep_diff_line: 'Versus baseline: {a} new, {f} fixed, {k} remaining',
      rep_title: 'Accessibility report',
      rep_errors: 'errors',
      rep_warnings: 'warnings',
      rep_issues: 'Issues',
      rep_sev: 'Severity',
      rep_rule: 'Rule',
      rep_target: 'Element',
      rep_fix: 'Suggested fix',
      rep_note: 'Automatic checks cover only part of WCAG 2.2; manual review is still required. Mapping to EN 301 549 v3.2.1 clause 9.',
      priv_btn: 'What leaves the browser?',
      priv_perm: 'Permissions: {p}',
      priv_urls: 'External addresses written in the code: {u}',
      priv_net: 'Network calls to outside targets found in the code: {n}',
      priv_local: 'Reads of files inside the extension: {n}',
      priv_note: 'External addresses are used only when you press 📖 (dexonline/Wiktionary) or turn on browser-account sync. There is no telemetry.',
      kn_none: 'Nothing found',
      kn_title: 'Landmarks, headings and links',
      kn_filter: 'Filter…',
      kn_spot_on: 'Spotlight on',
      kn_spot_off: 'Spotlight off',
      sm_title: 'Summary and simplification',
      sm_none: 'Not enough text found on the page.',
      sm_sum: 'Summary',
      sm_ai: 'Generated by Chrome’s local model.',
      sm_heur: 'Automatic selection of the most representative sentences (statistical method, not AI); may miss nuance.',
      sm_simple: 'Simplified text (long sentences split)',
      sm_copy: 'Copy simplified text',
      sm_copied: 'Copied',
      sm_copy_err: 'Could not copy',
      sm_gloss: 'Glossary: abbreviations and long words',
      sm_undef: 'abbreviation not defined on the page',
      im_auto: '[auto-generated description]',
      vc_on: 'Listening… say “help” for commands',
      vc_off: 'Voice control off',
      vc_na: 'Speech recognition is not available in this browser',
      vc_denied: 'Microphone access was denied',
      vc_unk: 'Did not understand: {w}',
      vc_help: 'Commands: next/previous heading, next/previous landmark, list, summary, reader, read, stop, zoom in, zoom out, dark mode, down, up',
      cp_on: 'Live captions on',
      cp_off: 'Live captions off',
      cp_na: 'Speech recognition is not available in this browser',
      rd_pos: 'Parts of speech: noun ─, verb ╌, adjective ┈, adverb ═',
      dict_import: 'Import dictionary (JSON or TSV)',
      dict_clear: 'Delete dictionary',
      dict_words: 'words in the local dictionary',
      dict_big: 'File too large (4 MB maximum)',
      dict_bad: 'No valid entries found (JSON {"word":"definition"} or lines “word⇥definition”)',
      sync_ok: 'Sync: up to date',
      sync_err: 'Sync failed (settings too large or browser not signed in)',
      ocr_open: 'Read text from an image (local OCR)',
      ocr_title: 'Local OCR — text from an image',
      ocr_priv: 'The image is processed in this browser and is not sent anywhere.',
      ocr_drop: 'Drop an image here, paste it (Ctrl+V) or choose a file:',
      ocr_lang: 'Language of the text in the image:',
      ocr_run: 'Recognize text',
      ocr_out: 'Recognized text',
      ocr_read: 'Read aloud',
      ocr_save: 'Save .txt',
      ocr_notimg: 'The file is not an image.',
      ocr_ready: 'Image loaded. Press “Recognize text”.',
      ocr_load: 'Loading the OCR engine…',
      ocr_work: 'Recognizing text',
      ocr_done: 'Done.',
      ocr_none: 'No text found in the image.',
      ocr_err: 'OCR error:',
      a_aria_role: 'Invalid ARIA role',
      a_aria_ref: 'ARIA reference to a missing id',
      a_form_label: 'Form field without a label',
      a_main_missing: 'Missing main landmark',
      a_main_many: 'More than one main landmark',
      a_aria_hidden_focus: 'Focusable element inside aria-hidden',
      a_viewport_zoom: 'Zoom blocked by meta viewport',
      a_video_captions: 'Video without captions',
      a_svg_name: 'Image-role SVG without a name',
      a_nested_interactive: 'Nested interactive elements',
      a_skip_link: 'No “skip to content” link',
      sim_glare: 'Glare sensitivity',
      sim_astig: 'Astigmatism',
      sim_dyslexia: 'Dyslexia simulation (shuffled letters)',
      f_lexend: 'Lexend (readability)',
      f_atkinson: 'Atkinson Hyperlegible',
      p_calm: 'Calm / sensory sensitivity',
      a_focus_obscured: 'Focused element is covered by a fixed element (WCAG 2.4.11)',
      a_spacing_clip: 'Text clipped under WCAG 1.4.12 spacing',
      a_auth_ac: 'Password field with autocomplete off (WCAG 3.3.8)',
      chk_title: 'Manual WCAG 2.2 checks (cannot be automated)',
      chk_help: '3.2.6 Help (contact, chat) appears in the same place on every page',
      chk_redundant: '3.3.7 Does not ask for the same data twice in one process',
      chk_drag: '2.5.7 Every drag action has a click alternative',
      chk_auth: '3.3.8 Sign-in needs no memorising/transcribing (paste works, CAPTCHA has an alternative)',
      chk_focus: '2.4.11 Tab through the page: focus never disappears under fixed bars',
      summary_line: '{e} errors · {w} warnings',
      lix_line: 'Readability (LIX): {n} – {lvl}',
      lvl_very_easy: 'very easy',
      lvl_easy: 'easy',
      lvl_medium: 'medium',
      lvl_hard: 'hard',
      lvl_very_hard: 'very hard',
      managed_note: 'Some settings are enforced by your administrator and cannot be changed.',
      rd_syl: 'Syllables',
      rd_linefocus: 'Line focus',
      rd_tldr: 'Local summary',
      rd_tr: 'Translate selection',
      ai_na: 'Local AI is not available in this browser, or the model is not downloaded.',
      ai_off: 'Turn on “Local AI features” in the More tab.',
      hint_on: 'Labels: type the number, Enter selects, Esc exits',
      scan_on: 'Scanning: Space selects, Esc exits',
      calm_n: '{n} elements hidden by calm mode',
      fab_open: 'Claritas – quick access',
      alt_missing: 'ALT MISSING',
      sev_tip: ''
    }
  };
  /* 8 limbi: en și ro sunt incluse; celelalte se încarcă la cerere din lang/<cod>.json (prin background, local, fără rețea) */
  const LANGS = ['en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu'];
  const LANG_NAMES = { en: 'English', ro: 'Română', fr: 'Français', it: 'Italiano', es: 'Español', pt: 'Português', de: 'Deutsch', hu: 'Magyar' };
  const langCode = (l) => { const c = (!l || l === 'auto') ? (navigator.language || 'en').slice(0, 2).toLowerCase() : l; return LANGS.indexOf(c) >= 0 ? c : 'en'; };
  const langPending = {};
  function loadLang(l) {
    const c = langCode(l);
    if (I18N[c]) return Promise.resolve(c);
    if (langPending[c]) return langPending[c];
    const api = typeof browser !== 'undefined' ? browser : chrome;
    /* la eșec punem un dicționar gol (cade pe engleză) ca să nu reîncercăm la nesfârșit */
    langPending[c] = Promise.resolve().then(() => api.runtime.sendMessage({ type: 'lang', code: c })).then((r) => { I18N[c] = (r && r.dict && typeof r.dict === 'object') ? r.dict : {}; if (!Object.keys(I18N[c]).length) setTimeout(() => { if (I18N[c] && !Object.keys(I18N[c]).length) delete I18N[c]; }, 4000); delete langPending[c]; return c; }, () => { I18N[c] = {}; setTimeout(() => { if (I18N[c] && !Object.keys(I18N[c]).length) delete I18N[c]; }, 4000); delete langPending[c]; return c; });
    return langPending[c];
  }
  function t(lang, key, vars) {
    lang = langCode(lang);
    const d = I18N[lang] || I18N.en;
    let s = d[key] != null ? d[key] : (I18N.en[key] != null ? I18N.en[key] : key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(String(vars[k])); });
    return s;
  }

  return { siteKey, TINTS, TINT_ORDER, SIMS, AUTO_MODES, sanitize, sanitizeSites, isHex, DEFAULTS, THEMES, THEME_ORDER, FONTS, PRESETS, I18N, LANGS, LANG_NAMES, langCode, loadLang, t, parseColor, hexToRgb, lum, ratio, over, rgbStr, fixColor, cbMatrix, resolve, applyPatch, osAdjust, mergeManaged, syllabify, readability, detectLang, FONT_FILES, UR_LATIN, UR_EXT, CB_MODES: CB_MODES };
})();
