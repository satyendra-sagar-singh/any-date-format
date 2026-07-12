# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.x (latest) | ✅ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, use one of these private channels:

- **GitHub private vulnerability reporting** (preferred): [Report a vulnerability](https://github.com/satyendra-sagar-singh/any-date-format/security/advisories/new)
- **Email:** satyendra.sagar@icloud.com with subject `[SECURITY] any-date-format`

You can expect an acknowledgement within 72 hours. Please include a description of the issue, steps to reproduce, and the affected version(s). Coordinated disclosure is appreciated — a fix will be prioritized and credited to you in the release notes unless you prefer otherwise.

## Scope

This library is routinely fed untrusted input (user-supplied date strings), so reports of particular interest:

- **ReDoS**: any input that makes parsing take super-linear time (the parser is regex-based; a crafted string that hangs or measurably stalls `parseDate`/`isValidDate` is a vulnerability)
- Crashes or exceptions other than the documented `InvalidDateError`/`TypeError` on any input, of any type or size
- Inputs that bypass validation (e.g. a string that produces a `Date` from data that should have been rejected)

Out of scope: disagreements with the documented ambiguity-resolution rules (correctness discussions belong in regular issues), and the behavior of the engine's native parser when explicitly enabled via `useNativeFallback`.
