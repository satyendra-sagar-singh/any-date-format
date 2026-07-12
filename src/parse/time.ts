export interface ParsedTime {
  hour: number
  minute: number
  second: number
  millisecond: number
  /** Explicit UTC offset in minutes, or null when no timezone was given. */
  offsetMinutes: number | null
}

export interface TimeExtraction {
  /** The input with any trailing time-of-day and timezone removed. */
  datePart: string
  time: ParsedTime | null
  /** True when a time-like suffix matched but contained impossible values. */
  invalid: boolean
}

const NAMED_ZONE_OFFSET_MINUTES: Record<string, number> = {
  Z: 0,
  UT: 0,
  UTC: 0,
  GMT: 0,
  EST: -300,
  EDT: -240,
  CST: -360,
  CDT: -300,
  MST: -420,
  MDT: -360,
  PST: -480,
  PDT: -420,
}

const UTC_OFFSET_RE = /^([+-])(\d{1,2})(?::?(\d{2}))?$/
const MAX_OFFSET_MINUTES = 14 * 60

export function parseUtcOffset(zone: string): number | null {
  const normalized = zone.trim().toUpperCase()
  const named = NAMED_ZONE_OFFSET_MINUTES[normalized]
  if (named !== undefined) return named

  const withoutPrefix = normalized.replace(/^(?:UTC|UT|GMT)\s*/, '')
  const match = UTC_OFFSET_RE.exec(withoutPrefix)
  if (!match) return null

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2])
  const minutes = match[3] === undefined ? 0 : Number(match[3])
  if (minutes > 59) return null

  const totalMinutes = hours * 60 + minutes
  if (totalMinutes > MAX_OFFSET_MINUTES) return null
  return sign * totalMinutes
}

const MERIDIEM_RE_SOURCE = 'am|pm|a\\.m\\.|p\\.m\\.'
const ZONE_RE_SOURCE =
  'Z|(?:UTC|UT|GMT)(?:\\s?[+-]\\d{1,2}:?\\d{2})?|[+-]\\d{2}(?::?\\d{2})?|EST|EDT|CST|CDT|MST|MDT|PST|PDT'

/**
 * Matches a time-of-day (with optional fraction, meridiem, and timezone) at
 * the END of the string. Timezones are only recognized after a time, so
 * offset-like fragments can never swallow parts of a date such as "-2023".
 */
const TIME_AND_ZONE_RE = new RegExp(
  '(?:^|[\\sT,])(?:at\\s+)?' +
    '(?:' +
    `(\\d{1,2}):(\\d{2})(?::(\\d{2})(?:[.,](\\d{1,9}))?)?\\s*(${MERIDIEM_RE_SOURCE})?` +
    `|(\\d{1,2})\\s*(${MERIDIEM_RE_SOURCE})` +
    ')' +
    `(?:\\s*(${ZONE_RE_SOURCE}))?` +
    '\\s*$',
  'i',
)

export function extractTimeAndZone(input: string): TimeExtraction {
  const match = TIME_AND_ZONE_RE.exec(input)
  if (!match) return { datePart: input.trim(), time: null, invalid: false }

  const datePart = input.slice(0, match.index).trim()
  const time = buildTime(match)
  if (!time) return { datePart, time: null, invalid: true }
  return { datePart, time, invalid: false }
}

function buildTime(match: RegExpExecArray): ParsedTime | null {
  const [, hourWithMinutes, minuteText, secondText, fractionText, meridiem, hourOnly, meridiemForHourOnly, zone] =
    match

  let hour = Number(hourWithMinutes ?? hourOnly)
  const minute = minuteText === undefined ? 0 : Number(minuteText)
  const second = secondText === undefined ? 0 : Number(secondText)
  const millisecond = fractionText === undefined ? 0 : Number(fractionText.slice(0, 3).padEnd(3, '0'))
  const meridiemToken = (meridiem ?? meridiemForHourOnly)?.toLowerCase().replace(/\./g, '')

  if (meridiemToken !== undefined) {
    if (hour < 1 || hour > 12) return null
    if (meridiemToken === 'pm' && hour !== 12) hour += 12
    if (meridiemToken === 'am' && hour === 12) hour = 0
  } else if (hour > 23) {
    return null
  }
  if (minute > 59 || second > 59) return null

  let offsetMinutes: number | null = null
  if (zone !== undefined) {
    offsetMinutes = parseUtcOffset(zone)
    if (offsetMinutes === null) return null
  }

  return { hour, minute, second, millisecond, offsetMinutes }
}
