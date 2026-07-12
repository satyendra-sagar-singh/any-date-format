import type { ParseOptions } from '../types'
import {
  isValidCalendarDate,
  MAX_SUPPORTED_YEAR,
  withTimeDefaults,
  type FullDateParts,
  type RawDateParts,
} from './shared'

const MILLISECONDS_THRESHOLD = 1e12
const MIN_TIMESTAMP_DIGITS = 10
const MAX_TIMESTAMP_DIGITS = 15

export function timestampToDate(value: number, unit: NonNullable<ParseOptions['timestampUnit']>): Date | null {
  const epochMilliseconds = resolveEpochMilliseconds(value, unit)
  const date = new Date(Math.round(epochMilliseconds))
  return Number.isNaN(date.getTime()) ? null : date
}

function resolveEpochMilliseconds(value: number, unit: NonNullable<ParseOptions['timestampUnit']>): number {
  if (unit === 'milliseconds') return value
  if (unit === 'seconds') return value * 1000

  if (Math.abs(value) >= MILLISECONDS_THRESHOLD) return value

  // Prefer seconds, but a seconds reading past year 9999 means the value was
  // almost certainly milliseconds (e.g. an epoch-ms from the 1990s).
  const asSeconds = value * 1000
  const secondsYear = new Date(asSeconds).getUTCFullYear()
  if (Number.isNaN(secondsYear) || secondsYear > MAX_SUPPORTED_YEAR) return value
  return asSeconds
}

/**
 * Parses strings made only of digits (optionally signed): compact calendar
 * dates (`20230815`, `20230815143000`), bare years (`2023`), and Unix
 * timestamps in seconds or milliseconds.
 */
export function parseDigitString(input: string, options: ParseOptions): Date | FullDateParts | null {
  const isSigned = input.startsWith('-') || input.startsWith('+')
  const digits = isSigned ? input.slice(1) : input

  if (!isSigned) {
    if (digits.length === 4) {
      const year = Number(digits)
      return isValidCalendarDate(year, 1, 1) ? withTimeDefaults({ year, month: 1, day: 1 }) : null
    }
    if (digits.length === 8) return parseCompactDate(digits, options)
    if (digits.length === 14) return parseCompactDateTime(digits)
  }

  if (digits.length >= MIN_TIMESTAMP_DIGITS && digits.length <= MAX_TIMESTAMP_DIGITS) {
    return timestampToDate(Number(input), options.timestampUnit ?? 'auto')
  }
  return null
}

/**
 * Eight digits are read as ISO `YYYYMMDD` first; if that is not a real
 * calendar date, the `dayFirst`-preferred order is tried, then the remaining
 * one — so `15082023` still resolves to 15 Aug 2023.
 */
function parseCompactDate(digits: string, options: ParseOptions): FullDateParts | null {
  const asYearFirst: RawDateParts = {
    year: Number(digits.slice(0, 4)),
    month: Number(digits.slice(4, 6)),
    day: Number(digits.slice(6, 8)),
  }
  const asDayFirst: RawDateParts = {
    year: Number(digits.slice(4, 8)),
    month: Number(digits.slice(2, 4)),
    day: Number(digits.slice(0, 2)),
  }
  const asMonthFirst: RawDateParts = {
    year: Number(digits.slice(4, 8)),
    month: Number(digits.slice(0, 2)),
    day: Number(digits.slice(2, 4)),
  }

  const candidates = options.dayFirst
    ? [asYearFirst, asDayFirst, asMonthFirst]
    : [asYearFirst, asMonthFirst, asDayFirst]

  for (const candidate of candidates) {
    if (isValidCalendarDate(candidate.year, candidate.month, candidate.day)) {
      return withTimeDefaults(candidate)
    }
  }
  return null
}

function parseCompactDateTime(digits: string): FullDateParts | null {
  const year = Number(digits.slice(0, 4))
  const month = Number(digits.slice(4, 6))
  const day = Number(digits.slice(6, 8))
  const hour = Number(digits.slice(8, 10))
  const minute = Number(digits.slice(10, 12))
  const second = Number(digits.slice(12, 14))

  if (!isValidCalendarDate(year, month, day)) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  return { year, month, day, hour, minute, second, millisecond: 0, offsetMinutes: null }
}
