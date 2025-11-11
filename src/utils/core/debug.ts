import { Logger } from "./Logger.js";

/**
 * Obtiene el timestamp actual con la mejor precisión disponible (browser o Node).
 */
const now = (): number =>
    typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();

/**
 * Opciones configurables para medir tiempos de ejecución.
 */
export interface StopwatchOptions {
    label?: string;
    logger?: Logger;
    precision?: number; // cantidad de decimales en los logs (default: 2)
    autoLog?: boolean; // si loguea automáticamente al detener
    namespace?: string; // si se quiere usar un logger hijo
}

/**
 * Representa un cronómetro utilitario.
 */
export interface Stopwatch {
    stop: () => number;
    elapsed: () => number;
    log: (context?: Record<string, unknown>) => number;
}

/**
 * Crea un cronómetro para medir duración de operaciones.
 */
export const createStopwatch = ({
    label = "stopwatch",
    logger,
    precision = 2,
    autoLog = false,
    namespace,
}: StopwatchOptions = {}): Stopwatch => {
    const start = now();
    const logInstance = namespace && logger ? logger.child(namespace) : logger;

    const elapsed = () => now() - start;

    const stop = () => {
        const duration = elapsed();
        if (autoLog && logInstance) {
            logInstance.debug(
                `${label} took ${duration.toFixed(precision)}ms`,
                {
                    duration,
                }
            );
        }
        return duration;
    };

    const log = (context?: Record<string, unknown>) => {
        const duration = stop();
        logInstance?.debug(`${label} took ${duration.toFixed(precision)}ms`, {
            ...context,
            duration,
        });
        return duration;
    };

    return { stop, elapsed, log };
};

/**
 * Ejecuta una función (sync o async) midiendo su tiempo total.
 */
export const withTiming = async <T>(
    label: string,
    fn: () => Promise<T> | T,
    options: StopwatchOptions = {}
): Promise<T> => {
    const stopwatch = createStopwatch({ ...options, label });
    try {
        return await fn();
    } finally {
        stopwatch.log();
    }
};

/**
 * Versión síncrona de withTiming para funciones normales.
 */
export const measureSync = <T>(
    label: string,
    fn: () => T,
    options: StopwatchOptions = {}
): T => {
    const stopwatch = createStopwatch({ ...options, label });
    try {
        return fn();
    } finally {
        stopwatch.log();
    }
};

/**
 * Versión asíncrona de withTiming con resultado enriquecido.
 */
export const measureAsync = async <T>(
    label: string,
    fn: () => Promise<T> | T,
    options: StopwatchOptions = {}
): Promise<{ result: T; durationMs: number }> => {
    const stopwatch = createStopwatch({ ...options, label });
    const result = await fn();
    const durationMs = stopwatch.stop();

    if (options.logger) {
        const logInstance =
            options.namespace && options.logger
                ? options.logger.child(options.namespace)
                : options.logger;

        logInstance.debug(`${label} completed in ${durationMs.toFixed(2)}ms`, {
            durationMs,
        });
    }

    return { result, durationMs };
};

/**
 * Captura una función sin logger, útil para medir internamente y devolver datos crudos.
 */
export const captureDebug = async <T>(
    fn: () => Promise<T> | T
): Promise<{ result: T; durationMs: number }> => {
    const start = now();
    const result = await fn();
    const durationMs = now() - start;
    return { result, durationMs };
};
