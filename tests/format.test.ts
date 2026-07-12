import { describe, expect, it } from 'vitest'
import { formatDate } from '../src'

// A fixed local date-time: Tuesday 2023-08-15 14:30:45.123 (local = Asia/Kolkata in tests).
const LOCAL = new Date(2023, 7, 15, 14, 30, 45, 123)

describe('formatDate: date tokens', () => {
  it('formats year tokens', () => {
    expect(formatDate(LOCAL, 'YYYY')).toBe('2023')
    expect(formatDate(LOCAL, 'YY')).toBe('23')
  })

  it('pads years below 1000', () => {
    expect(formatDate('0099-03-02', 'YYYY-MM-DD')).toBe('0099-03-02')
  })

  it('formats month tokens', () => {
    expect(formatDate(LOCAL, 'M')).toBe('8')
    expect(formatDate(LOCAL, 'MM')).toBe('08')
    expect(formatDate(LOCAL, 'MMM')).toBe('Aug')
    expect(formatDate(LOCAL, 'MMMM')).toBe('August')
  })

  it('formats day tokens', () => {
    expect(formatDate(LOCAL, 'D')).toBe('15')
    expect(formatDate(LOCAL, 'DD')).toBe('15')
    expect(formatDate(new Date(2023, 7, 5), 'D')).toBe('5')
    expect(formatDate(new Date(2023, 7, 5), 'DD')).toBe('05')
  })

  it('formats ordinal days', () => {
    expect(formatDate(new Date(2023, 7, 1), 'Do')).toBe('1st')
    expect(formatDate(new Date(2023, 7, 2), 'Do')).toBe('2nd')
    expect(formatDate(new Date(2023, 7, 3), 'Do')).toBe('3rd')
    expect(formatDate(new Date(2023, 7, 4), 'Do')).toBe('4th')
    expect(formatDate(new Date(2023, 7, 11), 'Do')).toBe('11th')
    expect(formatDate(new Date(2023, 7, 12), 'Do')).toBe('12th')
    expect(formatDate(new Date(2023, 7, 13), 'Do')).toBe('13th')
    expect(formatDate(new Date(2023, 7, 21), 'Do')).toBe('21st')
    expect(formatDate(new Date(2023, 7, 22), 'Do')).toBe('22nd')
    expect(formatDate(new Date(2023, 7, 23), 'Do')).toBe('23rd')
    expect(formatDate(new Date(2023, 7, 31), 'Do')).toBe('31st')
  })

  it('formats weekday tokens', () => {
    expect(formatDate(LOCAL, 'd')).toBe('2')
    expect(formatDate(LOCAL, 'ddd')).toBe('Tue')
    expect(formatDate(LOCAL, 'dddd')).toBe('Tuesday')
  })

  it('formats the quarter', () => {
    expect(formatDate(new Date(2023, 0, 10), 'Q')).toBe('1')
    expect(formatDate(new Date(2023, 2, 31), 'Q')).toBe('1')
    expect(formatDate(new Date(2023, 3, 1), 'Q')).toBe('2')
    expect(formatDate(new Date(2023, 11, 31), 'Q')).toBe('4')
  })
})

describe('formatDate: time tokens', () => {
  it('formats 24-hour tokens', () => {
    expect(formatDate(LOCAL, 'H:m:s')).toBe('14:30:45')
    expect(formatDate(LOCAL, 'HH:mm:ss')).toBe('14:30:45')
    expect(formatDate(new Date(2023, 7, 15, 4, 5, 6), 'HH:mm:ss')).toBe('04:05:06')
  })

  it('formats 12-hour tokens with meridiem', () => {
    expect(formatDate(LOCAL, 'h:mm A')).toBe('2:30 PM')
    expect(formatDate(LOCAL, 'hh:mm a')).toBe('02:30 pm')
    expect(formatDate(new Date(2023, 7, 15, 0, 5), 'h A')).toBe('12 AM')
    expect(formatDate(new Date(2023, 7, 15, 12, 0), 'h A')).toBe('12 PM')
    expect(formatDate(new Date(2023, 7, 15, 23, 0), 'hh a')).toBe('11 pm')
  })

  it('formats milliseconds', () => {
    expect(formatDate(LOCAL, 'SSS')).toBe('123')
    expect(formatDate(new Date(2023, 7, 15, 0, 0, 0, 7), 'SSS')).toBe('007')
  })

  it('formats epoch tokens', () => {
    const epoch = new Date(1692092400000)
    expect(formatDate(epoch, 'X')).toBe('1692092400')
    expect(formatDate(epoch, 'x')).toBe('1692092400000')
  })
})

describe('formatDate: timezone handling', () => {
  it('formats offsets for the local zone (fixed to +05:30 in tests)', () => {
    expect(formatDate(LOCAL, 'Z')).toBe('+05:30')
    expect(formatDate(LOCAL, 'ZZ')).toBe('+0530')
  })

  it('formats in UTC when utc is set', () => {
    expect(formatDate('2023-08-15T10:30:00+05:30', 'YYYY-MM-DD HH:mm Z', { utc: true })).toBe(
      '2023-08-15 05:00 +00:00',
    )
  })

  it('converts zoned inputs into local time by default', () => {
    // 00:30+05:30 is 19:00 UTC the previous day; in Asia/Kolkata it stays 00:30.
    expect(formatDate('2023-08-15T00:30:00+05:30', 'DD-MM-YYYY HH:mm')).toBe('15-08-2023 00:30')
  })
})

describe('formatDate: literals and structure', () => {
  it('preserves bracketed literals', () => {
    expect(formatDate(LOCAL, '[Year:] YYYY [Month:] MM')).toBe('Year: 2023 Month: 08')
    expect(formatDate(LOCAL, 'YYYY-MM-DD[T]HH:mm:ss')).toBe('2023-08-15T14:30:45')
    expect(formatDate(LOCAL, '[DD]')).toBe('DD')
  })

  it('passes unknown characters through', () => {
    expect(formatDate(LOCAL, 'DD/MM/YYYY')).toBe('15/08/2023')
    expect(formatDate(LOCAL, 'YYYY년 MM월 DD일')).toBe('2023년 08월 15일')
  })

  it('handles an empty format string', () => {
    expect(formatDate(LOCAL, '')).toBe('')
  })

  it('rejects a non-string format', () => {
    expect(() => formatDate(LOCAL, 42 as never)).toThrow(TypeError)
  })
})
