# Contributing

1. `python build.py` builds `dist/` for Chromium, Firefox and Safari (plus the legacy builds).
2. Tests live in `test/` and run with Playwright (`python test/run_matrix.py <label>`); CI runs them on all browsers.
3. Every user-visible string needs the 8 languages: `extension/shared.js` (ro, en) and `i18n_src/*.txt` (fr, it, es, pt, de, hu); the JSON in `extension/lang/` is generated from them.
4. New feature checklist: keyboard access, accessible name, targets of at least 24×24 px, a test, a CHANGELOG line, and a line in the README’s verified/unverified list.
5. Translation review by native speakers is the most useful contribution right now (Romanian and Hungarian first, then the privacy policies).
6. Real screen-reader and low-vision user testing reports are welcome as issues; negative results are as valuable as positive ones.
