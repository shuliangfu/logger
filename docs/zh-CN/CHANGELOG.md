# 变更日志

[English](../en-US/CHANGELOG.md) | 中文 (Chinese)

本文件记录 @dreamer/logger 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-07-22

### 新增

- **Node.js 兼容**：logger 通过 `@dreamer/runtime-adapter`（v1.2.2，已支持
  Node）进行所有文件系统与环境操作（`getEnv`、`isTerminal`、`mkdir`、`open`、
  `rename`、`stat`）。服务容器（`@dreamer/service` v1.1.0）已兼容 Node。无需修改
  `src/`。
- **Node 测试基础设施**：`package.json` 含 `test:node` 脚本
  （`tsx --tsconfig tsconfig.json --test --test-force-exit tests/mod.test.ts`）、
  `tsconfig.json`。浏览器测试（`client.test.ts`）在 Node CI 中排除（需
  Chromium + esbuild）。
- **CI 工作流**升级为 9 个 job — 3 Deno v2.9 + 3 Bun + 3 Node 22。 Deno/Bun job
  安装 Playwright Chromium 1.59.1 并运行全部测试（含浏览器）； Node job 仅运行
  `mod.test.ts`（不安装 Chromium）。
- `deno.json` 添加 `minimumDependencyAge: 0`，以兼容当日发布的 `@dreamer/*`
  依赖。

### 变更

- 依赖升级：`@dreamer/test` ^1.2.3、`@dreamer/service` ^1.1.0、
  `@dreamer/runtime-adapter` ^1.2.2。
- CI Deno 版本 v2.5 → v2.9；Playwright 1.58.2 → 1.59.1。

### 文档

- 中英文测试报告更新为三端结果：Deno 89、Bun 86、Node 67。

---

## [1.0.3] - 2026-02-25

### 新增

- **`color: "auto"`**：`LoggerConfig.color` 现支持 `"auto"`。设为或未设置时按
  TTY 与 format 自动检测（前台有颜色，后台无颜色）。
- **`output.console: "auto"`**：`LogOutputConfig.console` 现支持
  `"auto"`，行为与原先的 `output.auto` 一致（有 TTY 仅控制台，无 TTY 仅文件）。
- **测试**：新增 `color: "auto"`、`output.console: "auto"` 用例；总用例数
  89（client 21，mod 68）。
- **CI**：GitHub Actions 工作流（Linux/macOS/Windows，Deno + Bun）；Windows 上
  Bun 仅跑服务端测试（不跑浏览器），避免 Playwright 已知卡住问题。

### 变更

- **去掉 `output.auto`**：已移除 `output.auto` 参数，请改用
  `output.console: "auto"` 实现自动输出目标选择。
- **文档**：README 与 TEST_REPORT 已更新，说明新的 `"auto"`
  取值及配置变更总结（中英文）。

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
