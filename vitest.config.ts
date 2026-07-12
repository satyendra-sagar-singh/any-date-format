import { defineConfig } from 'vitest/config'

// Fixed IANA zone (no DST, +05:30 non-hour offset) so local-time tests are deterministic.
process.env.TZ = 'Asia/Kolkata'

export default defineConfig({
  test: {
    env: {
      TZ: 'Asia/Kolkata',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/types.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 95,
        lines: 90,
      },
    },
  },
})
