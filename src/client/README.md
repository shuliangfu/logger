# @dreamer/logger 客户端使用文档

> 专为浏览器环境设计的轻量级日志管理器

---

## 🎯 功能

客户端日志管理器，专为浏览器环境设计，使用 console API 输出日志，提供多级别日志、彩色输出、调试模式控制等功能。

---

## 📦 安装

### 浏览器环境

在浏览器中使用客户端日志包：

```typescript
import { createLogger, Logger } from "jsr:@dreamer/logger/client";
```


---

## 🌍 环境兼容性

| 环境 | 版本要求 | 状态 |
|------|---------|------|
| **浏览器** | 现代浏览器 | ✅ 完全支持 |
| **Deno** | 2.5.0+ | ✅ 支持（浏览器环境） |
| **Bun** | 1.3.0+ | ✅ 支持（浏览器环境） |

---

## ✨ 特性

- **多级别日志**：
  - debug、info、warn、error、fatal 五个级别
  - 日志级别控制，可动态调整
- **彩色日志输出**：
  - 不同级别使用不同颜色和图标
  - 支持浏览器控制台 CSS 样式
  - 可手动禁用颜色
- **美化的日志格式**：
  - 图标标识（🔍 debug、ℹ️ info、⚠️ warn、❌ error、💀 fatal）
  - 时间戳支持（可选）
  - 日志前缀支持
- **调试模式控制**：
  - 开发环境启用（debug: true）输出所有日志
  - 生产环境禁用（debug: false）完全禁用日志输出
- **轻量级设计**：
  - 无外部依赖
  - 纯 TypeScript 实现
  - 使用浏览器原生 console API

---

## 🚀 快速开始

### 基础使用

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

### 生产环境配置

```typescript
import { createLogger } from "jsr:@dreamer/logger/client";

// 生产环境：禁用所有日志输出
const prodLogger = createLogger({
  debug: false, // 禁用所有日志
});

// 这些日志都不会输出
prodLogger.info("这条日志不会输出");
prodLogger.error("这条错误日志也不会输出");
```

### 开发环境配置

```typescript
import { createLogger } from "jsr:@dreamer/logger/client";

// 开发环境：输出所有级别的日志
const devLogger = createLogger({
  level: "debug", // 最低级别，输出所有日志
  prefix: "[Dev]",
  color: true, // 启用彩色输出
  debug: true, // 启用调试模式
  timestamp: true, // 显示时间戳
});

devLogger.debug("详细的调试信息");
devLogger.info("应用状态");
```

---

## 📚 API 文档

### createLogger(config?)

创建日志器实例。

**参数**：

- `config` (可选): `LoggerConfig` 配置对象

**返回**：`Logger` 实例

**示例**：

```typescript
const logger = createLogger({
  level: "info",
  prefix: "[MyApp]",
  color: true,
  debug: true,
});
```

### Logger 类

#### 方法

##### `debug(message, data?, error?)`

记录调试日志。

**参数**：
- `message`: `string` - 日志消息
- `data?`: `unknown` - 额外数据（可选）
- `error?`: `Error` - 错误对象（可选）

**示例**：

```typescript
logger.debug("用户操作", { userId: "123", action: "click" });
logger.debug("调试信息", null, new Error("测试错误"));
```

##### `info(message, data?, error?)`

记录信息日志。

**参数**：
- `message`: `string` - 日志消息
- `data?`: `unknown` - 额外数据（可选）
- `error?`: `Error` - 错误对象（可选）

**示例**：

```typescript
logger.info("用户登录", { userId: "123" });
logger.info("操作完成");
```

##### `warn(message, data?, error?)`

记录警告日志。

**参数**：
- `message`: `string` - 日志消息
- `data?`: `unknown` - 额外数据（可选）
- `error?`: `Error` - 错误对象（可选）

**示例**：

```typescript
logger.warn("API 响应较慢", { duration: 5000 });
logger.warn("资源不足", null, new Error("内存不足"));
```

##### `error(message, data?, error?)`

记录错误日志。

**参数**：
- `message`: `string` - 日志消息
- `data?`: `unknown` - 额外数据（可选）
- `error?`: `Error` - 错误对象（可选）

**示例**：

```typescript
logger.error("请求失败", { url: "/api/users", status: 500 });
logger.error("处理异常", null, new Error("网络错误"));
```

##### `fatal(message, data?, error?)`

记录致命错误日志。

**参数**：
- `message`: `string` - 日志消息
- `data?`: `unknown` - 额外数据（可选）
- `error?`: `Error` - 错误对象（可选）

**示例**：

```typescript
logger.fatal("系统崩溃", { reason: "内存溢出" });
logger.fatal("致命错误", null, new Error("无法恢复"));
```

##### `setLevel(level)`

设置日志级别。

**参数**：
- `level`: `LogLevel` - 日志级别

**示例**：

```typescript
logger.setLevel("warn"); // 只输出 warn、error、fatal
```

##### `getLevel()`

获取当前日志级别。

**返回**：`LogLevel` - 当前日志级别

**示例**：

```typescript
const level = logger.getLevel(); // "info"
```

##### `setDebug(debug)`

设置调试模式。

**参数**：
- `debug`: `boolean` - 是否启用调试模式（true 输出日志，false 禁用所有日志）

**示例**：

```typescript
// 开发环境
logger.setDebug(true);

// 生产环境
logger.setDebug(false);
```

##### `getDebug()`

获取调试模式状态。

**返回**：`boolean` - 当前调试模式状态

**示例**：

```typescript
const isDebug = logger.getDebug(); // true
```

##### `setPrefix(prefix)`

设置日志前缀。

**参数**：
- `prefix`: `string` - 日志前缀

**示例**：

```typescript
logger.setPrefix("[MyApp]");
```

##### `getPrefix()`

获取日志前缀。

**返回**：`string` - 当前日志前缀

**示例**：

```typescript
const prefix = logger.getPrefix(); // "[MyApp]"
```

##### `child(config)`

创建子日志器（继承配置，可添加额外前缀；含 `maxMessageLength`）。

**参数**：
- `config`: `Partial<LoggerConfig>` - 子日志器配置

**返回**：`Logger` - 子日志器实例

**示例**：

```typescript
const childLogger = logger.child({
  prefix: "[API]",
});

childLogger.info("API 请求"); // 输出: [MyApp] [API] API 请求
```

### 类型定义

#### `LogLevel`

```typescript
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
```

#### `LoggerConfig`

```typescript
interface LoggerConfig {
  /** 日志级别（默认：warn） */
  level?: LogLevel;
  /** 日志前缀（默认：空字符串） */
  prefix?: string;
  /** 是否启用时间戳（默认：false） */
  timestamp?: boolean;
  /** 是否启用颜色（默认：true，浏览器控制台支持 CSS 样式） */
  color?: boolean;
  /** 是否启用调试模式（默认：true，开发环境为 true 输出所有日志，生产环境为 false 禁用所有日志） */
  debug?: boolean;
  /** 单条消息最大长度（字符），超出截断，0 表示不限制，默认 32KB，用于防止超大消息卡顿/DoS */
  maxMessageLength?: number;
}
```

#### 健壮性

- **消息长度**：可通过 `maxMessageLength` 限制单条消息长度（默认 32KB），超出部分截断并加省略标记。
- **输出异常隔离**：控制台输出包在 try/catch 中，若控制台抛错（如展开循环引用对象）不会导致应用中断。

---

## 💡 使用场景

### 开发环境

在开发环境中，启用所有日志输出，方便调试：

```typescript
const logger = createLogger({
  level: "debug", // 输出所有级别
  prefix: "[Dev]",
  color: true,
  debug: true,
  timestamp: true,
});
```

### 生产环境

在生产环境中，完全禁用日志输出，避免性能影响：

```typescript
const logger = createLogger({
  debug: false, // 禁用所有日志
});
```

### 条件日志输出

根据环境变量动态配置：

```typescript
const isDevelopment = import.meta.env?.MODE === "development";

const logger = createLogger({
  level: isDevelopment ? "debug" : "warn",
  debug: isDevelopment,
  color: isDevelopment,
});
```

### 模块化日志

为不同模块创建独立的日志器：

```typescript
const appLogger = createLogger({ prefix: "[App]" });
const apiLogger = appLogger.child({ prefix: "[API]" });
const dbLogger = appLogger.child({ prefix: "[DB]" });

appLogger.info("应用启动");
apiLogger.info("API 请求");
dbLogger.info("数据库查询");
```

---

## 🎨 日志输出示例

### 彩色输出（浏览器控制台）

启用颜色后，不同级别的日志会显示不同的颜色和图标：

- 🔍 **DEBUG** - 灰色
- ℹ️ **INFO** - 蓝色
- ⚠️ **WARN** - 橙色（粗体）
- ❌ **ERROR** - 红色（粗体）
- 💀 **FATAL** - 深红色（粗体，带背景色）

### 普通输出

禁用颜色后，使用纯文本格式：

```
[2024-01-18T10:00:00.000Z] 🔍 [DEBUG] [MyApp] 调试信息
[2024-01-18T10:00:00.000Z] ℹ️ [INFO] [MyApp] 应用启动
[2024-01-18T10:00:00.000Z] ⚠️ [WARN] [MyApp] 警告信息
[2024-01-18T10:00:00.000Z] ❌ [ERROR] [MyApp] 错误信息
[2024-01-18T10:00:00.000Z] 💀 [FATAL] [MyApp] 致命错误
```

---

## 📝 注意事项

- **浏览器环境专用**：此客户端日志器专为浏览器环境设计，使用 console API 输出
- **生产环境建议**：在生产环境中，建议设置 `debug: false` 完全禁用日志输出，避免性能影响
- **颜色支持**：彩色输出依赖浏览器控制台的 CSS 样式支持，所有现代浏览器都支持
- **无文件输出**：客户端日志器不支持文件输出，如需持久化日志，请使用远程日志服务
- **轻量级设计**：客户端日志器设计为轻量级，无外部依赖，适合前端应用使用
- **消息长度**：可通过 `maxMessageLength` 限制单条消息长度（默认 32KB），防止超大消息导致卡顿

---

## 📊 测试覆盖

客户端日志器经过全面测试，包含 13 个浏览器环境测试用例，全部通过。测试使用 Puppeteer 在真实浏览器环境中验证所有功能。

**测试覆盖**：
- ✅ 日志器实例创建
- ✅ 自定义配置（级别、前缀、调试模式、颜色）
- ✅ 日志级别控制（动态设置）
- ✅ 调试模式控制（动态设置）
- ✅ 日志前缀管理
- ✅ 子日志器创建
- ✅ 所有日志级别方法（debug、info、warn、error、fatal）
- ✅ 数据对象传递
- ✅ 错误对象传递
- ✅ 彩色输出（启用时）
- ✅ 无颜色输出（禁用时）

详细测试报告请查看 [主测试报告](../../TEST_REPORT.md)。

---

## 🔗 相关链接

- [主文档](../../README.md) - 服务端日志库文档
- [测试报告](../../TEST_REPORT.md) - 完整测试报告
- [JSR 包](https://jsr.io/@dreamer/logger) - JSR 包页面

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
