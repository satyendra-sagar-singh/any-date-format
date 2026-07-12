import { describe, expect, it } from 'vitest'
import { formatDate, isValidDate } from '../src'

describe('end to end: unknown input format, fixed output format', () => {
  // All of these describe 15 August 2023 (local or +05:30, which is local in tests).
  const inputsForAug15: Array<string | number> = [
    '2023-08-15',
    '2023-08-15T10:30:00',
    '2023-08-15 10:30:45.123',
    '2023-08-15T10:30:00+05:30',
    '15/08/2023',
    '15-08-2023',
    '15.08.2023',
    '08/15/2023',
    '2023/08/15',
    '15/8/23',
    'August 15, 2023',
    '15 Aug 2023',
    '15-Aug-2023',
    '15th of August 2023',
    'Aug 15 2023 2:30 PM',
    'Tuesday, 15 August 2023',
    '20230815',
    '15082023',
    '20230815T103000+0530',
    'Tue Aug 15 2023 14:30:00 GMT+0530 (India Standard Time)',
  ]

  it.each(inputsForAug15)('formats %s as 15-08-2023', (input) => {
    expect(formatDate(input, 'DD-MM-YYYY', { dayFirst: true })).toBe('15-08-2023')
  })

  it('formats UTC-anchored inputs consistently with utc output', () => {
    const utcInputs: Array<string | number> = [
      '2023-08-15T00:00:00Z',
      'Tue, 15 Aug 2023 00:00:00 GMT',
      1692057600, // 2023-08-15T00:00:00Z in seconds
      1692057600000,
    ]
    for (const input of utcInputs) {
      expect(formatDate(input, 'DD-MM-YYYY', { utc: true })).toBe('15-08-2023')
    }
  })

  it('supports rich output formats from any input', () => {
    expect(formatDate('15/08/2023', 'dddd, MMMM Do YYYY', { dayFirst: true })).toBe(
      'Tuesday, August 15th 2023',
    )
    expect(formatDate('August 15, 2023 2:30 PM', 'YYYY-MM-DD[T]HH:mm:ss')).toBe('2023-08-15T14:30:00')
    expect(formatDate(1692092400, 'MMM D, YYYY', { utc: true })).toBe('Aug 15, 2023')
  })

  it('round-trips its own output', () => {
    const output = formatDate('15 Aug 2023', 'DD/MM/YYYY')
    expect(formatDate(output, 'YYYY-MM-DD', { dayFirst: true })).toBe('2023-08-15')
  })

  it('isValidDate mirrors parseability', () => {
    expect(isValidDate('15/08/2023')).toBe(true)
    expect(isValidDate('Aug 15 2023')).toBe(true)
    expect(isValidDate('2023-02-30')).toBe(false)
    expect(isValidDate('nonsense')).toBe(false)
    expect(isValidDate(null as never)).toBe(false)
  })
})
