# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-12

### Added

- `formatDate(input, outputFormat, options?)` — parse a date from (almost) any input format and render it with moment-style tokens.
- `parseDate(input, options?)` and `isValidDate(input, options?)` companions, plus a typed `InvalidDateError` carrying the offending input.
- Input support: ISO 8601 (extended and compact), separated numeric dates in any order, English month names in every common arrangement, RFC 2822 and `Date#toString` output, Unix timestamps (seconds/milliseconds, number or digit string), compact digit dates (`YYYYMMDD`, `DDMMYYYY`, `YYYYMMDDHHmmss`), and `Date` instances.
- Documented ambiguity resolution: parts > 31 or 4-digit are the year, parts > 12 are the day (with auto-swap), `dayFirst`/`yearFirst` options decide the rest; two-digit year pivot at 70.
- Full calendar validation — impossible dates (`2023-02-30`, month 13, `25:00`) throw instead of rolling over; leap years handled correctly.
- Timezone handling: `Z`, `±HH:MM`, `±HHMM`, `±HH`, `GMT±…`, and US zone abbreviations on input; local or `utc: true` output.
- Timestamp unit auto-detection with `timestampUnit` override.
- Native `Date` parser fallback as an explicit opt-in (`useNativeFallback`), guarded against engine-invented years.
- Output tokens: `YYYY YY MMMM MMM MM M DD D Do dddd ddd d HH H hh h mm m ss s SSS A a Z ZZ Q X x`, with bracket escaping for literals.
- Dual ESM/CJS build with bundled TypeScript declarations; zero runtime dependencies.

[0.1.0]: https://github.com/satyendra-sagar-singh/any-date-format/releases/tag/v0.1.0
