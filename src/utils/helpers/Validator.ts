const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTERNATIONAL_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const PHONE_E164_REGEX = /^\+?[1-9]\d{7,14}$/;
const PASSWORD_SPECIAL_CHARS = /[^A-Za-z0-9]/;
const LOCAL_PHONE_PATTERNS: Record<string, RegExp> = {
    "es-ar": /^(?:54)?0?(?:11|[2368]\d{2})\d{6,8}$/,
    "es-es": /^(?:34)?(?:6|7|8|9)\d{8}$/,
    "es-mx": /^(?:52)?(?:1)?\d{10}$/,
    "en-us": /^(?:1)?\d{10}$/,
    "pt-br": /^(?:55)?0?\d{10,11}$/,
};

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");
const stripPhoneFormatting = (value: string) => value.replace(/[\s()-]/g, "");
const normalizeLocaleCode = (locale: string) =>
    locale.toLowerCase().replace("_", "-");
const resolveLocalePatterns = (locale: string): RegExp[] => {
    const normalized = normalizeLocaleCode(locale);
    const candidates = [normalized];

    const [language] = normalized.split("-");
    if (language && language !== normalized) candidates.push(language);

    return candidates
        .map((candidate) => LOCAL_PHONE_PATTERNS[candidate])
        .filter(Boolean) as RegExp[];
};

const calculateCheckDigit = (digits: string, weights: number[]) => {
    const sum = digits
        .split("")
        .reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
    return (10 - (sum % 10)) % 10;
};

const validateCuitChecksum = (digits: string) => {
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const checksum = digits
        .slice(0, 10)
        .split("")
        .reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
    const remainder = 11 - (checksum % 11);
    if (remainder === 11) return 0;
    if (remainder === 10) return 9;
    return remainder;
};

const validateCbuBlock = (
    digits: string,
    checkDigit: number,
    weights: number[]
) => calculateCheckDigit(digits, weights) === checkDigit;

export interface StrongPasswordOptions {
    minLength?: number;
    requireUppercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
}

export const Validator = {
    isEmail: (value: string | null | undefined) =>
        typeof value === "string" && EMAIL_REGEX.test(value),

    isEmpty: (value: unknown) =>
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" &&
            value !== null &&
            Object.keys(value).length === 0),

    minLength: (value: { length: number } | null | undefined, min: number) =>
        !!value && value.length >= min,

    maxLength: (value: { length: number } | null | undefined, max: number) =>
        !!value && value.length <= max,

    matches: (value: string | null | undefined, pattern: RegExp) =>
        typeof value === "string" && pattern.test(value),

    isUrl: (value: string | null | undefined) => {
        if (typeof value !== "string" || Validator.isEmpty(value)) return false;
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },

    isInternationalPhone: (value: string | null | undefined) => {
        if (typeof value !== "string") return false;
        const normalized = stripPhoneFormatting(value);
        if (!normalized.startsWith("+")) return false;
        return INTERNATIONAL_PHONE_REGEX.test(normalized);
    },

    isPhoneE164: (value: string | null | undefined) => {
        if (typeof value !== "string") return false;
        const normalized = stripPhoneFormatting(value);
        return PHONE_E164_REGEX.test(normalized);
    },

    isUUIDv4: (value: string | null | undefined) =>
        typeof value === "string" && UUID_V4_REGEX.test(value),

    isLocalPhone: (
        value: string | null | undefined,
        locale: string,
        options: { fallbackToGeneric?: boolean } = {}
    ) => {
        if (typeof value !== "string" || !locale) return false;
        const digits = sanitizeDigits(value);
        if (digits.length === 0) return false;

        const patterns = resolveLocalePatterns(locale);
        for (const pattern of patterns) {
            if (pattern.test(digits)) return true;
        }

        const { fallbackToGeneric = true } = options;
        if (!fallbackToGeneric) return false;
        return digits.length >= 6 && digits.length <= 12;
    },

    isDni: (value: string | number | null | undefined) => {
        if (value === null || value === undefined) return false;
        const digits = sanitizeDigits(String(value));
        return digits.length >= 7 && digits.length <= 8;
    },

    isCuit: (value: string | null | undefined) => {
        if (typeof value !== "string") return false;
        const digits = sanitizeDigits(value);
        if (digits.length !== 11) return false;
        const expected = Number(digits.at(-1));
        return expected === validateCuitChecksum(digits);
    },

    isCbu: (value: string | null | undefined) => {
        if (typeof value !== "string") return false;
        const digits = sanitizeDigits(value);
        if (digits.length !== 22) return false;

        const firstBlock = digits.slice(0, 7);
        const firstCheck = Number(digits[7]);
        const secondBlock = digits.slice(8, 21);
        const secondCheck = Number(digits[21]);

        const firstValid = validateCbuBlock(
            firstBlock,
            firstCheck,
            [7, 1, 3, 9, 7, 1, 3]
        );
        const secondValid = validateCbuBlock(
            secondBlock,
            secondCheck,
            [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]
        );

        return firstValid && secondValid;
    },

    isStrongPassword: (
        value: string | null | undefined,
        options: StrongPasswordOptions = {}
    ) => {
        if (typeof value !== "string") return false;
        const {
            minLength = 8,
            requireUppercase = true,
            requireNumber = true,
            requireSpecial = true,
        } = options;

        if (value.length < minLength) return false;
        if (requireUppercase && !/[A-Z]/.test(value)) return false;
        if (requireNumber && !/\d/.test(value)) return false;
        if (requireSpecial && !PASSWORD_SPECIAL_CHARS.test(value)) return false;
        return true;
    },

    isDateRange: (
        start: Date | string | null | undefined,
        end: Date | string | null | undefined
    ) => {
        if (!start || !end) return false;
        const startDate = start instanceof Date ? start : new Date(start);
        const endDate = end instanceof Date ? end : new Date(end);
        return !Number.isNaN(startDate.getTime()) &&
            !Number.isNaN(endDate.getTime())
            ? endDate.getTime() >= startDate.getTime()
            : false;
    },

    isOneTimeCode: (value: string | null | undefined, digits = 6) =>
        typeof value === "string" &&
        new RegExp(`^\\d{${digits}}$`).test(value.trim()),
};
