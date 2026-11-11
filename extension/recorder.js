/* CLARITAS — înregistrare ecran 100 % locală: getDisplayMedia + MediaRecorder, fișierele se descarcă direct din browser.
   Jurnalul de acțiuni (clic, taste, marcaje, navigare) vine de la capture.js din filele înregistrate și devine un fișier WebVTT. */
(async () => {
  'use strict';
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const $ = (id) => document.getElementById(id);
  let LG = 'auto';
  try { const st = await api.storage.local.get('settings'); if (st && st.settings && st.settings.lang) LG = st.settings.lang; } catch (e) { }
  const L = () => LG;
  try { await CLR.loadLang(LG); } catch (e) { }
  const T = (k, v) => CLR.t(L(), k, v);
  const set = (id, k) => { $(id).textContent = T(k); };
  document.documentElement.lang = CLR.langCode(LG);
  [['h', 'rec_title'], ['loc', 'rec_local'], ['lg', 'rec_options'], ['l_mic', 'rec_mic'], ['l_sys', 'rec_sys'], ['l_fx', 'rec_fx'], ['l_blur', 'rec_blur'], ['l_cnt', 'rec_count'], ['l_q', 'rec_quality'],
    ['q1', 'rec_q_low'], ['q2', 'rec_q_mid'], ['q3', 'rec_q_high'], ['start', 'rec_start'], ['mark', 'rec_mark'], ['stop', 'rec_stop']].forEach(([i, k]) => set(i, k));
  $('status').textContent = T('rec_status_idle');

  let mr = null, chunks = [], stream = null, t0 = 0, tick = null, events = [], actx = null, urls = [];
  const fmtT = (ms) => { const s = Math.floor(ms / 1000), p = (n) => String(n).padStart(2, '0'); return p(Math.floor(s / 60)) + ':' + p(s % 60); };
  const vttT = (ms) => { ms = Math.max(0, ms); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, x = ms % 1000, p = (n, w = 2) => String(n).padStart(w, '0'); return p(h) + ':' + p(m) + ':' + p(s) + '.' + p(x, 3); };
  const status = (m) => { $('status').textContent = m; };

  api.runtime.onMessage.addListener((msg) => { if (msg && msg.type === 'rec-ev' && mr && mr.state !== 'inactive' && msg.ev) events.push(msg.ev); });

  function pickMime() { const c = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']; return c.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || ''; }
  let capT = null, hb = null;
  const warnLeave = (e) => { e.preventDefault(); e.returnValue = ''; };
  const setRec = (on, beat) => { try { if (on) api.storage.local.set({ recSession: { on: true, beat: Date.now(), t0, fx: $('fx').checked, keys: $('fx').checked, blur: $('blur').checked } }); else api.storage.local.remove('recSession'); } catch (e) { } };

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.MediaRecorder) return status(T('rec_unsupported'));
    $('out').hidden = true; urls.forEach((u) => URL.revokeObjectURL(u)); urls = []; chunks = []; events = [];
    let disp, mic = null;
    try {
      disp = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30, cursor: 'always' }, audio: $('sys').checked });
      if ($('mic').checked) { try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { mic = null; } }
    } catch (e) { return status(T('rec_denied')); }
    const tracks = [...disp.getVideoTracks()];
    const aSrc = [disp, mic].filter((s) => s && s.getAudioTracks().length);
    if (aSrc.length) {
      try { actx = new AudioContext(); const dst = actx.createMediaStreamDestination(); aSrc.forEach((s) => actx.createMediaStreamSource(new MediaStream(s.getAudioTracks())).connect(dst)); tracks.push(...dst.stream.getAudioTracks()); }
      catch (e) { aSrc[0].getAudioTracks().forEach((t) => tracks.push(t)); }
    }
    stream = new MediaStream(tracks); const raw = [disp, mic];
    stream.__raw = raw;
    if ($('cnt').checked) { for (let i = 3; i > 0; i--) { status(String(i)); await new Promise((r) => setTimeout(r, 1000)); } }
    const mime = pickMime(); const opts = { videoBitsPerSecond: +$('q').value }; if (mime) opts.mimeType = mime;
    try { mr = new MediaRecorder(stream, opts); } catch (e) { cleanup(); return status(T('rec_unsupported')); }
    mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = finish;
    disp.getVideoTracks()[0].addEventListener('ended', () => { if (mr && mr.state !== 'inactive') mr.stop(); });
    t0 = Date.now(); mr.start(1000); setRec(true);
    try { if (actx && actx.state === 'suspended') actx.resume(); } catch (e) { }
    addEventListener('beforeunload', warnLeave);
    capT = setTimeout(() => { if (mr && mr.state !== 'inactive') mr.stop(); }, 2 * 3600 * 1000);   // plafon 2 h (memorie)
    hb = setInterval(() => setRec(true, true), 5000);
    $('start').disabled = true; $('stop').disabled = false; $('mark').disabled = false; $('opts').disabled = true;
    tick = setInterval(() => { const ms = Date.now() - t0; $('timer').textContent = fmtT(ms); if (ms % 5000 < 1000) status(T('rec_recording', { t: fmtT(ms) })); }, 1000);
    status(T('rec_recording', { t: '00:00' }));
  }
  function cleanup() {
    clearInterval(tick); tick = null; clearInterval(hb); clearTimeout(capT); removeEventListener('beforeunload', warnLeave); setRec(false);
    if (stream) { (stream.__raw || []).forEach((s) => s && s.getTracks().forEach((t) => t.stop())); stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (actx) { try { actx.close(); } catch (e) { } actx = null; }
    $('start').disabled = false; $('stop').disabled = true; $('mark').disabled = true; $('opts').disabled = false;
  }
  function stop() { if (mr && mr.state !== 'inactive') mr.stop(); }
  function mark() { events.push({ t: Date.now(), k: 'mark', text: '' }); status(T('rec_marked')); }
  function vtt() {
    const lines = ['WEBVTT', '', 'NOTE Jurnal de acțiuni creat local de Claritas. Nu conține text tastat în câmpuri, doar taste speciale și comenzi.', ''];
    const ev = events.filter((e) => e.t >= t0 - 500).sort((a, b) => a.t - b.t); let n = 1;
    ev.forEach((e, i) => {
      const s = e.t - t0, end = Math.min(s + 2500, (ev[i + 1] ? ev[i + 1].t - t0 : s + 2500)); const text = e.k === 'click' ? T('rec_click') + ': ' + (e.text || '') : e.k === 'key' ? T('rec_key') + ': ' + e.text : e.k === 'mark' ? '★ ' + T('rec_mark_ev') : T('rec_nav') + ': ' + (e.text || e.url || '');
      lines.push(String(n++), vttT(s) + ' --> ' + vttT(Math.max(end, s + 600)), text.replace(/-->/g, '→'), '');
    });
    return lines.join('\n');
  }
  /* WebM din MediaRecorder nu are Duration (nu se poate căuta în timp): îl scriem în antetul Info, local, fără rețea. */
  async function fixWebm(blob, ms) {
    try {
      const head = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
      let i = -1; for (let k = 0; k < head.length - 8; k++) if (head[k] === 0x15 && head[k + 1] === 0x49 && head[k + 2] === 0xA9 && head[k + 3] === 0x66) { i = k; break; }
      if (i < 0) return blob;
      for (let k = 0; k < head.length - 4; k++) if (head[k] === 0x11 && head[k + 1] === 0x4D && head[k + 2] === 0x9B && head[k + 3] === 0x74) return blob;   // are SeekHead: nu mutăm poziții
      let sg = -1; for (let k = 0; k < Math.min(head.length - 12, 200); k++) if (head[k] === 0x18 && head[k + 1] === 0x53 && head[k + 2] === 0x80 && head[k + 3] === 0x67) { sg = k; break; }
      if (sg < 0 || head[sg + 4] !== 0x01 || head.slice(sg + 5, sg + 12).some((b) => b !== 0xFF)) return blob;   // Segment cu dimensiune cunoscută: nu modificăm
      const lenByte = head[i + 4]; let n = 1; while (n < 8 && !(lenByte & (0x80 >> (n - 1)))) n++;
      let size = lenByte & (0xFF >> n); for (let k = 1; k < n; k++) size = size * 256 + head[i + 4 + k];
      const bodyStart = i + 4 + n, bodyEnd = bodyStart + size;
      if (bodyEnd > head.length) return blob;
      for (let k = bodyStart; k < bodyEnd - 2; k++) if (head[k] === 0x44 && head[k + 1] === 0x89) return blob;   // are deja Duration
      const dur = new Uint8Array(11); dur[0] = 0x44; dur[1] = 0x89; dur[2] = 0x88; new DataView(dur.buffer).setFloat64(3, ms, false);
      const nsz = size + 11, sz = new Uint8Array(8); sz[0] = 0x01; for (let k = 7; k >= 1; k--) sz[k] = (Math.floor(nsz / Math.pow(256, 7 - k))) & 255;
      const out = [head.slice(0, i + 4), sz, head.slice(bodyStart, bodyEnd), dur, blob.slice(bodyEnd)];
      return new Blob(out, { type: blob.type });
    } catch (e) { return blob; }
  }
  async function finish() {
    const dur = Date.now() - t0; cleanup();
    const type = (mr && mr.mimeType) || 'video/webm', ext = /mp4/.test(type) ? 'mp4' : 'webm'; let blob = new Blob(chunks, { type }); chunks = [];
    if (ext === 'webm') blob = await fixWebm(blob, dur);
    const url = URL.createObjectURL(blob), vurl = URL.createObjectURL(new Blob([vtt()], { type: 'text/vtt;charset=utf-8' })); urls.push(url, vurl);
    const d = new Date(), p = (n) => String(n).padStart(2, '0'), name = 'claritas_rec_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    $('vid').src = url; $('out').hidden = false;
    $('dlv').href = url; $('dlv').download = name + '.' + ext; $('dlv').textContent = T('rec_dl_video');
    $('dll').href = vurl; $('dll').download = name + '.vtt'; $('dll').textContent = T('rec_dl_vtt');
    status(T('rec_done', { size: (blob.size / 1048576).toFixed(1) + ' MB · ' + fmtT(dur) })); $('dlv').focus();
  }
  $('start').addEventListener('click', start); $('stop').addEventListener('click', stop); $('mark').addEventListener('click', mark);
  addEventListener('pagehide', () => { try { api.storage.local.remove('recSession'); } catch (e) { } });
})();
