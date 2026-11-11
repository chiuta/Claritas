/* Claritas — OCR local (modul opțional). Rulează Tesseract.js împachetat în extensie: imaginea nu pleacă din browser. */
(() => {
  'use strict';
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const $ = (id) => document.getElementById(id);
  const LANGS = { ro: ['ron', 'Română'], en: ['eng', 'English'], de: ['deu', 'Deutsch'], es: ['spa', 'Español'], fr: ['fra', 'Français'], it: ['ita', 'Italiano'], pt: ['por', 'Português'], hu: ['hun', 'Magyar'] };
  let L = 'en', file = null, worker = null, workerLang = '';
  const T = (k) => { try { return CLR.t(L, k); } catch (e) { return k; } };
  const status = (m) => { $('status').textContent = m; };

  async function init() {
    let s = {};
    try { const r = await api.storage.local.get('settings'); s = r.settings || {}; } catch (e) { }
    const pref = s.lang && s.lang !== 'auto' ? s.lang : (navigator.language || 'en').slice(0, 2).toLowerCase();
    L = LANGS[pref] ? pref : 'en';
    try { await CLR.loadLang(L); } catch (e) { }
    document.documentElement.lang = L;
    $('ttl').textContent = T('ocr_title'); $('priv').textContent = T('ocr_priv'); $('dropT').textContent = T('ocr_drop');
    $('langL').textContent = T('ocr_lang'); $('run').textContent = T('ocr_run'); $('outL').textContent = T('ocr_out');
    $('copy').textContent = T('copy'); $('read').textContent = T('ocr_read'); $('save').textContent = T('ocr_save');
    const sel = $('lang');
    Object.keys(LANGS).forEach((c) => { const o = document.createElement('option'); o.value = LANGS[c][0]; o.textContent = LANGS[c][1]; sel.appendChild(o); });
    sel.value = LANGS[L][0];
    const pick = (f) => {
      if (!f || !/^image\//.test(f.type)) { status(T('ocr_notimg')); return; }
      file = f; $('run').disabled = false;
      const u = URL.createObjectURL(f); const im = $('prev'); im.src = u; im.hidden = false; im.alt = f.name || '';
      status(T('ocr_ready'));
    };
    $('file').addEventListener('change', (e) => pick(e.target.files[0]));
    const d = $('drop');
    d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('over'); });
    d.addEventListener('dragleave', () => d.classList.remove('over'));
    d.addEventListener('drop', (e) => { e.preventDefault(); d.classList.remove('over'); pick(e.dataTransfer.files[0]); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file').click(); } });
    document.addEventListener('paste', (e) => { const it = Array.from(e.clipboardData.items || []).find((x) => /^image\//.test(x.type)); if (it) pick(it.getAsFile()); });
    $('run').addEventListener('click', run);
    $('copy').addEventListener('click', () => { const o = $('out'); o.select(); try { navigator.clipboard.writeText(o.value); } catch (e) { document.execCommand('copy'); } status(T('copied') || 'OK'); });
    $('read').addEventListener('click', () => {
      const t = $('out').value.trim(); if (!t) return;
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = ({ ron: 'ro-RO', eng: 'en-US', deu: 'de-DE', spa: 'es-ES', fra: 'fr-FR', ita: 'it-IT', por: 'pt-PT', hun: 'hu-HU' })[$('lang').value] || L; speechSynthesis.speak(u); } catch (e) { }
    });
    $('save').addEventListener('click', () => {
      const b = new Blob([$('out').value], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'ocr.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    window.__ocrReady = true;
  }

  async function run() {
    if (!file) return;
    const lang = $('lang').value; $('run').disabled = true; $('prog').hidden = false; $('prog').value = 0; status(T('ocr_load'));
    try {
      if (!worker || workerLang !== lang) {
        if (worker) { try { await worker.terminate(); } catch (e) { } }
        worker = await Tesseract.createWorker(lang, 1, {
          workerPath: api.runtime.getURL('vendor/worker.min.js'), corePath: api.runtime.getURL('vendor/core'), langPath: api.runtime.getURL('vendor/lang'),
          workerBlobURL: false, gzip: true, cacheMethod: 'none',
          logger: (m) => { if (m && m.status === 'recognizing text') { $('prog').value = m.progress || 0; status(T('ocr_work') + ' ' + Math.round((m.progress || 0) * 100) + '%'); } }
        });
        workerLang = lang;
      }
      const r = await worker.recognize(file);
      $('out').value = (r.data.text || '').trim();
      status($('out').value ? T('ocr_done') : T('ocr_none'));
      window.__ocrDone = true;
    } catch (e) { status(T('ocr_err') + ' ' + (e && e.message ? e.message : '')); window.__ocrErr = String(e && e.message || e); }
    $('prog').hidden = true; $('run').disabled = false;
  }
  init();
})();
