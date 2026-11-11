/* Claritas — raport de audit exportabil (HTML / CSV / JSON), mapare WCAG 2.2 + EN 301 549, sugestii de reparare, comparare între audituri.
   Fără DOM, fără rețea: rulează în popup și în Node (mod CI). */
(function (root) {
  'use strict';
  /* regulă → [criteriu WCAG, nivel, sugestie de reparare] ; EN 301 549 v3.2.1 §9 folosește aceeași numerotare: 9.<criteriu> */
  const MAP = {
    lang: ['3.1.1', 'A', '<html lang="ro">'],
    title: ['2.4.2', 'A', '<title>Titlu descriptiv al paginii</title>'],
    zoom: ['1.4.4', 'AA', '<meta name="viewport" content="width=device-width, initial-scale=1">  /* fără user-scalable=no / maximum-scale=1 */'],
    viewport_zoom: ['1.4.4', 'AA', '<meta name="viewport" content="width=device-width, initial-scale=1">'],
    img_alt: ['1.1.1', 'A', '<img src="…" alt="Descriere scurtă">  /* sau alt="" dacă e decorativă */'],
    img_alt_file: ['1.1.1', 'A', '<img src="…" alt="Descriere reală, nu numele fișierului">'],
    svg_name: ['1.1.1', 'A', '<svg role="img" aria-label="Descriere">…</svg>  /* sau <title> în svg */'],
    name: ['4.1.2', 'A', '<button aria-label="Acțiunea">…</button>  /* nume accesibil pentru buton/link */'],
    vague: ['2.4.4', 'A', '<a href="…">Descarcă raportul anual (PDF)</a>  /* nu „click aici” */'],
    form_label: ['3.3.2', 'A', '<label for="id">Etichetă</label><input id="id">'],
    h1_none: ['1.3.1', 'A', '<h1>Titlul paginii</h1>'],
    h1_many: ['1.3.1', 'A', 'Păstrează un singur <h1>; restul titlurilor <h2>…'],
    h_skip: ['1.3.1', 'A', 'Nu sări niveluri de titlu (h2 → h4); folosește h3.'],
    h_empty: ['1.3.1', 'A', '<h2>Text vizibil</h2>  /* titlu fără conținut */'],
    iframe_title: ['4.1.2', 'A', '<iframe title="Hartă locație" src="…"></iframe>'],
    tabindex: ['2.4.3', 'A', 'Elimină tabindex > 0; ordinea să urmeze ordinea din DOM.'],
    table_th: ['1.3.1', 'A', '<th scope="col">Coloană</th>'],
    target_small: ['2.5.8', 'AA', 'Ținte de cel puțin 24×24 px:  min-width:24px; min-height:24px;'],
    dup_id: ['4.1.1', 'A', 'Fiecare id trebuie să fie unic în pagină (criteriu retras în WCAG 2.2, util pentru ARIA/label).'],
    autoplay: ['1.4.2', 'A', 'Fără redare automată cu sunet > 3 s; oferă pauză/oprire.'],
    blink: ['2.2.2', 'A', 'Elimină <blink>/animații care clipesc > 5 s sau oferă oprire.'],
    auth_ac: ['3.3.8', 'AA', '<input type="password" autocomplete="current-password">  /* nu bloca managerul de parole */'],
    spacing_clip: ['1.4.12', 'AA', 'Nu tăia conținutul când se mărește spațierea textului (evită height/overflow fix).'],
    aria_role: ['4.1.2', 'A', 'Folosește un rol ARIA valid sau elimină atributul role.'],
    aria_ref: ['4.1.2', 'A', 'aria-labelledby / aria-describedby trebuie să indice id-uri existente.'],
    aria_hidden_focus: ['4.1.2', 'A', 'Nu pune elemente focalizabile în aria-hidden="true"; folosește inert sau tabindex="-1".'],
    main_missing: ['1.3.1', 'A', '<main>…conținut principal…</main>'],
    main_many: ['1.3.1', 'A', 'Un singur <main> vizibil pe pagină.'],
    video_captions: ['1.2.2', 'A', '<video controls><track kind="captions" src="sub.vtt" srclang="ro" label="Română"></video>'],
    nested_interactive: ['4.1.2', 'A', 'Nu pune <button> în <a> (sau invers); alege un singur element interactiv.'],
    skip_link: ['2.4.1', 'A', '<a href="#main" class="skip">Sari la conținut</a>']
  };
  const SEV = { err: 0, warn: 1, info: 2 };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = (it) => it.rule + '|' + (it.label || '');

  function enrich(items, names) {
    return (items || []).map((it) => {
      const m = MAP[it.rule] || ['', '', ''];
      return { rule: it.rule, name: (names && names[it.rule]) || it.rule, sev: it.sev, target: it.label || '', wcag: m[0], level: m[1], en301549: m[0] ? '9.' + m[0] : '', fix: m[2] };
    }).sort((a, b) => (SEV[a.sev] - SEV[b.sev]) || a.rule.localeCompare(b.rule));
  }
  function summary(rows) {
    const c = { err: 0, warn: 0, info: 0 }; rows.forEach((r) => { c[r.sev] = (c[r.sev] || 0) + 1; });
    const wcag = {}; rows.forEach((r) => { if (r.wcag) wcag[r.wcag] = (wcag[r.wcag] || 0) + 1; });
    return { errors: c.err, warnings: c.warn, info: c.info, total: rows.length, byWcag: wcag };
  }
  function csvCell(v) { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }

  /* meta: {url,title,date,version,names,lang} ; fmt: 'json' | 'csv' | 'html' */
  function build(items, meta, fmt) {
    meta = meta || {}; const rows = enrich(items, meta.names), sum = summary(rows);
    if (fmt === 'json') return JSON.stringify({ tool: 'Claritas', version: meta.version || '', url: meta.url || '', title: meta.title || '', date: meta.date || '', standard: 'WCAG 2.2 / EN 301 549 v3.2.1', summary: sum, issues: rows }, null, 2);
    if (fmt === 'csv') {
      const head = ['severity', 'rule', 'description', 'target', 'wcag', 'level', 'en301549', 'fix'];
      return '﻿' + [head.map(csvCell).join(',')].concat(rows.map((r) => [r.sev, r.rule, r.name, r.target, r.wcag, r.level, r.en301549, r.fix].map(csvCell).join(','))).join('\r\n') + '\r\n';
    }
    const L = meta.labels || {};
    const lb = (k, d) => esc(L[k] || d);
    const tr = rows.map((r) => '<tr class="' + esc(r.sev) + '"><td>' + esc(r.sev) + '</td><td>' + esc(r.name) + '<br><code>' + esc(r.rule) + '</code></td><td>' + esc(r.target) + '</td><td>' + esc(r.wcag) + (r.level ? ' (' + esc(r.level) + ')' : '') + '</td><td>' + esc(r.en301549) + '</td><td><code>' + esc(r.fix) + '</code></td></tr>').join('\n');
    return '<!doctype html><html lang="' + esc(meta.lang || 'en') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + lb('title', 'Accessibility report') + ' — ' + esc(meta.title || meta.url || '') + '</title>' +
      '<style>body{font:16px/1.5 system-ui,sans-serif;max-width:1100px;margin:1.5rem auto;padding:0 1rem;color:#111;background:#fff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:.4rem .5rem;text-align:left;vertical-align:top}th{background:#eee}tr.err td:first-child{font-weight:700;color:#8a0000}tr.warn td:first-child{color:#7a4a00}code{white-space:pre-wrap;word-break:break-word;font-size:.85em}caption{text-align:left;font-weight:700;margin:.5rem 0}</style></head><body><main>' +
      '<h1>' + lb('title', 'Accessibility report') + '</h1><p>' + esc(meta.title || '') + ' — <a href="' + esc(/^https?:/i.test(meta.url || '') ? meta.url : '#') + '">' + esc(meta.url || '') + '</a><br>' + esc(meta.date || '') + ' · Claritas ' + esc(meta.version || '') + '</p>' +
      '<p><strong>' + sum.errors + '</strong> ' + lb('errors', 'errors') + ', <strong>' + sum.warnings + '</strong> ' + lb('warnings', 'warnings') + ', ' + sum.info + ' info.</p>' +
      '<p>' + lb('note', 'Automatic checks cover only part of WCAG 2.2; manual review is still required. Mapping to EN 301 549 v3.2.1 clause 9.') + '</p>' +
      '<table><caption>' + lb('issues', 'Issues') + '</caption><thead><tr><th scope="col">' + lb('sev', 'Severity') + '</th><th scope="col">' + lb('rule', 'Rule') + '</th><th scope="col">' + lb('target', 'Element') + '</th><th scope="col">WCAG</th><th scope="col">EN 301 549</th><th scope="col">' + lb('fix', 'Suggested fix') + '</th></tr></thead><tbody>\n' + tr + '\n</tbody></table></main></body></html>';
  }

  /* comparare: prev = listă de chei salvate la un audit anterior */
  function keys(items) { return Array.from(new Set((items || []).map(key))); }
  function diff(prevKeys, items) {
    const prev = new Set(prevKeys || []), cur = new Set(keys(items));
    const added = [], kept = [], fixed = [];
    cur.forEach((k) => (prev.has(k) ? kept : added).push(k));
    prev.forEach((k) => { if (!cur.has(k)) fixed.push(k); });
    return { added, fixed, kept };
  }

  const api = { MAP, build, enrich, summary, keys, diff, key };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  const C = (root.CLR = root.CLR || {}); C.report = api;
})(typeof window !== 'undefined' ? window : globalThis);
