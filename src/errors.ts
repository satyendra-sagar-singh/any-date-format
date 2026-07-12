export class InvalidDateError extends Error {
  readonly input: unknown
  readonly reason: string

  constructor(input: unknown, reason: string) {
    super(`Unable to parse date input ${describeInput(input)}: ${reason}`)
    this.name = 'InvalidDateError'
    this.input = input
    this.reason = reason
  }
}

function describeInput(input: unknown): string {
  if (typeof input === 'string') return JSON.stringify(input)
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? 'Date(Invalid Date)' : `Date(${input.toISOString()})`
  }
  if (typeof input === 'number' || typeof input === 'boolean') return String(input)
  if (input === null) return 'null'
  if (input === undefined) return 'undefined'
  return `value of type ${typeof input}`
}
