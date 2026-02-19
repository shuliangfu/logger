# @dreamer/logger/client

> Lightweight logger for browser environments. Multi-level logs, colored output,
> debug mode, and console redirection.

[![JSR](https://jsr.io/badges/@dreamer/logger)](https://jsr.io/@dreamer/logger)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../../LICENSE)

[English](./README.md) | [中文 (Chinese)](../../zh-CN/client/README.md)

---

## Features

- **Log levels**: debug, info, warn, error, fatal with dynamic level control
- **Colored output**: Browser console CSS styles; optional timestamp and prefix
- **Debug mode**: `debug: true` in development, `debug: false` in production to
  disable all output
- **Console redirection**: `redirectConsoleToLogger()` / `restoreConsole()` to
  route console to logger
- **Lightweight**: No external dependencies; uses native console API

---

## Installation

```bash
deno add jsr:@dreamer/logger
```

## Import

```typescript
import {
  createLogger,
  Logger,
  logger,
  redirectConsoleToLogger,
  restoreConsole,
} from "jsr:@dreamer/logger/client";
```

---

## Quick start

### Basic usage

```typescript
const logger = createLogger({
  level: "info",
  prefix: "[MyApp]",
  color: true,
  debug: true,
});

logger.debug("Debug");
logger.info("Started");
logger.warn("Warning");
logger.error("Error");
logger.fatal("Fatal");
```

### Production (disable all output)

```typescript
const prodLogger = createLogger({ debug: false });
prodLogger.info("Not printed");
```

### Console redirection

```typescript
const restore = redirectConsoleToLogger(myLogger);
console.log("Goes to logger.info");
restore();
```

---

## API summary

| Method / Export                       | Description                |
| ------------------------------------- | -------------------------- |
| `createLogger(config?)`               | Create a logger instance   |
| `logger`                              | Default logger instance    |
| `Logger`                              | Class type                 |
| `debug / info / warn / error / fatal` | Log methods                |
| `setLevel(level)` / `getLevel()`      | Level control              |
| `setPrefix(prefix)` / `getPrefix()`   | Prefix                     |
| `setDebug(debug)` / `getDebug()`      | Debug mode                 |
| `child(config)`                       | Create child logger        |
| `redirectConsoleToLogger(logger?)`    | Redirect console to logger |
| `restoreConsole()`                    | Restore original console   |

### Types

- `LogLevel`: `"debug" | "info" | "warn" | "error" | "fatal"`
- `LoggerConfig`: `level?`, `prefix?`, `timestamp?`, `color?`, `debug?`,
  `maxMessageLength?`

---

## Links

- [Main README](../../../README.md) - Server-side logger and full API
- [Test report](../TEST_REPORT.md) - Test coverage
- [JSR](https://jsr.io/@dreamer/logger) - Package page

---

<div align="center">**Made with ❤️ by Dreamer Team**</div>
