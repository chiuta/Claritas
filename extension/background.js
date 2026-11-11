/* CLARITAS — fundal minimal: doar scurtături de tastatură (absente pe unele browsere mobile). */
const api = typeof browser !== 'undefined' ? browser : chrome;

if (api.commands && api.commands.onCommand) {
  api.commands.onCommand.addListener(async (cmd) => {
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (tab) await api.tabs.sendMessage(tab.id, { type: 'command', cmd }, { frameId: 0 });
    } catch (e) { /* pagină fără content script (ex. pagini interne) */ }
  });
}

/* Captură locală: captureVisibleTab dă o imagine data: care rămâne în browser; nimic nu este trimis nicăieri. */
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'cap-visible') {
    const wid = sender && sender.tab ? sender.tab.windowId : undefined;
    const go = () => api.tabs.captureVisibleTab(wid, { format: 'png' });
    /* captureVisibleTab fotografiază fila ACTIVĂ a ferestrei: refuză dacă fila care cere captura nu mai e activă */
    (sender && sender.tab && sender.tab.id != null ? api.tabs.get(sender.tab.id).then((t) => { if (!t.active) throw new Error('hidden-tab'); return go(); }) : go()).then((url) => sendResponse({ url }), (e) => sendResponse({ err: String(e && e.message || e) }));
    return true;
  }
  if (msg.type === 'lang') {
    const c = String(msg.code || ''); if (!/^(fr|it|es|pt|de|hu)$/.test(c)) { sendResponse({ dict: null }); return; }
    fetch(api.runtime.getURL('lang/' + c + '.json')).then((r) => r.json()).then((d) => sendResponse({ dict: d }), () => sendResponse({ dict: null }));
    return true;
  }
  if (msg.type === 'cap-mask') {
    if (sender && sender.tab) api.tabs.sendMessage(sender.tab.id, { type: 'cap-mask', on: !!msg.on }).catch(() => { });
    sendResponse({ ok: true }); return;
  }
  if (msg.type === 'rec-open') {
    api.tabs.create({ url: api.runtime.getURL('recorder.html') }).then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
});

/* ========= Sincronizare opțională a setărilor (storage.sync al browserului; implicit oprită) =========
   Se sincronizează doar „settings” și „sites”, comprimat în bucăți ASCII; nu se trimit dicționarul, capturile sau înregistrările.
   Opțiunea syncProfiles rămâne pe fiecare dispozitiv în parte. Conflict: câștigă modificarea cea mai recentă. */
(function () {
  const SY = api.storage && api.storage.sync, LO = api.storage && api.storage.local;
  if (!SY || !LO || !api.storage.onChanged) return;
  const CH = 6000, MAXC = 12; let pushT = null, applying = false;
  const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  const dec = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));
  async function devId() { const r = await LO.get('syncDev'); if (r.syncDev) return r.syncDev; const id = Math.random().toString(36).slice(2) + Date.now().toString(36); await LO.set({ syncDev: id }); return id; }
  const setStatus = (o) => LO.set({ syncStatus: Object.assign({ at: Date.now() }, o) }).catch(() => { });
  async function push() {
    pushT = null;
    try {
      const r = await LO.get(['settings', 'sites']);
      if (!r.settings || r.settings.syncProfiles !== true) return;
      const st = Object.assign({}, r.settings); delete st.syncProfiles;
      const s = enc({ settings: st, sites: r.sites || {} });
      const n = Math.ceil(s.length / CH);
      if (n > MAXC) return setStatus({ ok: false, err: 'size' });
      const dev0 = await devId(), l0 = await LO.get('syncT'), m0 = (await SY.get('cs_meta')).cs_meta;
      if (m0 && m0.dev !== dev0 && m0.t > (l0.syncT || 0)) { await pull(); return; }
      const t = Date.now(), dev = dev0, items = { cs_meta: { t, n, dev } };
      for (let i = 0; i < n; i++) items['cs_' + i] = s.slice(i * CH, (i + 1) * CH);
      applying = true;
      await SY.set(items);
      const old = []; for (let i = n; i < MAXC; i++) old.push('cs_' + i); if (old.length) await SY.remove(old);
      await LO.set({ syncT: t });
      setStatus({ ok: true, dir: 'push' });
    } catch (e) { setStatus({ ok: false, err: 'quota' }); } finally { setTimeout(() => { applying = false; }, 500); }
  }
  async function pull() {
    try {
      const l = await LO.get(['settings', 'syncT']);
      if (!l.settings || l.settings.syncProfiles !== true) return;
      const m = (await SY.get('cs_meta')).cs_meta; if (!m || !m.n || m.n > MAXC) return;
      const me = await devId(); if (m.dev === me || m.t <= (l.syncT || 0)) return;
      const keys = []; for (let i = 0; i < m.n; i++) keys.push('cs_' + i);
      const got = await SY.get(keys); let s = ''; for (const k of keys) { if (typeof got[k] !== 'string') return; s += got[k]; }
      const d = dec(s); if (!d || typeof d.settings !== 'object') return;
      applying = true;
      await LO.set({ settings: Object.assign({}, d.settings, { syncProfiles: true }), sites: d.sites && typeof d.sites === 'object' ? d.sites : {}, syncT: m.t });
      setStatus({ ok: true, dir: 'pull' });
    } catch (e) { setStatus({ ok: false, err: 'read' }); } finally { setTimeout(() => { applying = false; }, 500); }
  }
  api.storage.onChanged.addListener((ch, area) => {
    if (area === 'local' && (ch.settings || ch.sites) && !applying) { clearTimeout(pushT); pushT = setTimeout(push, 3000); }
    if (area === 'sync' && ch.cs_meta) pull();
  });
  if (api.runtime.onStartup) api.runtime.onStartup.addListener(() => { pull().then(() => { }); });
  if (api.runtime.onInstalled) api.runtime.onInstalled.addListener(() => { pull(); });
  pull();
})();
