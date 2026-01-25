/**
 * @module @dreamer/logger
 *
 * @dreamer/logger 日志工具库
 *
 * 提供多级别日志、格式化、轮转等功能，用于应用日志记录、调试和监控。
 *
 * 特性：
 * - 多级别日志（debug, info, warn, error, fatal）
 * - 日志格式化（JSON、文本、彩色）
 * - 智能颜色控制（自动检测 TTY，后台运行时禁用颜色，文件输出无颜色）
 * - 日志输出（控制台、文件、多目标）
 * - 日志管理（轮转、过滤、级别控制）
 * - 高级功能（性能监控、上下文、结构化日志、采样）
 *
 * 环境兼容性：
 * - 服务端：✅ 支持（Deno 和 Bun 运行时）
 * - 客户端：❌ 不支持（浏览器环境）
 *
 * @example
 * ```typescript
 * import { createLogger } from "jsr:@dreamer/logger";
 *
 * const logger = createLogger({
 *   level: "info",
 *   format: "text",
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
 * 日志格式
 */
export type LogFormat = "text" | "json" | "color";

/**
 * 日志轮转策略
 */
export type RotateStrategy = "size" | "time" | "size-time";

/**
 * 日志输出配置
 */
export interface LogOutputConfig {
  /** 控制台输出 */
  console?: boolean;
  /** 文件输出配置 */
  file?: {
    /** 文件路径 */
    path: string;
    /** 是否启用轮转 */
    rotate?: boolean;
    /** 轮转策略 */
    strategy?: RotateStrategy;
    /** 最大文件大小（字节，用于 size 和 size-time 策略） */
    maxSize?: number;
    /** 保留文件数量 */
    maxFiles?: number;
    /** 轮转时间间隔（毫秒，用于 time 和 size-time 策略） */
    rotateInterval?: number;
    /** 是否压缩旧文件 */
    compress?: boolean;
  };
  /** 自定义输出函数 */
  custom?: (message: string) => void | Promise<void>;
}

/**
 * 日志过滤配置
 */
export interface LogFilterConfig {
  /** 允许的标签（如果指定，只有包含这些标签的日志才会输出） */
  includeTags?: string[];
  /** 排除的标签（包含这些标签的日志不会输出） */
  excludeTags?: string[];
  /** 自定义过滤函数 */
  custom?: (entry: LogEntry) => boolean;
}

/**
 * 日志采样配置
 */
export interface LogSamplingConfig {
  /** 采样率（0-1，例如 0.1 表示 10% 的日志会被输出） */
  rate: number;
  /** 采样级别（只有这些级别的日志会被采样） */
  levels?: LogLevel[];
}

/**
 * 日志器配置
 */
export interface LoggerConfig {
  /** 日志级别 */
  level?: LogLevel;
  /** 日志格式 */
  format?: LogFormat;
  /** 输出配置 */
  output?: LogOutputConfig;
  /** 是否启用颜色（默认自动检测） */
  color?: boolean;
  /** 是否显示时间戳（默认 true） */
  showTime?: boolean;
  /** 是否显示日志级别标签（默认 true，设置为 false 时不显示 [info]、[error] 等标签） */
  showLevel?: boolean;
  /** 日志标签（用于过滤） */
  tags?: string[];
  /** 日志上下文（请求ID、用户ID等） */
  context?: Record<string, unknown>;
  /** 日志过滤配置 */
  filter?: LogFilterConfig;
  /** 日志采样配置 */
  sampling?: LogSamplingConfig;
}

/**
 * 日志条目
 */
interface LogEntry {
  /** 时间戳 */
  timestamp: string;
  /** 日志级别 */
  level: LogLevel;
  /** 消息 */
  message: string;
  /** 数据（可选） */
  data?: unknown;
  /** 错误（可选，支持 unknown 类型，会自动转换为 Error） */
  error?: unknown;
  /** 标签 */
  tags?: string[];
  /** 上下文 */
  context?: Record<string, unknown>;
}

import {
  type FileOpenOptions,
  getEnv,
  isTerminal,
  mkdir,
  open,
  rename,
  stat,
} from "@dreamer/runtime-adapter";

/**
 * 检查是否为 TTY
 */
function isTTY(): boolean {
  return isTerminal();
}

/**
 * 检查是否应该使用颜色
 */
function shouldUseColor(
  config: LoggerConfig,
  isFileOutput: boolean = false,
): boolean {
  // 文件输出始终不使用颜色
  if (isFileOutput) {
    return false;
  }

  // 如果明确指定了 color，使用指定值
  if (config.color !== undefined) {
    return config.color;
  }

  // 检查 NO_COLOR 环境变量
  if (getEnv("NO_COLOR")) {
    return false;
  }

  // 自动检测：如果是 TTY 且 format 是 color，使用颜色
  if (config.format === "color" && isTTY()) {
    return true;
  }

  // 默认不使用颜色
  return false;
}

/**
 * ANSI 颜色代码
 */
const ANSI_COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

/**
 * 获取日志级别的颜色
 */
function getLevelColor(level: LogLevel, useColor: boolean): string {
  if (!useColor) {
    return "";
  }

  switch (level) {
    case "debug":
      return ANSI_COLORS.gray;
    case "info":
      return ANSI_COLORS.blue;
    case "warn":
      return ANSI_COLORS.yellow;
    case "error":
      return ANSI_COLORS.red;
    case "fatal":
      return ANSI_COLORS.red + ANSI_COLORS.bold;
    default:
      return "";
  }
}

/**
 * 格式化日志为文本
 *
 * @param entry - 日志条目
 * @param useColor - 是否使用颜色
 * @param showTime - 是否包含时间戳
 * @param showLevel - 是否显示日志级别标签
 * @returns 格式化后的日志字符串
 */
function formatText(
  entry: LogEntry,
  useColor: boolean = false,
  showTime: boolean = true,
  showLevel: boolean = true,
): string {
  const { timestamp, level, message, data, error, tags, context } = entry;

  const levelColor = getLevelColor(level, useColor);
  const reset = useColor ? ANSI_COLORS.reset : "";

  // 构建级别标签部分
  const levelLabel = showLevel
    ? `[${levelColor}${level.toUpperCase()}${reset}] `
    : "";

  // 根据 showTime 和 showLevel 参数决定输出格式
  let output = showTime
    ? `${timestamp} ${levelLabel}${message}`
    : `${levelLabel}${message}`;

  if (tags && tags.length > 0) {
    output += ` [${tags.join(", ")}]`;
  }

  if (context && Object.keys(context).length > 0) {
    output += ` ${JSON.stringify(context)}`;
  }

  if (data !== undefined) {
    output += ` ${JSON.stringify(data)}`;
  }

  if (error !== undefined) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    output += `\n${errorObj.stack || errorObj.message}`;
  }

  return output;
}

/**
 * 格式化日志为 JSON
 */
function formatJSON(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * 格式化日志
 *
 * @param entry - 日志条目
 * @param format - 日志格式
 * @param useColor - 是否使用颜色
 * @param showTime - 是否包含时间戳
 * @param showLevel - 是否显示日志级别标签
 * @returns 格式化后的日志字符串
 */
function formatLog(
  entry: LogEntry,
  format: LogFormat,
  useColor: boolean,
  showTime: boolean = true,
  showLevel: boolean = true,
): string {
  switch (format) {
    case "json":
      return formatJSON(entry);
    case "color":
    case "text":
      return formatText(entry, useColor, showTime, showLevel);
    default:
      return formatText(entry, false, showTime, showLevel);
  }
}

/**
 * 性能监控数据
 */
interface PerformanceData {
  /** 操作名称 */
  operation: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 持续时间（毫秒） */
  duration?: number;
  /** 额外数据 */
  data?: Record<string, unknown>;
}

/**
 * 日志器类
 */
/**
 * 文件句柄接口（兼容 Deno 和 Bun）
 */
interface FileHandle {
  writable: WritableStream<Uint8Array>;
  close(): void;
}

export class Logger {
  private config: Required<Omit<LoggerConfig, "filter" | "sampling">> & {
    filter?: LogFilterConfig;
    sampling?: LogSamplingConfig;
  };
  private fileHandle?: FileHandle;
  private fileWriter?: WritableStreamDefaultWriter<Uint8Array>;
  private filePath?: string;
  private lastRotateTime?: number;
  private performanceData: Map<string, PerformanceData> = new Map();
  private logCount: number = 0;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || "info",
      format: config.format || "text",
      output: config.output || { console: true },
      color: config.color ?? (config.format === "color" && isTTY()),
      showTime: config.showTime ?? true,
      showLevel: config.showLevel ?? true,
      tags: config.tags || [],
      context: config.context || {},
      filter: config.filter,
      sampling: config.sampling,
    };

    // 初始化文件输出
    if (this.config.output.file) {
      this.initFileOutput();
      // 初始化按时间轮转
      if (
        this.config.output.file.rotate &&
        this.config.output.file.strategy?.includes("time")
      ) {
        this.startTimeRotation();
      }
    }
  }

  /**
   * 初始化文件输出
   */
  private async initFileOutput(): Promise<void> {
    if (!this.config.output.file) {
      return;
    }

    const { path } = this.config.output.file;

    try {
      // 确保目录存在
      const dir = path.substring(0, path.lastIndexOf("/"));
      if (dir) {
        await mkdir(dir, { recursive: true });
      }

      // 打开文件（追加模式）
      // 注意：在 Deno 中，append 模式会自动启用 write，所以不需要同时指定 write: true
      const options: FileOpenOptions = {
        create: true,
        append: true,
      };
      const handle = await open(path, options);
      this.fileHandle = {
        writable: handle.writable,
        close: () => {
          handle.close();
        },
      };
      this.fileWriter = handle.writable.getWriter();
      this.filePath = path;
    } catch (error) {
      console.error(`无法打开日志文件 ${path}:`, error);
    }
  }

  /**
   * 启动按时间轮转
   */
  private startTimeRotation(): void {
    const interval = this.config.output.file?.rotateInterval ||
      24 * 60 * 60 * 1000; // 默认 24 小时

    setInterval(async () => {
      if (
        this.config.output.file?.rotate &&
        this.config.output.file.strategy?.includes("time")
      ) {
        await this.rotateLog(
          this.config.output.file.maxFiles || 5,
          this.config.output.file.compress || false,
        );
      }
    }, interval);
  }

  /**
   * 检查日志级别是否应该输出
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * 检查标签过滤
   */
  private shouldFilterByTags(entry: LogEntry): boolean {
    if (!this.config.filter) {
      return true;
    }

    const { includeTags, excludeTags } = this.config.filter;

    // 检查排除标签
    if (excludeTags && excludeTags.length > 0) {
      const hasExcludedTag = entry.tags?.some((tag) =>
        excludeTags.includes(tag)
      );
      if (hasExcludedTag) {
        return false;
      }
    }

    // 检查包含标签
    if (includeTags && includeTags.length > 0) {
      const hasIncludedTag = entry.tags?.some((tag) =>
        includeTags.includes(tag)
      );
      if (!hasIncludedTag) {
        return false;
      }
    }

    // 自定义过滤函数
    if (this.config.filter.custom) {
      return this.config.filter.custom(entry);
    }

    return true;
  }

  /**
   * 检查采样
   */
  private shouldSample(level: LogLevel): boolean {
    if (!this.config.sampling) {
      return true;
    }

    const { rate, levels } = this.config.sampling;

    // 如果指定了级别，检查当前日志级别是否在采样级别列表中
    if (levels && levels.length > 0) {
      if (!levels.includes(level)) {
        return true; // 不在采样级别列表中，正常输出
      }
    }

    // 采样率判断
    this.logCount++;
    return Math.random() < rate;
  }

  /**
   * 写入日志
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // 合并上下文
    const finalEntry: LogEntry = {
      ...entry,
      tags: [...(this.config.tags || []), ...(entry.tags || [])],
      context: { ...this.config.context, ...entry.context },
    };

    // 标签过滤
    if (!this.shouldFilterByTags(finalEntry)) {
      return;
    }

    // 采样检查
    if (!this.shouldSample(finalEntry.level)) {
      return;
    }

    // 控制台输出
    if (this.config.output.console) {
      const useColor = shouldUseColor(this.config, false);
      const message = formatLog(
        finalEntry,
        this.config.format,
        useColor,
        this.config.showTime,
        this.config.showLevel,
      );
      console.log(message);
    }

    // 文件输出（始终不使用颜色）
    if (this.config.output.file && this.fileWriter) {
      const message = formatLog(
        finalEntry,
        "text",
        false,
        this.config.showTime,
        this.config.showLevel,
      ); // 文件输出始终使用文本格式，无颜色
      const encoder = new TextEncoder();
      const data = encoder.encode(message + "\n");
      await this.fileWriter.write(data);

      // 检查是否需要轮转
      if (this.config.output.file.rotate) {
        const strategy = this.config.output.file.strategy || "size";
        if (strategy === "size" || strategy === "size-time") {
          await this.checkSizeRotation();
        }
        // time 策略通过定时器处理
      }
    }

    // 自定义输出
    if (this.config.output.custom) {
      const useColor = shouldUseColor(this.config, false);
      const message = formatLog(
        finalEntry,
        this.config.format,
        useColor,
        this.config.showTime,
        this.config.showLevel,
      );
      await this.config.output.custom(message);
    }
  }

  /**
   * 检查并执行按大小轮转
   */
  private async checkSizeRotation(): Promise<void> {
    if (!this.config.output.file || !this.filePath) {
      return;
    }

    const { maxSize = 10 * 1024 * 1024, maxFiles = 5, compress = false } =
      this.config.output.file;

    try {
      const fileStat = await stat(this.filePath);
      if (fileStat.size >= maxSize) {
        await this.rotateLog(maxFiles, compress);
      }
    } catch (error) {
      // 文件不存在或无法访问，忽略
      console.error("检查日志轮转失败:", error);
    }
  }

  /**
   * 执行日志轮转
   */
  private async rotateLog(maxFiles: number, compress: boolean): Promise<void> {
    if (!this.filePath) {
      return;
    }

    try {
      // 关闭当前文件
      if (this.fileWriter) {
        try {
          await this.fileWriter.close();
        } catch {
          // 忽略关闭错误
        }
        this.fileWriter = undefined;
      }
      if (this.fileHandle) {
        try {
          this.fileHandle.close();
        } catch {
          // 忽略关闭错误（writer 关闭时可能已经关闭了底层文件）
        }
        this.fileHandle = undefined;
      }

      // 轮转旧文件
      for (let i = maxFiles - 1; i >= 1; i--) {
        const oldPath = `${this.filePath}.${i}`;
        const newPath = `${this.filePath}.${i + 1}`;

        try {
          await rename(oldPath, newPath);
        } catch {
          // 文件不存在，忽略
        }
      }

      // 移动当前文件
      const rotatedPath = `${this.filePath}.1`;
      await rename(this.filePath, rotatedPath);

      // 压缩旧文件（如果需要）
      if (compress) {
        // 注意：Deno 标准库不包含压缩功能，这里只是示例
        // 实际使用时需要依赖外部工具或库
        console.warn("日志压缩功能需要外部工具支持");
      }

      // 重新打开文件
      await this.initFileOutput();
    } catch (error) {
      console.error("日志轮转失败:", error);
      // 尝试重新打开文件
      await this.initFileOutput();
    }
  }

  /**
   * 记录调试日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  debug(message: string, data?: unknown, error?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      data,
      error,
    }).catch(console.error);
  }

  /**
   * 记录信息日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  info(message: string, data?: unknown, error?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      data,
      error,
    }).catch(console.error);
  }

  /**
   * 记录警告日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  warn(message: string, data?: unknown, error?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      data,
      error,
    }).catch(console.error);
  }

  /**
   * 记录错误日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  error(message: string, data?: unknown, error?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      data,
      error,
    }).catch(console.error);
  }

  /**
   * 记录致命错误日志
   *
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   * @param error - 错误对象（可选，支持 unknown 类型，会自动转换为 Error）
   */
  fatal(message: string, data?: unknown, error?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "fatal",
      message,
      data,
      error,
    }).catch(console.error);
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 获取日志级别
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 设置上下文
   */
  setContext(context: Record<string, unknown>): void {
    this.config.context = { ...this.config.context, ...context };
  }

  /**
   * 获取上下文
   */
  getContext(): Record<string, unknown> {
    return { ...this.config.context };
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    if (!this.config.tags.includes(tag)) {
      this.config.tags.push(tag);
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    const index = this.config.tags.indexOf(tag);
    if (index > -1) {
      this.config.tags.splice(index, 1);
    }
  }

  /**
   * 创建子日志器（继承配置，可添加额外上下文或标签）
   */
  child(config: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      ...config,
      tags: [...this.config.tags, ...(config.tags || [])],
      context: { ...this.config.context, ...config.context },
    });
  }

  /**
   * 开始性能监控
   *
   * @param operation 操作名称
   * @param data 额外数据
   * @returns 操作ID（用于结束监控）
   */
  startPerformance(operation: string, data?: Record<string, unknown>): string {
    const id = `${operation}-${Date.now()}-${Math.random()}`;
    this.performanceData.set(id, {
      operation,
      startTime: Date.now(),
      data,
    });
    return id;
  }

  /**
   * 结束性能监控并记录日志
   *
   * @param id 操作ID
   * @param level 日志级别（默认 info）
   */
  endPerformance(id: string, level: LogLevel = "info"): void {
    const perfData = this.performanceData.get(id);
    if (!perfData) {
      this.warn(`性能监控 ID 不存在: ${id}`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - perfData.startTime;

    perfData.endTime = endTime;
    perfData.duration = duration;

    // 记录性能日志
    const message = `性能监控: ${perfData.operation} 耗时 ${duration}ms`;
    const data = {
      ...perfData.data,
      duration,
      startTime: perfData.startTime,
      endTime,
    };

    switch (level) {
      case "debug":
        this.debug(message, data);
        break;
      case "info":
        this.info(message, data);
        break;
      case "warn":
        this.warn(message, data);
        break;
      case "error":
        this.error(message, data);
        break;
      case "fatal":
        this.fatal(message, data);
        break;
    }

    // 清理数据
    this.performanceData.delete(id);
  }

  /**
   * 性能监控装饰器（用于函数）
   *
   * @param operation 操作名称
   * @param level 日志级别
   * @returns 装饰器函数
   */
  performance<T extends (...args: unknown[]) => unknown>(
    operation: string,
    level: LogLevel = "info",
  ): (fn: T) => T {
    return (fn: T) => {
      return ((...args: unknown[]) => {
        const id = this.startPerformance(operation);
        try {
          const result = fn(...args);
          // 如果是 Promise，等待完成
          if (result instanceof Promise) {
            return result.finally(() => {
              this.endPerformance(id, level);
            });
          }
          this.endPerformance(id, level);
          return result;
        } catch (error) {
          this.endPerformance(id, "error");
          throw error;
        }
      }) as T;
    };
  }

  /**
   * 设置过滤配置
   */
  setFilter(filter: LogFilterConfig): void {
    this.config.filter = filter;
  }

  /**
   * 获取过滤配置
   */
  getFilter(): LogFilterConfig | undefined {
    return this.config.filter;
  }

  /**
   * 设置采样配置
   */
  setSampling(sampling: LogSamplingConfig): void {
    this.config.sampling = sampling;
  }

  /**
   * 获取采样配置
   */
  getSampling(): LogSamplingConfig | undefined {
    return this.config.sampling;
  }

  /**
   * 关闭日志器（关闭文件句柄等）
   */
  async close(): Promise<void> {
    // 先关闭 writer（这会关闭底层流），然后关闭文件句柄
    if (this.fileWriter) {
      try {
        await this.fileWriter.close();
      } catch {
        // 忽略关闭错误（可能已经关闭）
      }
      this.fileWriter = undefined;
    }
    // 注意：在 Deno 中，writer.close() 会关闭底层文件，所以 handle.close() 可能会失败
    // 但在某些情况下，我们需要显式关闭 handle
    if (this.fileHandle) {
      try {
        this.fileHandle.close();
      } catch {
        // 忽略关闭错误（writer 关闭时可能已经关闭了底层文件）
      }
      this.fileHandle = undefined;
    }
  }
}

/**
 * 创建日志器
 *
 * @param config 日志器配置
 * @returns 日志器实例
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  return new Logger(config);
}

/**
 * 默认日志器实例
 */
export const logger: Logger = createLogger();
