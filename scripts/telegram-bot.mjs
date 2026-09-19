import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Safely load MONGODB_URI from process.env or .env.local without hardcoding secrets
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    const envPath = path.resolve(__dirname, "../.env.local");
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        for (const line of envContent.split("\n")) {
            const trimmed = line.trim();
            if (trimmed.startsWith("MONGODB_URI=")) {
                mongoUri = trimmed.replace("MONGODB_URI=", "").trim().replace(/^["']|["']$/g, "");
                break;
            }
        }
    }
}

if (!mongoUri) {
    console.error("FATAL SECURITY ERROR: MONGODB_URI environment variable is missing. Configure it in .env.local.");
    process.exit(1);
}

async function run() {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const configCollection = mongoose.connection.collection("telegramconfigs");
    const recordsCollection = mongoose.connection.collection("servicerecords");
    const complianceCollection = mongoose.connection.collection("vehiclecompliances");
    const auditCollection = mongoose.connection.collection("auditlogs");

    const config = await configCollection.findOne({});
    if (!config || !config.botToken) {
        console.error("No Telegram Bot Token found in database. Configure it in Cockpit Settings.");
        process.exit(1);
    }

    const token = config.botToken;
    console.log(`Telegram Poller online for bot: @${config.botUsername || "MT15_Bot"}`);

    // Remove any existing webhook so getUpdates works cleanly
    try {
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    } catch (e) {}

    let offset = 0;

    const getKeyboard = () => ({
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
    });

    const sendMessage = async (chatId, text, replyMarkup) => {
        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_markup: replyMarkup || getKeyboard(),
                }),
            });
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleUpdate = async (update) => {
        const message = update.message;
        const callbackQuery = update.callback_query;

        let chatId = "";
        let text = "";
        let fromUser = "";
        let callbackId = "";

        if (callbackQuery) {
            chatId = String(callbackQuery.message?.chat?.id || "");
            text = callbackQuery.data || "";
            fromUser = callbackQuery.from?.first_name || "Rider";
            callbackId = callbackQuery.id;

            // Stop button loading animation
            try {
                await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackId }),
                });
            } catch (e) {}
        } else if (message) {
            chatId = String(message.chat?.id || "");
            text = (message.text || "").trim();
            fromUser = message.from?.first_name || "Rider";
        }

        if (!chatId || !text) return;
        console.log(`[Update ${update.update_id}] Received from ${fromUser} (Chat ID: ${chatId}): "${text}"`);

        // --- SECURITY ACCESS CONTROL: OWNER CHAT ID WHITELIST ---
        if (config.chatId && String(chatId) !== String(config.chatId)) {
            console.warn(`[SECURITY ALERT] Unauthorized access blocked from ${fromUser} (Chat ID: ${chatId}): "${text}"`);

            // 1. Log to MongoDB Atlas AuditLog
            try {
                await auditCollection.insertOne({
                    eventType: "TELEGRAM_UNAUTHORIZED_ACCESS",
                    status: "CRITICAL",
                    clientIp: "Telegram Bot Poller",
                    userAgent: `Telegram User: ${fromUser} (Chat ID: ${chatId})`,
                    details: `Intrusion blocked: Unauthorized command attempt: "${text}"`,
                    timestamp: new Date(),
                });
            } catch (err) {
                console.error("Failed to log audit event:", err);
            }

            // 2. Alert the legitimate owner on Telegram
            const intrusionWarning = `🚨 <b>[INTRUSION ATTEMPT // UNKNOWN BOT OPERATOR]</b>
━━━━━━━━━━━━━━━━━━━━━━━━
An unauthorized user tried to execute commands on your MT-15 Telegram Bot!

👤 <b>Telegram User:</b> <code>${fromUser}</code>
🆔 <b>Telegram Chat ID:</b> <code>${chatId}</code>
💬 <b>Attempted Text:</b> <code>${text}</code>
⏰ <b>Time:</b> <code>${new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })}</code>
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Access was blocked immediately. Their Chat ID has been flagged.</i>`;
            await sendMessage(config.chatId, intrusionWarning, { remove_keyboard: true });

            // 3. Send denial message to intruder
            const denialText = `🚫 <b>[ACCESS DENIED // MT-15 COCKPIT SECURITY]</b>
━━━━━━━━━━━━━━━━━━━━━━━━
This bot terminal is encrypted and paired exclusively with the authorized bike owner.

👤 <b>Your Telegram User:</b> <code>${fromUser}</code>
🆔 <b>Your Chat ID:</b> <code>${chatId}</code>
🔒 <b>Security Status:</b> <b>INTRUSION FLAGGED & LOGGED</b>

Your access attempt has been recorded in MongoDB Atlas and reported immediately to the bike owner's secure telemetry device.
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Access to telemetry, compliance, and bike controls is restricted.</i>`;
            await sendMessage(chatId, denialText, { remove_keyboard: true });
            return;
        }

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
<i>Dark Side of Japan • Live Telemetry Link</i>`;

            await sendMessage(chatId, welcomeText);
            return;
        }

        // 2. /status or cmd_status
        if (text === "/status" || text === "cmd_status") {
            const records = await recordsCollection.find({}).sort({ mileage: -1, date: -1 }).toArray();
            const compliance = await complianceCollection.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });

            const currentMileage = records.length > 0 ? records[0].mileage : 35000;
            const lastOilRecord = records.find((r) => r.oilChange);
            const lastOilMileage = lastOilRecord ? lastOilRecord.mileage : currentMileage - 1000;
            const nextServiceMileage = lastOilMileage + 3000;
            const oilLifeRemaining = Math.max(0, nextServiceMileage - currentMileage);

            const calculateStatus = (expiryDateStr) => {
                if (!expiryDateStr) return 0;
                const expiry = new Date(expiryDateStr);
                const now = new Date();
                const diffMs = expiry.setHours(23, 59, 59, 999) - now.getTime();
                return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            };

            const insDays = calculateStatus(compliance?.insurance?.expiryDate);
            const revDays = calculateStatus(compliance?.revenueLicense?.expiryDate);
            const emDays = calculateStatus(compliance?.emissionTest?.expiryDate);

            const getPill = (days) => {
                if (days < 0) return "🚨 EXPIRED";
                if (days <= 5) return `🔴 ${days}d (FINAL)`;
                if (days <= 15) return `🟠 ${days}d (URGENT)`;
                if (days <= 30) return `🟡 ${days}d`;
                return `🟢 Valid (${days}d)`;
            };

            const statusMsg = `🏍️ <b>YAMAHA MT-15 // MISSION CONTROL</b>
━━━━━━━━━━━━━━━━━━━━━━━━
📍 <b>Current Mileage:</b> <code>${currentMileage.toLocaleString()} KM</code>
🛢️ <b>Oil Life Remaining:</b> <code>${oilLifeRemaining.toLocaleString()} KM</code>
🎯 <b>Next Service Target:</b> <code>${nextServiceMileage.toLocaleString()} KM</code>
🛠️ <b>Total Service Logs:</b> <code>${records.length} Records</code>

📋 <b>LEGAL COMPLIANCE STATUS:</b>
🛡️ <b>Insurance:</b> ${getPill(insDays)} (${compliance?.insurance?.expiryDate || "N/A"})
📑 <b>Revenue License:</b> ${getPill(revDays)} (${compliance?.revenueLicense?.expiryDate || "N/A"})
💨 <b>Emission (VET):</b> ${getPill(emDays)} (${compliance?.emissionTest?.expiryDate || "N/A"})
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Dark Side of Japan • Live Atlas Sync</i>`;

            await sendMessage(chatId, statusMsg);
            return;
        }

        // 3. /compliance or cmd_compliance
        if (text === "/compliance" || text === "cmd_compliance") {
            const compliance = await complianceCollection.findOne({ bikeIdentifier: "YAMAHA_MT15_PRIMARY" });

            const calculateDays = (dateStr) => {
                if (!dateStr) return 0;
                const expiry = new Date(dateStr);
                const now = new Date();
                const diffMs = expiry.setHours(23, 59, 59, 999) - now.getTime();
                return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            };

            const insDays = calculateDays(compliance?.insurance?.expiryDate);
            const revDays = calculateDays(compliance?.revenueLicense?.expiryDate);
            const emDays = calculateDays(compliance?.emissionTest?.expiryDate);

            const getBadge = (days) => {
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

            await sendMessage(chatId, complianceMsg);
            return;
        }

        // 4. /service or cmd_service
        if (text === "/service" || text === "cmd_service") {
            const records = await recordsCollection.find({}).sort({ mileage: -1, date: -1 }).toArray();
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

            await sendMessage(chatId, serviceMsg);
            return;
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
                await sendMessage(chatId, helpMsg);
                return;
            }

            const odo = parseFloat(parts[0]);
            const liters = parseFloat(parts[1]);
            const cost = parseFloat(parts[2]);

            if (isNaN(odo) || isNaN(liters) || isNaN(cost) || liters <= 0) {
                await sendMessage(chatId, "⚠️ <b>Invalid numbers.</b> Example: <code>/fuel 35250 4.5 1680</code>");
                return;
            }

            const latestRecord = await recordsCollection.findOne({}, { sort: { mileage: -1, date: -1 } });
            const prevMileage = latestRecord ? latestRecord.mileage : odo - 150;
            const tripDistance = Math.max(1, odo - prevMileage);
            const kmPerL = tripDistance / liters;
            const costPerKm = cost / tripDistance;

            const today = new Date().toISOString().split("T")[0];

            await recordsCollection.insertOne({
                date: today,
                mileage: odo,
                oilChange: false,
                filterChange: false,
                cost: cost.toString(),
                type: "Fuel",
                notes: `Fuel Fill-up: ${liters}L @ Rs. ${cost} (${kmPerL.toFixed(1)} km/L • Rs. ${costPerKm.toFixed(2)}/km)`,
                createdAt: new Date(),
                updatedAt: new Date(),
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

            await sendMessage(chatId, replyMsg);
            return;
        }

        // 6. /odo <mileage>
        if (text.startsWith("/odo")) {
            const parts = text.split(/\s+/).slice(1);
            if (parts.length < 1) {
                await sendMessage(chatId, "<b>Format:</b> <code>/odo 35400</code> to update current bike mileage.");
                return;
            }

            const newMileage = parseFloat(parts[0]);
            if (isNaN(newMileage) || newMileage <= 0) {
                await sendMessage(chatId, "⚠️ <b>Invalid mileage number.</b> Example: <code>/odo 35400</code>");
                return;
            }

            const today = new Date().toISOString().split("T")[0];
            await recordsCollection.insertOne({
                date: today,
                mileage: newMileage,
                oilChange: false,
                filterChange: false,
                type: "Odometer Sync",
                notes: "Mileage updated via Telegram Bot",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await sendMessage(chatId, `📍 <b>ODOMETER UPDATED TO ${newMileage.toLocaleString()} KM!</b>\nOil life countdown has been synchronized on Mission Control.`);
            return;
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

            await sendMessage(chatId, helpText);
            return;
        }

        // Fallback
        await sendMessage(chatId, `🤖 Command not recognized. Send <code>/status</code> or tap a button below:`);
    };

    console.log("Polling loop starting. Waiting for Telegram messages...");
    while (true) {
        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.result)) {
                for (const update of data.result) {
                    offset = update.update_id + 1;
                    await handleUpdate(update);
                }
            }
        } catch (err) {
            console.error("Polling error:", err.message);
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
}

run().catch(console.error);
