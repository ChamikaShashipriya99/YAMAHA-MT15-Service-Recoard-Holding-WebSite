import { connectToDatabase } from "@/lib/mongodb";
import TelegramConfig from "@/models/TelegramConfig";
import ServiceRecord from "@/models/ServiceRecord";
import VehicleCompliance from "@/models/VehicleCompliance";
import { evaluateAllComplianceNotices, ComplianceNotificationItem } from "@/lib/complianceNotifier";

export interface TelegramCredentials {
    botToken: string;
    chatId: string;
    enabled: boolean;
    notifyMilestones: boolean;
    botUsername?: string;
}

/**
 * Retrieves configured Telegram credentials from MongoDB Atlas (with env fallback)
 */
export async function getTelegramCredentials(): Promise<TelegramCredentials> {
    let credentials: TelegramCredentials = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        chatId: process.env.TELEGRAM_CHAT_ID || "",
        enabled: true,
        notifyMilestones: true,
        botUsername: "",
    };

    try {
        await connectToDatabase();
        const config = await TelegramConfig.findOne();
        if (config) {
            if (config.botToken) credentials.botToken = config.botToken;
            if (config.chatId) credentials.chatId = config.chatId;
            credentials.enabled = config.enabled;
            credentials.notifyMilestones = config.notifyMilestones;
            credentials.botUsername = config.botUsername || "";
        }
    } catch (err) {
        console.warn("Could not retrieve TelegramConfig from database:", err);
    }

    return credentials;
}

/**
 * Verifies bot token with Telegram and returns bot info
 */
export async function verifyBotToken(token: string): Promise<{ valid: boolean; username?: string; firstName?: string; error?: string }> {
    if (!token) return { valid: false, error: "Bot token is empty" };

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await res.json();
        if (data.ok && data.result) {
            return {
                valid: true,
                username: data.result.username,
                firstName: data.result.first_name,
            };
        }
        return { valid: false, error: data.description || "Invalid token" };
    } catch (err: any) {
        return { valid: false, error: err.message || "Failed to reach Telegram API" };
    }
}

/**
 * Sends a message via Telegram Bot API
 */
export async function sendTelegramMessage(
    chatId: string,
    text: string,
    options?: {
        parse_mode?: "HTML" | "MarkdownV2";
        reply_markup?: any;
        botToken?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    let token = options?.botToken;
    if (!token) {
        const creds = await getTelegramCredentials();
        token = creds.botToken;
    }

    if (!token || !chatId) {
        return { success: false, error: "Missing bot token or chat ID" };
    }

    try {
        const payload: any = {
            chat_id: chatId,
            text,
            parse_mode: options?.parse_mode || "HTML",
            disable_web_page_preview: true,
        };

        if (options?.reply_markup) {
            payload.reply_markup = options.reply_markup;
        }

        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.ok) {
            return { success: true };
        }
        return { success: false, error: data.description || "Failed to send message" };
    } catch (err: any) {
        return { success: false, error: err.message || "Telegram API request failed" };
    }
}

/**
 * Default interactive inline keyboard for MT-15 Cockpit
 */
export function getCockpitInlineKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: "📊 Full Telemetry", callback_data: "cmd_status" },
                { text: "📄 Legal Papers", callback_data: "cmd_compliance" },
            ],
            [
                { text: "⚙️ Next Service", callback_data: "cmd_service" },
                { text: "⛽ Fuel Log Help", callback_data: "cmd_fuel_help" },
            ],
        ],
    };
}

/**
 * Formats full Cockpit Status readout
 */
export function formatCockpitStatusMessage(data: {
    currentMileage: number;
    nextServiceMileage: number;
    oilLifeRemaining: number;
    recordsCount: number;
    compliance: any;
    computed: any;
}): string {
    const { currentMileage, nextServiceMileage, oilLifeRemaining, recordsCount, compliance, computed } = data;

    const insDays = computed?.insurance?.daysRemaining ?? 0;
    const revDays = computed?.revenueLicense?.daysRemaining ?? 0;
    const emDays = computed?.emissionTest?.daysRemaining ?? 0;

    const getPill = (days: number) => {
        if (days < 0) return "🚨 EXPIRED";
        if (days <= 5) return `🔴 ${days}d (FINAL)`;
        if (days <= 15) return `🟠 ${days}d (URGENT)`;
        if (days <= 30) return `🟡 ${days}d`;
        return `🟢 Valid (${days}d)`;
    };

    return `🏍️ <b>YAMAHA MT-15 // MISSION CONTROL</b>
━━━━━━━━━━━━━━━━━━━━━━━━
📍 <b>Current Mileage:</b> <code>${currentMileage.toLocaleString()} KM</code>
🛢️ <b>Oil Life Remaining:</b> <code>${oilLifeRemaining.toLocaleString()} KM</code>
🎯 <b>Next Service Target:</b> <code>${nextServiceMileage.toLocaleString()} KM</code>
🛠️ <b>Total Service Logs:</b> <code>${recordsCount} Records</code>

📋 <b>LEGAL COMPLIANCE STATUS:</b>
🛡️ <b>Insurance:</b> ${getPill(insDays)} (${compliance?.insurance?.expiryDate || "N/A"})
📑 <b>Revenue License:</b> ${getPill(revDays)} (${compliance?.revenueLicense?.expiryDate || "N/A"})
💨 <b>Emission (VET):</b> ${getPill(emDays)} (${compliance?.emissionTest?.expiryDate || "N/A"})
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Dark Side of Japan • Live Atlas Sync</i>`;
}

/**
 * Formats Compliance Alert for 30d, 15d, 5d, and Expired milestones
 */
export function formatComplianceAlertMessage(item: ComplianceNotificationItem): string {
    let emoji = "📅";
    let alertHeader = item.stageLabel;

    if (item.milestone === "EXPIRED") {
        emoji = "🚨";
        alertHeader = "CRITICAL LEGAL VIOLATION // EXPIRED";
    } else if (item.milestone === "5_DAYS") {
        emoji = "⚠️";
        alertHeader = "STAGE 3 // 5-DAY FINAL WARNING";
    } else if (item.milestone === "15_DAYS") {
        emoji = "🔔";
        alertHeader = "STAGE 2 // 15-DAY URGENT NOTICE";
    } else if (item.milestone === "30_DAYS") {
        emoji = "📅";
        alertHeader = "STAGE 1 // 30-DAY ADVANCE NOTICE";
    }

    return `${emoji} <b>[YAMAHA MT-15 // ${alertHeader}]</b>
━━━━━━━━━━━━━━━━━━━━━━━━
📋 <b>Document:</b> <b>${item.title}</b>
📅 <b>Due Date:</b> <code>${item.expiryDate}</code>
⏳ <b>Countdown:</b> <b>${item.daysRemaining < 0 ? `Expired ${Math.abs(item.daysRemaining)} days ago` : `${item.daysRemaining} days remaining`}</b>

💬 ${item.message}

${item.documentNumber ? `🔖 <b>Policy/Doc #:</b> <code>${item.documentNumber}</code>\n` : ""}${item.provider ? `🏢 <b>Provider/Center:</b> ${item.provider}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━
<i>Please renew on time to avoid road impoundments or fines.</i>`;
}

/**
 * Evaluates compliance documents and sends automated Telegram notifications
 */
export async function dispatchTelegramComplianceAlerts(): Promise<number> {
    const creds = await getTelegramCredentials();
    if (!creds.enabled || !creds.notifyMilestones || !creds.botToken || !creds.chatId) {
        return 0;
    }

    await connectToDatabase();
    const compliance = await VehicleCompliance.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });
    if (!compliance) return 0;

    // Helper to calculate status
    const calculateStatus = (expiryDateStr: string) => {
        if (!expiryDateStr) return { daysRemaining: 0, status: "EXPIRED" as const };
        const expiry = new Date(expiryDateStr);
        const now = new Date();
        const diffMs = expiry.setHours(23, 59, 59, 999) - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { daysRemaining };
    };

    const computed = {
        insurance: calculateStatus(compliance.insurance?.expiryDate),
        revenueLicense: calculateStatus(compliance.revenueLicense?.expiryDate),
        emissionTest: calculateStatus(compliance.emissionTest?.expiryDate),
    };

    const notices = evaluateAllComplianceNotices({ compliance, computed });
    let sentCount = 0;

    // Retrieve already sent alerts from TelegramConfig
    const config = (await TelegramConfig.findOne()) || new TelegramConfig();
    const sentHistory = config.lastNotifiedMilestone ? config.lastNotifiedMilestone.split(",") : [];

    for (const notice of notices) {
        const marker = `${notice.type}_${notice.milestone}_${notice.expiryDate}`;
        if (sentHistory.includes(marker)) {
            continue; // Already notified
        }

        const messageText = formatComplianceAlertMessage(notice);
        const res = await sendTelegramMessage(creds.chatId, messageText, {
            botToken: creds.botToken,
            reply_markup: getCockpitInlineKeyboard(),
        });

        if (res.success) {
            sentHistory.push(marker);
            sentCount++;
        }
    }

    if (sentCount > 0) {
        config.lastNotifiedMilestone = sentHistory.slice(-20).join(",");
        await config.save();
    }

    return sentCount;
}
