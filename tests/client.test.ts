/**
 * @fileoverview 客户端日志器测试
 * 使用 @dreamer/test 浏览器测试集成，在浏览器环境中验证客户端 logger 功能
 *
 * 说明：使用测试库的 browser 配置，自动管理 Puppeteer 与 esbuild 打包，
 * 无需手动 existsSync/makeTempFile 等 runtime-adapter 依赖，Bun/Deno 兼容。
 */

import { RUNTIME } from "@dreamer/runtime-adapter";
import { afterAll, beforeAll, describe, expect, it } from "@dreamer/test";

// 浏览器测试配置：由 @dreamer/test 自动打包 client 并启动浏览器
const browserConfig = {
  sanitizeOps: false,
  sanitizeResources: false,
  timeout: 60_000,
  browser: {
    enabled: true,
    entryPoint: "./src/client/mod.ts",
    globalName: "LoggerClient",
    browserMode: true,
    moduleLoadTimeout: 30_000,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    reuseBrowser: true,
  },
};

describe(`Logger Client - 浏览器测试 (${RUNTIME})`, () => {
  beforeAll(() => {
    // 可选：统一前置逻辑，当前无服务器等需启动
  });

  afterAll(() => {
    // 可选：统一后置清理
  });

  describe("基础功能", () => {
    it("应该创建日志器实例", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const LoggerClient = (globalThis as any).LoggerClient;
        const { createLogger } = LoggerClient;
        const logger = createLogger();
        return {
          hasLogger: logger !== null && typeof logger === "object",
          hasDebug: typeof logger.debug === "function",
          hasInfo: typeof logger.info === "function",
          hasWarn: typeof logger.warn === "function",
          hasError: typeof logger.error === "function",
          hasFatal: typeof logger.fatal === "function",
        };
      });
      expect(result.hasLogger).toBe(true);
      expect(result.hasDebug).toBe(true);
      expect(result.hasInfo).toBe(true);
      expect(result.hasWarn).toBe(true);
      expect(result.hasError).toBe(true);
      expect(result.hasFatal).toBe(true);
    }, browserConfig);

    it("应该支持自定义配置", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "debug",
          prefix: "[Test]",
          timestamp: true,
          color: true,
          debug: true,
        });
        return {
          level: logger.getLevel(),
          prefix: logger.getPrefix(),
          debug: logger.getDebug(),
        };
      });
      expect(result.level).toBe("debug");
      expect(result.prefix).toBe("[Test]");
      expect(result.debug).toBe(true);
    }, browserConfig);

    it("应该支持日志级别控制", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "warn",
          color: false,
          debug: true,
        });
        const logs: string[] = [];
        const originalWarn = console.warn;
        const originalInfo = console.info;
        const originalDebug = console.debug;
        console.warn = (...args: any[]) => {
          logs.push("warn");
          originalWarn.apply(console, args);
        };
        console.info = (...args: any[]) => {
          logs.push("info");
          originalInfo.apply(console, args);
        };
        console.debug = (...args: any[]) => {
          logs.push("debug");
          originalDebug.apply(console, args);
        };
        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        console.warn = originalWarn;
        console.info = originalInfo;
        console.debug = originalDebug;
        return {
          hasWarn: logs.includes("warn"),
          hasInfo: logs.includes("info"),
          hasDebug: logs.includes("debug"),
        };
      });
      expect(result.hasWarn).toBe(true);
      expect(result.hasInfo).toBe(false);
      expect(result.hasDebug).toBe(false);
    }, browserConfig);

    it("应该支持调试模式控制", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({ debug: false });
        const logs: string[] = [];
        const originalError = console.error;
        console.error = (...args: any[]) => {
          logs.push("error:" + args.join(" "));
          originalError.apply(console, args);
        };
        logger.error("error message");
        logger.fatal("fatal message");
        console.error = originalError;
        return {
          hasError: logs.some((log) => log.includes("error")),
          hasFatal: logs.some((log) => log.includes("fatal")),
        };
      });
      expect(result.hasError).toBe(false);
      expect(result.hasFatal).toBe(false);
    }, browserConfig);

    it("应该支持动态设置日志级别", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({ level: "error" });
        logger.setLevel("debug");
        return { level: logger.getLevel() };
      });
      expect(result.level).toBe("debug");
    }, browserConfig);

    it("应该支持动态设置调试模式", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({ debug: true });
        logger.setDebug(false);
        const debugState1 = logger.getDebug();
        logger.setDebug(true);
        const debugState2 = logger.getDebug();
        return { debugState1, debugState2 };
      });
      expect(result.debugState1).toBe(false);
      expect(result.debugState2).toBe(true);
    }, browserConfig);

    it("应该支持日志前缀", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({ prefix: "[MyApp]" });
        logger.setPrefix("[NewApp]");
        return { prefix: logger.getPrefix() };
      });
      expect(result.prefix).toBe("[NewApp]");
    }, browserConfig);

    it("应该支持创建子日志器", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const parentLogger = createLogger({ prefix: "[Parent]" });
        const childLogger = parentLogger.child({ prefix: "[Child]" });
        return {
          parentPrefix: parentLogger.getPrefix(),
          childPrefix: childLogger.getPrefix(),
          hasChildMethods: typeof childLogger.debug === "function" &&
            typeof childLogger.info === "function",
        };
      });
      expect(result.parentPrefix).toBe("[Parent]");
      expect(result.childPrefix).toBe("[Child]");
      expect(result.hasChildMethods).toBe(true);
    }, browserConfig);
  });

  describe("日志级别方法", () => {
    it("应该支持所有日志级别方法", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "debug",
          debug: true,
          color: false,
        });
        const logs: string[] = [];
        const orig = {
          debug: console.debug,
          info: console.info,
          warn: console.warn,
          error: console.error,
        };
        console.debug = (...args: any[]) => {
          logs.push("debug");
          orig.debug.apply(console, args);
        };
        console.info = (...args: any[]) => {
          logs.push("info");
          orig.info.apply(console, args);
        };
        console.warn = (...args: any[]) => {
          logs.push("warn");
          orig.warn.apply(console, args);
        };
        console.error = (...args: any[]) => {
          logs.push("error");
          orig.error.apply(console, args);
        };
        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        logger.error("error message");
        logger.fatal("fatal message");
        console.debug = orig.debug;
        console.info = orig.info;
        console.warn = orig.warn;
        console.error = orig.error;
        return {
          hasDebug: logs.includes("debug"),
          hasInfo: logs.includes("info"),
          hasWarn: logs.includes("warn"),
          hasError: logs.includes("error"),
          errorCount: logs.filter((l) => l === "error").length,
        };
      });
      expect(result.hasDebug).toBe(true);
      expect(result.hasInfo).toBe(true);
      expect(result.hasWarn).toBe(true);
      expect(result.hasError).toBe(true);
      expect(result.errorCount).toBe(2);
    }, browserConfig);

    it("应该支持带数据的日志", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "debug",
          debug: true,
          color: false,
        });
        let logData: any = null;
        const originalInfo = console.info;
        console.info = function (...args: any[]) {
          for (let i = 1; i < args.length; i++) {
            if (
              typeof args[i] === "object" && args[i] !== null &&
              !(args[i] instanceof Error)
            ) {
              logData = args[i];
              break;
            }
          }
          originalInfo.apply(console, args);
        };
        logger.info("test message", { key: "value", number: 123 });
        console.info = originalInfo;
        return {
          hasData: logData !== null,
          dataKey: logData?.key,
          dataNumber: logData?.number,
        };
      });
      expect(result.hasData).toBe(true);
      expect(result.dataKey).toBe("value");
      expect(result.dataNumber).toBe(123);
    }, browserConfig);

    it("应该支持带错误对象的日志", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "error",
          debug: true,
          color: false,
        });
        let logError: any = null;
        const originalError = console.error;
        console.error = (...args: any[]) => {
          const err = args.find((a) => a instanceof Error);
          if (err) logError = err;
          originalError.apply(console, args);
        };
        const testError = new Error("test error");
        logger.error("error message", undefined, testError);
        console.error = originalError;
        return {
          hasError: logError !== null,
          errorMessage: logError?.message,
        };
      });
      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe("test error");
    }, browserConfig);

    it("应该支持彩色输出（如果启用）", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "info",
          color: true,
          debug: true,
        });
        let hasStyleArg = false;
        const originalInfo = console.info;
        console.info = (...args: any[]) => {
          hasStyleArg = args.length > 1 &&
            args.some((arg, i) =>
              i > 0 && typeof arg === "string" && arg.includes("color:")
            );
          originalInfo.apply(console, args);
        };
        logger.info("test message");
        console.info = originalInfo;
        return { hasStyleArg };
      });
      expect(result.hasStyleArg).toBe(true);
    }, browserConfig);

    it("应该支持无颜色输出（如果禁用）", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const { createLogger } = (globalThis as any).LoggerClient;
        const logger = createLogger({
          level: "info",
          color: false,
          debug: true,
        });
        let hasStyleArg = false;
        const originalInfo = console.info;
        console.info = (...args: any[]) => {
          hasStyleArg = args.some((a) =>
            typeof a === "string" && a.includes("color:")
          );
          originalInfo.apply(console, args);
        };
        logger.info("test message");
        console.info = originalInfo;
        return { hasStyleArg };
      });
      expect(result.hasStyleArg).toBe(false);
    }, browserConfig);
  });

  describe("console 重定向", () => {
    it(
      "redirectConsoleToLogger 应将 console.log/info 转发到 logger.info",
      async (t) => {
        const result = await t!.browser!.evaluate(() => {
          const {
            createLogger,
            redirectConsoleToLogger,
            restoreConsole,
          } = (globalThis as any).LoggerClient;
          const logger = createLogger({ level: "debug", debug: true });
          const infoCalls: string[] = [];
          const origInfo = logger.info.bind(logger);
          logger.info = (message: string) => {
            infoCalls.push(message);
            origInfo(message);
          };
          redirectConsoleToLogger(logger);
          console.log("log-msg");
          console.info("info-msg");
          const hasLog = infoCalls.includes("log-msg");
          const hasInfo = infoCalls.includes("info-msg");
          restoreConsole();
          return { hasLog, hasInfo };
        });
        expect(result.hasLog).toBe(true);
        expect(result.hasInfo).toBe(true);
      },
      browserConfig,
    );

    it(
      "redirectConsoleToLogger 应将 console.warn 转发到 logger.warn",
      async (t) => {
        const result = await t!.browser!.evaluate(() => {
          const {
            createLogger,
            redirectConsoleToLogger,
            restoreConsole,
          } = (globalThis as any).LoggerClient;
          const logger = createLogger({ level: "debug", debug: true });
          const warnCalls: string[] = [];
          const origWarn = logger.warn.bind(logger);
          logger.warn = (message: string) => {
            warnCalls.push(message);
            origWarn(message);
          };
          redirectConsoleToLogger(logger);
          console.warn("warn-msg");
          const hasWarn = warnCalls.includes("warn-msg");
          restoreConsole();
          return { hasWarn };
        });
        expect(result.hasWarn).toBe(true);
      },
      browserConfig,
    );

    it(
      "redirectConsoleToLogger 应将 console.error/debug 转发到 logger.error/logger.debug",
      async (t) => {
        const result = await t!.browser!.evaluate(() => {
          const {
            createLogger,
            redirectConsoleToLogger,
            restoreConsole,
          } = (globalThis as any).LoggerClient;
          const logger = createLogger({ level: "debug", debug: true });
          const errorCalls: string[] = [];
          const debugCalls: string[] = [];
          const origError = logger.error.bind(logger);
          const origDebug = logger.debug.bind(logger);
          logger.error = (message: string) => {
            errorCalls.push(message);
            origError(message);
          };
          logger.debug = (message: string) => {
            debugCalls.push(message);
            origDebug(message);
          };
          redirectConsoleToLogger(logger);
          console.error("error-msg");
          console.debug("debug-msg");
          const hasError = errorCalls.includes("error-msg");
          const hasDebug = debugCalls.includes("debug-msg");
          restoreConsole();
          return { hasError, hasDebug };
        });
        expect(result.hasError).toBe(true);
        expect(result.hasDebug).toBe(true);
      },
      browserConfig,
    );

    it(
      "redirectConsoleToLogger 应支持多参数，第一个为消息、其余为 data",
      async (t) => {
        const result = await t!.browser!.evaluate(() => {
          const {
            createLogger,
            redirectConsoleToLogger,
            restoreConsole,
          } = (globalThis as any).LoggerClient;
          const logger = createLogger({ level: "debug", debug: true });
          let lastMessage = "";
          let lastData: any = undefined;
          const origInfo = logger.info.bind(logger);
          logger.info = (message: string, data?: unknown) => {
            lastMessage = message;
            lastData = data;
            origInfo(message, data);
          };
          redirectConsoleToLogger(logger);
          console.log("hello", { foo: 1 });
          const ok = lastMessage === "hello" && lastData && lastData.foo === 1;
          const dataFoo = lastData?.foo;
          restoreConsole();
          return { ok, lastMessage, dataFoo };
        });
        expect(result.ok).toBe(true);
        expect(result.lastMessage).toBe("hello");
        expect(result.dataFoo).toBe(1);
      },
      browserConfig,
    );

    it(
      "restoreConsole 应恢复原始 console，之后 console 调用不再转发到 logger",
      async (t) => {
        const result = await t!.browser!.evaluate(() => {
          const {
            createLogger,
            redirectConsoleToLogger,
            restoreConsole,
          } = (globalThis as any).LoggerClient;
          const logger = createLogger({ level: "debug", debug: true });
          const infoCalls: string[] = [];
          const origInfo = logger.info.bind(logger);
          logger.info = (message: string) => {
            infoCalls.push(message);
            origInfo(message);
          };
          const restore = redirectConsoleToLogger(logger);
          console.log("before-restore");
          const countBefore = infoCalls.length;
          restore();
          infoCalls.length = 0;
          console.log("after-restore");
          const countAfter = infoCalls.length;
          return { countBefore, countAfter };
        });
        expect(result.countBefore).toBeGreaterThanOrEqual(1);
        expect(result.countAfter).toBe(0);
      },
      browserConfig,
    );

    it("redirectConsoleToLogger 不传参时应使用默认 logger", async (t) => {
      const result = await t!.browser!.evaluate(() => {
        const {
          redirectConsoleToLogger,
          restoreConsole,
          logger: defaultLogger,
        } = (globalThis as any).LoggerClient;
        const infoCalls: string[] = [];
        const origInfo = defaultLogger.info.bind(defaultLogger);
        defaultLogger.info = (message: string) => {
          infoCalls.push(message);
          origInfo(message);
        };
        redirectConsoleToLogger();
        console.info("default-logger-msg");
        const hasMsg = infoCalls.includes("default-logger-msg");
        restoreConsole();
        defaultLogger.info = origInfo;
        return { hasMsg };
      });
      expect(result.hasMsg).toBe(true);
    }, browserConfig);
  });
}, browserConfig);
