# Changelog

## 1.10.3 — 19 Nov 2026
- **Site:** the landing page (`site/index.html`) runs in older browsers (Chrome/Edge 55+, Firefox 52+, Safari 10.1+/iOS 10.3+): fff-kit 1.8.0 compatibility layer and ES2017 syntax. This concerns the web page only, not the extension builds. Checked with an ES2017 parser and in a simulated old engine, not on real old devices.
- **Version stamps:** README, privacy policy, site and manifests moved to 1.10.3.

## 1.10.2 — 18 Nov 2026
- **Accessibility fixes found by an independent audit (axe-core on our own pages):** the popup's A−/A+ buttons now include their visible text in the accessible name (WCAG 2.5.3); the two install-command blocks on the site are keyboard-focusable (WCAG 2.1.1). New test `t23_axe_self.py` + workflow `a11y-self.yml`: popup in 8 languages × every tab × simple mode, and the site in 8 languages — 0 violations after the fixes.
- **Benchmark:** `tools/contrast_benchmark.py` now also runs the axe-core `color-contrast` rule (third-party, not written by us), adds a control measurement without the extension, excludes pages that change on their own, and writes a per-page table. Results are in the READMEs.
- **Docs:** a “Measured results” section in all 8 READMEs and on the site (axe-core: 292 failing elements without Claritas → 0 with, 20 public pages; an earlier run left 11 and one page one element worse; what was not measured is listed); the site's “last updated” date was stale (13 Nov) and is fixed; test fixtures no longer name a real institution; the benchmark URL list no longer contains an institutional site.
- **Hardening:** the dictionary link for selected text validates the language code before building the URL; README dates made consistent in all 8 languages.

## 1.10.1 — 18 Nov 2026
- **Popup:** new *Simple mode* (contrast and size only, remembered); checkboxes enlarged to 24×24 px (WCAG 2.2 target size). New test `t22_popup_a11y.py` (accessible names, targets, mode, persistence).
- **Evidence tooling:** `tools/contrast_benchmark.py` + `benchmark.yml` workflow measure contrast on real pages with and without Claritas using an independent calculation; no results published yet.
- **Trust files:** `SECURITY.md`, `GOVERNANCE.md`, `CONTRIBUTING.md`; privacy-policy translations marked as machine-assisted and unreviewed (English text prevails).
- **Site:** minimum versions aligned with the README (declared, untested); legacy packages listed as experimental; Pages publishes them.

## 1.10.0 — 17 Nov 2026
- **New: builds for older browsers** (experimental). `claritas-firefox-legacy.zip` (Manifest V2, Firefox 91+, non-persistent background page) and `claritas-safari-legacy-source.zip` (Manifest V2 for Safari 14–15). The declared minimums of the main packages were lowered to Chromium 88 and Firefox 115 (Android 120).
- **Docs:** the declared minimum versions are labelled as untested; the audit is described as “own rules (a WCAG 2.2 subset)”; a not-a-compliance-tool line was added to every README.
- **Honest status:** the older builds and the lowered minimums have NOT been verified on real old browsers. The CI attempts (Firefox ESR 91/102/115, Chromium 88/103) did not complete a test run yet; see `old-browsers.yml`. Use at your own risk and report problems.
- Privacy policy in 8 languages; CI on Ubuntu 26.04 and the latest Node.js; Vivaldi partially verified; Opera t5–t8, t15 verified.
- Docs: the privacy policy is now available in all 8 languages (`PRIVACY.<lang>.md`, with a language switcher); the READMEs link to their own language. Translations still await native-speaker review.
- CI: all workflows run on Ubuntu 26.04 and the latest Node.js; `setup-geckodriver` uses the GitHub token (no more rate-limit failures on macOS).
- CI: Vivaldi (Linux) is now partially verified by `t21_single_page.py` (content script, audit rules, contrast, popup), after fixing the CDP connection in the test harness (wait + retries, `--remote-allow-origins`). Vivaldi exposes no new tabs through CDP, so multi-tab tests cannot run there. Opera now passes t5–t8 and t15 (the harness had been messaging a stale tab); t9 (recording) is skipped under CDP.

## 1.9.1 — 13 Nov 2026
- **Fix:** the `/` search shortcut was ignored while a checkbox or slider had focus (only text fields should block it). CI on Windows/macOS caught it via `t20_ui.py`, now covering both cases.

## 1.9.0 — 13 Nov 2026
- **Popup redesign:** search across all settings in every tab (`/` or Ctrl+K; Esc clears; result count announced to screen readers); quick-action bar (next theme, read aloud, text size ±); tab bar and search stay visible while scrolling long tabs; tab labels no longer wrap or get cut; full ARIA tab keyboard pattern (arrows, Home/End, roving tabindex); the last-used tab is remembered; no horizontal overflow at 320 px.
- **Fix (engine):** on very large pages the node budget could abandon content added meanwhile, leaving new text uncorrected (intermittent). Only the current walk is dropped now; recently added nodes are re-queued. `t16_budget.py` made timing-tolerant.
- 10 new interface strings in 8 languages.
- New test `test/t20_ui.py` (15 checks), added to CI.

## 1.8.1 — 13 Nov 2026
- **Fix:** text placed over a CSS background image (e.g. a grey heading on a dark blue hero image) was skipped by the contrast engine. It is now measured against the image's average colour (images from the same origin, `data:` or `blob:`); when the image cannot be read, a cautious white/black choice plus a contrasting halo is used. Small no-repeat icons are not treated as backgrounds; an opaque colour over an image now counts as the real background (cards on hero images are corrected). Sampling is capped (24 images/page, bounded cache) and makes no request to other origins.
- Privacy panel and PRIVACY.md/PRIVACY.ro.md mention the local image decode; the “What leaves the browser?” scan also looks for `new Image`.
- New test `test/t19_bgimage.py` (7 cases + no cross-origin request), added to CI.
- Site: install videos with captions in 8 languages (illustrated guides, not screen recordings).

## 1.8.0 — 12 Nov 2026
See README (v1.8 modules), `PRIVACY.md`, and the site's “What is verified and what is not”.
