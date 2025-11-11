const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/gi;
const PLACEHOLDER_REGEX = /\{\{\s*([\w.[\]-]+)\s*\}\}/g;

type InterpolableValue = string | number | boolean | null | undefined;

export interface SlugifyOptions {
    separator?: string;
    lowercase?: boolean;
}

export interface TruncateOptions {
    ellipsis?: string;
    respectWordBoundaries?: boolean;
}

export interface MaskOptions {
    maskChar?: string;
    visibleStart?: number;
    visibleEnd?: number;
}

export interface InterpolateOptions {
    strict?: boolean;
    fallback?: string;
    transform?: (value: unknown, key: string) => string;
}

export interface InitialsOptions {
    limit?: number;
    uppercase?: boolean;
}

export interface QueryStringOptions {
    arrayFormat?: "repeat" | "bracket" | "comma";
    skipNull?: boolean;
    skipEmptyString?: boolean;
    encode?: boolean;
    sortKeys?: boolean;
}

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const safeString = (value: InterpolableValue) =>
    value === null || value === undefined ? "" : String(value);

const removeDiacritics = (value: string) =>
    value.normalize("NFD").replace(DIACRITICS_REGEX, "");

const isPlainObject = (
    value: unknown
): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const splitWords = (value: string | null | undefined) =>
    safeString(value)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

const getPathValue = (
    record: Record<string, unknown>,
    path: string
): unknown =>
    path
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .filter(Boolean)
        .reduce<unknown>((acc, key) => {
            if (acc === null || acc === undefined) return undefined;
            if (typeof acc !== "object") return undefined;
            return (acc as Record<string, unknown>)[key];
        }, record);

const serializeValue = (value: unknown) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "boolean") return value ? "true" : "false";
    if (
        typeof value === "number" ||
        typeof value === "bigint" ||
        typeof value === "string"
    )
        return String(value);
    return safeString(value as InterpolableValue);
};

const DEFAULT_QUERY_OPTIONS: Required<QueryStringOptions> = {
    arrayFormat: "repeat",
    skipNull: true,
    skipEmptyString: false,
    encode: true,
    sortKeys: true,
};

type QueryPair = [string, string];

const encodePair = (value: string, encode: boolean) =>
    encode ? encodeURIComponent(value) : value;

const buildQueryPairs = (
    key: string,
    value: unknown,
    options: Required<QueryStringOptions>,
    pairs: QueryPair[]
) => {
    if (value === undefined) return;
    if (value === null) {
        if (!options.skipNull) pairs.push([key, ""]);
        return;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return;

        if (options.arrayFormat === "comma") {
            const serialized = value
                .map((entry) => serializeValue(entry))
                .filter(
                    (entry) => !(options.skipEmptyString && entry === "")
                )
                .join(",");
            if (serialized || !options.skipEmptyString)
                pairs.push([key, serialized]);
            return;
        }

        for (const item of value) {
            const nextKey =
                options.arrayFormat === "bracket" ? `${key}[]` : key;
            buildQueryPairs(nextKey, item, options, pairs);
        }
        return;
    }

    if (isPlainObject(value)) {
        const entries = Object.entries(value);
        if (options.sortKeys)
            entries.sort(([a], [b]) => a.localeCompare(b));
        for (const [childKey, childValue] of entries) {
            const nextKey = key ? `${key}[${childKey}]` : childKey;
            buildQueryPairs(nextKey, childValue, options, pairs);
        }
        return;
    }

    const serialized = serializeValue(value);
    if (options.skipEmptyString && serialized === "") return;
    pairs.push([key, serialized]);
};

export const StringUtils = {
    removeDiacritics: (value: string | null | undefined) =>
        removeDiacritics(safeString(value)),

    slugify: (
        value: string | null | undefined,
        { separator = "-", lowercase = true }: SlugifyOptions = {}
    ) => {
        const normalized = removeDiacritics(safeString(value));
        const base = lowercase ? normalized.toLowerCase() : normalized;
        const escapedSeparator = escapeRegExp(separator);
        return base
            .replace(NON_ALPHANUMERIC_REGEX, separator)
            .replace(new RegExp(`${escapedSeparator}+`, "g"), separator)
            .replace(
                new RegExp(
                    `^${escapedSeparator}|${escapedSeparator}$`,
                    "g"
                ),
                ""
            );
    },

    compactWhitespace: (value: string | null | undefined) =>
        safeString(value).trim().replace(/\s+/g, " "),

    capitalize: (value: string | null | undefined, locale = "es-AR") => {
        const input = safeString(value).trim();
        if (!input) return "";
        const [first, ...rest] = input;
        return (
            first.toLocaleUpperCase(locale) +
            rest.join("").toLocaleLowerCase(locale)
        );
    },

    capitalizeWords: (value: string | null | undefined, locale = "es-AR") =>
        splitWords(value)
            .map((word) => StringUtils.capitalize(word, locale))
            .join(" "),

    truncate: (
        value: string | null | undefined,
        maxLength: number,
        { ellipsis = "…", respectWordBoundaries = true }: TruncateOptions = {}
    ) => {
        const input = safeString(value);
        if (input.length <= maxLength) return input;

        const sliceLength = Math.max(maxLength - ellipsis.length, 0);
        let truncated = input.slice(0, sliceLength);

        if (respectWordBoundaries) {
            const lastSpace = truncated.lastIndexOf(" ");
            if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
        }

        return `${truncated}${ellipsis}`;
    },

    mask: (
        value: string | null | undefined,
        { maskChar = "•", visibleStart = 0, visibleEnd = 4 }: MaskOptions = {}
    ) => {
        const input = safeString(value);
        if (!input) return "";
        if (visibleStart + visibleEnd >= input.length) return input;

        const start = input.slice(0, visibleStart);
        const end =
            visibleEnd > 0 ? input.slice(input.length - visibleEnd) : "";
        const maskedLength = input.length - start.length - end.length;
        return `${start}${maskChar.repeat(Math.max(maskedLength, 0))}${end}`;
    },

    interpolate: (
        template: string,
        params: Record<string, unknown>,
        { strict = false, fallback = "", transform }: InterpolateOptions = {}
    ) => {
        if (!template) return "";
        return template.replace(
            PLACEHOLDER_REGEX,
            (_, rawKey: string): string => {
                const value = getPathValue(params, rawKey);
                if (value === undefined || value === null) {
                    if (strict)
                        throw new Error(`Missing value for key "${rawKey}"`);
                    return fallback;
                }
                const resolved = transform
                    ? transform(value, rawKey)
                    : safeString(value as InterpolableValue);
                return resolved;
            }
        );
    },

    initials: (
        value: string | null | undefined,
        { limit = 2, uppercase = true }: InitialsOptions = {}
    ) => {
        const letters = splitWords(value)
            .slice(0, limit)
            .map((word) => word.charAt(0));
        const result = letters.join("");
        return uppercase ? result.toUpperCase() : result;
    },

    toQueryString: (
        params: Record<string, unknown> | null | undefined,
        customOptions: QueryStringOptions = {}
    ) => {
        if (!params) return "";
        const options = { ...DEFAULT_QUERY_OPTIONS, ...customOptions };
        const pairs: QueryPair[] = [];
        const entries = Object.entries(params);
        if (options.sortKeys) entries.sort(([a], [b]) => a.localeCompare(b));

        for (const [key, value] of entries) {
            buildQueryPairs(key, value, options, pairs);
        }

        return pairs
            .map(([key, value]) => {
                const encodedKey = encodePair(key, options.encode);
                const encodedValue = encodePair(value, options.encode);
                return `${encodedKey}=${encodedValue}`;
            })
            .join("&");
    },
};
