# Security policy

Claritas asks for access to all pages (`<all_urls>`) and the `storage` permission, nothing else on Chromium. Because of that access, security reports are taken seriously.

- **Report privately** to alexio@trom.tf (subject: `Claritas security`). Please do not open a public issue for vulnerabilities.
- **What to expect:** an acknowledgement within 7 days and a fix or a written assessment within 30 days. This is a volunteer project; there is no bug bounty.
- **Scope:** the extension code in `extension/`, the build in `build.py`, the install scripts in `install/`, the release workflow.
- **Verify a download:** every release publishes `SHA256SUMS`; compare it with the file you downloaded.
- **No network by design:** the extension sends no requests of its own. The only outgoing navigation is the dictionary button, and only when you press it (dexonline.ro or Wiktionary). A report showing otherwise is a vulnerability.
- **Supported versions:** the latest release only. The experimental legacy builds (Firefox Manifest V2, Safari 14–15) receive fixes on a best-effort basis.
