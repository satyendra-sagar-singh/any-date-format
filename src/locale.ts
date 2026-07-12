export const MONTH_NAMES: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const MONTH_ABBREVIATIONS: readonly string[] = MONTH_NAMES.map((name) => name.slice(0, 3))

export const WEEKDAY_NAMES: readonly string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const WEEKDAY_ABBREVIATIONS: readonly string[] = WEEKDAY_NAMES.map((name) => name.slice(0, 3))

const MIN_MONTH_NAME_LENGTH = 3

/**
 * Resolves an English month name (full, abbreviated, or any unambiguous
 * prefix of at least three letters, e.g. "Sept") to its 1-based number.
 */
export function monthFromName(word: string): number | null {
  const normalized = word.toLowerCase().replace(/\./g, '')
  if (normalized.length < MIN_MONTH_NAME_LENGTH) return null
  const index = MONTH_NAMES.findIndex((name) => name.toLowerCase().startsWith(normalized))
  return index === -1 ? null : index + 1
}

export function ordinalSuffixOf(day: number): string {
  const remainderOfHundred = day % 100
  if (remainderOfHundred >= 11 && remainderOfHundred <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}
