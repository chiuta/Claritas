# Claritas — Privacy policy

**Version 1.8.1 · Last updated: 13 Nov 2026** · Romanian version: [PRIVACY.ro.md](PRIVACY.ro.md)

Claritas is a free, open-source (MIT) accessibility extension. It has **no telemetry, no analytics, no accounts and no servers of its own**. This document says exactly what it stores and the few cases where your browser (not Claritas) talks to a third party.

## What Claritas stores
Everything is kept in your browser's extension storage (`storage.local`):
- your settings, profiles and per-site rules;
- optional features you turn on: reading list and notes, your per-site CSS, a dictionary file you import, highlights.

Screenshots and screen recordings are created in the browser and saved straight to your Downloads folder. Claritas never uploads them.

You can export or delete all of this from the popup, or by removing the extension.

## What Claritas reads
To do its job (fix contrast, read aloud, audit, etc.) the content script reads the pages you visit **inside your browser**. The page content is not sent anywhere by Claritas. The "What leaves the browser?" button in the optional-modules panel reads the extension's own code and lists every network call it finds, so you can check this yourself.

To estimate the contrast of text placed over a background image, the content script can decode that image locally (a small canvas) when it is a `data:`/`blob:` image or comes from the same site as the page (normally already in the browser cache). Images from other sites are never fetched by Claritas, and nothing about the image is stored or sent.

## Cases where data can leave your browser
These are never on by default or only on your explicit action:
1. **Definition button**: opens dexonline.ro or Wiktionary in a new tab, only when you press it. Those sites then see the word you looked up.
2. **Voice control and live captions (Chrome)**: the browser's speech-recognition service processes the audio, under Google's terms. Firefox has no such service.
3. **Settings sync (off by default)**: uses your browser's own `storage.sync`, which your browser vendor synchronises. Only settings and per-site rules are included, never the dictionary, notes, screenshots or recordings.
4. **On-device AI (off by default)**: uses the Prompt API of Chrome with the model already on your computer. Claritas does not send page text to any server; Chrome may download its own model, which is Chrome's behaviour.
5. **Optional packages** (`-ocr`, `-axe`, `-pdf`) are bundled and run locally; they make no requests.

## Permissions
- `storage`: save your settings.
- Access to all sites (content script on `<all_urls>`, all frames): required to apply contrast fixes, themes and tools on any page you choose to use them on. The extension can be disabled globally or per site.

## Children
Claritas collects no personal data from anyone, including children.

## Changes
Changes to this policy appear in this file and in the repository history: https://github.com/chiuta/Claritas

## Contact
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
