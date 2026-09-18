import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecoveryCode {
    codeHash: string;
    used: boolean;
    usedAt?: Date;
}

export interface IUserSettings extends Document {
    username: string;
    passwordHash?: string;
    totpSecret?: string;
    tokenVersion: number;
    recoveryCodes?: IRecoveryCode[];
    updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            default: "Chamikaz99",
        },
        passwordHash: {
            type: String,
            default: null,
        },
        totpSecret: {
            type: String,
            default: null,
        },
        tokenVersion: {
            type: Number,
            default: 1,
        },
        recoveryCodes: [
            {
                codeHash: { type: String, required: true },
                used: { type: Boolean, default: false },
                usedAt: { type: Date, default: null },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const UserSettings: Model<IUserSettings> =
    mongoose.models.UserSettings ||
    mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

export default UserSettings;
