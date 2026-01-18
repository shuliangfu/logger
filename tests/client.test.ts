/**
 * @fileoverview 客户端日志器测试
 * 测试客户端日志器在浏览器环境中的功能
 */

import {
  existsSync,
  makeTempFile,
  resolve,
  writeTextFileSync,
} from "@dreamer/runtime-adapter";
import { afterEach, beforeEach, describe, expect, it } from "@dreamer/test";

/**
 * 动态加载依赖
 */
async function loadDependencies() {
  let esbuild: any;
  let puppeteer: any;

  try {
    // 动态导入 esbuild
    const esbuildModule = await import("esbuild");
    esbuild = esbuildModule.default || esbuildModule;

    // 动态导入 puppeteer
    const puppeteerModule = await import("puppeteer");
    puppeteer = puppeteerModule.default || puppeteerModule;
  } catch (error) {
    console.warn(`无法加载依赖:`, error);
    return null;
  }
  return { esbuild, puppeteer };
}

describe("Logger Client - 浏览器测试", () => {
  let browser: any = null;
  let page: any = null;
  let buildTimer: ReturnType<typeof setTimeout> | null = null;
  let waitTimer: ReturnType<typeof setTimeout> | null = null;

  // 跳过测试的辅助函数（如果 Puppeteer 不可用）
  const skipIfNoBrowser = (testFn: () => void | Promise<void>) => {
    return async () => {
      if (!page) {
        console.warn(`跳过测试：浏览器未初始化`);
        return;
      }
      await testFn();
    };
  };

  beforeEach(async () => {
    try {
      // 动态加载依赖
      const deps = await loadDependencies();
      if (!deps) {
        console.warn(`跳过测试：依赖未加载`);
        return;
      }

      const { esbuild: esbuildModule, puppeteer: puppeteerModule } = deps;

      // 初始化浏览器测试环境
      console.log(`初始化浏览器测试环境`);

      // 尝试使用系统 Chrome（如果可用）
      let executablePath: string | undefined;

      // macOS Chrome 路径
      const macChromePaths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
      ];

      // Linux Chrome 路径
      const linuxChromePaths = [
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
      ];

      // 检查系统 Chrome
      const allPaths = [...macChromePaths, ...linuxChromePaths];
      for (const path of allPaths) {
        try {
          if (existsSync(path)) {
            executablePath = path;
            break;
          }
        } catch {
          // 忽略错误
        }
      }

      // 启动浏览器
      browser = await puppeteerModule.launch({
        headless: true,
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      page = await browser.newPage();

      // 构建客户端模块
      // 使用 import.meta.url 获取当前文件路径
      const currentDir = new URL(".", import.meta.url).pathname;
      const clientModulePath = resolve(currentDir, "../src/client/mod.ts");

      const buildResult = await esbuildModule.build({
        entryPoints: [clientModulePath],
        bundle: true,
        format: "iife", // 使用 IIFE 格式，自动创建全局变量
        target: "es2020",
        write: false,
        platform: "browser",
        globalName: "LoggerClient",
        minify: false,
        sourcemap: false,
      });

      const bundleCode = new TextDecoder().decode(
        buildResult.outputFiles[0].contents,
      );

      // 创建测试 HTML 页面
      const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Logger Client Test</title>
</head>
<body>
  <div id="test-container"></div>
  <script>
    ${bundleCode}

    // 标记模块已加载
    if (typeof window !== 'undefined') {
      window.loggerClientReady = true;
    }
  </script>
</body>
</html>
      `;

      const htmlPath = await makeTempFile({ suffix: ".html" });
      writeTextFileSync(htmlPath, testHtml);

      // 加载测试页面
      await page.goto(`file://${htmlPath}`, {
        waitUntil: "networkidle0",
      });

      // 等待模块加载（IIFE 格式会自动创建全局变量 LoggerClient）
      await page.waitForFunction(() => {
        return typeof (window as any).LoggerClient !== "undefined" &&
          (window as any).loggerClientReady === true;
      }, { timeout: 10000 });
    } catch (error) {
      console.warn(`初始化失败:`, error);
      if (browser) {
        await browser.close().catch(() => {});
      }
      browser = null;
      page = null;
    }
  }, { timeout: 30000, sanitizeOps: false, sanitizeResources: false });

  afterEach(async () => {
    // 清理定时器
    if (buildTimer) {
      clearTimeout(buildTimer);
      buildTimer = null;
    }
    if (waitTimer) {
      clearTimeout(waitTimer);
      waitTimer = null;
    }

    // 关闭浏览器
    if (page) {
      try {
        await page.close();
      } catch {
        // 忽略错误
      }
      page = null;
    }

    if (browser) {
      try {
        await browser.close();
      } catch {
        // 忽略错误
      }
      browser = null;
    }
  }, { sanitizeOps: false, sanitizeResources: false });

  it(
    "应该创建日志器实例",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        // IIFE 格式会将所有导出合并到全局变量中
        const LoggerClient = (window as any).LoggerClient;
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
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持自定义配置",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
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
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持日志级别控制",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({
          level: "warn",
          color: false,
          debug: true,
        }); // 启用 debug 模式

        // 捕获 console 调用
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

        // 恢复 console
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
      expect(result.hasInfo).toBe(false); // info 级别低于 warn，不应该输出
      expect(result.hasDebug).toBe(false); // debug 级别低于 warn，不应该输出
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持调试模式控制",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({ debug: false });

        // 捕获 console 调用
        const logs: string[] = [];
        const originalError = console.error;
        console.error = (...args: any[]) => {
          logs.push("error:" + args.join(" "));
          originalError.apply(console, args);
        };

        logger.error("error message");
        logger.fatal("fatal message");

        // 恢复 console
        console.error = originalError;

        return {
          hasError: logs.some((log) => log.includes("error")),
          hasFatal: logs.some((log) => log.includes("fatal")),
        };
      });

      expect(result.hasError).toBe(false); // debug: false 时，所有日志都不输出
      expect(result.hasFatal).toBe(false);
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持动态设置日志级别",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({ level: "error" });

        logger.setLevel("debug");
        const newLevel = logger.getLevel();

        return {
          level: newLevel,
        };
      });

      expect(result.level).toBe("debug");
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持动态设置调试模式",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({ debug: true });

        logger.setDebug(false);
        const debugState1 = logger.getDebug();

        logger.setDebug(true);
        const debugState2 = logger.getDebug();

        return {
          debugState1,
          debugState2,
        };
      });

      expect(result.debugState1).toBe(false);
      expect(result.debugState2).toBe(true);
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持日志前缀",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({ prefix: "[MyApp]" });

        logger.setPrefix("[NewApp]");
        const prefix = logger.getPrefix();

        return {
          prefix,
        };
      });

      expect(result.prefix).toBe("[NewApp]");
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持创建子日志器",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
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
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持所有日志级别方法",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({
          level: "debug",
          debug: true,
          color: false,
        }); // 禁用颜色以便测试

        // 捕获所有 console 调用
        const logs: string[] = [];
        const originalMethods = {
          debug: console.debug,
          info: console.info,
          warn: console.warn,
          error: console.error,
        };

        console.debug = (...args: any[]) => {
          logs.push("debug");
          originalMethods.debug.apply(console, args);
        };
        console.info = (...args: any[]) => {
          logs.push("info");
          originalMethods.info.apply(console, args);
        };
        console.warn = (...args: any[]) => {
          logs.push("warn");
          originalMethods.warn.apply(console, args);
        };
        console.error = (...args: any[]) => {
          logs.push("error");
          originalMethods.error.apply(console, args);
        };

        logger.debug("debug message");
        logger.info("info message");
        logger.warn("warn message");
        logger.error("error message");
        logger.fatal("fatal message");

        // 恢复 console
        console.debug = originalMethods.debug;
        console.info = originalMethods.info;
        console.warn = originalMethods.warn;
        console.error = originalMethods.error;

        return {
          hasDebug: logs.includes("debug"),
          hasInfo: logs.includes("info"),
          hasWarn: logs.includes("warn"),
          hasError: logs.includes("error"), // fatal 也使用 console.error
          errorCount: logs.filter((log) => log === "error").length,
        };
      });

      expect(result.hasDebug).toBe(true);
      expect(result.hasInfo).toBe(true);
      expect(result.hasWarn).toBe(true);
      expect(result.hasError).toBe(true);
      expect(result.errorCount).toBe(2); // error 和 fatal 都使用 console.error
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持带数据的日志",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({
          level: "debug",
          debug: true,
          color: false,
        }); // 禁用颜色以便测试

        // 捕获 console 调用
        let logData: any = null;
        const originalInfo = console.info;
        console.info = function (...args: any[]) {
          // 无颜色时：args[0] 是消息，args[1] 是数据
          // 有颜色时：args[0] 是消息，args[1..n] 是样式，最后一个对象是数据
          // 为了兼容两种情况，查找第一个对象类型的参数（排除 Error）
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

        // 恢复 console
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
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持带错误对象的日志",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({
          level: "error",
          debug: true,
          color: false,
        }); // 禁用颜色以便测试

        // 捕获 console 调用
        let logError: any = null;
        const originalError = console.error;
        console.error = (...args: any[]) => {
          // 查找 Error 对象（可能在最后，因为错误对象在最后添加）
          const errorArg = args.find((arg) => arg instanceof Error);
          if (errorArg) {
            logError = errorArg;
          }
          originalError.apply(console, args);
        };

        const testError = new Error("test error");
        logger.error("error message", undefined, testError);

        // 恢复 console
        console.error = originalError;

        return {
          hasError: logError !== null,
          errorMessage: logError?.message,
        };
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBe("test error");
    }),
    { sanitizeOps: false, sanitizeResources: false },
  );

  it(
    "应该支持彩色输出（如果启用）",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({
          level: "info",
          color: true,
          debug: true,
        });

        // 捕获 console 调用
        let hasStyleArg = false;
        const originalInfo = console.info;
        console.info = (...args: any[]) => {
          // 检查是否有样式参数（CSS 样式字符串）
          // 彩色输出时，args[0] 是格式化消息（包含 %c），args[1..n] 是样式字符串
          hasStyleArg = args.length > 1 &&
            args.some((arg, index) =>
              index > 0 && typeof arg === "string" && arg.includes("color:")
            );
          originalInfo.apply(console, args);
        };

        logger.info("test message");

        // 恢复 console
        console.info = originalInfo;

        return {
          hasStyleArg,
        };
      });

      // 彩色输出应该包含样式参数
      expect(result.hasStyleArg).toBe(true);
    }),
    { sanitizeOps: false, sanitizeResources: false, timeout: 30000 },
  );

  it(
    "应该支持无颜色输出（如果禁用）",
    skipIfNoBrowser(async () => {
      const result = await page.evaluate(() => {
        const { createLogger } = (window as any).LoggerClient;
        const logger = createLogger({
          level: "info",
          color: false,
          debug: true,
        });

        // 捕获 console 调用
        let hasStyleArg = false;
        const originalInfo = console.info;
        console.info = (...args: any[]) => {
          hasStyleArg = args.some((arg) =>
            typeof arg === "string" && arg.includes("color:")
          );
          originalInfo.apply(console, args);
        };

        logger.info("test message");

        // 恢复 console
        console.info = originalInfo;

        return {
          hasStyleArg,
        };
      });

      // 无颜色输出不应该包含样式参数
      expect(result.hasStyleArg).toBe(false);
    }),
    { sanitizeOps: false, sanitizeResources: false, timeout: 30000 },
  );
});
