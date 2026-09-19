import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramConfig from "@/models/TelegramConfig";
import {
    verifyBotToken,
    sendTelegramMessage,
    getCockpitInlineKeyboard,
    getTelegramCredentials,
} from "@/lib/telegramBot";
import { verifyRequestSession } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
    try {
        const session = await verifyRequestSession(req);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
        }

        await connectToDatabase();
        let config = await TelegramConfig.findOne();

        if (!config) {
            config = new TelegramConfig({
                botToken: process.env.TELEGRAM_BOT_TOKEN || "",
                chatId: process.env.TELEGRAM_CHAT_ID || "",
                enabled: true,
                notifyMilestones: true,
            });
        }

        let botInfo: { valid: boolean; username?: string; firstName?: string; error?: string } = { valid: false };
        if (config.botToken) {
            botInfo = await verifyBotToken(config.botToken);
            if (botInfo.valid && botInfo.username && botInfo.username !== config.botUsername) {
                config.botUsername = botInfo.username;
                await config.save();
            }
        }

        // Mask token for privacy
        const maskedToken = config.botToken
            ? `${config.botToken.slice(0, 5)}...${config.botToken.slice(-4)}`
            : "";

        return NextResponse.json({
            success: true,
            data: {
                hasToken: Boolean(config.botToken),
                maskedToken,
                chatId: config.chatId,
                enabled: config.enabled,
                notifyMilestones: config.notifyMilestones,
                botUsername: config.botUsername || botInfo.username || "",
                botName: botInfo.firstName || "MT-15 Bot",
                isValid: botInfo.valid,
            },
        });
    } catch (err: any) {
        console.error("GET /api/telegram/status error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await verifyRequestSession(req);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
        }

        await connectToDatabase();
        const body = await req.json();
        const { action, botToken, chatId, enabled, notifyMilestones, webhookUrl } = body;

        let config = await TelegramConfig.findOne();
        if (!config) {
            config = new TelegramConfig();
        }

        if (action === "save") {
            if (botToken !== undefined) config.botToken = botToken.trim();
            if (chatId !== undefined) config.chatId = String(chatId).trim();
            if (enabled !== undefined) config.enabled = Boolean(enabled);
            if (notifyMilestones !== undefined) config.notifyMilestones = Boolean(notifyMilestones);

            // Verify with Telegram
            let botInfo: { valid: boolean; username?: string; firstName?: string; error?: string } = { valid: false };
            if (config.botToken) {
                botInfo = await verifyBotToken(config.botToken);
                if (botInfo.valid && botInfo.username) {
                    config.botUsername = botInfo.username;
                }
            }

            await config.save();

            // Record security audit event
            await logSecurityEvent({
                eventType: "TELEGRAM_CONFIG_UPDATED",
                status: "SUCCESS",
                request: req,
                details: `Telegram bot configuration updated. Chat ID: ${config.chatId}, Enabled: ${config.enabled}, Notifications: ${config.notifyMilestones}`,
            });

            return NextResponse.json({
                success: true,
                message: "Telegram bot settings updated successfully.",
                data: {
                    hasToken: Boolean(config.botToken),
                    chatId: config.chatId,
                    enabled: config.enabled,
                    notifyMilestones: config.notifyMilestones,
                    botUsername: config.botUsername,
                    isValid: botInfo.valid,
                    botInfoError: botInfo.error,
                },
            });
        }

        if (action === "test") {
            const tokenToUse = botToken ? botToken.trim() : config.botToken || process.env.TELEGRAM_BOT_TOKEN;
            const targetChatId = chatId ? String(chatId).trim() : config.chatId || process.env.TELEGRAM_CHAT_ID;

            if (!tokenToUse || !targetChatId) {
                return NextResponse.json(
                    { success: false, error: "Please provide both Bot Token and Chat ID before sending a test message." },
                    { status: 400 }
                );
            }

            const testMessage = `🏍️ <b>YAMAHA MT-15 // TELEMETRY PING</b>
━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>Connection Status:</b> <code>ONLINE & VERIFIED</code>
📡 <b>Host Engine:</b> <code>Next.js 16 • MongoDB Atlas</code>
🔔 <b>Milestone Reminders:</b> <code>Active (30d // 15d // 5d)</code>

Your Telegram Bot is now successfully paired with your motorcycle mission control console. You can tap the buttons below or send commands like <code>/status</code> anytime.
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Dark Side of Japan • Instant Telemetry Link</i>`;

            const result = await sendTelegramMessage(targetChatId, testMessage, {
                botToken: tokenToUse,
                reply_markup: getCockpitInlineKeyboard(),
            });

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error || "Failed to deliver test message" },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Test message sent successfully! Check your Telegram app.",
            });
        }

        if (action === "setWebhook") {
            if (!config.botToken) {
                return NextResponse.json({ success: false, error: "Bot token not configured" }, { status: 400 });
            }
            const targetUrl = webhookUrl || `${req.nextUrl.origin}/api/telegram/webhook`;
            const res = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook?url=${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            return NextResponse.json({ success: data.ok, data });
        }

        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    } catch (err: any) {
        console.error("POST /api/telegram/status error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
