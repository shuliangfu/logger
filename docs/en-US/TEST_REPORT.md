# @dreamer/logger Test Report

English | [中文 (Chinese)](../zh-CN/TEST_REPORT.md)

## 📊 Test Overview

| Item                          | Value                     |
| ----------------------------- | ------------------------- |
| **Logger Version**            | `@dreamer/logger@1.0.0`   |
| **Service Container Version** | `@dreamer/service@^1.0.2` |
| **Test Framework**            | `@dreamer/test@^1.0.10`   |
| **Test Environment**          | Deno 2.5+, Bun 1.0+       |
| **Test Files**                | 2                         |
| **Test Date**                 | 2026-02-25                |
| **Total Test Cases**          | 89                        |
| **Pass Rate**                 | 100% ✅                   |
| **Execution Time**            | ~4s                       |

### Config change summary (matches this test run)

- **Removed** `output.auto`; use **`output.console: "auto"`** for auto mode (TTY
  → console, no TTY → file).
- **`color`** supports **`"auto"`** (auto-detect by TTY and format).
- **`output.console`** supports **`"auto"`** for the same auto output behavior.

## Test Results

### Overall Statistics

- **Total Tests**: 89
- **Passed**: 89 ✅
- **Failed**: 0
- **Pass Rate**: 100% ✅
- **Execution Time**: ~4 seconds (Deno, `deno test -A`)

### Test File Statistics

| Test File        | Tests | Status      | Description                                                      |
| ---------------- | ----- | ----------- | ---------------------------------------------------------------- |
| `client.test.ts` | 21    | ✅ All Pass | Browser tests (@dreamer/test browser integration)                |
| `mod.test.ts`    | 68    | ✅ All Pass | Server-side tests + LoggerManager + ServiceContainer integration |

## Functional Test Details

### 1. Browser Environment Tests (client.test.ts) - 21 tests

Uses @dreamer/test `browser.enabled` config with `browserMode: false` (IIFE
bundle). Auto-manages Playwright and esbuild bundling. Bun/Deno compatible.

#### 1.1 Basic Features (9 tests)

- ✅ Should create logger instance
- ✅ Should support custom config
- ✅ Should support log level control
- ✅ Should support debug mode control
- ✅ Should support dynamic log level
- ✅ Should support dynamic debug mode
- ✅ Should support log prefix
- ✅ Should support child logger creation

#### 1.2 Log Level Methods (5 tests)

- ✅ Should support all log level methods
- ✅ Should support logs with data
- ✅ Should support logs with error objects
- ✅ Should support colored output (when enabled)
- ✅ Should support no-color output (when disabled)

#### 1.3 Console Redirection (6 tests)

- ✅ redirectConsoleToLogger should forward console.log/info to logger.info
- ✅ redirectConsoleToLogger should forward console.warn to logger.warn
- ✅ redirectConsoleToLogger should forward console.error/debug to
  logger.error/logger.debug
- ✅ redirectConsoleToLogger should support multiple args (first as message,
  rest as data)
- ✅ restoreConsole should restore original console; subsequent console calls
  are not forwarded to logger
- ✅ redirectConsoleToLogger without args should use default logger

**Result**: All 21 tests passed

### 2. Server-Side Tests (mod.test.ts) - 68 tests

Same as previously documented (createLogger, log levels, formats, timestamp
including **color: "auto"** and **output.console: "auto"**, context/tags, child
logger, performance, filter/sampling, output, file, console redirection,
LoggerManager, ServiceContainer, createLoggerManager).

**Result**: All 68 tests passed

## Conclusion

@dreamer/logger is fully tested with all 89 tests passing (100% pass rate).

- **Browser tests (client.test.ts)**: 21 ✅
- **Server-side tests (mod.test.ts)**: 68 ✅

**Config**: This version removes `output.auto`; use `output.console: "auto"` for
auto output. Both `color` and `output.console` support the `"auto"` value. See
"Config change summary" above.

**Ready for production use.**

---

_Test report: see repository for latest run._
