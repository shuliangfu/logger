/**
 * @module @dreamer/logger/client
 *
 * @fileoverview 客户端日志管理器
 * 专为浏览器环境设计的轻量级日志管理，使用 console API 输出日志
 *
 * 特性：
 * - 多级别日志（debug, info, warn, error, fatal）
 * - 日志级别控制
 * - 日志前缀设置
 * - 彩色日志输出（不同级别使用不同颜色）
 * - 美化的日志格式
 * - 统一的日志输出接口
 *
 * 环境兼容性：
 * - 客户端：✅ 支持（浏览器环境）
 *
 * @example
 * ```typescript
 * import { createLogger } from "jsr:@dreamer/logger/client";
 *
 * // 开发环境
 * const logger = createLogger({
 *   level: "info",
 *   prefix: "[MyApp]",
 *   color: true,
 *   debug: true, // 启用日志输出
 * });
 *
 * // 生产环境
 * const prodLogger = createLogger({
 *   debug: false, // 禁用所有日志输出
 * });
 *
 * logger.info("应用启动");
 * logger.error("错误信息", { error: "..." });
 * ```
 */

/**
 * 日志级别
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * 日志级别优先级（数字越小优先级越高）
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * CSS 样式定义（用于浏览器控制台）
 */
const LOG_STYLES: Record<LogLevel, string> = {
  debug: "color: #888; font-weight: normal;",
  info: "color: #2196F3; font-weight: normal;",
  warn: "color: #FF9800; font-weight: bold;",
  error: "color: #F44336; font-weight: bold;",
  fatal: "color: #D32F2F; font-weight: bold; background: #FFEBEE;",
};

/**
 * 日志级别图标
 */
const LOG_ICONS: Record<LogLevel, string> = {
  debug: "🔍",
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  fatal: "💀",
};

/**
 * 客户端日志器配置
 */
export interface LoggerConfig {
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
}

/**
 * 获取控制台方法（运行时动态获取，支持测试中拦截 console）
 *
 * @param level - 日志级别
 * @returns 对应的控制台方法
 */
function getConsoleMethod(level: LogLevel): typeof console.debug {
  switch (level) {
    case "debug":
      return console.debug.bind(console);
    case "info":
      return console.info.bind(console);
    case "warn":
      return console.warn.bind(console);
    case "error":
    case "fatal":
      return console.error.bind(console);
    default:
      return console.log.bind(console);
  }
}

/**
 * 客户端日志器
 *
 * 专为浏览器环境设计的轻量级日志管理器，使用 console API 输出日志
 */
export class Logger {
  private config: Required<LoggerConfig>;

  /**
   * 构造函数
   *
   * @param config - 日志器配置
   */
  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || "warn",
      prefix: config.prefix || "",
      timestamp: config.timestamp || false,
      color: config.color !== undefined ? config.color : true,
      debug: config.debug !== undefined ? config.debug : true,
    };
  }

  /**
   * 检查日志级别是否应该输出
   *
   * @param level - 日志级别
   * @returns 是否应该输出
   */
  private shouldLog(level: LogLevel): boolean {
    // 如果 debug 为 false，禁用所有日志输出（生产环境）
    if (!this.config.debug) {
      return false;
    }
    // 检查日志级别是否满足要求
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * 格式化日志消息（用于普通输出）
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @returns 格式化后的消息
   */
  private formatMessage(level: LogLevel, message: string): string {
    let formatted = "";

    // 添加时间戳
    if (this.config.timestamp) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }

    // 添加图标和日志级别
    formatted += `${LOG_ICONS[level]} [${level.toUpperCase()}]`;

    // 添加前缀
    if (this.config.prefix) {
      formatted += ` ${this.config.prefix}`;
    }

    // 添加消息
    formatted += ` ${message}`;

    return formatted;
  }

  /**
   * 格式化日志消息（用于带样式的输出）
   * 使用浏览器控制台的 CSS 样式功能，支持彩色输出
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @returns 格式化后的消息和样式数组
   */
  private formatStyledMessage(
    level: LogLevel,
    message: string,
  ): { message: string; styles: string[] } {
    let formatted = "";
    const styles: string[] = [];

    // 添加时间戳（如果启用）
    if (this.config.timestamp) {
      const timestamp = new Date().toISOString();
      formatted += `%c[${timestamp}] `;
      styles.push("color: #999; font-size: 11px;");
    }

    // 添加图标和日志级别（带样式）
    formatted += `%c${LOG_ICONS[level]} [${level.toUpperCase()}]`;
    styles.push(LOG_STYLES[level]);

    // 添加前缀（如果存在）
    if (this.config.prefix) {
      formatted += ` %c${this.config.prefix}`;
      styles.push("color: #666; font-weight: normal;");
    }

    // 添加消息
    formatted += ` %c${message}`;
    styles.push("color: inherit; font-weight: normal;");

    return {
      message: formatted,
      styles,
    };
  }

  /**
   * 内部日志记录方法（统一处理所有级别的日志）
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: unknown,
  ): void {
    // 提前检查，避免不必要的格式化
    if (!this.shouldLog(level)) {
      return;
    }

    const consoleMethod = getConsoleMethod(level);
    const args: unknown[] = [];

    if (this.config.color) {
      const { message: formattedMessage, styles } = this.formatStyledMessage(
        level,
        message,
      );
      args.push(formattedMessage, ...styles);
    } else {
      const formattedMessage = this.formatMessage(level, message);
      args.push(formattedMessage);
    }

    // 添加额外数据
    if (data !== undefined) {
      args.push(data);
    }

    // 添加错误对象（自动转换 unknown 为 Error）
    if (error !== undefined) {
      const errorObj = error instanceof Error
        ? error
        : new Error(String(error));
      args.push(errorObj);
    }

    // 调用对应的控制台方法
    consoleMethod(...args);
  }

  /**
   * 记录调试日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  debug(message: string, data?: unknown, error?: unknown): void {
    this.log("debug", message, data, error);
  }

  /**
   * 记录信息日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  info(message: string, data?: unknown, error?: unknown): void {
    this.log("info", message, data, error);
  }

  /**
   * 记录警告日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  warn(message: string, data?: unknown, error?: unknown): void {
    this.log("warn", message, data, error);
  }

  /**
   * 记录错误日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  error(message: string, data?: unknown, error?: unknown): void {
    this.log("error", message, data, error);
  }

  /**
   * 记录致命错误日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  fatal(message: string, data?: unknown, error?: unknown): void {
    this.log("fatal", message, data, error);
  }

  /**
   * 设置日志级别
   *
   * @param level - 日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 获取日志级别
   *
   * @returns 当前日志级别
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 设置调试模式
   *
   * @param debug - 是否启用调试模式（true 输出日志，false 禁用所有日志）
   */
  setDebug(debug: boolean): void {
    this.config.debug = debug;
  }

  /**
   * 获取调试模式状态
   *
   * @returns 当前调试模式状态
   */
  getDebug(): boolean {
    return this.config.debug;
  }

  /**
   * 设置日志前缀
   *
   * @param prefix - 日志前缀
   */
  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  /**
   * 获取日志前缀
   *
   * @returns 当前日志前缀
   */
  getPrefix(): string {
    return this.config.prefix;
  }

  /**
   * 创建子日志器（继承配置，可添加额外前缀）
   *
   * @param config - 子日志器配置
   * @returns 子日志器实例
   */
  child(config: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      ...config,
      prefix: config.prefix || this.config.prefix,
    });
  }
}

/**
 * 创建日志器
 *
 * @param config - 日志器配置
 * @returns 日志器实例
 */
export function createLogger(
  config: LoggerConfig = {},
): Logger {
  return new Logger(config);
}

/**
 * 默认日志器实例
 */
export const logger: Logger = createLogger();
