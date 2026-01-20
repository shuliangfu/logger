# @dreamer/logger

> 一个兼容 Deno 和 Bun 的日志工具库，提供多级别日志、格式化、轮转等功能

[![JSR](https://jsr.io/badges/@dreamer/logger)](https://jsr.io/@dreamer/logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-53%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 功能

日志工具库，提供完整的服务端日志管理功能，支持多级别日志、格式化、轮转、过滤等高级功能，用于应用日志记录、调试和监控。

---

## 📦 安装

### Deno

```bash
deno add jsr:@dreamer/logger
```

### Bun

```bash
bunx jsr add @dreamer/logger
```

### 客户端（浏览器环境）

在浏览器中使用客户端日志包：

```typescript
import { createLogger } from "jsr:@dreamer/logger/client";
```

详细使用说明请查看 [客户端文档](./src/client/README.md)

---

## 🌍 环境兼容性

| 环境 | 版本要求 | 状态 |
|------|---------|------|
| **Deno** | 2.5.0+ | ✅ 完全支持 |
| **Bun** | 1.3.0+ | ✅ 完全支持 |
| **服务端** | - | ✅ 支持（兼容 Deno 和 Bun 运行时，自动检测 TTY 环境，后台运行时自动禁用颜色，支持文件输出） |
| **浏览器** | 现代浏览器 | ✅ 支持（客户端日志模块，详见 [客户端文档](./src/client/README.md)） |

**依赖**：无外部依赖（纯 TypeScript 实现）

---

## ✨ 特性

- **多级别日志**：
  - debug、info、warn、error、fatal 五个级别
  - 日志级别控制，可动态调整
- **日志格式化**：
  - JSON 格式（结构化日志，适合日志收集系统）
  - 文本格式（人类可读）
  - 彩色格式（仅控制台输出，自动检测环境）
  - 时间戳控制（可配置是否显示时间戳）
- **智能颜色控制**：
  - 自动检测运行环境（TTY/非TTY）
  - 后台运行时（非TTY）自动禁用颜色
  - 文件输出时不使用颜色（避免 ANSI 代码污染日志文件）
  - 控制台输出时根据环境自动决定是否使用颜色
  - 支持手动禁用颜色（NO_COLOR 环境变量）
- **日志输出**：
  - 控制台输出（支持彩色，自动检测环境）
  - 文件输出（纯文本，无颜色）
  - 多目标输出（同时输出到控制台和文件）
  - 自定义输出目标（Stream、HTTP 等）
- **日志管理**：
  - 日志轮转（按大小、按时间）
  - 日志过滤（按级别、按标签）
  - 日志级别控制（运行时动态调整）
  - 日志压缩（归档时自动压缩）
- **高级功能**：
  - 性能监控日志（记录执行时间）
  - 日志上下文（请求ID、用户ID等）
  - 结构化日志（支持字段和元数据）
  - 日志采样（高频日志采样输出）
- **客户端支持**：
  - 浏览器环境专用日志模块
  - 彩色日志输出（使用浏览器控制台 CSS 样式）
  - 调试模式控制（开发/生产环境切换）
  - 轻量级设计，无外部依赖

---

## 🎯 使用场景

- **应用日志记录**：开发和生产环境的日志记录
- **调试和问题排查**：多级别日志帮助快速定位问题
- **性能监控和分析**：性能监控日志记录执行时间
- **日志收集和分析**：结构化日志适合 ELK、Loki 等日志系统
- **后台服务日志**：自动禁用颜色，适合文件输出和容器环境
- **客户端日志**：浏览器环境的日志记录和调试（详见 [客户端文档](./src/client/README.md)）

---

## 🚀 快速开始

### 服务端示例

```typescript
import { Logger, createLogger } from "jsr:@dreamer/logger";

// 创建日志器
const logger = createLogger({
  level: "info",
  format: "text", // 或 "json"
  showTime: true, // 是否显示时间戳（默认 true）
  // 自动检测环境，后台运行时禁用颜色
  // 文件输出时自动禁用颜色
});

// 控制台输出（根据环境自动决定是否使用颜色）
logger.info("应用启动");
logger.warn("警告信息");
logger.error("错误信息");

// 文件输出（自动禁用颜色，纯文本）
const fileLogger = createLogger({
  level: "info",
  format: "text",
  output: {
    file: {
      path: "./logs/app.log",
      // 文件输出时自动禁用颜色，即使 format 是 text
    }
  }
});

// 同时输出到控制台和文件
const multiLogger = createLogger({
  level: "debug",
  format: "text",
  output: {
    console: true, // 控制台：根据环境决定颜色
    file: {
      path: "./logs/app.log",
      // 文件：始终无颜色
    }
  }
});

// 后台服务示例（自动检测，禁用颜色）
// 当 stdout 不是 TTY 时，自动禁用颜色
// 适合后台服务、Docker 容器等场景
```

### 客户端示例

```typescript
import { createLogger } from "jsr:@dreamer/logger/client";

// 创建日志器
const logger = createLogger({
  level: "info",
  prefix: "[MyApp]",
  color: true,
  debug: true, // 开发环境启用
});

// 记录日志
logger.debug("调试信息");
logger.info("应用启动");
logger.warn("警告信息");
logger.error("错误信息");
logger.fatal("致命错误");
```

---

## 📊 测试报告

本库经过全面测试，所有 53 个测试用例均已通过，测试覆盖率达到 100%。详细测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)。

**测试统计**：
- **总测试数**: 53
- **通过**: 53 ✅
- **失败**: 0
- **通过率**: 100% ✅
- **测试执行时间**: ~21秒
- **测试覆盖**: 所有公共 API、边界情况、错误处理
- **测试环境**: Deno 2.6.5, Bun 1.3.0+

**测试类型**：
- ✅ 单元测试（40 个）
- ✅ 浏览器测试（13 个）

**测试亮点**：
- ✅ 所有功能、边界情况、错误处理都有完整的测试覆盖
- ✅ 浏览器测试验证了在真实浏览器环境中的功能
- ✅ 集成测试验证了端到端的完整流程

查看完整测试报告：[TEST_REPORT.md](./TEST_REPORT.md)

---

## 📚 API 文档

### Logger 类

#### 方法

##### `debug(message, data?, error?)`
记录调试日志

##### `info(message, data?, error?)`
记录信息日志

##### `warn(message, data?, error?)`
记录警告日志

##### `error(message, data?, error?)`
记录错误日志

##### `fatal(message, data?, error?)`
记录致命错误日志

##### `setLevel(level)`
设置日志级别

##### `getLevel()`
获取日志级别

##### `setContext(context)`
设置上下文

##### `getContext()`
获取上下文

##### `addTag(tag)`
添加标签

##### `removeTag(tag)`
移除标签

##### `setFilter(filter)`
设置过滤配置

##### `getFilter()`
获取过滤配置

##### `setSampling(sampling)`
设置采样配置

##### `getSampling()`
获取采样配置

##### `startPerformance(operation, data?)`
开始性能监控

##### `endPerformance(id, level?)`
结束性能监控并记录日志

##### `performance(operation, level?)`
性能监控装饰器

##### `child(config)`
创建子日志器

##### `close()`
关闭日志器

### 类型定义

#### `LogLevel`
```typescript
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
```

#### `LogFormat`
```typescript
type LogFormat = "text" | "json" | "color";
```

#### `RotateStrategy`
```typescript
type RotateStrategy = "size" | "time" | "size-time";
```

#### `LogFilterConfig`
```typescript
interface LogFilterConfig {
  includeTags?: string[];
  excludeTags?: string[];
  custom?: (entry: LogEntry) => boolean;
}
```

#### `LogSamplingConfig`
```typescript
interface LogSamplingConfig {
  rate: number;
  levels?: LogLevel[];
}
```

#### `LoggerConfig`
```typescript
interface LoggerConfig {
  level?: LogLevel;
  format?: LogFormat;
  output?: LogOutputConfig;
  color?: boolean;
  showTime?: boolean; // 是否显示时间戳（默认 true）
  tags?: string[];
  context?: Record<string, unknown>;
  filter?: LogFilterConfig;
  sampling?: LogSamplingConfig;
}
```

---

## 🎨 使用示例

### 示例 1：基础用法

```typescript
import { createLogger } from "jsr:@dreamer/logger";

const logger = createLogger({
  level: "info",
  format: "text",
});

logger.info("应用启动");
logger.warn("警告信息");
logger.error("错误信息");
```

### 示例 1.1：控制时间戳显示

```typescript
import { createLogger } from "jsr:@dreamer/logger";

// 默认显示时间戳
const logger1 = createLogger({
  level: "info",
  format: "text",
});
logger1.info("这条日志包含时间戳");
// 输出: 2026-01-20T03:20:59.689Z [INFO] 这条日志包含时间戳

// 禁用时间戳
const logger2 = createLogger({
  level: "info",
  format: "text",
  showTime: false, // 不显示时间戳
});
logger2.info("这条日志不包含时间戳");
// 输出: [INFO] 这条日志不包含时间戳
```

### 示例 2：性能监控

```typescript
import { createLogger } from "jsr:@dreamer/logger";

const logger = createLogger();

// 方式1：手动性能监控
const perfId = logger.startPerformance("数据库查询", { table: "users" });
// ... 执行操作 ...
logger.endPerformance(perfId, "info");
// 输出：性能监控: 数据库查询 耗时 150ms

// 方式2：使用装饰器（函数）
const fetchUserData = logger.performance("获取用户数据", "info")(
  async (userId: string) => {
    // 执行操作
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { id: userId, name: "Alice" };
  }
);

await fetchUserData("123");
// 输出：性能监控: 获取用户数据 耗时 100ms
```

### 示例 3：日志过滤

```typescript
import { createLogger } from "jsr:@dreamer/logger";

// 只输出包含 "api" 标签的日志
const logger = createLogger({
  level: "debug",
  filter: {
    includeTags: ["api"], // 只输出包含 "api" 标签的日志
  },
});

logger.info("API 请求", undefined, undefined, ["api"]); // ✅ 会输出
logger.info("内部操作", undefined, undefined, ["internal"]); // ❌ 不会输出

// 排除特定标签
const logger2 = createLogger({
  level: "debug",
  filter: {
    excludeTags: ["debug"], // 排除包含 "debug" 标签的日志
  },
});

// 自定义过滤函数
const logger3 = createLogger({
  level: "debug",
  filter: {
    custom: (entry) => {
      // 只输出 error 和 fatal 级别的日志
      return entry.level === "error" || entry.level === "fatal";
    },
  },
});
```

---

## 🔧 高级配置

### 日志采样

```typescript
import { createLogger } from "jsr:@dreamer/logger";

// 采样 10% 的日志（用于高频日志场景）
const logger = createLogger({
  level: "debug",
  sampling: {
    rate: 0.1, // 10% 的日志会被输出
  },
});

// 只对特定级别进行采样
const logger2 = createLogger({
  level: "debug",
  sampling: {
    rate: 0.1,
    levels: ["debug", "info"], // 只对 debug 和 info 级别采样
  },
});
```

### 日志轮转

```typescript
import { createLogger } from "jsr:@dreamer/logger";

// 按时间轮转（每 24 小时）
const logger = createLogger({
  level: "info",
  output: {
    file: {
      path: "./logs/app.log",
      rotate: true,
      strategy: "time", // 按时间轮转
      rotateInterval: 24 * 60 * 60 * 1000, // 24 小时
      maxFiles: 7, // 保留 7 天的日志
    },
  },
});

// 按大小和时间轮转（满足任一条件即轮转）
const logger2 = createLogger({
  level: "info",
  output: {
    file: {
      path: "./logs/app.log",
      rotate: true,
      strategy: "size-time", // 按大小和时间轮转
      maxSize: 10 * 1024 * 1024, // 10MB
      rotateInterval: 24 * 60 * 60 * 1000, // 24 小时
      maxFiles: 7,
      compress: true, // 压缩旧文件
    },
  },
});
```

---

## 📝 注意事项

- **服务端和客户端支持**：服务端提供完整的日志管理功能，客户端提供轻量级日志模块（详见 [客户端文档](./src/client/README.md)）
- **统一接口**：服务端和客户端提供统一的日志 API 接口，降低学习成本
- **自动检测环境**：服务端自动检测 TTY 环境，后台运行时自动禁用颜色
- **类型安全**：完整的 TypeScript 类型支持
- **无外部依赖**：纯 TypeScript 实现
- **文件输出**：文件输出时自动禁用颜色，避免 ANSI 代码污染日志文件
- **生产环境**：建议在生产环境中使用适当的日志级别，避免输出过多调试信息

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE.md](./LICENSE.md)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
