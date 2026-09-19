/**
 * Sanitizes generic user text inputs to prevent XSS and injection
 */
export function sanitizeText(input: unknown, maxLength: number = 500): string {
    if (typeof input !== "string") return "";
    return input
        .replace(/<[^>]*>?/gm, "") // Strip HTML tags
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // Remove ASCII control characters
        .trim()
        .slice(0, maxLength);
}

/**
 * Validates motorcycle odometer mileage
 */
export function validateMileage(mileage: unknown): { valid: boolean; value?: number; error?: string } {
    const num = Number(mileage);
    if (isNaN(num)) {
        return { valid: false, error: "Mileage must be a valid number" };
    }
    if (num < 0) {
        return { valid: false, error: "Mileage cannot be negative" };
    }
    if (num > 2_000_000) {
        return { valid: false, error: "Mileage exceeds realistic operational limits (max 2,000,000 KM)" };
    }
    return { valid: true, value: Math.round(num) };
}

/**
 * Validates date in YYYY-MM-DD format
 */
export function validateDate(dateStr: unknown): { valid: boolean; value?: string; error?: string } {
    if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
        return { valid: false, error: "Date must be in YYYY-MM-DD format" };
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
        return { valid: false, error: "Invalid calendar date" };
    }
    return { valid: true, value: dateStr.trim() };
}

/**
 * Sanitizes expenditure cost string
 */
export function sanitizeCost(cost: unknown): string {
    if (typeof cost !== "string" && typeof cost !== "number") return "";
    return String(cost)
        .replace(/[^0-9.]/g, "")
        .slice(0, 15);
}

/**
 * Validates MongoDB 24-character hexadecimal ObjectId format
 */
export function isValidObjectId(id: unknown): boolean {
    if (typeof id !== "string") return false;
    return /^[a-fA-F0-9]{24}$/.test(id.trim());
}

/**
 * Recursively scrubs MongoDB query operator keys ('$' and '.') to neutralize NoSQL injection
 */
export function sanitizeMongoInput<T>(input: T): T {
    if (!input || typeof input !== "object") {
        return input;
    }

    if (Array.isArray(input)) {
        return input.map((item) => sanitizeMongoInput(item)) as unknown as T;
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
        // Strip keys starting with '$' or containing '.'
        if (key.startsWith("$") || key.includes(".")) {
            continue;
        }
        clean[key] = sanitizeMongoInput(value);
    }

    return clean as T;
}
