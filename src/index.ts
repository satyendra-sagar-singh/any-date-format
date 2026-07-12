import { InvalidDateError } from './errors'
import { formatDateInstance } from './format'
import { parseDate } from './parse'
import type { DateInput, FormatDateOptions, ParseOptions } from './types'

/**
 * Parses `input` (almost any date format: ISO 8601, `15/08/2023`,
 * `August 15, 2023`, RFC 2822, Unix timestamps, compact digits, …) and
 * renders it with the given output format tokens, e.g. `"DD-MM-YYYY"`.
 *
 * Throws `InvalidDateError` when the input cannot be parsed.
 */
export function formatDate(input: DateInput, outputFormat: string, options: FormatDateOptions = {}): string {
  if (typeof outputFormat !== 'string') {
    throw new TypeError('outputFormat must be a string of format tokens, e.g. "DD-MM-YYYY"')
  }
  const date = parseDate(input, options)
  return formatDateInstance(date, outputFormat, options.utc ?? false)
}

/** Returns true when `input` can be parsed as a date. Never throws for bad values. */
export function isValidDate(input: DateInput, options: ParseOptions = {}): boolean {
  try {
    parseDate(input, options)
    return true
  } catch (error) {
    if (error instanceof InvalidDateError) return false
    throw error
  }
}

export { parseDate } from './parse'
export { InvalidDateError } from './errors'
export type { DateInput, FormatDateOptions, ParseOptions } from './types'
