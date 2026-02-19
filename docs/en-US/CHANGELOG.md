# Changelog

English | [中文 (Chinese)](../zh-CN/CHANGELOG.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
