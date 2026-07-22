# Changelog

English | [中文 (Chinese)](../zh-CN/CHANGELOG.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.0] - 2026-07-22

### Added

- **Node.js compatibility**: Logger uses `@dreamer/runtime-adapter` (v1.2.2,
  Node-supported) for all filesystem and environment operations (`getEnv`,
  `isTerminal`, `mkdir`, `open`, `rename`, `stat`). Service container
  (`@dreamer/service` v1.1.0) is Node-compatible. No `src/` changes needed.
- **Node test infrastructure**: `package.json` with `test:node` script
  (`tsx --tsconfig tsconfig.json --test --test-force-exit tests/mod.test.ts`),
  `tsconfig.json`. Browser tests (`client.test.ts`) excluded from Node CI
  (require Chromium + esbuild).
- **CI workflow** updated to 9 jobs — 3 Deno v2.9 + 3 Bun + 3 Node 22. Deno/Bun
  jobs install Playwright Chromium 1.59.1 and run all tests (including browser);
  Node jobs run `mod.test.ts` only (no Chromium).
- `minimumDependencyAge: 0` in `deno.json` for freshly published `@dreamer/*`
  dependencies.

### Changed

- Dependencies upgraded: `@dreamer/test` ^1.2.3, `@dreamer/service` ^1.1.0,
  `@dreamer/runtime-adapter` ^1.2.2.
- CI Deno version v2.5 → v2.9; Playwright 1.58.2 → 1.59.1.

### Documentation

- Test report (en-US and zh-CN) updated to three-end results: Deno 89, Bun 86,
  Node 67.

---

## [1.0.3] - 2026-02-25

### Added

- **`color: "auto"`**: `LoggerConfig.color` now accepts `"auto"`. When set or
  undefined, color is auto-detected by TTY and format (foreground with color,
  background no color).
- **`output.console: "auto"`**: `LogOutputConfig.console` now accepts `"auto"`.
  Same behavior as the former `output.auto` (TTY → console only, no TTY → file
  only).
- **Tests**: Added cases for `color: "auto"` and `output.console: "auto"`; total
  tests 89 (client 21, mod 68).
- **CI**: GitHub Actions workflow (Linux/macOS/Windows, Deno + Bun); Bun on
  Windows runs only server tests (no browser) due to known Playwright hang.

### Changed

- **Removed `output.auto`**: The `output.auto` parameter has been removed. Use
  `output.console: "auto"` instead for auto output target selection.
- **Docs**: README and TEST_REPORT updated to document the new `"auto"` values
  and config change summary (en-US and zh-CN).

---

## [1.0.2] - 2026-02-20

### Changed

- **Dependencies**: Bump `@dreamer/test` to `^1.0.12`.

---

## [1.0.1] - 2026-02-19

### Changed

- **Docs**: Documentation reorganized into `docs/en-US/` (CHANGELOG,
  TEST_REPORT, client README) and `docs/zh-CN/` (README, CHANGELOG, TEST_REPORT,
  client README). Root keeps English README only; Chinese and other assets under
  docs.
- **Browser test**: Client browser tests use `browserMode: false` (IIFE bundle)
  so `window.LoggerClient` is set by the bundler; added `cleanupAllBrowsers()`
  in afterAll.
- **zh-CN TEST_REPORT**: Rewritten to follow 04 test report spec (overview,
  results, functional details, coverage, strengths, conclusion).

---

## [1.0.0] - 2026-02-06

### Added

First stable release. Logging library compatible with Deno and Bun. Pure
TypeScript, no external dependencies.

#### Server-side Logger

- **Log levels**: debug, info, warn, error, fatal with dynamic level control
- **Formats**: text (human-readable), JSON (structured), color (console only,
  env-aware)
- **Timestamp & level labels**: Configurable via `showTime` and `showLevel`
- **Smart color control**: TTY detection, auto-disable in background, no color
  in file output, NO_COLOR env support
- **Output**: Console, file, multi-target, auto mode (TTY → console only, no TTY
  → file only), custom (Stream, HTTP)
- **Log rotation**: By size, by time, or size-time combined, with optional
  compression
- **Filtering**: By level, by tags (include/exclude), custom filter function
- **Sampling**: Rate-based and level-based sampling for high-frequency logs
- **Performance monitoring**: `startPerformance`, `endPerformance`,
  `performance` decorator
- **Context & tags**: Request ID, user ID, custom context and tags
- **Child logger**: `child()` with config inheritance

#### Client-side Logger (Browser)

- **Browser module**: `jsr:@dreamer/logger/client` for browser environments
- **Colored output**: Via browser console CSS styles
- **Debug mode**: Dev/production toggle
- **Lightweight**: No external dependencies

#### Console Redirection

- `redirectConsoleToLogger()`: Forward console.log/info/warn/error/debug to
  logger
- `restoreConsole()`: Restore original console

#### LoggerManager & ServiceContainer Integration

- **LoggerManager**: Manage multiple Logger instances, get or create by name
- **createLoggerManager()**: Factory function with default config
- **ServiceContainer**: Integration with `@dreamer/service` for dependency
  injection
- **Methods**: `getLogger`, `createLogger`, `hasLogger`, `removeLogger`,
  `getLoggerNames`, `setLevel`, `close`
- **fromContainer()**: Static method to get LoggerManager from service container

#### Security & Robustness

- **Path validation**: Reject `..` in file paths to prevent path traversal
- **Message length limit**: `maxMessageLength` (default 32KB) to mitigate DoS
- **Safe serialization**: Circular refs and non-serializable values output as
  `[Unserializable]`

#### Type Exports

- `LogLevel`, `LogFormat`, `RotateStrategy`, `LogFilterConfig`,
  `LogSamplingConfig`, `LoggerConfig`, `LogEntry`
- `Logger`, `LoggerManager`, `createLogger`, `createLoggerManager`,
  `redirectConsoleToLogger`, `restoreConsole`
