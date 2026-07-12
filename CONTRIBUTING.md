# Contributing

Thanks for your interest in improving `any-date-format`!

## Getting started

```bash
git clone https://github.com/satyendra-sagar-singh/any-date-format.git
cd any-date-format
nvm use        # Node version from .nvmrc
npm install
```

## Development workflow

| Command | What it does |
| --- | --- |
| `npm test` | Run the test suite |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage thresholds enforced |
| `npm run typecheck` | Strict TypeScript check |
| `npm run build` | Build ESM + CJS + type declarations with tsup |
| `npm run check:package` | Validate the publishable package (publint + arethetypeswrong) |

## Guidelines

- **Every parsing behavior change needs a test.** The ambiguity-resolution rules in the README are a contract — if a change affects how an input is interpreted, update the README section and the tests together.
- **Keep tests timezone-honest.** The suite pins `TZ=Asia/Kolkata` (no DST, non-hour offset). Prefer assertions that hold in any zone (local-in/local-out round trips, or `utc: true`); when a test is zone-sensitive, derive the expectation from `getTimezoneOffset()` instead of hard-coding.
- **Rejection is a feature.** This library never silently guesses: impossible dates, yearless strings, and garbage must throw `InvalidDateError` — never a different exception, a rolled-over date, or an engine-invented year. Test the rejection paths as carefully as the happy paths.
- Keep the public API surface small and typed; no runtime dependencies.
- CI must pass (typecheck, tests with coverage, build, package checks). The published library supports Node ≥ 18 at runtime; the dev toolchain (vitest 4) needs Node 20+, so CI runs on Node 20–24.

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/satyendra-sagar-singh/any-date-format/issues/new/choose). A parsing bug report is most useful with the exact input value, the options passed, the output you got, and the output you expected.

## Releases

Maintainers: bump the version in package.json, update CHANGELOG.md, commit, then tag and push:

```bash
git tag v0.x.y && git push origin main v0.x.y
```

The publish workflow builds, validates, and publishes to npm via trusted publishing.
