# Claritas — store listing (Chrome Web Store, Edge Add-ons, Firefox AMO)

*Version 1.9.1 · 13 Nov 2026. Draft text to paste into the stores; nothing here claims a store listing exists yet.*

## Name
Claritas — accessibility

## Short description (≤132 characters)
Fix weak text contrast, read aloud, themes, reader mode and WCAG 2.2 audit. No telemetry, no accounts. 8 languages.

## Long description
Claritas measures the real contrast of the text on the pages you visit and fixes it where it is too weak (WCAG AA or AAA). It adds high-contrast themes, colour-blindness correction, text and spacing controls, dyslexia-friendly fonts, a reader mode, read-aloud with local voices, reading ruler and mask, large click targets, single-switch scanning, local screenshots and recordings, and a WCAG 2.2 audit.

Optional modules (all off by default): quick keyboard navigation, voice control, summary and glossary, image-description suggestions, live captions, contrast inspector, tab-order map with accessible names, reading list with notes, your own CSS per site, spoken MathML, and an optional on-device AI.

Privacy: no telemetry, no accounts, no servers. Everything runs in your browser. The code is open (MIT): https://github.com/chiuta/Claritas

Limits we state openly: automatic rules cover only part of WCAG and do not replace manual evaluation; backgrounds that are images cannot be measured; speech recognition in Chrome uses the browser's service.

Interface: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Single purpose
Improve the readability and usability of web pages for people with different visual, reading and motor needs.

## Permission justifications
- **storage**: saves the user's settings, profiles and optional notes locally.
- **Host access (all sites)**: the content script must run on whichever page the user wants to make readable. It reads the page locally to measure contrast and apply fixes; nothing is sent out.
- **Remote code**: none. All code is in the package. No `eval`, no remote scripts.

## Data usage declarations
- Does not collect or transmit personal data, web history, location, financial or health information.
- Not sold or shared with third parties; not used for creditworthiness or unrelated purposes.
- Privacy policy: PRIVACY.md in the repository.

## Support
Website: https://claritas.chiuta.ro · Contact: alexio@trom.tf · Source: https://github.com/chiuta/Claritas · Support the project: https://buymeacoffee.com/echo.of.the.strings
