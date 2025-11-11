type DateInput = Date | string | number | null | undefined;

export type DiffUnit =
    | "milliseconds"
    | "seconds"
    | "minutes"
    | "hours"
    | "days";

export type RoundingMode = "floor" | "ceil" | "round" | "trunc";

export interface DiffOptions {
    unit?: DiffUnit;
    absolute?: boolean;
    rounding?: RoundingMode;
}

export interface AddDurationOptions {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}

const MS_PER_UNIT: Record<DiffUnit, number> = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
};

const ROUNDING_FUNCTIONS: Record<RoundingMode, (value: number) => number> = {
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    trunc: Math.trunc,
};

const toDate = (value: DateInput): Date | null => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime()))
        return new Date(value.getTime());
    if (typeof value === "number" && Number.isFinite(value))
        return new Date(value);
    if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

const requireDate = (value: DateInput): Date => {
    const date = toDate(value);
    if (!date) throw new TypeError("Invalid date input");
    return date;
};

const pad = (value: number) => value.toString().padStart(2, "0");

const calculateDurationMs = ({
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
}: AddDurationOptions = {}) =>
    days * MS_PER_UNIT.days +
    hours * MS_PER_UNIT.hours +
    minutes * MS_PER_UNIT.minutes +
    seconds * MS_PER_UNIT.seconds +
    milliseconds;

export const DateUtils = {
    parse(value: DateInput) {
        return toDate(value);
    },

    isValid(value: DateInput) {
        return Boolean(toDate(value));
    },

    toISODate(value: DateInput) {
        const date = requireDate(value);
        return `${date.getFullYear()}-${pad(
            date.getMonth() + 1
        )}-${pad(date.getDate())}`;
    },

    startOfDay(value: DateInput) {
        const date = requireDate(value);
        date.setHours(0, 0, 0, 0);
        return date;
    },

    endOfDay(value: DateInput) {
        const date = requireDate(value);
        date.setHours(23, 59, 59, 999);
        return date;
    },

    add(value: DateInput, duration: AddDurationOptions = {}) {
        const date = requireDate(value);
        const result = new Date(date.getTime());
        result.setTime(result.getTime() + calculateDurationMs(duration));
        return result;
    },

    diff(a: DateInput, b: DateInput, options: DiffOptions = {}) {
        const start = requireDate(a);
        const end = requireDate(b);
        const { unit = "milliseconds", absolute = false, rounding = "floor" } =
            options;
        const diffMs = end.getTime() - start.getTime();
        const value = diffMs / MS_PER_UNIT[unit];
        const rounded = ROUNDING_FUNCTIONS[rounding](value);
        return absolute ? Math.abs(rounded) : rounded;
    },

    diffInDays(
        a: DateInput,
        b: DateInput,
        options: Omit<DiffOptions, "unit"> = {}
    ) {
        const { rounding = "ceil", ...rest } = options;
        return DateUtils.diff(a, b, {
            ...rest,
            rounding,
            unit: "days",
        });
    },

    isSameDay(a: DateInput, b: DateInput) {
        const first = requireDate(a);
        const second = requireDate(b);
        return (
            first.getFullYear() === second.getFullYear() &&
            first.getMonth() === second.getMonth() &&
            first.getDate() === second.getDate()
        );
    },

    isBefore(a: DateInput, b: DateInput) {
        return requireDate(a).getTime() < requireDate(b).getTime();
    },

    isAfter(a: DateInput, b: DateInput) {
        return requireDate(a).getTime() > requireDate(b).getTime();
    },

    format(date: Date, locale = "es-AR"): string {
        return date.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    },
};
