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
 * - console 重定向：redirectConsoleToLogger() 将全局 console 统一由 logger 管理，restoreConsole() 恢复
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

/** 性能监控 Map 最大条目数，超出时淘汰最旧条目，防止内存无限增长 */
const MAX_PERFORMANCE_ENTRIES = 1000;

/** 默认日志消息最大长度（字节），防止过大消息导致 DoS；0 表示不限制 */
const DEFAULT_MAX_MESSAGE_LENGTH = 32 * 1024;

/** 模块级 TextEncoder 实例，供文件写入复用，避免每次 new 的开销 */
const sharedTextEncoder = new TextEncoder();

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
 *
 * 输出方式说明：
 * - 手动：显式设置 console / file，按配置输出
 * - 自动（output.auto = true）：根据运行环境自动选择
 *   - 前台（有 TTY，如直接执行、交互终端）→ 仅控制台
 *   - 后台（无 TTY，如 nohup、systemd、daemon）→ 仅文件，路径用 file.path 或默认 ./logs/app.log
 */
export interface LogOutputConfig {
  /**
   * 是否根据运行环境自动选择输出目标
   * - true：有 TTY 时只打控制台，无 TTY 时只写文件（路径用下面的 file，未配置时用 ./logs/app.log）
   * - 未设置或 false：按 console / file 配置，不自动切换
   */
  auto?: boolean;
  /** 控制台输出（手动模式有效；auto 模式下由 isTTY 决定） */
  console?: boolean;
  /** 文件输出配置（手动模式直接使用；auto 且无 TTY 时使用，未配置时默认 path: "./logs/app.log"） */
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
  /**
   * 单条日志消息最大长度（字符数），超出时截断并追加省略标记，防止 DoS。
   * 0 表示不限制。默认 32KB。
   */
  maxMessageLength?: number;
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
 * 原始 console 引用（用于 console 重定向到 logger 时，Logger 自身输出仍使用真实控制台，避免递归）
 */
let _originalConsole:
  | Pick<
    Console,
    "log" | "info" | "warn" | "error" | "debug"
  >
  | null = null;

/**
 * 获取用于输出的 console（重定向时使用原始 console，避免 Logger 输出再次进入 logger 造成递归）
 *
 * @returns 当前应使用的 console 对象
 */
function getConsoleForOutput(): Pick<
  Console,
  "log" | "info" | "warn" | "error" | "debug"
> {
  return _originalConsole ??
    (globalThis as unknown as { console: Console }).console;
}

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
 * 安全序列化为 JSON 字符串，遇循环引用或不可序列化值时返回占位符，避免抛错
 *
 * @param value - 待序列化值
 * @returns JSON 字符串或 "[Unserializable]"
 */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[Unserializable]";
  }
}

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
    output += ` ${safeStringify(context)}`;
  }

  if (data !== undefined) {
    output += ` ${safeStringify(data)}`;
  }

  if (error !== undefined) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    output += `\n${errorObj.stack || errorObj.message}`;
  }

  return output;
}

/**
 * 格式化日志为 JSON（使用安全序列化，避免循环引用抛错）
 */
function formatJSON(entry: LogEntry): string {
  return safeStringify(entry);
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

/** 默认自动模式下的后台日志路径（无 TTY 时使用） */
const DEFAULT_AUTO_FILE_PATH = "./logs/app.log";

/**
 * 根据 output.auto 与是否 TTY 解析最终输出配置
 * - auto 且 有 TTY（前台）→ 仅控制台
 * - auto 且 无 TTY（后台）→ 仅文件，路径用 file.path 或默认 ./logs/app.log
 * - 未开 auto → 原样使用 console / file 配置
 *
 * @param output - 用户传入的 output 配置
 * @returns 解析后的输出配置（Logger 内部使用）
 */
function resolveOutputConfig(output: LogOutputConfig): LogOutputConfig {
  if (output.auto !== true) {
    return {
      ...output,
      console: output.console ?? true,
    };
  }

  const tty = isTTY();
  if (tty) {
    return {
      auto: true,
      console: true,
      file: undefined,
      custom: output.custom,
    };
  }

  const fileConfig = output.file ?? { path: DEFAULT_AUTO_FILE_PATH };
  return {
    auto: true,
    console: false,
    file: fileConfig,
    custom: output.custom,
  };
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
    maxMessageLength?: number;
  };
  private fileHandle?: FileHandle;
  private fileWriter?: WritableStreamDefaultWriter<Uint8Array>;
  private filePath?: string;
  private lastRotateTime?: number;
  private performanceData: Map<string, PerformanceData> = new Map();
  private logCount: number = 0;
  /** 按时间轮转的定时器 ID，close 时需清除以防内存泄漏 */
  private timeRotationTimerId?: ReturnType<typeof setInterval>;
  /** includeTags 的 Set 形式，用于 O(1) 查找 */
  private includeTagsSet?: Set<string>;
  /** excludeTags 的 Set 形式，用于 O(1) 查找 */
  private excludeTagsSet?: Set<string>;

  constructor(config: LoggerConfig = {}) {
    const rawOutput = config.output || { console: true };
    const resolvedOutput = resolveOutputConfig(rawOutput);

    this.config = {
      level: config.level || "info",
      format: config.format || "text",
      output: resolvedOutput,
      color: config.color ?? (config.format === "color" && isTTY()),
      showTime: config.showTime ?? true,
      showLevel: config.showLevel ?? true,
      tags: config.tags || [],
      context: config.context || {},
      filter: config.filter,
      sampling: config.sampling,
      maxMessageLength: config.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH,
    };

    this.updateFilterSets();

    // 初始化文件输出（仅在配置了 file 时）
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
   * 校验并规范化日志文件路径，防止路径遍历（如 ../）导致写入到预期外目录
   *
   * @param path - 用户配置的路径
   * @returns 是否允许使用该路径
   */
  private isAllowedLogPath(path: string): boolean {
    // 拒绝包含路径遍历的配置
    if (path.includes("..")) {
      return false;
    }
    return true;
  }

  /**
   * 初始化文件输出
   */
  private async initFileOutput(): Promise<void> {
    if (!this.config.output.file) {
      return;
    }

    const { path } = this.config.output.file;

    if (!this.isAllowedLogPath(path)) {
      getConsoleForOutput().error(
        `拒绝使用日志路径（含路径遍历）: ${path}`,
      );
      return;
    }

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
      getConsoleForOutput().error(`无法打开日志文件 ${path}:`, error);
    }
  }

  /**
   * 启动按时间轮转（定时器 ID 会在 close 时清除，避免泄漏）
   */
  private startTimeRotation(): void {
    const interval = this.config.output.file?.rotateInterval ||
      24 * 60 * 60 * 1000; // 默认 24 小时

    this.timeRotationTimerId = setInterval(async () => {
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
   * 根据当前 filter 配置更新 includeTagsSet / excludeTagsSet，供 O(1) 查找
   */
  private updateFilterSets(): void {
    const f = this.config.filter;
    this.includeTagsSet = f?.includeTags?.length
      ? new Set(f.includeTags)
      : undefined;
    this.excludeTagsSet = f?.excludeTags?.length
      ? new Set(f.excludeTags)
      : undefined;
  }

  /**
   * 检查标签过滤（使用 Set 做 O(1) 查找）
   */
  private shouldFilterByTags(entry: LogEntry): boolean {
    if (!this.config.filter) {
      return true;
    }

    // 检查排除标签
    if (this.excludeTagsSet && this.excludeTagsSet.size > 0) {
      const hasExcludedTag = entry.tags?.some((tag) =>
        this.excludeTagsSet!.has(tag)
      );
      if (hasExcludedTag) {
        return false;
      }
    }

    // 检查包含标签
    if (this.includeTagsSet && this.includeTagsSet.size > 0) {
      const hasIncludedTag = entry.tags?.some((tag) =>
        this.includeTagsSet!.has(tag)
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
   * 按配置截断消息长度，防止过大消息导致 DoS；0 表示不限制
   */
  private truncateMessageIfNeeded(entry: LogEntry): LogEntry {
    const max = this.config.maxMessageLength ?? 0;
    if (max <= 0 || entry.message.length <= max) {
      return entry;
    }
    return { ...entry, message: entry.message.slice(0, max) + "…" };
  }

  /**
   * 写入日志（级别/过滤/采样先检查再构建 finalEntry；各输出目标异常隔离；复用 TextEncoder）
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // 合并上下文与标签，仅构建一次，供过滤与输出共用
    const merged: LogEntry = {
      ...entry,
      tags: [...(this.config.tags || []), ...(entry.tags || [])],
      context: { ...this.config.context, ...entry.context },
    };

    if (!this.shouldFilterByTags(merged)) {
      return;
    }
    if (!this.shouldSample(merged.level)) {
      return;
    }

    const finalEntry = this.truncateMessageIfNeeded(merged);

    // 控制台输出（使用 getConsoleForOutput 避免重定向后递归；单目标失败不影响其他）
    if (this.config.output.console) {
      try {
        const useColor = shouldUseColor(this.config, false);
        const message = formatLog(
          finalEntry,
          this.config.format,
          useColor,
          this.config.showTime,
          this.config.showLevel,
        );
        getConsoleForOutput().log(message);
      } catch (err) {
        getConsoleForOutput().error("logger console output error", err);
      }
    }

    // 文件输出（始终不使用颜色；复用模块级 TextEncoder；单目标失败不影响其他）
    if (this.config.output.file && this.fileWriter) {
      try {
        const message = formatLog(
          finalEntry,
          "text",
          false,
          this.config.showTime,
          this.config.showLevel,
        );
        const data = sharedTextEncoder.encode(message + "\n");
        await this.fileWriter.write(data);

        if (this.config.output.file.rotate) {
          const strategy = this.config.output.file.strategy || "size";
          if (strategy === "size" || strategy === "size-time") {
            await this.checkSizeRotation();
          }
        }
      } catch (err) {
        getConsoleForOutput().error("logger file output error", err);
      }
    }

    // 自定义输出（单目标失败不影响其他）
    if (this.config.output.custom) {
      try {
        const useColor = shouldUseColor(this.config, false);
        const message = formatLog(
          finalEntry,
          this.config.format,
          useColor,
          this.config.showTime,
          this.config.showLevel,
        );
        await this.config.output.custom(message);
      } catch (err) {
        getConsoleForOutput().error("logger custom output error", err);
      }
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
      getConsoleForOutput().error("检查日志轮转失败:", error);
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
        getConsoleForOutput().warn("日志压缩功能需要外部工具支持");
      }

      // 重新打开文件
      await this.initFileOutput();
    } catch (error) {
      getConsoleForOutput().error("日志轮转失败:", error);
      // 尝试重新打开文件
      await this.initFileOutput();
    }
  }

  /**
   * 内部统一写日志入口（供 debug/info/warn/error/fatal 复用，减少重复代码）
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
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
    }).catch((err: unknown) =>
      getConsoleForOutput().error("writeLog error", err)
    );
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
   * 创建子日志器（继承配置，可添加额外上下文或标签；含 maxMessageLength）
   */
  child(config: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      ...config,
      tags: [...this.config.tags, ...(config.tags || [])],
      context: { ...this.config.context, ...config.context },
      maxMessageLength: config.maxMessageLength ?? this.config.maxMessageLength,
    });
  }

  /**
   * 开始性能监控（超出 MAX_PERFORMANCE_ENTRIES 时淘汰最旧条目，防止内存无限增长）
   *
   * @param operation 操作名称
   * @param data 额外数据
   * @returns 操作ID（用于结束监控）
   */
  startPerformance(operation: string, data?: Record<string, unknown>): string {
    if (this.performanceData.size >= MAX_PERFORMANCE_ENTRIES) {
      const firstKey = this.performanceData.keys().next().value;
      if (firstKey !== undefined) {
        this.performanceData.delete(firstKey);
      }
    }
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
   * 设置过滤配置（会更新 includeTagsSet / excludeTagsSet）
   */
  setFilter(filter: LogFilterConfig): void {
    this.config.filter = filter;
    this.updateFilterSets();
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
   * 关闭日志器（关闭文件句柄、清除时间轮转定时器，避免泄漏）
   */
  async close(): Promise<void> {
    if (this.timeRotationTimerId !== undefined) {
      clearInterval(this.timeRotationTimerId);
      this.timeRotationTimerId = undefined;
    }
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

/**
 * 将多个参数格式化为日志消息和数据
 * console 方法可能接收多个参数，第一个作为消息，其余作为数据
 *
 * @param args - console 方法的参数列表
 * @returns [message, data] 消息和可选数据
 */
function formatConsoleArgs(args: unknown[]): [string, unknown | undefined] {
  if (args.length === 0) {
    return ["", undefined];
  }
  const first = args[0];
  const message = typeof first === "string" ? first : String(first);
  if (args.length === 1) {
    return [message, undefined];
  }
  if (args.length === 2) {
    return [message, args[1]];
  }
  return [message, args.slice(1)];
}

/**
 * 将全局 console 重定向到指定 logger，统一由 logger 管理输出
 * - console.log -> logger.info
 * - console.info -> logger.info
 * - console.warn -> logger.warn
 * - console.error -> logger.error
 * - console.debug -> logger.debug
 * Logger 自身的控制台输出会使用原始 console，避免递归。
 *
 * @param targetLogger - 目标 logger 实例，未传则使用默认 logger
 * @returns 恢复函数，调用可恢复原始 console
 */
export function redirectConsoleToLogger(targetLogger?: Logger): () => void {
  const log = targetLogger ?? logger;
  const g = globalThis as unknown as { console: Console };

  // 保存原始 console，供 Logger 内部输出使用（避免递归）
  _originalConsole = {
    log: g.console.log.bind(g.console),
    info: g.console.info.bind(g.console),
    warn: g.console.warn.bind(g.console),
    error: g.console.error.bind(g.console),
    debug: g.console.debug.bind(g.console),
  };

  g.console.log = (...args: unknown[]) => {
    const [message, data] = formatConsoleArgs(args);
    log.info(message, data);
  };
  g.console.info = (...args: unknown[]) => {
    const [message, data] = formatConsoleArgs(args);
    log.info(message, data);
  };
  g.console.warn = (...args: unknown[]) => {
    const [message, data] = formatConsoleArgs(args);
    log.warn(message, data);
  };
  g.console.error = (...args: unknown[]) => {
    const [message, data] = formatConsoleArgs(args);
    log.error(message, data);
  };
  g.console.debug = (...args: unknown[]) => {
    const [message, data] = formatConsoleArgs(args);
    log.debug(message, data);
  };

  return restoreConsole;
}

/**
 * 恢复全局 console 为重定向前的原始实现
 * 仅在已调用 redirectConsoleToLogger 后有效
 */
export function restoreConsole(): void {
  const g = globalThis as unknown as { console: Console };
  if (_originalConsole) {
    g.console.log = _originalConsole.log;
    g.console.info = _originalConsole.info;
    g.console.warn = _originalConsole.warn;
    g.console.error = _originalConsole.error;
    g.console.debug = _originalConsole.debug;
    _originalConsole = null;
  }
}
