import { monthFromName } from '../locale'
import { expandYear, type RawDateParts } from './shared'

const DAY_MONTH_YEAR_RE = /^(\d{1,2})[\s\-./]*([a-z][a-z.]*)[\s\-./]*(\d{1,4})$/i
const YEAR_MONTH_DAY_RE = /^(\d{4})[\s\-./]*([a-z][a-z.]*)[\s\-./]*(\d{1,2})$/i
// Day and year are both digit runs, so they need a real separator between
// them — otherwise "August 2023" would split into day 20, year 23.
const MONTH_DAY_YEAR_RE = /^([a-z][a-z.]*)[\s\-./]*(\d{1,2})[\s\-./]+(\d{2,4})$/i
const MONTH_YEAR_RE = /^([a-z][a-z.]*)[\s\-./]*(\d{4})$/i
const YEAR_MONTH_RE = /^(\d{4})[\s\-./]*([a-z][a-z.]*)$/i

/**
 * Parses dates containing an English month name in any common arrangement:
 * `15 Aug 2023`, `August 15, 2023`, `2023 Aug 15`, `15th of August 2023`,
 * `Sep-2023`, `15-Aug-23`, …
 */
export function parseMonthNameDate(datePart: string): RawDateParts | null {
  const cleaned = datePart
    .replace(/,/g, ' ')
    .replace(/(\d)(st|nd|rd|th)\b/gi, '$1')
    .replace(/\b(?:the|of)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const dayMonthYear = DAY_MONTH_YEAR_RE.exec(cleaned)
  if (dayMonthYear) {
    return buildParts(dayMonthYear[2] as string, dayMonthYear[1] as string, dayMonthYear[3] as string)
  }

  const yearMonthDay = YEAR_MONTH_DAY_RE.exec(cleaned)
  if (yearMonthDay) {
    return buildParts(yearMonthDay[2] as string, yearMonthDay[3] as string, yearMonthDay[1] as string)
  }

  const monthDayYear = MONTH_DAY_YEAR_RE.exec(cleaned)
  if (monthDayYear) {
    return buildParts(monthDayYear[1] as string, monthDayYear[2] as string, monthDayYear[3] as string)
  }

  const monthYear = MONTH_YEAR_RE.exec(cleaned)
  if (monthYear) {
    return buildParts(monthYear[1] as string, '1', monthYear[2] as string)
  }

  const yearMonth = YEAR_MONTH_RE.exec(cleaned)
  if (yearMonth) {
    return buildParts(yearMonth[2] as string, '1', yearMonth[1] as string)
  }

  return null
}

function buildParts(monthWord: string, dayText: string, yearText: string): RawDateParts | null {
  const month = monthFromName(monthWord)
  if (month === null) return null

  const year = expandYear(Number(yearText), yearText.length)
  if (year === null) return null

  return { year, month, day: Number(dayText) }
}
