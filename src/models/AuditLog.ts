import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditEventType =
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGIN_RECOVERY_USED"
    | "PASSWORD_CHANGED"
    | "2FA_REPAIRED"
    | "RECORDS_PURGED"
    | "RECORD_CREATED"
    | "RECORD_UPDATED"
    | "RECORD_DELETED"
    | "REPORT_EXPORTED"
    | "SESSION_REVOKED"
    | "INACTIVITY_LOCKED"
    | "INACTIVITY_UNLOCKED"
    | "TELEGRAM_CONFIG_UPDATED"
    | "TELEGRAM_UNAUTHORIZED_ACCESS";

export type AuditEventStatus = "SUCCESS" | "WARNING" | "CRITICAL";

export interface IAuditLog extends Document {
    eventType: AuditEventType;
    status: AuditEventStatus;
    clientIp: string;
    userAgent: string;
    details?: string;
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["SUCCESS", "WARNING", "CRITICAL"],
            default: "SUCCESS",
            index: true,
        },
        clientIp: {
            type: String,
            required: true,
            default: "unknown",
        },
        userAgent: {
            type: String,
            default: "unknown",
        },
        details: {
            type: String,
            default: "",
        },
        timestamp: {
            type: Date,
            default: Date.now,
            // Automatically expire and purge audit logs older than 90 days
            expires: 90 * 24 * 60 * 60,
        },
    },
    {
        timestamps: false,
    }
);

// Compound index for fast timeline queries
AuditLogSchema.index({ timestamp: -1 });

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
