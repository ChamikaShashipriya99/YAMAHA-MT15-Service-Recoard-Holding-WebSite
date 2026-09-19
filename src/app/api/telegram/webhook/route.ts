import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ServiceRecord from "@/models/ServiceRecord";
import VehicleCompliance from "@/models/VehicleCompliance";
import {
    sendTelegramMessage,
    getCockpitInlineKeyboard,
    formatCockpitStatusMessage,
    getTelegramCredentials,
} from "@/lib/telegramBot";

export async function GET() {
    return NextResponse.json({
        ok: true,
        message: "Yamaha MT-15 Telegram Webhook is active.",
        timestamp: new Date().toISOString(),
    });
}

export async function POST(req: NextRequest) {
    try {
        const update = await req.json();

        // Extract message or callback query
        const message = update.message;
        const callbackQuery = update.callback_query;

        let chatId = "";
        let text = "";
        let fromUser = "";
        let callbackQueryId = "";

        if (callbackQuery) {
            chatId = String(callbackQuery.message?.chat?.id || "");
            text = callbackQuery.data || "";
            fromUser = callbackQuery.from?.first_name || "Rider";
            callbackQueryId = callbackQuery.id;
        } else if (message) {
            chatId = String(message.chat?.id || "");
            text = (message.text || "").trim();
            fromUser = message.from?.first_name || "Rider";
        }

        if (!chatId) {
            return NextResponse.json({ ok: true });
        }

        const creds = await getTelegramCredentials();
        const botToken = creds.botToken;

        // Acknowledge callback query if present to stop spinner
        if (callbackQueryId && botToken) {
            fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQueryId }),
            }).catch(() => {});
        }

        await connectToDatabase();

        // --- COMMAND HANDLERS ---

        // 1. /start
        if (text === "/start") {
            const welcomeText = `🏍️ <b>YAMAHA MT-15 // TELEMETRY CONSOLE</b>
━━━━━━━━━━━━━━━━━━━━━━━━
Greetings, <b>${fromUser}</b>! Welcome to your digital mission control bot.

Your Yamaha MT-15 is connected in real-time to MongoDB Atlas. You can check telemetry, monitor legal document expirations, and log fuel fill-ups directly from this chat.

<b>AVAILABLE COMMANDS:</b>
• <code>/status</code> — Live Odometer, Oil Life & System Health
• <code>/compliance</code> — Insurance, License & Emission Due Dates
• <code>/service</code> — Next Service Milestone & Oil Life
• <code>/fuel [odo] [liters] [cost]</code> — Log a petrol refill
• <code>/odo [mileage]</code> — Update lifetime bike odometer
• <code>/help</code> — Detailed command guide

Tap a button below to get started:
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Dark Side of Japan • Instant Telemetry Link</i>`;

            await sendTelegramMessage(chatId, welcomeText, {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            });

            return NextResponse.json({ ok: true });
        }

        // 2. /status or cmd_status
        if (text === "/status" || text === "cmd_status") {
            const records = await ServiceRecord.find().sort({ mileage: -1, date: -1 });
            const compliance = await VehicleCompliance.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });

            const currentMileage = records.length > 0 ? records[0].mileage : 35000;
            const lastOilRecord = records.find((r) => r.oilChange);
            const lastOilMileage = lastOilRecord ? lastOilRecord.mileage : currentMileage - 1000;
            const nextServiceMileage = lastOilMileage + 3000;
            const oilLifeRemaining = Math.max(0, nextServiceMileage - currentMileage);

            const calculateStatus = (expiryDateStr?: string) => {
                if (!expiryDateStr) return { daysRemaining: 0 };
                const expiry = new Date(expiryDateStr);
                const now = new Date();
                const diffMs = expiry.setHours(23, 59, 59, 999) - now.getTime();
                const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                return { daysRemaining };
            };

            const computed = {
                insurance: calculateStatus(compliance?.insurance?.expiryDate),
                revenueLicense: calculateStatus(compliance?.revenueLicense?.expiryDate),
                emissionTest: calculateStatus(compliance?.emissionTest?.expiryDate),
            };

            const statusMsg = formatCockpitStatusMessage({
                currentMileage,
                nextServiceMileage,
                oilLifeRemaining,
                recordsCount: records.length,
                compliance,
                computed,
            });

            await sendTelegramMessage(chatId, statusMsg, {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            });

            return NextResponse.json({ ok: true });
        }

        // 3. /compliance or cmd_compliance
        if (text === "/compliance" || text === "cmd_compliance") {
            const compliance = await VehicleCompliance.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });

            const calculateDays = (dateStr?: string) => {
                if (!dateStr) return 0;
                const expiry = new Date(dateStr);
                const now = new Date();
                const diffMs = expiry.setHours(23, 59, 59, 999) - now.getTime();
                return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            };

            const insDays = calculateDays(compliance?.insurance?.expiryDate);
            const revDays = calculateDays(compliance?.revenueLicense?.expiryDate);
            const emDays = calculateDays(compliance?.emissionTest?.expiryDate);

            const getBadge = (days: number) => {
                if (days < 0) return `🚨 <b>EXPIRED (${Math.abs(days)}d ago)</b>`;
                if (days <= 5) return `🔴 <b>STAGE 3: FINAL NOTICE (${days}d left)</b>`;
                if (days <= 15) return `🟠 <b>STAGE 2: URGENT (${days}d left)</b>`;
                if (days <= 30) return `🟡 <b>STAGE 1: 30-DAY NOTICE (${days}d left)</b>`;
                return `🟢 <b>VALID (${days}d left)</b>`;
            };

            const complianceMsg = `📋 <b>LEGAL COMPLIANCE & PAPERS // TELEMETRY</b>
━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ <b>VEHICLE INSURANCE:</b>
• Status: ${getBadge(insDays)}
• Due Date: <code>${compliance?.insurance?.expiryDate || "Not Set"}</code>
• Policy #: <code>${compliance?.insurance?.policyNumber || "N/A"}</code>
• Provider: ${compliance?.insurance?.provider || "N/A"}

📑 <b>REVENUE LICENSE (ROAD TAX):</b>
• Status: ${getBadge(revDays)}
• Due Date: <code>${compliance?.revenueLicense?.expiryDate || "Not Set"}</code>
• License #: <code>${compliance?.revenueLicense?.licenseNumber || "N/A"}</code>
• Province: ${compliance?.revenueLicense?.provincialCouncil || "Western Province"}

💨 <b>EMISSION TEST (VET):</b>
• Status: ${getBadge(emDays)}
• Due Date: <code>${compliance?.emissionTest?.expiryDate || "Not Set"}</code>
• Result: <code>${compliance?.emissionTest?.status || "PASS"}</code>
• Center: ${compliance?.emissionTest?.testCenter || "DriveGreen"}
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Milestone alerts fire automatically at 30d, 15d, and 5d before expiration.</i>`;

            await sendTelegramMessage(chatId, complianceMsg, {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            });

            return NextResponse.json({ ok: true });
        }

        // 4. /service or cmd_service
        if (text === "/service" || text === "cmd_service") {
            const records = await ServiceRecord.find().sort({ mileage: -1, date: -1 });
            const currentMileage = records.length > 0 ? records[0].mileage : 35000;
            const lastOilRecord = records.find((r) => r.oilChange);
            const lastOilMileage = lastOilRecord ? lastOilRecord.mileage : currentMileage - 1000;
            const nextServiceMileage = lastOilMileage + 3000;
            const kmRemaining = Math.max(0, nextServiceMileage - currentMileage);

            const serviceMsg = `⚙️ <b>MAINTENANCE & OIL LIFE TELEMETRY</b>
━━━━━━━━━━━━━━━━━━━━━━━━
📍 <b>Current Odometer:</b> <code>${currentMileage.toLocaleString()} KM</code>
🎯 <b>Next Target:</b> <code>${nextServiceMileage.toLocaleString()} KM</code>
⏳ <b>Remaining Life:</b> <code>${kmRemaining.toLocaleString()} KM</code>
🛢️ <b>Last Oil Change:</b> <code>${lastOilMileage.toLocaleString()} KM</code> (${lastOilRecord?.date || "Initial Seed"})

<b>ITEMS DUE AT NEXT SERVICE:</b>
• Yamalube 10W-40 4T Engine Oil (850 ml / 950 ml with filter)
• OEM Yamaha MT-15 Oil Filter Cartridge
• Drive Chain Clean, Tension & Lube (30–40mm slack)
• Spark Plug Check & Tire PSI inspection (28 Front / 33 Rear)
━━━━━━━━━━━━━━━━━━━━━━━━`;

            await sendTelegramMessage(chatId, serviceMsg, {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            });

            return NextResponse.json({ ok: true });
        }

        // 5. /fuel <odometer> <liters> <cost>
        if (text.startsWith("/fuel")) {
            const parts = text.split(/\s+/).slice(1);
            if (parts.length < 3) {
                const helpMsg = `⛽ <b>HOW TO LOG A FUEL REFILL:</b>
━━━━━━━━━━━━━━━━━━━━━━━━
<b>Format:</b>
<code>/fuel [Odometer] [Liters] [Cost in Rs.]</code>

<b>Example:</b>
<code>/fuel 35250 4.5 1680</code>

This will automatically calculate:
• Trip distance since last service
• Real-world km/L consumption
• Exact cost per kilometer (Rs./km)
And save it to your MongoDB database instantly!`;

                await sendTelegramMessage(chatId, helpMsg, { botToken });
                return NextResponse.json({ ok: true });
            }

            const odo = parseFloat(parts[0]);
            const liters = parseFloat(parts[1]);
            const cost = parseFloat(parts[2]);

            if (isNaN(odo) || isNaN(liters) || isNaN(cost) || liters <= 0) {
                await sendTelegramMessage(chatId, "⚠️ <b>Invalid numbers.</b> Example: <code>/fuel 35250 4.5 1680</code>", { botToken });
                return NextResponse.json({ ok: true });
            }

            const latestRecord = await ServiceRecord.findOne().sort({ mileage: -1, date: -1 });
            const prevMileage = latestRecord ? latestRecord.mileage : odo - 150;
            const tripDistance = Math.max(1, odo - prevMileage);
            const kmPerL = tripDistance / liters;
            const costPerKm = cost / tripDistance;

            const today = new Date().toISOString().split("T")[0];

            await ServiceRecord.create({
                date: today,
                mileage: odo,
                oilChange: false,
                filterChange: false,
                cost: cost.toString(),
                type: "Fuel",
                notes: `Fuel Fill-up: ${liters}L @ Rs. ${cost} (${kmPerL.toFixed(1)} km/L • Rs. ${costPerKm.toFixed(2)}/km)`,
            });

            const replyMsg = `⛽ <b>FUEL FILL-UP RECORDED!</b>
━━━━━━━━━━━━━━━━━━━━━━━━
📍 <b>New Odometer:</b> <code>${odo.toLocaleString()} KM</code>
🛣️ <b>Trip Distance:</b> <code>+${tripDistance} KM</code>
💧 <b>Fuel Pumped:</b> <code>${liters.toFixed(2)} Liters</code>
💰 <b>Total Paid:</b> <code>Rs. ${cost.toLocaleString()}</code>
⚡ <b>Fuel Economy:</b> <code>${kmPerL.toFixed(1)} km/L</code>
💸 <b>Running Cost:</b> <code>Rs. ${costPerKm.toFixed(2)} / KM</code>
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Synced to MongoDB Atlas. Viewable on Mission Control.</i>`;

            await sendTelegramMessage(chatId, replyMsg, {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            });

            return NextResponse.json({ ok: true });
        }

        // 6. /odo <mileage>
        if (text.startsWith("/odo")) {
            const parts = text.split(/\s+/).slice(1);
            if (parts.length < 1) {
                await sendTelegramMessage(chatId, "<b>Format:</b> <code>/odo 35400</code> to update current bike mileage.", { botToken });
                return NextResponse.json({ ok: true });
            }

            const newMileage = parseFloat(parts[0]);
            if (isNaN(newMileage) || newMileage <= 0) {
                await sendTelegramMessage(chatId, "⚠️ <b>Invalid mileage number.</b> Example: <code>/odo 35400</code>", { botToken });
                return NextResponse.json({ ok: true });
            }

            const today = new Date().toISOString().split("T")[0];
            await ServiceRecord.create({
                date: today,
                mileage: newMileage,
                oilChange: false,
                filterChange: false,
                type: "Odometer Sync",
                notes: "Mileage updated via Telegram Bot",
            });

            await sendTelegramMessage(
                chatId,
                `📍 <b>ODOMETER UPDATED TO ${newMileage.toLocaleString()} KM!</b>\nOil life countdown has been synchronized on Mission Control.`,
                {
                    botToken,
                    reply_markup: getCockpitInlineKeyboard(),
                }
            );

            return NextResponse.json({ ok: true });
        }

        // 7. /help or cmd_fuel_help
        if (text === "/help" || text === "cmd_fuel_help") {
            const helpText = `🏍️ <b>YAMAHA MT-15 // COMMAND GUIDE</b>
━━━━━━━━━━━━━━━━━━━━━━━━
<b>Available Commands:</b>

• <code>/status</code>
  Full cockpit readout with current mileage, remaining oil life, and legal paper statuses.

• <code>/compliance</code>
  Expiry countdowns, status tags, and policy numbers for Insurance, Road Tax, and Emission Test.

• <code>/service</code>
  Next scheduled maintenance target and required service items.

• <code>/fuel [odo] [liters] [cost]</code>
  Log petrol refills.
  <i>Example:</i> <code>/fuel 35250 4.5 1680</code>

• <code>/odo [mileage]</code>
  Update bike's current odometer reading.
  <i>Example:</i> <code>/odo 35400</code>

• <code>/start</code>
  Show main menu with quick interactive buttons.
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Dark Side of Japan • Real-time Telemetry</i>`;

            await sendTelegramMessage(chatId, helpText, {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            });

            return NextResponse.json({ ok: true });
        }

        // Unknown text default fallback
        await sendTelegramMessage(
            chatId,
            `🤖 Command not recognized. Send <code>/status</code> or tap a button below:`,
            {
                botToken,
                reply_markup: getCockpitInlineKeyboard(),
            }
        );

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("POST /api/telegram/webhook error:", err);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
