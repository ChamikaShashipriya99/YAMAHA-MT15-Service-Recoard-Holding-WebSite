import crypto from "crypto";

const DEFAULT_SECRET = "yamaha_mt15_super_secret_jwt_key_2026";
const RAW_SECRET = process.env.ENCRYPTION_SECRET || process.env.AUTH_JWT_SECRET || DEFAULT_SECRET;

// Derive a deterministic 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(RAW_SECRET).digest();
const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:gcm:";

/**
 * Encrypts sensitive string telemetry using AES-256-GCM authenticated symmetric encryption
 */
export function encryptText(plainText?: string | null): string {
    if (!plainText || typeof plainText !== "string" || !plainText.trim()) {
        return plainText || "";
    }

    try {
        const iv = crypto.randomBytes(12); // Recommended IV size for GCM is 12 bytes
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        let encrypted = cipher.update(plainText, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag().toString("hex");

        return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error("Field encryption error:", error);
        return plainText; // Fail-safe fallback
    }
}

/**
 * Decrypts AES-256-GCM ciphertext back to plaintext.
 * Safely handles unencrypted legacy text seamlessly for backwards compatibility.
 */
export function decryptText(cipherText?: string | null): string {
    if (!cipherText || typeof cipherText !== "string" || !cipherText.trim()) {
        return cipherText || "";
    }

    // Check if the text was actually encrypted with our prefix
    if (!cipherText.startsWith(PREFIX)) {
        return cipherText; // Return legacy plaintext directly
    }

    try {
        const content = cipherText.slice(PREFIX.length);
        const [ivHex, authTagHex, encryptedHex] = content.split(":");

        if (!ivHex || !authTagHex || !encryptedHex) {
            return cipherText;
        }

        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Field decryption error:", error);
        return "[ENCRYPTED // AUTH ERROR]";
    }
}
