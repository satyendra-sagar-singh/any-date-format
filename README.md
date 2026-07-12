# any-date-format

[![npm version](https://img.shields.io/npm/v/any-date-format.svg)](https://www.npmjs.com/package/any-date-format)
[![CI](https://github.com/satyendra-sagar-singh/any-date-format/actions/workflows/ci.yml/badge.svg)](https://github.com/satyendra-sagar-singh/any-date-format/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/any-date-format.svg)](https://github.com/satyendra-sagar-singh/any-date-format/blob/main/LICENSE)

Parse dates from (almost) any input format and format them exactly how you want.

You don't always control what a date looks like when it reaches you — an API sends `2023-08-15T10:30:00Z`, a CSV has `15/08/2023`, a user types `August 15, 2023`, a legacy system stores `20230815`. This library takes any of them and gives you the output format you asked for.

```ts
import { formatDate } from 'any-date-format'

formatDate('2023-08-15T10:30:00Z', 'DD-MM-YYYY')           // '15-08-2023'
formatDate('August 15, 2023', 'DD-MM-YYYY')                // '15-08-2023'
formatDate('15/08/2023', 'DD-MM-YYYY')                     // '15-08-2023'
formatDate(1692092400, 'DD-MM-YYYY')                       // '15-08-2023'
formatDate('20230815', 'DD-MM-YYYY')                       // '15-08-2023'
formatDate('Tue, 15 Aug 2023 14:30:00 GMT', 'DD-MM-YYYY')  // '15-08-2023'

formatDate('15 Aug 2023 2:30 PM', 'YYYY-MM-DD[T]HH:mm:ss') // '2023-08-15T14:30:00'
formatDate('15/08/2023', 'dddd, MMMM Do YYYY')             // 'Tuesday, August 15th 2023'
```

- **Zero dependencies**, fully typed, ESM + CJS.
- **Deterministic**: only formats this library recognizes are accepted; it never silently guesses through the engine's `Date` parser (unless you opt in).
- **Validating**: `2023-02-30`, `25:00`, month `13` — rejected, never rolled over.

## Install

```sh
npm install any-date-format
```

## API

### `formatDate(input, outputFormat, options?)`

Parses `input` (string, number, or `Date`) and renders it using format tokens. Throws `InvalidDateError` if the input cannot be parsed.

### `parseDate(input, options?)`

Same parsing, returns a `Date`. Throws `InvalidDateError` on failure.

### `isValidDate(input, options?)`

Returns `true`/`false`, never throws for bad values.

### Options

| Option | Default | Meaning |
|---|---|---|
| `dayFirst` | `false` | Read ambiguous numeric dates like `01/02/2023` as day-first (1 Feb). Unambiguous dates (`25/12/2023`) resolve automatically either way. |
| `yearFirst` | `false` | Read fully ambiguous triples like `10-11-12` as year-first (`2010-11-12`). |
| `timestampUnit` | `'auto'` | `'seconds'` \| `'milliseconds'` \| `'auto'` for bare numeric timestamps. Auto: values ≥ 1e12 are milliseconds, otherwise seconds — unless the seconds reading lands past year 9999, then milliseconds. |
| `utc` | `false` | (`formatDate` only) Render the output in UTC instead of local time. |
| `useNativeFallback` | `false` | Last-resort parse via the engine's `new Date(string)` for unrecognized strings. Engine-dependent; results whose year appears nowhere in the input are rejected. |

## Accepted input formats

- **ISO 8601**: `2023-08-15`, `2023-08-15T10:30:00.123+05:30`, `2023-08`, `20230815T103000Z`
- **Separated numeric**: `15/08/2023`, `08-15-2023`, `15.08.2023`, `15 08 2023`, `2023/08/15`, `08/2023`, two-digit years (`15/8/23`)
- **Month names** (English): `15 Aug 2023`, `August 15, 2023`, `2023 Aug 15`, `15-Aug-23`, `Sept 2023`, `15th of August 2023`
- **RFC 2822 / `Date#toString`**: `Tue, 15 Aug 2023 14:30:00 GMT`, `Tue Aug 15 2023 14:30:00 GMT+0530 (India Standard Time)`
- **Times**: 24-hour and 12-hour (`2:30 PM`, `2pm`, `14:30:45.123`), following the date
- **Timezones**: `Z`, `UTC`, `GMT`, `±HH:MM`, `±HHMM`, `GMT+0530`, and US abbreviations (`EST`, `PDT`, …)
- **Timestamps**: seconds or milliseconds, as `number` or digit string (`1692092400`, `'1692092400000'`)
- **Compact digits**: `20230815` (`YYYYMMDD`), `15082023` (falls back to `DDMMYYYY`/`MMDDYYYY` when `YYYYMMDD` is impossible), `20230815143000`, bare year `2023`
- **`Date` instances**: validated and cloned

### How ambiguity is resolved

For `a/b/c` numeric dates:

1. A four-digit part (or any part > 31) is the **year**.
2. Of the two remaining parts, one > 12 must be the **day** — `31/12/2023` and `12/31/2023` both parse as 31 Dec regardless of options.
3. Still ambiguous (`01/02/2023`)? `dayFirst` decides (default: month-first).
4. All parts two-digit (`10-11-12`)? `yearFirst`/`dayFirst` decide (default: `M-D-Y` order, so `2012-10-11`).

Two-digit years use a pivot: `< 70` → `20xx`, otherwise `19xx`.

### Timezone semantics

- Input **with** an explicit offset (`Z`, `+05:30`, `GMT`, `EST`) marks an exact instant; it is converted to your local time for formatting (or UTC with `utc: true`).
- Input **without** an offset is taken as local time, unchanged.

## Format tokens

| Token | Output | Token | Output |
|---|---|---|---|
| `YYYY` | `2023` | `HH` / `H` | `09` / `9` (24 h) |
| `YY` | `23` | `hh` / `h` | `02` / `2` (12 h) |
| `MMMM` | `August` | `mm` / `m` | `05` / `5` |
| `MMM` | `Aug` | `ss` / `s` | `07` / `7` |
| `MM` / `M` | `08` / `8` | `SSS` | `042` (ms) |
| `DD` / `D` | `05` / `5` | `A` / `a` | `PM` / `pm` |
| `Do` | `5th` | `Z` / `ZZ` | `+05:30` / `+0530` |
| `dddd` | `Tuesday` | `Q` | `3` (quarter) |
| `ddd` | `Tue` | `X` | Unix seconds |
| `d` | `2` (weekday 0–6) | `x` | Unix milliseconds |

Escape literal text with brackets: `'YYYY [year], MMMM'` → `2023 year, August`.
Unrecognized characters (`-`, `/`, `:`, unicode, …) pass through unchanged.

## Errors

Everything unparseable throws (or returns `false` from `isValidDate`) — nothing is silently coerced:

```ts
import { formatDate, InvalidDateError } from 'any-date-format'

try {
  formatDate('2023-02-30', 'DD-MM-YYYY')
} catch (error) {
  if (error instanceof InvalidDateError) {
    console.error(error.message) // Unable to parse date input "2023-02-30": …
    console.error(error.input)   // '2023-02-30'
  }
}
```

## Limitations

- Month and weekday names are **English only**.
- Named timezones are limited to `UTC`/`GMT`/`Z` and US abbreviations; IANA zone names (`Asia/Kolkata`) are not parsed, and output is local time or UTC only.
- The time of day must come **after** the date (`15/08/2023 14:30`, not `14:30 15/08/2023`).
- Strings without a year (`Aug 15`) are rejected rather than guessed.
- ISO week dates (`2023-W33-2`) and ordinal dates (`2023-227`) are not supported.
- A bare `number` is always a timestamp; a digit-string like `'2023'` is calendar-shaped (year 2023). Pass `timestampUnit` if your data disagrees.

## License

MIT © Satyendra Sagar Singh
