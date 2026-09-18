import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserSettings extends Document {
    username: string;
    passwordHash?: string;
    totpSecret?: string;
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
    },
    {
        timestamps: true,
    }
);

const UserSettings: Model<IUserSettings> =
    mongoose.models.UserSettings ||
    mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

export default UserSettings;
