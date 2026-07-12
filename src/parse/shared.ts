export interface RawDateParts {
  year: number
  /** 1-based month. */
  month: number
  day: number
}

export interface FullDateParts extends RawDateParts {
  hour: number
  minute: number
  second: number
  millisecond: number
  /** Explicit UTC offset in minutes, or null when the input carries no timezone. */
  offsetMinutes: number | null
}

export const MIN_SUPPORTED_YEAR = 0
export const MAX_SUPPORTED_YEAR = 9999

/** Two-digit years below this pivot map to 20xx, the rest to 19xx. */
export const TWO_DIGIT_YEAR_PIVOT = 70

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

const DAYS_IN_MONTH: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29
  return DAYS_IN_MONTH[month - 1] ?? 0
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) return false
  if (!Number.isInteger(month) || month < 1 || month > 12) return false
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) return false
  return true
}

/**
 * Expands a year written with the given number of digits. Only two- and
 * four-digit years are accepted; two-digit years use the pivot rule.
 */
export function expandYear(value: number, digitCount: number): number | null {
  if (digitCount === 4) return value
  if (digitCount !== 2) return null
  return value < TWO_DIGIT_YEAR_PIVOT ? 2000 + value : 1900 + value
}

export function withTimeDefaults(raw: RawDateParts): FullDateParts {
  return { ...raw, hour: 0, minute: 0, second: 0, millisecond: 0, offsetMinutes: null }
}
