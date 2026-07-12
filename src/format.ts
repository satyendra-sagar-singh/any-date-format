import {
  MONTH_ABBREVIATIONS,
  MONTH_NAMES,
  ordinalSuffixOf,
  WEEKDAY_ABBREVIATIONS,
  WEEKDAY_NAMES,
} from './locale'

// Bracketed literals first, then tokens longest-first so `MM` wins over `M`.
const FORMAT_TOKEN_RE =
  /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|Do|DD|D|dddd|ddd|d|HH|H|hh|h|mm|m|ss|s|SSS|A|a|ZZ|Z|Q|X|x/g

interface DateFields {
  year: number
  month: number
  day: number
  weekday: number
  hour: number
  minute: number
  second: number
  millisecond: number
  offsetMinutes: number
  epochMilliseconds: number
}

export function formatDateInstance(date: Date, outputFormat: string, utc = false): string {
  const fields = readDateFields(date, utc)
  return outputFormat.replace(FORMAT_TOKEN_RE, (token, bracketedText: string | undefined) => {
    if (bracketedText !== undefined) return bracketedText
    return formatToken(token, fields)
  })
}

function readDateFields(date: Date, utc: boolean): DateFields {
  if (utc) {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      weekday: date.getUTCDay(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      millisecond: date.getUTCMilliseconds(),
      offsetMinutes: 0,
      epochMilliseconds: date.getTime(),
    }
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: date.getDay(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
    offsetMinutes: -date.getTimezoneOffset(),
    epochMilliseconds: date.getTime(),
  }
}

function formatToken(token: string, fields: DateFields): string {
  switch (token) {
    case 'YYYY':
      return padYear(fields.year)
    case 'YY':
      return pad2(((fields.year % 100) + 100) % 100)
    case 'M':
      return String(fields.month)
    case 'MM':
      return pad2(fields.month)
    case 'MMM':
      return MONTH_ABBREVIATIONS[fields.month - 1] as string
    case 'MMMM':
      return MONTH_NAMES[fields.month - 1] as string
    case 'D':
      return String(fields.day)
    case 'DD':
      return pad2(fields.day)
    case 'Do':
      return `${fields.day}${ordinalSuffixOf(fields.day)}`
    case 'd':
      return String(fields.weekday)
    case 'ddd':
      return WEEKDAY_ABBREVIATIONS[fields.weekday] as string
    case 'dddd':
      return WEEKDAY_NAMES[fields.weekday] as string
    case 'H':
      return String(fields.hour)
    case 'HH':
      return pad2(fields.hour)
    case 'h':
      return String(twelveHour(fields.hour))
    case 'hh':
      return pad2(twelveHour(fields.hour))
    case 'm':
      return String(fields.minute)
    case 'mm':
      return pad2(fields.minute)
    case 's':
      return String(fields.second)
    case 'ss':
      return pad2(fields.second)
    case 'SSS':
      return String(fields.millisecond).padStart(3, '0')
    case 'A':
      return fields.hour < 12 ? 'AM' : 'PM'
    case 'a':
      return fields.hour < 12 ? 'am' : 'pm'
    case 'Z':
      return formatOffset(fields.offsetMinutes, ':')
    case 'ZZ':
      return formatOffset(fields.offsetMinutes, '')
    case 'Q':
      return String(Math.floor((fields.month - 1) / 3) + 1)
    case 'X':
      return String(Math.floor(fields.epochMilliseconds / 1000))
    case 'x':
      return String(fields.epochMilliseconds)
    default:
      return token
  }
}

function twelveHour(hour: number): number {
  return hour % 12 === 0 ? 12 : hour % 12
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function padYear(year: number): string {
  if (year < 0) return `-${String(-year).padStart(4, '0')}`
  return String(year).padStart(4, '0')
}

function formatOffset(offsetMinutes: number, separator: string): string {
  const sign = offsetMinutes < 0 ? '-' : '+'
  const absolute = Math.abs(offsetMinutes)
  return `${sign}${pad2(Math.floor(absolute / 60))}${separator}${pad2(absolute % 60)}`
}
