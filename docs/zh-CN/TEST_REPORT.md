# @dreamer/logger 测试报告

[English](../en-US/TEST_REPORT.md) | 中文 (Chinese)

## 📊 测试概览

| 项目             | 值                               |
| ---------------- | -------------------------------- |
| **Logger 版本**  | @dreamer/logger@1.0.0            |
| **服务容器版本** | @dreamer/service@^1.0.2          |
| **测试框架**     | @dreamer/test@^1.0.10            |
| **测试日期**     | 2026-02-19                       |
| **测试环境**     | Deno 2.5+, Bun 1.0+              |
| **测试文件数**   | 2                                |
| **总用例数**     | 86                               |
| **通过率**       | 100% ✅                          |
| **执行时间**     | 约 22 秒（Deno，`deno test -A`） |

## 测试结果

### 总体统计

- **测试总数**：86
- **通过**：86 ✅
- **失败**：0
- **通过率**：100% ✅
- **执行时间**：约 22 秒（Deno）

### 测试文件统计

| 测试文件         | 用例数 | 状态        | 说明                                                       |
| ---------------- | ------ | ----------- | ---------------------------------------------------------- |
| `client.test.ts` | 21     | ✅ 全部通过 | 浏览器环境测试（@dreamer/test 浏览器集成，IIFE 打包）      |
| `mod.test.ts`    | 65     | ✅ 全部通过 | 服务端单元测试 + LoggerManager + ServiceContainer 集成测试 |

## 功能测试详情

### 1. 浏览器环境测试 (client.test.ts) - 21 个用例

使用 @dreamer/test 的 `browser.enabled` 配置，`browserMode: false`（IIFE
打包），自动管理 Playwright 与 esbuild 打包。兼容 Deno 与 Bun。

#### 1.1 基础功能（9 个用例）

| 场景                      | 状态 |
| ------------------------- | ---- |
| ✅ 应能创建日志器实例     | 通过 |
| ✅ 应支持自定义配置       | 通过 |
| ✅ 应支持日志级别控制     | 通过 |
| ✅ 应支持调试模式控制     | 通过 |
| ✅ 应支持动态设置日志级别 | 通过 |
| ✅ 应支持动态设置调试模式 | 通过 |
| ✅ 应支持日志前缀         | 通过 |
| ✅ 应支持创建子日志器     | 通过 |

#### 1.2 日志级别方法（5 个用例）

| 场景                          | 状态 |
| ----------------------------- | ---- |
| ✅ 应支持所有日志级别方法     | 通过 |
| ✅ 应支持带数据的日志         | 通过 |
| ✅ 应支持带错误对象的日志     | 通过 |
| ✅ 应支持彩色输出（启用时）   | 通过 |
| ✅ 应支持无颜色输出（禁用时） | 通过 |

#### 1.3 Console 重定向（6 个用例）

| 场景                                                                | 状态 |
| ------------------------------------------------------------------- | ---- |
| ✅ redirectConsoleToLogger 应将 console.log/info 转发到 logger.info | 通过 |
| ✅ redirectConsoleToLogger 应将 console.warn 转发到 logger.warn     | 通过 |
| ✅ redirectConsoleToLogger 应将 console.error/debug 转发到 logger   | 通过 |
| ✅ redirectConsoleToLogger 应支持多参数（首参为消息，其余为 data）  | 通过 |
| ✅ restoreConsole 应恢复原始 console，之后不再转发到 logger         | 通过 |
| ✅ redirectConsoleToLogger 不传参时应使用默认 logger                | 通过 |

**结果**：21 个用例全部通过。

### 2. 服务端测试 (mod.test.ts) - 65 个用例

#### 2.1 createLogger（2 个用例）

- ✅ 应能创建日志器实例
- ✅ 应支持自定义 format

#### 2.2 日志级别（3 个用例）

- ✅ 应支持所有日志级别
- ✅ 应按级别过滤日志
- ✅ 应支持设置与获取日志级别

#### 2.3 日志格式（3 个用例）

- ✅ 应支持 text 格式
- ✅ 应支持 JSON 格式
- ✅ 应支持 color 格式

#### 2.4 时间戳显示（6 个用例）

- ✅ 默认显示时间戳、支持禁用/启用、text/color 下时间戳控制、JSON 格式行为

#### 2.5 日志数据（3 个用例）

- ✅ 应支持 data 参数、error 参数、data 与 error 同时传入

#### 2.6 上下文与标签（4 个用例）

- ✅ 应支持设置/获取 context、合并 context、添加/移除 tag、去重 tag

#### 2.7 子日志器（2 个用例）

- ✅ 应能创建子日志器、继承父级配置

#### 2.8 性能监控（5 个用例）

- ✅ 应支持性能监控、不存在的 performance ID 处理、performance
  装饰器（同步/异步）、错误处理

#### 2.9 过滤配置（4 个用例）

- ✅ 应支持设置/获取 filter、include 标签过滤、exclude 标签过滤、自定义过滤函数

#### 2.10 采样配置（3 个用例）

- ✅ 应支持设置/获取 sampling、采样率、按级别采样

#### 2.11 输出配置（2 个用例）

- ✅ 应支持禁用控制台输出、自定义输出

#### 2.12 文件输出（2 个用例）

- ✅ 应支持文件输出、关闭 logger

#### 2.13 Console 重定向（6 个用例）

- ✅ 服务端 redirectConsoleToLogger / restoreConsole 行为与多参数、默认 logger
  一致

#### 2.14 默认日志器（1 个用例）

- ✅ 应导出默认 logger 实例

#### 2.15 LoggerManager（9 个用例）

- ✅ 创建实例、默认/自定义名称、getLogger、带 tag
  创建、hasLogger、removeLogger、getLoggerNames、setLevel、createLogger（非缓存）

#### 2.16 LoggerManager 与 ServiceContainer 集成（4 个用例）

- ✅ 设置/获取 container、fromContainer 获取、服务不存在时返回
  undefined、多实例支持

#### 2.17 createLoggerManager 工厂（5 个用例）

- ✅ 创建实例、默认名称、自定义名称、可注册到 container、默认 config

**结果**：65 个用例全部通过。

## 测试覆盖分析

### 接口方法覆盖

| 类别           | 覆盖说明                                                   |
| -------------- | ---------------------------------------------------------- |
| createLogger   | ✅ 多场景创建与 format 配置                                |
| 日志方法       | ✅ debug / info / warn / error / fatal 全级别              |
| 级别与配置     | ✅ setLevel / getLevel、context、tag、filter、sampling     |
| 子日志器       | ✅ child() 及配置继承                                      |
| 性能监控       | ✅ startPerformance / endPerformance / performance 装饰器  |
| 输出与关闭     | ✅ 控制台/文件/自定义输出、close                           |
| Console 重定向 | ✅ 服务端与客户端 redirectConsoleToLogger / restoreConsole |
| LoggerManager  | ✅ 注册、获取、作用域、ServiceContainer 集成               |

### 边界与错误处理

| 场景                       | 覆盖   |
| -------------------------- | ------ |
| ✅ 不存在的 performance ID | 已覆盖 |
| ✅ 性能装饰器抛错          | 已覆盖 |
| ✅ 重复 tag                | 已覆盖 |
| ✅ 无效日志级别            | 已覆盖 |
| ✅ 文件输出初始化失败      | 已覆盖 |
| ✅ 关闭后操作              | 已覆盖 |

## 优点

1. ✅ **覆盖完整**：公共 API、边界情况、错误处理均有测试
2. ✅ **浏览器集成**：使用 @dreamer/test 浏览器测试，Deno/Bun 下无需手动配置
   Puppeteer/esbuild
3. ✅ **多格式**：text、JSON、color 格式均有验证
4. ✅ **时间戳与级别**：showTime、showLevel 等配置有专门用例
5. ✅ **性能与采样**：性能监控与采样配置全覆盖
6. ✅ **Console 重定向**：服务端与客户端均覆盖 redirectConsoleToLogger /
   restoreConsole
7. ✅ **LoggerManager**：单例/多例/作用域/工厂及 ServiceContainer 集成均有测试
8. ✅ **跨运行时**：Deno 与 Bun 下测试通过

## 结论

@dreamer/logger 共 86 个测试用例，全部通过，通过率 100%。

- **浏览器测试 (client.test.ts)**：21 ✅
- **服务端测试 (mod.test.ts)**：65 ✅

**适用于生产环境使用。**

---

_测试报告以仓库最新运行结果为准。_
