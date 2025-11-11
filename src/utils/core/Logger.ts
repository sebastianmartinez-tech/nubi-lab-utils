export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

export interface LogEntry<
    TContext extends Record<string, unknown> = Record<string, unknown>
> {
    level: LogLevel;
    message: string;
    namespace?: string;
    timestamp: Date;
    context?: TContext;
    error?: Error;
}

export type LogTransport = (entry: LogEntry) => void | Promise<void>;

export interface LoggerOptions {
    namespace?: string;
    level?: LogLevel;
    transports?: LogTransport[];
    includeTimestamp?: boolean;
}

// ------------------------------------
// Config & Constants
// ------------------------------------
const LEVEL_PRIORITY: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};

const DEFAULT_LEVEL: LogLevel =
    typeof process !== "undefined" && process?.env?.NODE_ENV === "production"
        ? "info"
        : "debug";

const isBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";

// ------------------------------------
// Transports
// ------------------------------------
export const consoleTransportNode = ({
    includeTimestamp = true,
}: { includeTimestamp?: boolean } = {}): LogTransport => {
    const COLORS: Record<LogLevel, string> = {
        error: "\x1b[31m", // rojo
        warn: "\x1b[33m", // amarillo
        info: "\x1b[32m", // verde
        debug: "\x1b[90m", // gris tenue
        silent: "",
    };
    const RESET = "\x1b[0m";

    return (entry) => {
        const { level, message, namespace, timestamp, context, error } = entry;
        const color = COLORS[level] ?? "";
        const prefixParts: string[] = [];

        if (includeTimestamp) prefixParts.push(timestamp.toISOString());
        prefixParts.push(color + level.toUpperCase() + RESET);
        if (namespace) prefixParts.push(`[${namespace}]`);

        const prefix = prefixParts.join(" ");
        const payload: unknown[] = [`${prefix} ${message}`.trim()];

        if (context && Object.keys(context).length > 0) payload.push(context);
        if (error) payload.push(error);

        const method =
            level === "error"
                ? console.error
                : level === "warn"
                ? console.warn
                : console.log;

        method(...payload);
    };
};

export const consoleTransportBrowser = ({
    includeTimestamp = true,
}: { includeTimestamp?: boolean } = {}): LogTransport => {
    const COLORS: Record<LogLevel, string> = {
        error: "color: red",
        warn: "color: orange",
        info: "color: green",
        debug: "color: gray",
        silent: "",
    };

    return (entry) => {
        const { level, message, namespace, timestamp, context, error } = entry;
        const color = COLORS[level] ?? "";
        const prefixParts: string[] = [];

        if (includeTimestamp) prefixParts.push(timestamp.toISOString());
        prefixParts.push(`${level.toUpperCase()}`);
        if (namespace) prefixParts.push(`[${namespace}]`);

        const prefix = prefixParts.join(" ");
        const payload: unknown[] = [`%c${prefix} ${message}`.trim(), color];

        if (context && Object.keys(context).length > 0) payload.push(context);
        if (error) payload.push(error);

        const method =
            level === "error"
                ? console.error
                : level === "warn"
                ? console.warn
                : console.log;

        method(...payload);
    };
};

// ------------------------------------
// Logger Class
// ------------------------------------
export class Logger<
    TContext extends Record<string, unknown> = Record<string, unknown>
> {
    private readonly namespace?: string;
    private readonly transports: LogTransport[];
    private level: LogLevel;

    constructor({
        namespace,
        level = DEFAULT_LEVEL,
        transports,
        includeTimestamp,
    }: LoggerOptions = {}) {
        this.namespace = namespace;
        this.level = level;

        // Usa el transporte correcto según entorno si no se pasó uno custom
        this.transports =
            transports?.length && transports.length > 0
                ? transports
                : [
                      isBrowser
                          ? consoleTransportBrowser({ includeTimestamp })
                          : consoleTransportNode({ includeTimestamp }),
                  ];
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    child(namespace: string) {
        const childNamespace = this.namespace
            ? `${this.namespace}:${namespace}`
            : namespace;
        return new Logger<TContext>({
            namespace: childNamespace,
            level: this.level,
            transports: this.transports,
        });
    }

    debug(message: string, context?: TContext) {
        this.log("debug", message, context);
    }

    info(message: string, context?: TContext) {
        this.log("info", message, context);
    }

    warn(message: string, context?: TContext) {
        this.log("warn", message, context);
    }

    error(message: string, context?: TContext, error?: Error) {
        this.log("error", message, context, error);
    }

    log(level: LogLevel, message: string, context?: TContext, error?: Error) {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry<TContext> = {
            level,
            message,
            namespace: this.namespace,
            timestamp: new Date(),
            context,
            error,
        };

        for (const transport of this.transports) {
            Promise.resolve(transport(entry)).catch((err) =>
                console.error("[Logger] Transport failure", err)
            );
        }
    }

    private shouldLog(level: LogLevel) {
        if (this.level === "silent") return false;
        return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.level];
    }

    static silent() {
        return new Logger({ level: "silent" });
    }
}

// ------------------------------------
// Factory
// ------------------------------------
export const createLogger = (options?: LoggerOptions) => new Logger(options);
