/* Claritas — cititor PDF local (pdf.js, Apache-2.0). Extrage textul și îl afișează ca HTML accesibil;
   fișierul nu părăsește browserul. Contur, căutare, temă/fonturi, citire cu voce, salvare .txt. */
import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
const api = typeof browser !== 'undefined' ? browser : chrome;
const $ = (s) => document.querySelector(s);
let lang = 'en', segs = [], full = '', speaking = 0, doc = null;
const T = (k, v) => CLR.t(lang, k, v);
const say = (m) => { $('#status').textContent = m; };

async function init() {
  try { const r = await api.storage.local.get('settings'); const l = r && r.settings && r.settings.lang; lang = CLR.langCode(l && l !== 'auto' ? l : navigator.language); } catch (e) { lang = CLR.langCode(navigator.language); }
  if (!CLR.I18N[lang]) { try { await CLR.loadLang(lang); } catch (e) { } }
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = T(n.dataset.i18n); });
  document.title = T('pdf_title');
  const L = $('#th'); [...L.options].forEach((o, i) => { o.textContent = T(['pdf_t_light', 'pdf_t_dark', 'pdf_t_sepia', 'pdf_t_yellow'][i]); });
  bind();
}
function bind() {
  $('#f').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) openFile(f); });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) openFile(f); });
  $('#th').addEventListener('change', (e) => { document.body.className = e.target.value; });
  $('#fs').addEventListener('input', (e) => { $('#m').style.fontSize = e.target.value + 'px'; });
  $('#lh').addEventListener('input', (e) => { $('#m').style.lineHeight = e.target.value / 10; });
  $('#ff').addEventListener('change', (e) => { $('#m').style.fontFamily = e.target.value; });
  $('#q').addEventListener('input', (e) => search(e.target.value));
  $('#go').addEventListener('click', () => read(0));
  $('#stop').addEventListener('click', stop);
  $('#sv').addEventListener('click', () => { if (!full) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([full], { type: 'text/plain;charset=utf-8' })); a.download = 'claritas-pdf.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); });
}
/* ---- extragere: linii → paragrafe ---- */
export function groupItems(items) {
  const paras = []; let cur = '', lastY = null, lastH = 0, lastX = 0;
  for (const it of items) {
    if (!it.str && !it.hasEOL) continue;
    const y = it.transform ? it.transform[5] : 0, h = Math.abs(it.height || (it.transform && it.transform[3]) || 10) || 10;
    if (lastY !== null && Math.abs(y - lastY) > h * 0.55) {
      const gap = Math.abs(y - lastY);
      if (gap > Math.max(lastH, h) * 1.9) { if (cur.trim()) paras.push(cur.trim()); cur = ''; }
      else if (/-$/.test(cur) && /^\p{Ll}/u.test(it.str)) cur = cur.slice(0, -1);
      else if (cur && !/\s$/.test(cur)) cur += ' ';
    } else if (lastY !== null && it.transform && it.transform[4] - lastX > h * 3 && cur && !/\s$/.test(cur)) cur += ' ';
    cur += it.str;
    if (it.transform) { lastY = y; lastH = h; lastX = it.transform[4] + (it.width || 0); }
  }
  if (cur.trim()) paras.push(cur.trim());
  return paras.map((p) => p.replace(/\s+/g, ' '));
}
async function openFile(file) {
  stop(); say(T('pdf_loading')); segs = []; full = '';
  const m = $('#m'); m.textContent = '';
  let pdf; try { pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, enableXfa: false }).promise; }
  catch (e) { say(e && e.name === 'PasswordException' ? T('pdf_pass') : T('pdf_err', { e: (e && e.message) || e })); m.appendChild(Object.assign(document.createElement('p'), { textContent: T('pdf_err', { e: (e && e.name) || 'error' }) })); return; }
  doc = pdf; let total = 0;
  try { const md = await pdf.getMetadata(); const t = md && md.info && md.info.Title; if (t) $('#ttl').textContent = String(t).slice(0, 200); else $('#ttl').textContent = file.name; } catch (e) { $('#ttl').textContent = file.name; }
  document.title = $('#ttl').textContent + ' — Claritas';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i), tc = await page.getTextContent();
    const sec = document.createElement('section'); sec.className = 'pg'; sec.id = 'p' + i; sec.setAttribute('aria-labelledby', 'h' + i);
    const h = document.createElement('h2'); h.id = 'h' + i; h.textContent = T('pdf_page', { n: i, t: pdf.numPages }); sec.appendChild(h);
    const ps = groupItems(tc.items); total += ps.join('').length;
    ps.forEach((t) => { const p = document.createElement('p'); p.className = 'seg'; p.textContent = t; sec.appendChild(p); segs.push(p); });
    if (!ps.length) { const p = document.createElement('p'); p.textContent = T('pdf_empty'); sec.appendChild(p); }
    m.appendChild(sec); full += ps.join('\n\n') + '\n\n';
    if (i % 5 === 0) say(T('pdf_loading') + ' ' + i + '/' + pdf.numPages);
  }
  say(total < 20 ? T('pdf_scanned') : T('pdf_done', { n: pdf.numPages }));
  buildOutline(pdf); m.focus();
}
async function buildOutline(pdf) {
  const nav = $('#nav'), ol = $('#ol'); ol.textContent = ''; let out = null;
  try { out = await pdf.getOutline(); } catch (e) { }
  if (!out || !out.length) { nav.hidden = true; return; }
  async function pageOf(it) { try { let d = it.dest; if (typeof d === 'string') d = await pdf.getDestination(d); if (Array.isArray(d)) return (await pdf.getPageIndex(d[0])) + 1; } catch (e) { } return 0; }
  async function walk(list, ul, depth) {
    for (const it of list.slice(0, 300)) {
      const li = document.createElement('li'), a = document.createElement('a'), n = await pageOf(it);
      a.textContent = it.title || '—'; a.href = n ? '#p' + n : '#'; li.appendChild(a); ul.appendChild(li);
      if (it.items && it.items.length && depth < 4) { const sub = document.createElement('ul'); li.appendChild(sub); await walk(it.items, sub, depth + 1); }
    }
  }
  await walk(out, ol, 0); nav.hidden = false;
}
function search(q) {
  document.querySelectorAll('mark').forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
  document.querySelectorAll('p.seg').forEach((p) => p.normalize());
  q = q.trim(); if (q.length < 2) { say(''); return; }
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); let n = 0, first = null;
  segs.forEach((p) => {
    const t = p.textContent; if (!re.test(t)) { re.lastIndex = 0; return; } re.lastIndex = 0;
    const f = document.createDocumentFragment(); let last = 0, m;
    while ((m = re.exec(t))) { f.appendChild(document.createTextNode(t.slice(last, m.index))); const k = document.createElement('mark'); k.textContent = m[0]; f.appendChild(k); last = m.index + m[0].length; n++; if (!first) first = k; if (m[0].length === 0) re.lastIndex++; }
    f.appendChild(document.createTextNode(t.slice(last))); p.textContent = ''; p.appendChild(f);
  });
  say(T('pdf_found', { n })); if (first) first.scrollIntoView({ block: 'center' });
}
/* ---- citire cu voce ---- */
function read(i) {
  if (typeof speechSynthesis === 'undefined') { say(T('pdf_novoice')); return; }
  stop(); const token = ++speaking;
  const step = (k) => {
    if (token !== speaking || k >= segs.length) { segs.forEach((p) => p.classList.remove('cur')); return; }
    segs.forEach((p) => p.classList.remove('cur')); const p = segs[k]; p.classList.add('cur'); p.scrollIntoView({ block: 'center' });
    const u = new SpeechSynthesisUtterance(p.textContent); u.lang = document.documentElement.lang;
    const vs = speechSynthesis.getVoices(); const v = vs.find((x) => x.localService && x.lang.toLowerCase().startsWith(lang)); if (v) u.voice = v;
    u.onend = () => step(k + 1); u.onerror = () => { }; speechSynthesis.speak(u);
  };
  const start = Math.max(0, segs.findIndex((p) => p.getBoundingClientRect().top >= 0));
  step(i || start);
}
function stop() { speaking++; try { speechSynthesis.cancel(); } catch (e) { } segs.forEach((p) => p.classList.remove('cur')); }
init();
