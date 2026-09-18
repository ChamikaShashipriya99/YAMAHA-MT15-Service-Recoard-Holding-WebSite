import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimitEntry extends Document {
    key: string;
    count: number;
    resetTime: number;
    expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimitEntry>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        count: {
            type: Number,
            required: true,
            default: 1,
        },
        resetTime: {
            type: Number,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            // Native MongoDB TTL index: automatically purges the document once expiresAt is reached
            expires: 0,
        },
    },
    {
        timestamps: false,
    }
);

const RateLimitEntry: Model<IRateLimitEntry> =
    mongoose.models.RateLimitEntry ||
    mongoose.model<IRateLimitEntry>("RateLimitEntry", RateLimitSchema);

export default RateLimitEntry;
