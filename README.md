# @dreamer/logger

一个用于 Deno 的日志工具库，提供多级别日志、格式化、轮转等功能。

## 功能

日志工具库，用于应用日志记录、调试和监控。

## 特性

- **多级别日志**：debug, info, warn, error, fatal
- **日志格式化**：
  - JSON 格式（结构化日志，适合日志收集系统）
  - 文本格式（人类可读）
  - 彩色格式（仅控制台输出，自动检测环境）
- **智能颜色控制**：
  - 自动检测运行环境（TTY/非TTY）
  - **后台运行时（非TTY）自动禁用颜色**（重要）
  - 文件输出时**不使用颜色**（避免 ANSI 代码污染日志文件）
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

## 使用场景

- 应用日志记录（开发和生产环境）
- 调试和问题排查
- 性能监控和分析
- 日志收集和分析（ELK、Loki 等）
- 后台服务日志（自动禁用颜色，适合文件输出）

## 优先级

⭐⭐⭐⭐⭐

## 安装

```bash
deno add jsr:@dreamer/logger
```

## 环境兼容性

- **Deno 版本**：要求 Deno 2.5 或更高版本
- **服务端**：✅ 支持（Deno 运行时，自动检测 TTY 环境，后台运行时自动禁用颜色，支持文件输出）
- **客户端**：❌ 不支持（浏览器环境无法使用文件输出功能，如需客户端日志，需要另外实现客户端专用库，使用 console API 或远程日志服务）
- **依赖**：无外部依赖（纯 TypeScript 实现）

## 示例用法

```typescript
import { Logger, createLogger } from "jsr:@dreamer/logger";

// 创建日志器
const logger = createLogger({
  level: "info",
  format: "text", // 或 "json"
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

### 性能监控日志

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

### 日志过滤（按标签）

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

### 日志轮转（按时间）

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

### 完整示例

```typescript
import { createLogger } from "jsr:@dreamer/logger";

// 创建生产环境日志器
const logger = createLogger({
  level: "info",
  format: "json", // 结构化日志，适合日志收集系统
  output: {
    console: true, // 控制台输出（自动检测颜色）
    file: {
      path: "./logs/app.log",
      rotate: true,
      strategy: "size-time",
      maxSize: 10 * 1024 * 1024, // 10MB
      rotateInterval: 24 * 60 * 60 * 1000, // 24 小时
      maxFiles: 7,
      compress: true,
    },
  },
  filter: {
    excludeTags: ["debug"], // 排除调试日志
  },
  sampling: {
    rate: 0.1, // 采样 10% 的日志
    levels: ["debug", "info"],
  },
});

// 添加上下文
logger.setContext({
  requestId: "req-123",
  userId: "user-456",
});

// 记录日志
logger.info("用户登录", { username: "alice" });
logger.error("登录失败", { username: "bob" }, new Error("密码错误"));

// 性能监控
const perfId = logger.startPerformance("数据库查询");
await queryDatabase();
logger.endPerformance(perfId, "info");

// 创建子日志器（继承配置）
const apiLogger = logger.child({
  tags: ["api"],
  context: { service: "api" },
});

apiLogger.info("API 请求", { path: "/users" });
```

## API 文档

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
