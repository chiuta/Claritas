/* Claritas — module opționale (inerte până nu sunt activate din popup → „Module opționale”).
   1) părți de vorbire aproximative (RO/EN), pentru Cititor
   2) reguli suplimentare de audit
   3) dicționar local importat de utilizator (nimic nu pleacă din browser)
   Fără rețea. Euristic: etichetele sunt orientative, nu analiză lingvistică completă. */
(function () {
  'use strict';
  const CLR = (window.CLR = window.CLR || {});
  const mod = (CLR.mod = CLR.mod || {});
  const api = typeof browser !== 'undefined' ? browser : chrome;

  /* ---------- 1. părți de vorbire ---------- */
  const W = (s) => new Set(s.split(/\s+/));
  const FUNC = {
    en: W('a an the and or but nor so yet if than that this these those of in on at to for from by with without about against between into through during before after above below up down out off over under again further then once here there when where why how all any both each few more most other some such no not only own same too very can will just i me my we our you your he him his she her it its they them their who whom which what whose is are was were be been being am do does did doing have has had having would could should may might must shall as while until because although whether either neither also'),
    ro: W('un o niște unui unei ale al a ai lui lor și sau dar iar ci dacă că ce cine care cui cât cum unde când de din în la pe pentru cu fără prin sub peste între despre către spre după până lângă contra față ca să se nu nici nici și eu tu el ea noi voi ei ele mă te mi ți ne vă le îl o îi lui ei mea mele tău tale său sale nostru noastră voastră acesta aceasta aceștia acestea acel acea acei acele însuși cel cea cei cele tot toată toți toate fiecare orice oricare'),
  };
  const ADV = {
    en: W('not very too quite rather almost always never often sometimes usually already still just only even also then here there now soon later today tomorrow yesterday well badly fast hard'),
    ro: W('foarte mai prea destul aproape mereu niciodată adesea uneori deja încă doar numai chiar tot acum apoi atunci aici acolo azi mâine ieri bine rău repede tare acolo aproape departe jos sus'),
  };
  const AUX = {
    en: W('is are was were be been being am do does did have has had will would can could should may might must'),
    ro: W('sunt ești este e suntem sunteți era erau fi fost am ai are avem aveți au avea voi vei va vom veți vor aș ai ar am ați ar'),
  };
  const SUF = {
    en: {
      r: [/ly$/],
      v: [/(ize|ise|ify|ate)$/, /(ing|ed)$/],
      n: [/(tion|sion|ment|ness|ity|ance|ence|ship|hood|ism|ist|age|ure|ery|dom)s?$/],
      a: [/(ous|ful|less|able|ible|ive|ical|ish|ary|al|ic|ent|ant)$/],
    },
    ro: {
      r: [/mente$/],
      v: [/(ează|ește|ăște|âște|ăm|ați|ând|ind|esc)$/, /(at|ut|it|ât|ât)(ă|e|i)?$/, /^(a|să)\s/],
      n: [/(ție|ția|ției|re|rea|ire|ime|imea|ință|ința|tate|tatea|ism|ismul|ist|istă|tor|toare|ier|iere|ător|ătoare|ărie|aj|ajul|ment|mentul)$/],
      a: [/(os|oasă|oși|oase|esc|ească|ești|ibil|ibilă|ic|ică|ici|ice|al|ală|ali|ale|iv|ivă|ar|ară|ari|are|uit|uită)$/],
    },
  };
  function langOf(l) { const c = String(l || '').slice(0, 2).toLowerCase(); return c === 'ro' || c === 'en' ? c : null; }
  /* 'n' substantiv, 'v' verb, 'a' adjectiv, 'r' adverb, 'f' cuvânt-funcție, '' necunoscut */
  mod.pos = function (word, lang) {
    const L = langOf(lang); if (!L) return '';
    const w = String(word).toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
    if (w.length < 1 || !/^\p{L}+$/u.test(w)) return '';
    if (FUNC[L].has(w)) return 'f';
    if (AUX[L].has(w)) return 'v';
    if (ADV[L].has(w)) return 'r';
    if (w.length < 4) return '';
    const order = L === 'en' ? ['r', 'n', 'a', 'v'] : ['r', 'n', 'a', 'v'];
    for (const k of order) if (SUF[L][k].some((re) => re.test(w))) return k;
    return '';
  };
  mod.posLang = langOf;

  /* ---------- 2. reguli suplimentare de audit ---------- */
  const ROLES = W('alert alertdialog application article banner button cell checkbox columnheader combobox complementary contentinfo definition dialog directory document feed figure form grid gridcell group heading img link list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio meter navigation none note option presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status switch tab table tablist tabpanel term textbox timer toolbar tooltip tree treegrid treeitem generic paragraph');
  const FOCUSABLE = 'a[href],button,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"]),summary';
  const visible = (el) => { try { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; } catch (e) { return false; } };
  const ours = (el) => !!(el.closest && el.closest('#clr-cap,#clr-f,#clr-ui,[id^="clr-"]'));
  mod.auditPlus = function (add, doc) {
    doc = doc || document;
    let n = 0; const cap = () => n++ > 250;
    doc.querySelectorAll('[role]').forEach((el) => {
      if (cap() || ours(el)) return;
      const r = (el.getAttribute('role') || '').trim().toLowerCase().split(/\s+/)[0];
      if (r && !ROLES.has(r)) add('aria_role', 'err', el);
    });
    doc.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls],[aria-owns]').forEach((el) => {
      if (cap() || ours(el)) return;
      ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'].forEach((a) => {
        const v = el.getAttribute(a); if (!v) return;
        const ids = v.trim().split(/\s+/);
        const found = ids.filter((id) => { try { return !!doc.getElementById(id); } catch (e) { return false; } });
        if (!found.length) add('aria_ref', 'err', el);
      });
    });
    doc.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]),select,textarea').forEach((el) => {
      if (cap() || ours(el) || !visible(el)) return;
      const name = (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('aria-labelledby') ? 'x' : '') || (el.getAttribute('title') || '').trim();
      const hasLabel = el.labels && el.labels.length && Array.from(el.labels).some((l) => (l.textContent || '').trim());
      if (!name && !hasLabel) add('form_label', 'err', el);
    });
    const mains = doc.querySelectorAll('main,[role=main]');
    if (doc.body && !mains.length && doc.body.querySelectorAll('*').length > 40) add('main_missing', 'warn', doc.body);
    else if (mains.length > 1) add('main_many', 'warn', mains[1]);
    doc.querySelectorAll('[aria-hidden=true]').forEach((el) => {
      if (cap() || ours(el)) return;
      const f = el.matches(FOCUSABLE) ? el : el.querySelector(FOCUSABLE);
      if (f && f.getAttribute('tabindex') !== '-1' && !f.disabled && visible(f)) add('aria_hidden_focus', 'err', f);
    });
    const vp = doc.querySelector('meta[name=viewport]');
    if (vp) {
      const c = (vp.getAttribute('content') || '').toLowerCase();
      const mx = /maximum-scale\s*=\s*([\d.]+)/.exec(c);
      if (/user-scalable\s*=\s*(no|0)/.test(c) || (mx && parseFloat(mx[1]) < 2)) add('viewport_zoom', 'err', vp);
    }
    doc.querySelectorAll('video').forEach((el) => {
      if (cap() || ours(el) || el.muted && el.loop && !el.controls) return;
      if (!el.querySelector('track[kind=captions],track[kind=subtitles]')) add('video_captions', 'warn', el);
    });
    doc.querySelectorAll('svg[role=img],svg[aria-hidden=false]').forEach((el) => {
      if (cap() || ours(el)) return;
      if (!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.querySelector('title'))) add('svg_name', 'err', el);
    });
    doc.querySelectorAll('a[href] button,button a[href],a[href] a[href]').forEach((el) => { if (!cap() && !ours(el)) add('nested_interactive', 'warn', el); });
    const first = doc.querySelector(FOCUSABLE);
    if (first && doc.querySelectorAll('nav a,header a,[role=navigation] a').length > 8) {
      const h = first.getAttribute('href') || '';
      if (!(first.localName === 'a' && h.charAt(0) === '#' && h.length > 1)) add('skip_link', 'info', first);
    }
  };

  /* ---------- 3. dicționar local ---------- */
  const KEY = 'dictLocal', MAX = 4 * 1024 * 1024;
  let cache = null;
  const norm = (w) => String(w).toLowerCase().normalize('NFC').replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  mod.dictParse = function (text) {
    const out = {}; let n = 0;
    const t = String(text).replace(/^﻿/, '').trim();
    if (!t) return { dict: out, n };
    if (t[0] === '{') { let o; try { o = JSON.parse(t); } catch (e) { return { dict: out, n, err: 'json' }; } for (const k of Object.keys(o)) { const v = typeof o[k] === 'string' ? o[k] : Array.isArray(o[k]) ? o[k].join('; ') : ''; const nk = norm(k); if (nk && v) { out[nk] = v.slice(0, 600); n++; } } }
    else if (t[0] === '[') { let a; try { a = JSON.parse(t); } catch (e) { return { dict: out, n, err: 'json' }; } for (const e of a) { const k = e && (e.word || e.w || e[0]), v = e && (e.def || e.d || e.definition || e[1]); const nk = norm(k || ''); if (nk && typeof v === 'string') { out[nk] = v.slice(0, 600); n++; } } }
    else t.split(/\r?\n/).forEach((ln) => { const m = /^([^\t;|]+)[\t;|]\s*(.+)$/.exec(ln); if (m) { const nk = norm(m[1]); if (nk) { out[nk] = m[2].trim().slice(0, 600); n++; } } });
    return { dict: out, n };
  };
  mod.dictSave = async function (dict) {
    const s = JSON.stringify(dict); if (s.length > MAX) return { ok: false, err: 'size' };
    await api.storage.local.set({ [KEY]: dict }); cache = dict; return { ok: true, n: Object.keys(dict).length };
  };
  mod.dictClear = async function () { cache = {}; await api.storage.local.remove(KEY); };
  mod.dictCount = async function () { const r = await api.storage.local.get(KEY); return r && r[KEY] ? Object.keys(r[KEY]).length : 0; };
  mod.dictLookup = async function (word) {
    if (!cache) { try { const r = await api.storage.local.get(KEY); cache = r && r[KEY] && typeof r[KEY] === 'object' ? r[KEY] : {}; } catch (e) { cache = {}; } }
    const w = norm(word); if (!w) return null;
    if (Object.prototype.hasOwnProperty.call(cache, w)) return cache[w];
    const alt = [w.replace(/(ului|ilor|elor|ul|ii|ei|le|lui|ele)$/, ''), w.replace(/(s|es|ed|ing)$/, '')].find((x) => x.length > 2 && x !== w && Object.prototype.hasOwnProperty.call(cache, x));
    return alt ? cache[alt] : null;
  };
  try { api.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch[KEY]) cache = null; }); } catch (e) { }
})();
