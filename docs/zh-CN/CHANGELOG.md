# 变更日志

[English](../en-US/CHANGELOG.md) | 中文 (Chinese)

本文件记录 @dreamer/logger 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.2] - 2026-02-20

### 变更

- **依赖**：将 `@dreamer/test` 升级为 `^1.0.12`。

---

## [1.0.1] - 2026-02-19

### 变更

- **文档**：文档结构调整为 `docs/en-US/`（CHANGELOG、TEST_REPORT、客户端
  README）与 `docs/zh-CN/`（README、CHANGELOG、TEST_REPORT、客户端
  README）；根目录仅保留英文 README。
- **浏览器测试**：客户端浏览器测试改为 `browserMode: false`（IIFE
  打包），由打包器设置 `window.LoggerClient`；afterAll 中增加
  `cleanupAllBrowsers()`。
- **中文测试报告**：按 04
  测试报告规范重写（概览、结果、功能详情、覆盖分析、优点、结论）。

---

## [1.0.0] - 2026-02-06

### 新增

首个稳定版。兼容 Deno 与 Bun 的日志库。纯 TypeScript，无外部依赖。

#### 服务端 Logger

- **日志级别**：debug、info、warn、error、fatal，支持动态级别控制
- **格式**：text（人类可读）、JSON（结构化）、color（仅控制台，环境感知）
- **时间戳与级别标签**：通过 `showTime`、`showLevel` 配置
- **智能颜色**：TTY 检测、后台禁用颜色、文件输出无颜色、支持 NO_COLOR 环境变量
- **输出**：控制台、文件、多目标、自动模式（TTY 仅控制台，非 TTY
  仅文件）、自定义（Stream、HTTP）
- **轮转**：按大小、按时间或大小+时间，可选压缩
- **过滤**：按级别、按标签（包含/排除）、自定义过滤函数
- **采样**：按速率与级别的采样
- **性能监控**：`startPerformance`、`endPerformance`、`performance` 装饰器
- **上下文与标签**：请求 ID、用户 ID、自定义上下文与标签
- **子日志器**：`child()` 继承配置

#### 客户端 Logger（浏览器）

- **浏览器模块**：`jsr:@dreamer/logger/client` 用于浏览器环境
- **彩色输出**：通过浏览器控制台 CSS 样式
- **调试模式**：开发/生产切换
- **轻量**：无外部依赖

#### Console 重定向

- `redirectConsoleToLogger()`：将 console.log/info/warn/error/debug 转发到
  logger
- `restoreConsole()`：恢复原始 console

#### LoggerManager 与 ServiceContainer 集成

- **LoggerManager**：管理多个 Logger 实例，按名称获取或创建
- **createLoggerManager()**：工厂函数，支持默认配置
- **ServiceContainer**：与 `@dreamer/service` 依赖注入集成
- **方法**：`getLogger`、`createLogger`、`hasLogger`、`removeLogger`、`getLoggerNames`、`setLevel`、`close`
- **fromContainer()**：静态方法从服务容器获取 LoggerManager

#### 安全与健壮性

- **路径校验**：拒绝文件路径中的 `..` 防止路径穿越
- **消息长度**：`maxMessageLength`（默认 32KB）缓解 DoS
- **安全序列化**：循环引用与不可序列化值输出为 `[Unserializable]`

#### 类型导出

- `LogLevel`、`LogFormat`、`RotateStrategy`、`LogFilterConfig`、`LogSamplingConfig`、`LoggerConfig`、`LogEntry`
- `Logger`、`LoggerManager`、`createLogger`、`createLoggerManager`、`redirectConsoleToLogger`、`restoreConsole`
