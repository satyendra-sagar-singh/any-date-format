import { describe, expect, it } from 'vitest'
import { InvalidDateError, parseDate } from '../src'

function localParts(date: Date): [number, number, number, number, number, number, number] {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ]
}

describe('parseDate: ISO 8601', () => {
  it('parses a plain ISO date as local time', () => {
    expect(localParts(parseDate('2023-08-15'))).toEqual([2023, 8, 15, 0, 0, 0, 0])
  })

  it('parses ISO date-time with T separator', () => {
    expect(localParts(parseDate('2023-08-15T10:30:45'))).toEqual([2023, 8, 15, 10, 30, 45, 0])
  })

  it('parses ISO date-time with space separator and fraction', () => {
    expect(localParts(parseDate('2023-08-15 10:30:45.123'))).toEqual([2023, 8, 15, 10, 30, 45, 123])
  })

  it('truncates long fractional seconds to milliseconds', () => {
    expect(parseDate('2023-08-15T10:30:45.123456789Z').getUTCMilliseconds()).toBe(123)
  })

  it('parses Z as UTC', () => {
    expect(parseDate('2023-08-15T10:30:00Z').getTime()).toBe(Date.UTC(2023, 7, 15, 10, 30, 0))
  })

  it('parses positive and negative UTC offsets', () => {
    expect(parseDate('2023-08-15T10:30:00+05:30').getTime()).toBe(Date.UTC(2023, 7, 15, 5, 0, 0))
    expect(parseDate('2023-08-15T10:30:00-0430').getTime()).toBe(Date.UTC(2023, 7, 15, 15, 0, 0))
    expect(parseDate('2023-08-15T10:30:00+05').getTime()).toBe(Date.UTC(2023, 7, 15, 5, 30, 0))
  })

  it('parses year-month as the first of the month', () => {
    expect(localParts(parseDate('2023-08'))).toEqual([2023, 8, 1, 0, 0, 0, 0])
  })

  it('parses compact ISO date-times', () => {
    expect(parseDate('20230815T1030Z').getTime()).toBe(Date.UTC(2023, 7, 15, 10, 30, 0))
    expect(parseDate('20230815T103045+0530').getTime()).toBe(Date.UTC(2023, 7, 15, 5, 0, 45))
    expect(localParts(parseDate('20230815T103045'))).toEqual([2023, 8, 15, 10, 30, 45, 0])
  })

  it('parses years below 100 without 19xx remapping', () => {
    expect(parseDate('0099-03-02').getFullYear()).toBe(99)
  })
})

describe('parseDate: separated numeric dates', () => {
  it('defaults ambiguous dates to month-first', () => {
    expect(localParts(parseDate('01/02/2023')).slice(0, 3)).toEqual([2023, 1, 2])
  })

  it('respects dayFirst for ambiguous dates', () => {
    expect(localParts(parseDate('01/02/2023', { dayFirst: true })).slice(0, 3)).toEqual([2023, 2, 1])
  })

  it('resolves unambiguous day > 12 automatically in both modes', () => {
    expect(localParts(parseDate('15/08/2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('08/15/2023', { dayFirst: true })).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('supports dash, dot, and space separators', () => {
    expect(localParts(parseDate('15-08-2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('15.08.2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('15 08 2023')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('rejects mixed separators', () => {
    expect(() => parseDate('15-08/2023')).toThrow(InvalidDateError)
  })

  it('treats a leading four-digit part as the year (Y-M-D)', () => {
    expect(localParts(parseDate('2023/08/15')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('swaps month and day when the month slot is impossible', () => {
    expect(localParts(parseDate('2023-15-08')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('2023-13-01')).slice(0, 3)).toEqual([2023, 1, 13])
  })

  it('expands two-digit years with a 1970 pivot', () => {
    expect(parseDate('15/08/23').getFullYear()).toBe(2023)
    expect(parseDate('15/08/85').getFullYear()).toBe(1985)
  })

  it('handles fully ambiguous two-digit triples via options', () => {
    expect(localParts(parseDate('10-11-12')).slice(0, 3)).toEqual([2012, 10, 11])
    expect(localParts(parseDate('10-11-12', { dayFirst: true })).slice(0, 3)).toEqual([2012, 11, 10])
    expect(localParts(parseDate('10-11-12', { yearFirst: true })).slice(0, 3)).toEqual([2010, 11, 12])
  })

  it('parses month/year and year/month pairs', () => {
    expect(localParts(parseDate('08/2023')).slice(0, 3)).toEqual([2023, 8, 1])
    expect(localParts(parseDate('2023-08')).slice(0, 3)).toEqual([2023, 8, 1])
  })

  it('rejects three-digit years', () => {
    expect(() => parseDate('15/08/223')).toThrow(InvalidDateError)
  })

  it('parses numeric dates with a trailing time', () => {
    expect(localParts(parseDate('15/08/2023 14:30'))).toEqual([2023, 8, 15, 14, 30, 0, 0])
    expect(localParts(parseDate('15/08/2023 2:30 pm'))).toEqual([2023, 8, 15, 14, 30, 0, 0])
  })
})

describe('parseDate: month names', () => {
  it('parses day-month-year arrangements', () => {
    expect(localParts(parseDate('15 Aug 2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('15-Aug-2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('15 August 23')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('parses month-day-year arrangements', () => {
    expect(localParts(parseDate('August 15, 2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('Aug 15 2023')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('parses year-month-day arrangements', () => {
    expect(localParts(parseDate('2023 Aug 15')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('handles ordinals, "the", and "of"', () => {
    expect(localParts(parseDate('15th of August 2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('the 3rd of March 2021')).slice(0, 3)).toEqual([2021, 3, 3])
    expect(localParts(parseDate('August 21st, 2023')).slice(0, 3)).toEqual([2023, 8, 21])
  })

  it('is case-insensitive and accepts "Sept" and dotted abbreviations', () => {
    expect(localParts(parseDate('15 SEPT 2023')).slice(0, 3)).toEqual([2023, 9, 15])
    expect(localParts(parseDate('15 aug. 2023')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('parses month-year without a day', () => {
    expect(localParts(parseDate('August 2023')).slice(0, 3)).toEqual([2023, 8, 1])
    expect(localParts(parseDate('2023 August')).slice(0, 3)).toEqual([2023, 8, 1])
  })

  it('ignores a leading weekday', () => {
    expect(localParts(parseDate('Tuesday, 15 August 2023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('Tue Aug 15 2023')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('rejects unknown month words', () => {
    expect(() => parseDate('15 Augustus 2023')).toThrow(InvalidDateError)
    expect(() => parseDate('15 xy 2023')).toThrow(InvalidDateError)
  })

  it('rejects dates without a year', () => {
    expect(() => parseDate('August 15')).toThrow(InvalidDateError)
    expect(() => parseDate('Aug 15')).toThrow(InvalidDateError)
  })
})

describe('parseDate: RFC 2822 and toString-style inputs', () => {
  it('parses RFC 2822 with GMT', () => {
    expect(parseDate('Tue, 15 Aug 2023 14:30:00 GMT').getTime()).toBe(Date.UTC(2023, 7, 15, 14, 30, 0))
  })

  it('parses RFC 2822 with numeric offsets', () => {
    expect(parseDate('Tue, 15 Aug 2023 14:30:00 +0530').getTime()).toBe(Date.UTC(2023, 7, 15, 9, 0, 0))
  })

  it('parses RFC 2822 with US zone abbreviations', () => {
    expect(parseDate('Tue, 15 Aug 2023 14:30:00 EST').getTime()).toBe(Date.UTC(2023, 7, 15, 19, 30, 0))
  })

  it('parses JS Date#toString output', () => {
    const asString = 'Tue Aug 15 2023 14:30:00 GMT+0530 (India Standard Time)'
    expect(parseDate(asString).getTime()).toBe(Date.UTC(2023, 7, 15, 9, 0, 0))
  })

  it('round-trips toString/toISOString/toUTCString of a real date', () => {
    const original = new Date(2023, 7, 15, 14, 30, 45)
    expect(parseDate(original.toString()).getTime()).toBe(original.getTime())
    expect(parseDate(original.toISOString()).getTime()).toBe(original.getTime())
    expect(parseDate(original.toUTCString()).getTime()).toBe(original.getTime())
  })
})

describe('parseDate: times and meridiem', () => {
  it('parses 12-hour edges correctly', () => {
    expect(parseDate('15/08/2023 12:00 am').getHours()).toBe(0)
    expect(parseDate('15/08/2023 12:00 pm').getHours()).toBe(12)
    expect(parseDate('15/08/2023 1:00 pm').getHours()).toBe(13)
  })

  it('parses hour-only times with meridiem', () => {
    expect(parseDate('15 Aug 2023 2pm').getHours()).toBe(14)
    expect(parseDate('15 Aug 2023 at 2 p.m.').getHours()).toBe(14)
  })

  it('rejects impossible times', () => {
    expect(() => parseDate('15/08/2023 25:00')).toThrow(InvalidDateError)
    expect(() => parseDate('15/08/2023 10:75')).toThrow(InvalidDateError)
    expect(() => parseDate('15/08/2023 13:00 pm')).toThrow(InvalidDateError)
    expect(() => parseDate('15/08/2023 10:30:99')).toThrow(InvalidDateError)
  })
})

describe('parseDate: timestamps and numbers', () => {
  it('auto-detects second timestamps', () => {
    expect(parseDate(1692092400).getTime()).toBe(1692092400000)
    expect(parseDate('1692092400').getTime()).toBe(1692092400000)
  })

  it('auto-detects millisecond timestamps', () => {
    expect(parseDate(1692092400000).getTime()).toBe(1692092400000)
    expect(parseDate('1692092400000').getTime()).toBe(1692092400000)
  })

  it('honors an explicit timestampUnit', () => {
    expect(parseDate(1692092400, { timestampUnit: 'milliseconds' }).getTime()).toBe(1692092400)
    expect(parseDate(86400, { timestampUnit: 'seconds' }).getTime()).toBe(86400000)
  })

  it('treats sub-threshold ms values whose seconds reading overflows as ms', () => {
    // 9e11 as seconds would be year ~30489; as ms it is 1998.
    expect(parseDate(9e11).getUTCFullYear()).toBe(1998)
  })

  it('handles zero and negative timestamps', () => {
    expect(parseDate(0).getTime()).toBe(0)
    expect(parseDate(-86400).getTime()).toBe(-86400000)
  })

  it('rejects non-finite numbers', () => {
    expect(() => parseDate(Number.NaN)).toThrow(InvalidDateError)
    expect(() => parseDate(Number.POSITIVE_INFINITY)).toThrow(InvalidDateError)
  })

  it('rejects timestamps outside the Date range', () => {
    expect(() => parseDate(9e15, { timestampUnit: 'milliseconds' })).toThrow(InvalidDateError)
  })
})

describe('parseDate: digit-only calendar strings', () => {
  it('parses compact YYYYMMDD', () => {
    expect(localParts(parseDate('20230815')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('falls back to DDMMYYYY / MMDDYYYY when YYYYMMDD is impossible', () => {
    expect(localParts(parseDate('15082023')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('01022023')).slice(0, 3)).toEqual([2023, 1, 2])
    expect(localParts(parseDate('01022023', { dayFirst: true })).slice(0, 3)).toEqual([2023, 2, 1])
  })

  it('parses compact YYYYMMDDHHmmss', () => {
    expect(localParts(parseDate('20230815143045'))).toEqual([2023, 8, 15, 14, 30, 45, 0])
  })

  it('parses a bare four-digit year as Jan 1', () => {
    expect(localParts(parseDate('2023')).slice(0, 3)).toEqual([2023, 1, 1])
  })

  it('rejects digit strings with no sensible reading', () => {
    expect(() => parseDate('123')).toThrow(InvalidDateError)
    expect(() => parseDate('999999')).toThrow(InvalidDateError)
    expect(() => parseDate('99999999')).toThrow(InvalidDateError)
  })
})

describe('parseDate: calendar validation', () => {
  it('accepts leap days only in leap years', () => {
    expect(localParts(parseDate('2024-02-29')).slice(0, 3)).toEqual([2024, 2, 29])
    expect(localParts(parseDate('2000-02-29')).slice(0, 3)).toEqual([2000, 2, 29])
    expect(() => parseDate('2023-02-29')).toThrow(InvalidDateError)
    expect(() => parseDate('1900-02-29')).toThrow(InvalidDateError)
  })

  it('rejects impossible days and months without rollover', () => {
    expect(() => parseDate('2023-02-30')).toThrow(InvalidDateError)
    expect(() => parseDate('2023-04-31')).toThrow(InvalidDateError)
    expect(() => parseDate('2023-00-10')).toThrow(InvalidDateError)
    expect(() => parseDate('2023-01-00')).toThrow(InvalidDateError)
  })

  it('accepts month-length boundaries', () => {
    expect(localParts(parseDate('2023-01-31')).slice(0, 3)).toEqual([2023, 1, 31])
    expect(localParts(parseDate('2023-04-30')).slice(0, 3)).toEqual([2023, 4, 30])
  })
})

describe('parseDate: Date instances and invalid inputs', () => {
  it('clones Date instances', () => {
    const original = new Date(2023, 7, 15)
    const cloned = parseDate(original)
    expect(cloned.getTime()).toBe(original.getTime())
    expect(cloned).not.toBe(original)
  })

  it('rejects invalid Date instances', () => {
    expect(() => parseDate(new Date(Number.NaN))).toThrow(InvalidDateError)
  })

  it('rejects unsupported types and empty strings', () => {
    expect(() => parseDate(null as never)).toThrow(InvalidDateError)
    expect(() => parseDate(undefined as never)).toThrow(InvalidDateError)
    expect(() => parseDate(true as never)).toThrow(InvalidDateError)
    expect(() => parseDate({} as never)).toThrow(InvalidDateError)
    expect(() => parseDate('')).toThrow(InvalidDateError)
    expect(() => parseDate('   ')).toThrow(InvalidDateError)
  })

  it('rejects garbage strings', () => {
    expect(() => parseDate('not a date')).toThrow(InvalidDateError)
    expect(() => parseDate('hello world 42')).toThrow(InvalidDateError)
  })

  it('tolerates surrounding whitespace and non-breaking spaces', () => {
    expect(localParts(parseDate('  15/08/2023  ')).slice(0, 3)).toEqual([2023, 8, 15])
    expect(localParts(parseDate('Aug 15, 2023')).slice(0, 3)).toEqual([2023, 8, 15])
  })

  it('does not use the engine parser unless asked', () => {
    expect(() => parseDate('2023-W33-2')).toThrow(InvalidDateError)
    expect(() => parseDate('hello world 42')).toThrow(InvalidDateError)
  })

  it('guards the opt-in native fallback against invented years', () => {
    // Whatever the engine does with a yearless string, the result must not
    // carry a year that appears nowhere in the input.
    expect(() => parseDate('Aug 15', { useNativeFallback: true })).toThrow(InvalidDateError)
    expect(() => parseDate('not a date', { useNativeFallback: true })).toThrow(InvalidDateError)
  })
})
