# Governance

Claritas is currently maintained by one person (Alexandru-Ionuț Chiuță, “Alexio”). This file exists so the project does not depend on that one person.

## Principles
- **Free and trade-free:** MIT licence, no telemetry, no accounts, no paid tier. Donations only through Buy Me a Coffee.
- **Honest status:** the README lists what is verified and what is not; claims move to “verified” only after a test or a report supports them.
- **Not a compliance tool:** Claritas improves reading for the user. It does not make a website conform to WCAG.

## Decisions
- Small changes: maintainer review, merged when CI is green.
- Changes to permissions, network behaviour, the privacy policy or the licence: need a public discussion of at least 14 days and a CHANGELOG entry.
- A new permission or any network request is a breaking change in trust and is never added silently.

## Looking for a second maintainer
The biggest risk to Claritas is the single maintainer. Anyone who contributes regularly for three months and is willing to review pull requests can be added as co-maintainer. Write to alexio@trom.tf.

## Continuity
Releases are reproducible from the repository (`python build.py`, then `SHA256SUMS`). If the project is abandoned for 12 months, the MIT licence lets anyone fork it; this file is the permission to call the fork a successor if it keeps the “no network, no telemetry” rules.
