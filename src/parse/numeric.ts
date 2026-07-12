import type { ParseOptions } from '../types'
import { expandYear, type RawDateParts } from './shared'

interface NumericPart {
  value: number
  digits: number
}

const THREE_PART_RE = /^(\d{1,4})([/\-.\s])\s*(\d{1,2})\2\s*(\d{1,4})$/
const TWO_PART_RE = /^(\d{1,4})([/\-.])\s*(\d{1,4})$/

/**
 * Parses purely numeric dates with separators: `2023-08-15`, `15/08/2023`,
 * `08.15.23`, `08/2023`, … Ambiguity rules:
 * - a four-digit part (or any part > 31) is the year;
 * - of the remaining two, a part > 12 must be the day;
 * - otherwise `dayFirst` / `yearFirst` decide.
 */
export function parseNumericDate(datePart: string, options: ParseOptions): RawDateParts | null {
  const threePart = THREE_PART_RE.exec(datePart)
  if (threePart) {
    return resolveThreeParts(
      toNumericPart(threePart[1] as string),
      toNumericPart(threePart[3] as string),
      toNumericPart(threePart[4] as string),
      options,
    )
  }

  const twoPart = TWO_PART_RE.exec(datePart)
  if (twoPart) {
    return resolveTwoParts(toNumericPart(twoPart[1] as string), toNumericPart(twoPart[3] as string))
  }

  return null
}

function toNumericPart(text: string): NumericPart {
  return { value: Number(text), digits: text.length }
}

function looksLikeYear(part: NumericPart): boolean {
  return part.digits === 4 || part.value > 31
}

function resolveThreeParts(
  first: NumericPart,
  second: NumericPart,
  third: NumericPart,
  options: ParseOptions,
): RawDateParts | null {
  const firstIsYear = looksLikeYear(first)
  const thirdIsYear = looksLikeYear(third)
  if (firstIsYear && thirdIsYear) return null

  if (firstIsYear) {
    const year = expandYear(first.value, first.digits)
    if (year === null) return null
    // Year-first formats are conventionally Y-M-D.
    return { year, ...resolveMonthAndDay(second.value, third.value, false) }
  }

  if (thirdIsYear) {
    const year = expandYear(third.value, third.digits)
    if (year === null) return null
    return { year, ...resolveMonthAndDay(first.value, second.value, options.dayFirst ?? false) }
  }

  // Every part fits in two digits: fully ambiguous, options decide the order.
  if (options.yearFirst) {
    const year = expandYear(first.value, first.digits)
    if (year === null) return null
    return { year, ...resolveMonthAndDay(second.value, third.value, false) }
  }

  const year = expandYear(third.value, third.digits)
  if (year === null) return null
  return { year, ...resolveMonthAndDay(first.value, second.value, options.dayFirst ?? false) }
}

/**
 * Orders the two non-year parts. When the part placed in the month slot
 * cannot be a month (> 12) but the other part can, they swap — so
 * `31/12/2023` parses correctly even with month-first settings.
 */
function resolveMonthAndDay(a: number, b: number, dayFirst: boolean): { month: number; day: number } {
  let month = dayFirst ? b : a
  let day = dayFirst ? a : b
  if (month > 12 && day <= 12) {
    ;[month, day] = [day, month]
  }
  return { month, day }
}

function resolveTwoParts(first: NumericPart, second: NumericPart): RawDateParts | null {
  if (first.digits === 4 && second.value >= 1 && second.value <= 12) {
    return { year: first.value, month: second.value, day: 1 }
  }
  if (second.digits === 4 && first.value >= 1 && first.value <= 12) {
    return { year: second.value, month: first.value, day: 1 }
  }
  return null
}
