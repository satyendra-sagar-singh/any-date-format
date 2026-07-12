import { InvalidDateError } from '../errors'
import type { DateInput, ParseOptions } from '../types'
import { parseDigitString, timestampToDate } from './digits'
import { parseMonthNameDate } from './month-name'
import { parseNumericDate } from './numeric'
import { isValidCalendarDate, withTimeDefaults, type FullDateParts } from './shared'
import { extractTimeAndZone, parseUtcOffset, type ParsedTime } from './time'

const DIGIT_ONLY_RE = /^[+-]?\d+$/
const COMPACT_ISO_RE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(?:(\d{2})(?:[.,](\d{1,9}))?)?(Z|[+-]\d{2}(?::?\d{2})?)?$/
// NBSP, figure space, narrow NBSP: Intl-formatted date strings contain these.
const UNUSUAL_SPACE_RE = /[\u00a0\u2007\u202f]/g
const LEADING_WEEKDAY_RE = /^(?:sun|mon|tue|wed|thu|fri|sat)[a-z]*\.?[,\s]+/i
const TRAILING_PARENTHETICAL_RE = /\s*\([^()]*\)\s*$/

/**
 * Parses a date from (almost) any input format into a `Date`.
 * Throws `InvalidDateError` when the input cannot be understood.
 */
export function parseDate(input: DateInput, options: ParseOptions = {}): Date {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) throw new InvalidDateError(input, 'invalid Date instance')
    return new Date(input.getTime())
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new InvalidDateError(input, 'not a finite number')
    const date = timestampToDate(input, options.timestampUnit ?? 'auto')
    if (!date) throw new InvalidDateError(input, 'timestamp out of supported range')
    return date
  }

  if (typeof input !== 'string') throw new InvalidDateError(input, 'unsupported input type')

  const normalized = input.replace(UNUSUAL_SPACE_RE, ' ').trim()
  if (!normalized) throw new InvalidDateError(input, 'empty string')

  // Digit-only strings are fully owned by this library: no native fallback.
  if (DIGIT_ONLY_RE.test(normalized)) {
    const result = parseDigitString(normalized, options)
    if (result instanceof Date) return result
    if (result) return buildDate(result)
    throw new InvalidDateError(input, 'unrecognized numeric date or timestamp')
  }

  const structured = parseStructuredDate(normalized, options)
  if (structured) return structured

  if (options.useNativeFallback) {
    const fallback = new Date(normalized)
    if (!Number.isNaN(fallback.getTime()) && fallbackYearIsPlausible(normalized, fallback)) {
      return fallback
    }
  }

  throw new InvalidDateError(input, 'unrecognized date format')
}

function parseStructuredDate(normalized: string, options: ParseOptions): Date | null {
  const compactIso = parseCompactIso(normalized)
  if (compactIso) return buildDate(compactIso)

  const withoutParenthetical = normalized.replace(TRAILING_PARENTHETICAL_RE, '')
  const extraction = extractTimeAndZone(withoutParenthetical)
  if (extraction.invalid) return null

  const datePart = extraction.datePart
    .replace(LEADING_WEEKDAY_RE, '')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '')
    .trim()
  if (!datePart) return null

  const raw = parseNumericDate(datePart, options) ?? parseMonthNameDate(datePart)
  if (!raw || !isValidCalendarDate(raw.year, raw.month, raw.day)) return null

  return buildDate(mergeDateAndTime(raw, extraction.time))
}

function parseCompactIso(input: string): FullDateParts | null {
  const match = COMPACT_ISO_RE.exec(input)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = match[6] === undefined ? 0 : Number(match[6])
  const millisecond = match[7] === undefined ? 0 : Number(match[7].slice(0, 3).padEnd(3, '0'))

  if (!isValidCalendarDate(year, month, day)) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  let offsetMinutes: number | null = null
  if (match[8] !== undefined) {
    offsetMinutes = parseUtcOffset(match[8])
    if (offsetMinutes === null) return null
  }

  return { year, month, day, hour, minute, second, millisecond, offsetMinutes }
}

function mergeDateAndTime(raw: { year: number; month: number; day: number }, time: ParsedTime | null): FullDateParts {
  if (!time) return withTimeDefaults(raw)
  return {
    ...raw,
    hour: time.hour,
    minute: time.minute,
    second: time.second,
    millisecond: time.millisecond,
    offsetMinutes: time.offsetMinutes,
  }
}

function buildDate(parts: FullDateParts): Date {
  if (parts.offsetMinutes !== null) {
    const utcReference = new Date(0)
    utcReference.setUTCFullYear(parts.year, parts.month - 1, parts.day)
    utcReference.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond)
    return new Date(utcReference.getTime() - parts.offsetMinutes * 60_000)
  }

  // Construct via setters so years below 100 are not remapped to 19xx.
  const local = new Date(2000, 0, 1)
  local.setFullYear(parts.year, parts.month - 1, parts.day)
  local.setHours(parts.hour, parts.minute, parts.second, parts.millisecond)
  return local
}

/**
 * Guards the native-`Date` fallback: a correct parse must have taken its year
 * from the input, so reject results whose year appears nowhere in it (V8, for
 * example, invents a year for strings like "Aug 15").
 */
function fallbackYearIsPlausible(input: string, parsed: Date): boolean {
  const numbers = input.match(/\d+/g)
  if (!numbers) return false

  const candidateYears = new Set<number>()
  for (const text of numbers) {
    const value = Number(text)
    candidateYears.add(value)
    if (text.length <= 2) candidateYears.add(value < 70 ? 2000 + value : 1900 + value)
  }

  const localYear = parsed.getFullYear()
  const utcYear = parsed.getUTCFullYear()
  return [localYear, localYear - 1, localYear + 1, utcYear].some((year) => candidateYears.has(year))
}
