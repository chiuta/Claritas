# Changelog

## 1.10.0 — 17 Nov 2026
- **New: builds for older browsers** (experimental). `claritas-firefox-legacy.zip` (Manifest V2, Firefox 91+, non-persistent background page) and `claritas-safari-legacy-source.zip` (Manifest V2 for Safari 14–15). The declared minimums of the main packages were lowered to Chromium 88 and Firefox 115 (Android 120).
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
