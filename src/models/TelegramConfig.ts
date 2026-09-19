import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITelegramConfig extends Document {
    botToken: string;
    chatId: string;
    enabled: boolean;
    notifyMilestones: boolean;
    lastNotifiedMilestone?: string;
    botUsername?: string;
    updatedAt: Date;
}

const TelegramConfigSchema = new Schema<ITelegramConfig>(
    {
        botToken: { type: String, default: "" },
        chatId: { type: String, default: "" },
        enabled: { type: Boolean, default: true },
        notifyMilestones: { type: Boolean, default: true },
        lastNotifiedMilestone: { type: String, default: "" },
        botUsername: { type: String, default: "" },
    },
    { timestamps: true }
);

const TelegramConfig: Model<ITelegramConfig> =
    mongoose.models.TelegramConfig ||
    mongoose.model<ITelegramConfig>("TelegramConfig", TelegramConfigSchema);

export default TelegramConfig;
