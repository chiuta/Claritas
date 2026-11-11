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
    $$('[data-i18n-title]').forEach((el) => { el.title = t(L, el.dataset.i18nTitle); });
    document.documentElement.lang = L === 'auto' ? (navigator.language || 'en').slice(0, 2) : L;
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
  function bindTools() {
    $$('[data-feat]').forEach((b) => b.addEventListener('click', async () => {
      const r = await feat(b.dataset.feat);
      if (!r || r.inactive) { $('#auditStats').textContent = t(lang(), 'inactive'); return; }
      if (b.dataset.feat !== 'hiddenClear') setTimeout(() => window.close(), 60);
    }));
    $('#auditBtn').addEventListener('click', async () => {
      const r = await feat('audit');
      if (!r || !r.ok) { $('#auditStats').textContent = t(lang(), 'inactive'); return; }
      const s = r.stats; $('#auditStats').textContent = t(lang(), 'stats_line', { w: s.words, m: s.minutes, l: s.longSentences, s: s.sentences }) + (s.lix != null ? ' · ' + t(lang(), 'lix_line', { n: s.lix, lvl: t(lang(), 'lvl_' + s.level) }) : '');
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
      box.appendChild(sc);
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
    render();
    refreshStats(); refreshZoom();
    setTimeout(refreshStats, 900);
  }

  function bind() {
    /* tab-uri */
    $$('.tabs [role=tab]').forEach((tab) => tab.addEventListener('click', () => {
      $$('.tabs [role=tab]').forEach((x) => { const on = x === tab; x.setAttribute('aria-selected', String(on)); $('#' + x.getAttribute('aria-controls')).hidden = !on; });
    }));
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
