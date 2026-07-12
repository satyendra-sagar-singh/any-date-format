export type DateInput = string | number | Date

export interface ParseOptions {
  /**
   * Interpret ambiguous numeric dates like `01/02/2023` as day-first (D/M/Y).
   * Unambiguous inputs (e.g. `25/12/2023`) resolve automatically regardless.
   * Default: `false` (month-first, M/D/Y).
   */
  dayFirst?: boolean
  /**
   * Interpret fully ambiguous all-two-digit dates like `10-11-12` as
   * year-first (Y/M/D). Default: `false` (year last).
   */
  yearFirst?: boolean
  /**
   * How to interpret bare numeric timestamps.
   * `'auto'` treats values >= 1e12 (absolute) as milliseconds, otherwise as
   * seconds — unless the seconds reading lands past year 9999, in which case
   * milliseconds are assumed. Default: `'auto'`.
   */
  timestampUnit?: 'auto' | 'seconds' | 'milliseconds'
  /**
   * As a last resort, try the JS engine's native `Date` parser for strings
   * this library does not recognize. Engine-dependent and lenient; results
   * are still rejected when the parsed year appears nowhere in the input.
   * Default: `false`.
   */
  useNativeFallback?: boolean
}

export interface FormatDateOptions extends ParseOptions {
  /** Render output in UTC instead of the local timezone. Default: `false`. */
  utc?: boolean
}
