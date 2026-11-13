(() => {
  'use strict';
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const { DEFAULTS, THEMES, THEME_ORDER, PRESETS, t, resolve, applyPatch } = CLR;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  let G = {}, SITES = {}, MG = null, MSITES = null, LOCKED = [], MANAGED = null, host = null, tabId = null, supported = false;

  const hk = () => CLR.siteKey(SITES, host);
  /* G/SITES = valorile brute ale utilizatorului (se scriu în storage); MG/MSITES = valorile efective, cu politica administratorului aplicată */
  function recompute() { const m = CLR.mergeManaged(G, SITES, MANAGED); MG = m.G; MSITES = m.SITES; LOCKED = m.locked; }
  const cur = () => { if (!MG) recompute(); return resolve(MG, MSITES[CLR.siteKey(MSITES, host)]); };
  const lang = () => cur().s.lang;

  let pend = {}, timer = null;
  function flush() { const w = pend; pend = {}; timer = null; return api.storage.local.set(w).catch(() => { }); }
  /* actualizare imediată în interfață, scriere în storage grupată (glisoarele nu inundă toate filele) */
  function save(w) {
    if (w.settings) G = w.settings;
    if (w.sites) SITES = w.sites;
    Object.assign(pend, w); recompute();
    if (!timer) timer = setTimeout(flush, 120);
    render();
  }
  addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); flush(); } });
  const patch = (p) => save(applyPatch(G, SITES, hk(), p));
  const isLocked = (k) => LOCKED.indexOf(k) >= 0;

  function fmt(key, v) {
    if (key === 'lineHeight') return v === 0 ? t(lang(), 'auto') : v.toFixed(1);
    if (key === 'letter' || key === 'word') return v === 0 ? t(lang(), 'auto') : v.toFixed(2) + ' em';
    if (key === 'ttsRate' || key === 'ttsPitch') return v.toFixed(1) + '×';
    if (key === 'scrollSpeed') return v + ' px/s';
    if (key === 'scanMs') return (v / 1000).toFixed(1) + ' s';
    if (key === 'playRate') return v.toFixed(2).replace(/0$/, '') + '×';
    if (key === 'dwellMs') return (v / 1000).toFixed(1) + ' s';
    if (key === 'maxWidth') return v === 0 ? t(lang(), 'auto') : v + ' ch';
    if (key === 'hue') return v + '°';
    return v + '%';
  }

  function buildThemes() {
    const box = $('#themes');
    box.textContent = '';
    THEME_ORDER.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.theme = id;
      const sw = document.createElement('span'); sw.className = 'sw'; sw.setAttribute('aria-hidden', 'true');
      if (THEMES[id]) { sw.style.background = THEMES[id].bg; sw.style.color = THEMES[id].fg; sw.textContent = 'Aa'; }
      else if (id === 'dark') { sw.style.background = '#111'; sw.style.color = '#eee'; sw.textContent = 'Aa'; }
      else if (id === 'custom') { sw.style.background = 'linear-gradient(135deg,#f33,#3f3,#33f)'; sw.textContent = ''; }
      else { sw.style.background = '#fff'; sw.style.color = '#111'; sw.textContent = 'Aa'; }
      const lab = document.createElement('span'); lab.dataset.i18n = 'th_' + id;
      b.append(sw, lab);
      b.addEventListener('click', () => patch({ theme: id }));
      box.appendChild(b);
    });
  }

  function translate() {
    const L = lang();
    if (!CLR.I18N[CLR.langCode(L)]) CLR.loadLang(L).then(() => translate());
    $$('[data-i18n]').forEach((el) => { el.textContent = t(L, el.dataset.i18n); });
    $$('[data-i18n-title]').forEach((el) => { el.title = t(L, el.dataset.i18nTitle); if (el.matches("button[data-tts]")) el.setAttribute("aria-label", el.title); });
    $$('[data-i18n-aria]').forEach((el) => { const v = t(L, el.dataset.i18nAria); el.setAttribute('aria-label', v); if (el.tagName === 'BUTTON') el.title = v; });
    $$('[data-i18n-ph]').forEach((el) => { const v = t(L, el.dataset.i18nPh); el.placeholder = v + '…'; el.setAttribute('aria-label', v); });
    document.documentElement.lang = (window.CLR && CLR.langCode) ? CLR.langCode(L) : (L === 'auto' ? (navigator.language || 'en').slice(0, 2) : L);
  }

  function render() {
    const r = cur(), s = r.s;
    translate();
    $('#enabled').checked = G.enabled !== false;
    $('#siteOn').checked = !r.off;
    $('#siteOn').disabled = !host;
    $('#siteOnly').checked = r.scoped;
    $('#siteOnly').disabled = !host;
    $('#unsupported').hidden = supported;
    $$('[data-k]').forEach((el) => {
      const k = el.dataset.k;
      if (el.type === 'checkbox') el.checked = !!s[k];
      else el.value = String(s[k]);
      el.disabled = isLocked(k);
      const out = el.parentElement.querySelector('output');
      if (out && el.type === 'range') out.textContent = fmt(k, Number(s[k]));
    });
    $$('#themes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === s.theme)));
    $('#managedNote').hidden = !LOCKED.length;
    $('#customBox').hidden = s.theme !== 'custom';
    $$('[data-ck]').forEach((el) => { el.value = s.custom[el.dataset.ck]; });
  }

  async function refreshStats() {
    if (tabId == null) return;
    try {
      const r = await api.tabs.sendMessage(tabId, { type: 'stats' });
      $('#fixedInfo').textContent = r ? t(lang(), 'fixed_n', { n: r.fixed }) : '';
    } catch (e) { $('#fixedInfo').textContent = ''; }
  }
  async function refreshZoom() {
    try { const z = await api.tabs.getZoom(tabId); $('#zoomVal').textContent = Math.round(z * 100) + '%'; } catch (e) { }
  }

  function buildAutoTheme() {
    const sel = $('#autoTheme'); sel.textContent = '';
    THEME_ORDER.filter((id) => id !== 'none').forEach((id) => { const o = document.createElement('option'); o.value = id; o.dataset.i18n = 'th_' + id; sel.appendChild(o); });
  }
  function fillVoices() {
    const sel = $('#voiceSel'); if (!sel) return;
    if (typeof speechSynthesis === 'undefined') { sel.closest('.field').hidden = true; return; }
    const fill = () => {
      const keep = sel.value || (cur().s.ttsVoice || '');
      sel.textContent = '';
      const d = document.createElement('option'); d.value = ''; d.textContent = t(lang(), 'voice_default'); sel.appendChild(d);
      speechSynthesis.getVoices().slice(0, 400).forEach((v) => { const o = document.createElement('option'); o.value = v.voiceURI; o.textContent = v.name + ' (' + v.lang + ')'; sel.appendChild(o); });
      sel.value = Array.from(sel.options).some((o) => o.value === keep) ? keep : '';
    };
    fill(); speechSynthesis.onvoiceschanged = fill;
    bindVoiceGuide(sel);
  }
  /* Ghid de voci: clasează vocile pentru limba paginii/interfeței (locale înaintea celor online) */
  function vgScore(v, L) {
    const lg = (v.lang || '').toLowerCase().replace('_', '-'); let s = 0;
    if (lg.startsWith(L)) s += 8; else return -1;
    if (v.localService) s += 6;
    if (/natural|neural|premium|enhanced|siri|studio|online/i.test(v.name)) s += 3;
    if (v.default) s += 1;
    return s;
  }
  function bindVoiceGuide(sel) {
    const btn = $('#vgBtn'), box = $('#vgBox'), ul = $('#vgList'), info = $('#vgInfo'); if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!box.hidden) { box.hidden = true; return; }
      let L = CLR.langCode(lang()).slice(0, 2); try { const pi = await pageInfo(); if (pi && pi.lang && /^[a-z]{2}/i.test(pi.lang)) L = pi.lang.slice(0, 2).toLowerCase(); } catch (e) { }
      const vs = speechSynthesis.getVoices().map((v) => ({ v, s: vgScore(v, L) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).slice(0, 12);
      ul.textContent = ''; info.textContent = vs.length ? '' : t(lang(), 'vg_none');
      vs.forEach(({ v }) => {
        const li = document.createElement('li'); li.textContent = v.name + ' (' + v.lang + ') · ' + t(lang(), v.localService ? 'vg_local' : 'vg_online') + ' ';
        const a = document.createElement('button'); a.type = 'button'; a.textContent = t(lang(), 'vg_test');
        a.addEventListener('click', () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t(lang(), 'vg_sample')); u.voice = v; u.lang = v.lang; speechSynthesis.speak(u); } catch (e) { } });
        const b = document.createElement('button'); b.type = 'button'; b.textContent = t(lang(), 'vg_use');
        b.addEventListener('click', () => { sel.value = v.voiceURI; sel.dispatchEvent(new Event('change', { bubbles: true })); info.textContent = t(lang(), 'vg_used'); });
        li.append(a, b); ul.appendChild(li);
      });
      box.hidden = false;
    });
  }
  function bindModules3() {
    $$('[data-m3]').forEach((b) => b.addEventListener('click', async () => {
      const r = await feat('m3', { what: b.dataset.m3 }), i = $('#m3Info');
      if (!r || r.inactive) { i.textContent = tl('inactive'); return; }
      if (r.off) { i.textContent = tl('m_modules3'); return; }
      if (r.na && b.dataset.m3 === 'axe') { i.textContent = tl('m3_axe_na'); return; }
      if (r.na) { i.textContent = tl('m3_ai_na'); return; }
      setTimeout(() => window.close(), 60);
    }));
    /* variantele opționale se recunosc din manifest (fără sonde de rețea/fișiere): -axe adaugă vendor/axe.min.js la scripturile de conținut, -pdf are CSP cu worker-src */
    try {
      const mf = api.runtime.getManifest(), csp = mf.content_security_policy, c = typeof csp === 'string' ? csp : (csp && csp.extension_pages) || '';
      if ((mf.content_scripts || []).some((x) => (x.js || []).indexOf('vendor/axe.min.js') >= 0)) $('#axeBtn').hidden = false;
      if (/worker-src/.test(c)) { const b = $('#pdfOpen'); b.hidden = false; b.addEventListener('click', () => { api.tabs.create({ url: api.runtime.getURL('pdf.html') }); window.close(); }); }
    } catch (e) { }
  }
  const send = (msg) => (tabId == null ? Promise.resolve(null) : api.tabs.sendMessage(tabId, msg).catch(() => null));
  const feat = (cmd, extra) => send(Object.assign({ type: 'feat', cmd }, extra || {}));
  function li(cls, ...kids) { const e = document.createElement('li'); if (cls) e.className = cls; e.append(...kids); return e; }
  const sp = (txt, cls) => { const e = document.createElement('span'); e.textContent = txt; if (cls) e.className = cls; return e; };
  const locBtn = (id) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = '↗'; b.title = b.ariaLabel = t(lang(), 'show'); b.addEventListener('click', () => { feat('locate', { id }); }); return b; };
  async function refreshHL() {
    const r = await feat('hlList'), ul = $('#hlList'); ul.textContent = '';
    if (!r || !r.ok) { ul.appendChild(li('', sp(t(lang(), 'inactive')))); return; }
    if (!r.items.length) { ul.appendChild(li('', sp(t(lang(), 't_none')))); return; }
    const COL = { 1: '#fff176', 2: '#a5d6a7', 3: '#81d4fa', 4: '#f8bbd0' };
    r.items.forEach((h) => {
      const sw = sp('', 'sw'); sw.style.background = COL[h.c];
      const x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', t(lang(), 'close'));
      x.addEventListener('click', async () => { await feat('hlDelete', { id: h.id }); refreshHL(); });
      ul.appendChild(li('', sw, sp(h.t.length > 90 ? h.t.slice(0, 90) + '…' : h.t), x));
    });
    $('#hlList').dataset.items = JSON.stringify(r.items);
  }
  function renderIssues(items, kind) {
    const ul = $('#auditList'); ul.textContent = '';
    if (!items.length) { ul.appendChild(li('', sp(t(lang(), kind === 'audit' ? 'no_issues' : 't_none')))); return; }
    items.forEach((it) => {
      if (kind === 'audit') ul.appendChild(li(it.sev, sp(t(lang(), 'sev_' + it.sev), 'sev'), sp(t(lang(), 'a_' + it.rule) + (it.label ? ' — ' + it.label : '')), ...(it.id >= 0 ? [locBtn(it.id)] : [])));
      else { const e = li('', sp((it.kind === 'h' ? 'H' + it.level : '◆'), 'sev'), sp(it.text)); e.style.paddingLeft = (it.kind === 'h' ? (it.level - 1) * 8 : 0) + 6 + 'px'; e.append(locBtn(it.id)); ul.appendChild(e); }
    });
  }
  let lastAudit = null;
  function bindTools() {
    bindReport();
    $$('[data-feat]').forEach((b) => b.addEventListener('click', async () => {
      const r = await feat(b.dataset.feat);
      if (!r || r.inactive) { $('#auditStats').textContent = t(lang(), 'inactive'); return; }
      if (b.dataset.feat !== 'hiddenClear') setTimeout(() => window.close(), 60);
    }));
    $('#auditBtn').addEventListener('click', async () => {
      const r = await feat('audit');
      if (!r || !r.ok) { $('#auditStats').textContent = t(lang(), 'inactive'); return; }
      const s = r.stats; $('#auditStats').textContent = t(lang(), 'stats_line', { w: s.words, m: s.minutes, l: s.longSentences, s: s.sentences }) + (s.lix != null ? ' · ' + t(lang(), 'lix_line', { n: s.lix, lvl: t(lang(), 'lvl_' + s.level) }) : '');
      lastAudit = r.items; $('#repBtns').hidden = false;
      const ec = r.items.filter((i) => i.sev === 'err').length, wc = r.items.filter((i) => i.sev === 'warn').length;
      $('#auditStats').textContent += ' · ' + t(lang(), 'summary_line', { e: ec, w: wc });
      renderIssues(r.items, 'audit');
    });
    $('#outlineBtn').addEventListener('click', async () => {
      const r = await feat('outline'); $('#auditStats').textContent = '';
      if (!r || !r.ok) { $('#auditStats').textContent = t(lang(), 'inactive'); return; }
      renderIssues(r.items, 'outline');
    });
    $('#hlClear').addEventListener('click', async () => { await feat('hlClear'); refreshHL(); });
    $('#hlExport').addEventListener('click', () => {
      let items = []; try { items = JSON.parse($('#hlList').dataset.items || '[]'); } catch (e) { }
      if (!items.length) return;
      const body = '# ' + (document.title || 'Claritas') + '\n' + (host || '') + '\n\n' + items.map((h) => '> ' + h.t).join('\n\n') + '\n';
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/markdown' })); a.download = 'claritas-evidentieri.md'; a.hidden = true;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    });
    $('#t-tools').addEventListener('click', refreshHL);
    $$('[data-cap]').forEach((b) => b.addEventListener('click', async () => { if (tabId != null) { try { await api.tabs.sendMessage(tabId, { type: 'cap', cmd: b.dataset.cap }); } catch (e) { const m = document.createElement('div'); m.setAttribute('role', 'alert'); m.style.cssText = 'margin:8px;padding:8px;border:2px solid #b00020;border-radius:6px;font-weight:600'; m.textContent = t(lang(), 'cap_fail'); b.closest('section,div').appendChild(m); return; } } window.close(); }));
    $('#recBtn').addEventListener('click', () => { api.tabs.create({ url: api.runtime.getURL('recorder.html') }); window.close(); });
    /* alternative la limitările browserelor: acces la site-uri retras (Chrome „la clic”, Firefox), scurtături în conflict, înregistrare indisponibilă */
    try {
      const all = { origins: ['<all_urls>'] }, box = document.querySelector('#recBtn').parentElement;
      api.permissions.contains(all).then((has) => {
        if (has) return; const d = document.createElement('div'); d.setAttribute('role', 'alert'); d.style.cssText = 'margin:8px 0;padding:8px;border:2px solid #b00020;border-radius:6px;font-weight:600';
        d.textContent = t(lang(), 'perm_need') + ' '; const g = document.createElement('button'); g.type = 'button'; g.textContent = t(lang(), 'perm_grant');
        g.addEventListener('click', () => { api.permissions.request(all).then((ok) => { if (ok) d.remove(); }); }); d.appendChild(g); document.body.insertBefore(d, document.body.firstChild);
      }, () => { });
      const sc = document.createElement('button'); sc.type = 'button'; sc.textContent = t(lang(), 'sc_open');
      sc.addEventListener('click', () => { try { if (api.commands && api.commands.openShortcutSettings) api.commands.openShortcutSettings(); else api.tabs.create({ url: typeof browser !== 'undefined' ? 'about:addons' : 'chrome://extensions/shortcuts' }); } catch (e) { } });
      if ((api.commands && api.commands.openShortcutSettings) || /Firefox\//.test(navigator.userAgent) && !/Android|Mobile/.test(navigator.userAgent) || /Chrome\//.test(navigator.userAgent) && !/Safari\/[\d.]+ Version|Mobile/.test(navigator.userAgent)) box.appendChild(sc);
      if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.MediaRecorder)) { const rb = document.querySelector('#recBtn'); rb.disabled = true; rb.title = t(lang(), 'rec_unsupported'); }
    } catch (e) { }
    /* verificări manuale WCAG 2.2, memorate per site */
    const chkKey = () => 'chk:' + (host || '*');
    api.storage.local.get(chkKey()).then((r) => { const v = r && r[chkKey()] || {}; $$('[data-chk]').forEach((c) => { c.checked = v[c.dataset.chk] === true; }); }).catch(() => { });
    $$('[data-chk]').forEach((c) => c.addEventListener('change', () => {
      const v = {}; $$('[data-chk]').forEach((x) => { if (x.checked) v[x.dataset.chk] = true; });
      api.storage.local.set({ [chkKey()]: v }).catch(() => { });
    }));
  }
  async function init() {
    const st = await api.storage.local.get(['settings', 'sites']);
    G = st.settings && typeof st.settings === 'object' ? st.settings : {}; SITES = CLR.sanitizeSites(st.sites);
    try { if (api.storage.managed) api.storage.managed.get(null).then((m) => { MANAGED = m; recompute(); render(); }, () => { }); } catch (e) { }
    recompute();
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      tabId = tab ? tab.id : null;
      const r = tab ? await api.tabs.sendMessage(tab.id, { type: 'host' }) : null;
      if (r && r.host) { host = r.host; supported = true; }
    } catch (e) { supported = false; }
    if (!api.tabs || !api.tabs.setZoom || !api.tabs.getZoom) { const z = $('#zoomOut'); if (z) z.closest('.field').hidden = true; }
    buildThemes();
    buildAutoTheme();
    fillVoices();
    bind();
    bindTools();
    bindModules(); bindModules2(); bindModules3();
    render();
    refreshStats(); refreshZoom();
    setTimeout(refreshStats, 900);
  }

  async function bindModules() {
    const tr = (k) => t(lang() === 'auto' ? (navigator.language || 'en').slice(0, 2) : lang(), k);
    const info = $('#dictInfo'), M = CLR.mod;
    const refresh = async () => {
      const n = await M.dictCount().catch(() => 0);
      info.textContent = n ? n + ' ' + tr('dict_words') : '';
      try {
        const r = await api.storage.local.get('syncStatus'), s = r && r.syncStatus;
        $('#syncInfo').textContent = s ? (s.ok ? tr('sync_ok') : tr('sync_err')) : '';
      } catch (e) { }
    };
    $('#dictImport').addEventListener('click', () => $('#dictFile').click());
    $('#dictFile').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      if (f.size > 4 * 1024 * 1024) { info.textContent = tr('dict_big'); return; }
      const txt = await f.text(), p = M.dictParse(txt);
      if (!p.n) { info.textContent = tr('dict_bad'); return; }
      const r = await M.dictSave(p.dict);
      info.textContent = r.ok ? r.n + ' ' + tr('dict_words') : tr('dict_big');
      e.target.value = '';
    });
    $('#dictClear').addEventListener('click', async () => { await M.dictClear(); refresh(); });
    try { const mf = api.runtime.getManifest(), csp = mf.content_security_policy; if (csp && (() => { const c = typeof csp === 'string' ? csp : (csp.extension_pages || ''); return /wasm-unsafe-eval/.test(c) && !/worker-src/.test(c); })()) { const b = $('#ocrOpen'); b.hidden = false; b.addEventListener('click', () => api.tabs.create({ url: api.runtime.getURL('ocr.html') })); } } catch (e) { }
    try { api.storage.onChanged.addListener((ch, a) => { if (a === 'local' && (ch.syncStatus || ch.dictLocal)) refresh(); }); } catch (e) { }
    refresh();
  }

  /* ---------- v1.7: raport de audit, module noi, reguli pe site, panou confidențialitate ---------- */
  const tl = (k, v) => t(lang() === 'auto' ? (navigator.language || 'en').slice(0, 2) : lang(), k, v);
  function download(name, mime, text) {
    const a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
  }
  async function pageInfo() {
    let url = '', title = '';
    try { const [tb] = await api.tabs.query({ active: true, currentWindow: true }); if (tb) { url = tb.url || ''; title = tb.title || ''; } } catch (e) { }
    return { url, title };
  }
  const baseKey = (url) => { try { const u = new URL(url); return u.origin + u.pathname; } catch (e) { return url || 'page'; } };
  function bindReport() {
    const R = CLR.report; if (!R) return;
    const names = () => { const o = {}; Object.keys(R.MAP).forEach((k) => { o[k] = tl('a_' + k); }); return o; };
    $$('[data-rep]').forEach((b) => b.addEventListener('click', async () => {
      if (!lastAudit) return; const fmt = b.dataset.rep, pi = await pageInfo(), L = {};
      ['title', 'errors', 'warnings', 'issues', 'sev', 'rule', 'target', 'fix', 'note'].forEach((k) => { L[k] = tl('rep_' + k); });
      const meta = { url: pi.url, title: pi.title, date: new Date().toISOString().slice(0, 16).replace('T', ' '), version: api.runtime.getManifest().version, names: names(), labels: L, lang: CLR.langCode(lang()) };
      download('claritas-audit.' + fmt, fmt === 'html' ? 'text/html' : fmt === 'csv' ? 'text/csv' : 'application/json', R.build(lastAudit, meta, fmt));
    }));
    $('#repBase').addEventListener('click', async () => {
      if (!lastAudit) return; const pi = await pageInfo(), r = await api.storage.local.get('auditBase'), all = (r && r.auditBase && typeof r.auditBase === 'object') ? r.auditBase : {};
      const keys = Object.keys(all); if (keys.length > 60) delete all[keys[0]];
      all[baseKey(pi.url)] = R.keys(lastAudit); await api.storage.local.set({ auditBase: all });
      $('#auditStats').textContent = tl('rep_base_ok', { n: all[baseKey(pi.url)].length });
    });
    $('#repDiff').addEventListener('click', async () => {
      if (!lastAudit) return; const pi = await pageInfo(), r = await api.storage.local.get('auditBase'), prev = r && r.auditBase && r.auditBase[baseKey(pi.url)];
      if (!prev) { $('#auditStats').textContent = tl('rep_base_none'); return; }
      const d = R.diff(prev, lastAudit); $('#auditStats').textContent = tl('rep_diff_line', { a: d.added.length, f: d.fixed.length, k: d.kept.length });
    });
  }
  function bindModules2() {
    $$('[data-m2]').forEach((b) => b.addEventListener('click', async () => {
      const r = await feat('m2', { what: b.dataset.m2 });
      if (!r || r.inactive) { const i = $('#sitesInfo'); if (i) i.textContent = tl('inactive'); return; }
      if (r.off) { const i = $('#sitesInfo'); if (i) i.textContent = tl('m_modules2'); return; }
      setTimeout(() => window.close(), 60);
    }));
    $('#sitesExport').addEventListener('click', () => download('claritas-sites.json', 'application/json', JSON.stringify({ claritas: 'sites', v: 1, sites: SITES }, null, 2)));
    $('#sitesImport').addEventListener('click', () => $('#sitesFile').click());
    $('#sitesFile').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return; const info = $('#sitesInfo');
      if (f.size > 512 * 1024) { info.textContent = tl('sites_bad'); return; }
      const txt = await f.text(); let add = null;
      try { const j = JSON.parse(txt); add = CLR.sanitizeSites(j && j.sites ? j.sites : j); } catch (x) { }
      if (!add || !Object.keys(add).length) {
        const hosts = txt.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim().toLowerCase()).filter((l) => /^(\*\.)?[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(l) && l.length < 254);
        if (hosts.length) { add = {}; hosts.forEach((h) => { add[h] = { off: true }; }); add = CLR.sanitizeSites(add); }
      }
      if (!add || !Object.keys(add).length) { info.textContent = tl('sites_bad'); return; }
      const sites = Object.assign({}, SITES); Object.keys(add).forEach((k) => { sites[k] = add[k]; });
      save({ sites }); info.textContent = tl('sites_ok', { n: Object.keys(add).length }); e.target.value = '';
    });
    $('#privBtn').addEventListener('click', privacyReport);
  }
  async function privacyReport() {
    const ul = $('#privList'); ul.textContent = ''; const mf = api.runtime.getManifest();
    const add = (s) => { const l = document.createElement('li'); l.textContent = s; ul.appendChild(l); };
    const files = new Set(['popup.js', 'report.js']);
    (mf.content_scripts || []).forEach((c) => (c.js || []).forEach((f) => files.add(f)));
    if (mf.background) { if (mf.background.service_worker) files.add(mf.background.service_worker); (mf.background.scripts || []).forEach((f) => files.add(f)); }
    const F = 'fet' + 'ch', hosts = {}, ext = [], loc = [];
    for (const f of files) {
      let src = ''; try { src = await (await self[F](api.runtime.getURL(f))).text(); } catch (e) { continue; }
      (src.match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || []).forEach((u) => { const h = u.replace(/^https?:\/\//i, '').toLowerCase(); if (!/(^|\.)w3\.org$|^example\.|^claude\.|^github\.com|buymeacoffee|patreon|trom\.tf/.test(h)) (hosts[h] = hosts[h] || new Set()).add(f); });
      const re = new RegExp('(?:\\b' + F + '|sendBeacon|new\\s+WebSocket|new\\s+EventSource|new\\s+XMLHttpRequest|new\\s+Image|importScripts)\\s*\\(([^)]{0,90})', 'g'); let m;
      while ((m = re.exec(src))) { if (/getURL/.test(m[1]) || /getURL|data:image/.test(src.slice(Math.max(0, m.index - 420), m.index + m[0].length))) loc.push(f); else ext.push(f + ': ' + m[0].slice(0, 70).replace(/\s+/g, ' ')); }
    }
    add(tl('priv_perm', { p: (mf.permissions || []).concat(mf.host_permissions || []).join(', ') || '—' }));
    add(tl('priv_urls', { u: Object.keys(hosts).map((h) => h + ' (' + Array.from(hosts[h]).join(', ') + ')').join('; ') || '0' }));
    add(tl('priv_net', { n: ext.length }));
    ext.slice(0, 8).forEach((x) => add('  · ' + x));
    add(tl('priv_local', { n: loc.length }));
    add(tl('priv_note'));
  }

  function bind() {
    /* tab-uri */
    const TABS = $$('.tabs [role=tab]');
    const showTab = (tab, focus) => {
      TABS.forEach((x) => { const on = x === tab; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
      try { tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { }
      if (focus) tab.focus();
      try { api.storage.local.set({ uiTab: tab.id }); } catch (e) { }
    };
    TABS.forEach((tab, i) => {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', () => showTab(tab, false));
      tab.addEventListener('keydown', (e) => {
        const n = TABS.length; let j = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
        if (j >= 0) { e.preventDefault(); showTab(TABS[j], true); }
      });
    });
    try { api.storage.local.get('uiTab').then((r) => { const tb = r && r.uiTab && document.getElementById(r.uiTab); if (tb && tb.getAttribute('aria-selected') !== 'true' && !$('#q').value) showTab(tb, false); }); } catch (e) { }
    /* căutare în setări (toate tab-urile) */
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const qIn = $('#q');
    const searchUnits = () => $$('main label, main fieldset > .btns > button, main > section > button, main details > summary').filter((el) => !el.closest('.custom, .timeRow, .list'));
    const runSearch = () => {
      const raw = qIn.value.trim(), words = norm(raw).split(/\s+/).filter(Boolean);
      $('#qClear').hidden = !raw;
      const panels = $$('main > section[role=tabpanel]'), tabsEl = $('.tabs');
      $$('.sx-hide').forEach((e) => e.classList.remove('sx-hide'));
      if (!words.length) {
        tabsEl.classList.remove('searching'); $('#searchLive').textContent = '';
        const sel = TABS.find((x) => x.getAttribute('aria-selected') === 'true') || TABS[0];
        panels.forEach((pn) => { pn.hidden = pn.id !== sel.getAttribute('aria-controls'); });
        return;
      }
      tabsEl.classList.add('searching');
      const units = searchUnits(); let hits = 0;
      const hitSet = new Set();
      units.forEach((u) => {
        let txt = norm(u.textContent); const nx = u.nextElementSibling; if (nx && nx.classList.contains('hint')) txt += ' ' + norm(nx.textContent);
        const ok = words.every((w) => txt.includes(w));
        if (ok) { hits++; hitSet.add(u); } else u.classList.add('sx-hide');
      });
      /* indiciile (.hint) urmează unitatea; containerele fără rezultate dispar */
      $$('main .hint').forEach((hp) => { const pv = hp.previousElementSibling; if (!(pv && hitSet.has(pv))) hp.classList.add('sx-hide'); });
      panels.forEach((pn) => {
        $$('fieldset, details', pn).forEach((f) => { if (!$$('label, button', f).some((x) => hitSet.has(x) && !x.classList.contains('sx-hide'))) f.classList.add('sx-hide'); });
        const any = units.some((u) => pn.contains(u) && hitSet.has(u));
        pn.hidden = !any;
        $$('details', pn).forEach((d) => { if (!d.classList.contains('sx-hide')) d.open = true; });
      });
      $('#searchLive').textContent = hits ? tl('ui_found', { n: hits }) : tl('ui_none', { q: raw });
    };
    qIn.addEventListener('input', runSearch);
    qIn.addEventListener('keydown', (e) => { if (e.key === 'Escape' && qIn.value) { e.preventDefault(); e.stopPropagation(); qIn.value = ''; runSearch(); } });
    $('#qClear').addEventListener('click', () => { qIn.value = ''; runSearch(); qIn.focus(); });
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '');
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); qIn.focus(); qIn.select(); }
    });
    /* acțiuni rapide */
    const qLive = (m) => { $('#qLive').textContent = ''; setTimeout(() => { $('#qLive').textContent = m; }, 30); };
    $('#qTheme').addEventListener('click', () => {
      const order = THEME_ORDER.filter((x) => x !== 'custom'), now = cur().s.theme, nx = order[(Math.max(0, order.indexOf(now)) + 1) % order.length];
      patch({ theme: nx }); qLive(tl('ui_theme_now', { t: tl('th_' + nx) }));
    });
    $('#qRead').addEventListener('click', () => { send({ type: 'tts', mode: 'toggle' }); });
    $('#qPlus').addEventListener('click', () => zoomBy(0.1));
    $('#qMinus').addEventListener('click', () => zoomBy(-0.1));
    /* comutatoare */
    $('#enabled').addEventListener('change', (e) => save({ settings: Object.assign({}, G, { enabled: e.target.checked }) }));
    $('#siteOn').addEventListener('change', (e) => {
      const key = hk(), site = Object.assign({}, SITES[key] || {});
      if (cur().only) { if (e.target.checked) site.on = true; else delete site.on; }
      else if (e.target.checked) delete site.off; else site.off = true;
      const sites = Object.assign({}, SITES);
      if (Object.keys(site).length) sites[key] = site; else delete sites[key];
      save({ sites });
    });
    $('#siteOnly').addEventListener('change', (e) => {
      const key = hk(), sites = Object.assign({}, SITES);
      const site = Object.assign({}, sites[key] || {});
      const flags = {}; if (site.off) flags.off = true; if (site.on) flags.on = true;
      if (e.target.checked) sites[key] = Object.assign({}, cur().s, flags, { scoped: true });
      else if (Object.keys(flags).length) sites[key] = flags; else delete sites[key];
      save({ sites });
    });
    /* controale generice */
    $$('[data-k]').forEach((el) => {
      const k = el.dataset.k;
      const ev = el.type === 'range' ? 'input' : 'change';
      el.addEventListener(ev, () => {
        let v;
        if (el.type === 'checkbox') v = el.checked;
        else if (el.type === 'range' || el.dataset.num) v = parseFloat(el.value);
        else v = el.value;
        if (k === 'lang' || k === 'onlyListed') save({ settings: Object.assign({}, G, { [k]: v }) });
        else patch({ [k]: v });
      });
    });
    $$('[data-ck]').forEach((el) => el.addEventListener('input', () => {
      patch({ custom: Object.assign({}, cur().s.custom, { [el.dataset.ck]: el.value }) });
    }));
    /* profile */
    $$('[data-profile]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.profile;
      if (id === 'reset') {
        const keep = { enabled: G.enabled, lang: G.lang };
        const reset = {}; Object.keys(DEFAULTS).forEach((k) => { if (k !== 'enabled' && k !== 'lang') reset[k] = DEFAULTS[k]; });
        const site = SITES[hk()];
        if (site && site.scoped) { const key = hk(); const sites = Object.assign({}, SITES, { [key]: Object.assign({}, reset, { scoped: true }, site.off ? { off: true } : {}, site.on ? { on: true } : {}) }); save({ sites }); }
        else save({ settings: Object.assign({}, keep, reset) });
      } else patch(PRESETS[id]);
    }));
    /* voce */
    $$('[data-tts]').forEach((b) => b.addEventListener('click', () => {
      if (tabId != null) api.tabs.sendMessage(tabId, { type: 'tts', mode: b.dataset.tts }).catch(() => { });
    }));
    /* zoom pagină */
    const zoomBy = async (d) => { try { const z = await api.tabs.getZoom(tabId); await api.tabs.setZoom(tabId, Math.min(5, Math.max(0.25, Math.round((z + d) * 100) / 100))); refreshZoom(); } catch (e) { } };
    $('#zoomIn').addEventListener('click', () => zoomBy(0.1));
    $('#zoomOut').addEventListener('click', () => zoomBy(-0.1));
    $('#zoomReset').addEventListener('click', async () => { try { await api.tabs.setZoom(tabId, 0); refreshZoom(); } catch (e) { } });
    /* export / import */
    $('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ claritas: 1, settings: G, sites: SITES }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'claritas-setari.json'; a.hidden = true;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    });
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        if (f.size > 1e6) throw new Error('prea mare');
        const j = JSON.parse(await f.text());
        if (j && j.claritas && j.settings && typeof j.settings === 'object' && !Array.isArray(j.settings)) {
          const clean = CLR.sanitize(j.settings);
          save({ settings: clean, sites: CLR.sanitizeSites(j.sites) });
        }
      } catch (err) { /* fișier invalid */ }
      e.target.value = '';
    });
  }

  init();
})();
