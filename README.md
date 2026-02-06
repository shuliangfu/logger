# @dreamer/logger

> A Deno and Bun compatible logging library with multi-level logs, formatting, rotation, and more.

English | [中文 (Chinese)](./README-zh.md)

[![JSR](https://jsr.io/badges/@dreamer/logger)](https://jsr.io/@dreamer/logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Tests: 85 passed](https://img.shields.io/badge/Tests-85%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 Features

A logging library with full server-side log management: multi-level logs, formatting, rotation, filtering, and more for application logging, debugging, and monitoring.

---

## 📦 Installation

### Deno

```bash
deno add jsr:@dreamer/logger
```

### Bun

```bash
bunx jsr add @dreamer/logger
```

### Client (Browser)

Use the client logger in the browser:

```typescript
import { createLogger } from "jsr:@dreamer/logger/client";
```

See [Client Documentation](./src/client/README.md) for details.

---

## 🌍 Compatibility

| Environment | Version | Status |
| ----------- | ------- | ------ |
| **Deno** | 2.5.0+ | ✅ Fully supported |
| **Bun** | 1.3.0+ | ✅ Fully supported |
| **Server** | - | ✅ Supported (Deno/Bun, TTY detection, auto-disable colors in background, file output) |
| **Browser** | Modern browsers | ✅ Supported (client module, see [Client Documentation](./src/client/README.md)) |

**Dependencies**: None (pure TypeScript)

---

## ✨ Highlights

- **Multi-level logs**: debug, info, warn, error, fatal with dynamic level control
- **Formats**: JSON (structured), text (human-readable), color (console only, env-aware)
- **Timestamp & level labels**: Configurable via `showTime` and `showLevel`
- **Smart color control**: TTY detection, auto-disable in background, no color in file output, NO_COLOR env support
- **Output**: Console, file, multi-target, **auto mode** (TTY → console only, no TTY → file only), custom (Stream, HTTP)
- **Log management**: Rotation (size/time), filtering (level/tags), compression
- **Advanced**: Performance monitoring, context (request ID, user ID), structured logs, sampling
- **Client**: Browser-specific module, colored output via console CSS, debug mode, lightweight
- **Service container**: `@dreamer/service` DI, LoggerManager, `createLoggerManager` factory

---

## 🎯 Use Cases

- Application logging (dev and prod)
- Debugging and troubleshooting
- Performance monitoring and analysis
- Log aggregation (ELK, Loki, etc.)
- Background service logs (auto-disable colors, file output)
- Client-side logging (see [Client Documentation](./src/client/README.md))

---

## 🚀 Quick Start

### Server

```typescript
import { createLogger, Logger } from "jsr:@dreamer/logger";

const logger = createLogger({
  level: "info",
  format: "text", // or "json"
  showTime: true,
  showLevel: true,
});

logger.info("Application started");
logger.warn("Warning");
logger.error("Error");

// File output (no color)
const fileLogger = createLogger({
  level: "info",
  format: "text",
  output: {
    file: { path: "./logs/app.log" },
  },
});

// Console + file
const multiLogger = createLogger({
  level: "debug",
  format: "text",
  output: {
    console: true,
    file: { path: "./logs/app.log" },
  },
});

// Auto mode (recommended for background services)
const autoLogger = createLogger({
  level: "info",
  format: "text",
  output: {
    auto: true,
    file: { path: "./logs/app.log" },
  },
});
```

### Client

```typescript
import { createLogger } from "jsr:@dreamer/logger/client";

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

---

## 📊 Test Report

All 85 tests pass (100% pass rate). See [TEST_REPORT.md](./TEST_REPORT.md).

- **Total**: 85 ✅
- **Failed**: 0
- **Execution time**: ~22s (Deno)
- **Coverage**: All public APIs, edge cases, error handling
- **Types**: Server unit tests (mod.test.ts), browser tests (client.test.ts)

---

## 📚 API

### Logger Methods

| Method | Description |
| ------ | ----------- |
| `debug(message, data?, error?)` | Debug log |
| `info(message, data?, error?)` | Info log |
| `warn(message, data?, error?)` | Warn log |
| `error(message, data?, error?)` | Error log |
| `fatal(message, data?, error?)` | Fatal log |
| `setLevel(level)` / `getLevel()` | Level control |
| `setContext(context)` / `getContext()` | Context |
| `addTag(tag)` / `removeTag(tag)` | Tags |
| `setFilter(filter)` / `getFilter()` | Filter config |
| `setSampling(sampling)` / `getSampling()` | Sampling config |
| `startPerformance(operation, data?)` | Start performance monitoring |
| `endPerformance(id, level?)` | End performance monitoring |
| `performance(operation, level?)` | Performance decorator |
| `child(config)` | Create child logger |
| `close()` | Close logger |

### Types

```typescript
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
type LogFormat = "text" | "json" | "color";
type RotateStrategy = "size" | "time" | "size-time";

interface LogFilterConfig {
  includeTags?: string[];
  excludeTags?: string[];
  custom?: (entry: LogEntry) => boolean;
}

interface LogSamplingConfig {
  rate: number;
  levels?: LogLevel[];
}

interface LoggerConfig {
  level?: LogLevel;
  format?: LogFormat;
  output?: LogOutputConfig;
  color?: boolean;
  showTime?: boolean;
  showLevel?: boolean;
  tags?: string[];
  context?: Record<string, unknown>;
  filter?: LogFilterConfig;
  sampling?: LogSamplingConfig;
  maxMessageLength?: number; // default 32KB, 0 = unlimited
}
```

### Security & Robustness

- **Path validation**: Rejects `..` in file paths to prevent path traversal
- **Message length**: `maxMessageLength` limits log message size (default 32KB)
- **Safe serialization**: Circular refs and non-serializable values output as `[Unserializable]`

---

## 🎨 Examples

### Basic

```typescript
import { createLogger } from "jsr:@dreamer/logger";

const logger = createLogger({ level: "info", format: "text" });
logger.info("Started");
logger.warn("Warning");
logger.error("Error");
```

### Timestamp & Level Control

```typescript
// showTime: false - no timestamp
// showLevel: false - no [INFO], [ERROR] labels
const logger = createLogger({
  level: "info",
  format: "text",
  showTime: false,
  showLevel: false,
});
logger.info("Message only");
```

### Performance Monitoring

```typescript
const logger = createLogger();

// Manual
const id = logger.startPerformance("DB query", { table: "users" });
// ... do work ...
logger.endPerformance(id, "info");

// Decorator
const fn = logger.performance("fetchUser", "info")(async (id: string) => {
  await new Promise((r) => setTimeout(r, 100));
  return { id, name: "Alice" };
});
await fn("123");
```

### Log Filtering

```typescript
const logger = createLogger({
  level: "debug",
  filter: {
    includeTags: ["api"],
    // or excludeTags: ["debug"]
    // or custom: (entry) => entry.level === "error" || entry.level === "fatal"
  },
});
```

---

## 🔧 Advanced Config

### Sampling

```typescript
const logger = createLogger({
  level: "debug",
  sampling: {
    rate: 0.1,
    levels: ["debug", "info"],
  },
});
```

### Rotation

```typescript
const logger = createLogger({
  level: "info",
  output: {
    file: {
      path: "./logs/app.log",
      rotate: true,
      strategy: "size-time",
      maxSize: 10 * 1024 * 1024,
      rotateInterval: 24 * 60 * 60 * 1000,
      maxFiles: 7,
      compress: true,
    },
  },
});
```

---

## 📖 Server Output Behavior

- **File**: Only when `output.file` with `path` is set
- **Console**: Controlled by `output.console` (default `true`)

### Manual

- Console only: `output: { console: true }` (default)
- File only: `output: { console: false, file: { path: "./logs/app.log" } }`
- Both: `output: { console: true, file: { path: "./logs/app.log" } }`

### Auto Mode (`output.auto: true`)

| Run mode | TTY | Output |
| -------- | --- | ------ |
| Direct, interactive | Yes | Console only |
| nohup, systemd, daemon, pipe | No | File only |

---

## 🔗 ServiceContainer Integration

```typescript
import { createLoggerManager, LoggerManager } from "jsr:@dreamer/logger";
import { ServiceContainer } from "jsr:@dreamer/service";

const container = new ServiceContainer();
container.registerSingleton("logger:main", () =>
  createLoggerManager({
    name: "main",
    defaultConfig: { level: "info", format: "text" },
  }));

const manager = container.get<LoggerManager>("logger:main");
const appLogger = manager.getLogger("app");
const dbLogger = manager.getLogger("db");

manager.setLevel("debug");
const same = LoggerManager.fromContainer(container, "main");
```

### LoggerManager Methods

| Method | Description |
| ------ | ----------- |
| `getName()` | Get manager name |
| `setContainer(container)` / `getContainer()` | Service container |
| `static fromContainer(container, name?)` | Get from container |
| `getLogger(name, config?)` | Get or create (cached) |
| `createLogger(config?)` | Create non-cached logger |
| `hasLogger(name)` / `removeLogger(name)` | Check / remove |
| `getLoggerNames()` | List all loggers |
| `setLevel(level)` | Set level for all |
| `close()` | Close all |

---

## 📝 Notes

- Server: full log management; client: lightweight module (see [Client Documentation](./src/client/README.md))
- Unified API for server and client
- TTY detection, auto-disable colors in background
- Full TypeScript types, no external dependencies
- Use appropriate log levels in production

---

## 🤝 Contributing

Issues and Pull Requests welcome!

---

## 📄 License

MIT License - see [LICENSE.md](./LICENSE.md)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
