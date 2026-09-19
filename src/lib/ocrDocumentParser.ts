import { createWorker } from "tesseract.js";

export interface ParsedDocumentData {
    rawText: string;
    issueDate?: string; // YYYY-MM-DD
    expiryDate?: string; // YYYY-MM-DD
    status?: "PASS" | "FAIL" | "PENDING";
    documentNumber?: string;
    providerOrCenter?: string;
    secondaryInfo?: string;
    previewUrl?: string;
    confidence: number;
}

const MONTH_MAP: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
};

/**
 * Extracts all recognizable calendar dates from OCR text and converts to YYYY-MM-DD
 */
export function extractDatesFromText(text: string): Array<{ dateStr: string; raw: string; index: number }> {
    const results: Array<{ dateStr: string; raw: string; index: number }> = [];

    // Pattern 1: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const dmyRegex = /\b([0-3]?[0-9])[\/\-\.]([0-1]?[0-9])[\/\-\.](20[2-3][0-9])\b/g;
    let match;
    while ((match = dmyRegex.exec(text)) !== null) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        const year = match[3];
        if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
            results.push({
                dateStr: `${year}-${month}-${day}`,
                raw: match[0],
                index: match.index,
            });
        }
    }

    // Pattern 2: YYYY-MM-DD, YYYY/MM/DD
    const ymdRegex = /\b(20[2-3][0-9])[\/\-\.]([0-1]?[0-9])[\/\-\.]([0-3]?[0-9])\b/g;
    while ((match = ymdRegex.exec(text)) !== null) {
        const year = match[1];
        const month = match[2].padStart(2, "0");
        const day = match[3].padStart(2, "0");
        if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
            results.push({
                dateStr: `${year}-${month}-${day}`,
                raw: match[0],
                index: match.index,
            });
        }
    }

    // Pattern 3: Textual months e.g. 15 March 2026 or 15-Mar-2026
    const textMonthRegex = /\b([0-3]?[0-9])[\s\-\/]([A-Za-z]{3,9})[\s\-\/,]+(20[2-3][0-9])\b/g;
    while ((match = textMonthRegex.exec(text)) !== null) {
        const day = match[1].padStart(2, "0");
        const monthName = match[2].toLowerCase();
        const year = match[3];
        const monthNum = MONTH_MAP[monthName];
        if (monthNum && Number(day) >= 1 && Number(day) <= 31) {
            results.push({
                dateStr: `${year}-${monthNum}-${day}`,
                raw: match[0],
                index: match.index,
            });
        }
    }

    // Filter out duplicates
    const uniqueMap = new Map<string, { dateStr: string; raw: string; index: number }>();
    for (const item of results) {
        if (!uniqueMap.has(item.dateStr)) {
            uniqueMap.set(item.dateStr, item);
        }
    }

    return Array.from(uniqueMap.values());
}

/**
 * Parses OCR text specifically according to document type (Insurance, Revenue License, Emission Test)
 */
export function parseDocumentIntelligence(
    text: string,
    docType: "insurance" | "revenue" | "emission",
    confidence: number = 90
): ParsedDocumentData {
    const dates = extractDatesFromText(text);
    let issueDate: string | undefined;
    let expiryDate: string | undefined;
    let documentNumber: string | undefined;
    let providerOrCenter: string | undefined;
    let secondaryInfo: string | undefined;
    let status: "PASS" | "FAIL" | "PENDING" | undefined;

    const lowerText = text.toLowerCase();

    // 1. DATES CLASSIFICATION (Issue Date vs Expiry Due Date)
    if (dates.length >= 2) {
        // Find proximity to "from", "issue", "start" vs "to", "expiry", "valid until"
        let bestFrom: string | undefined;
        let bestTo: string | undefined;

        for (const d of dates) {
            const windowStart = Math.max(0, d.index - 50);
            const contextBefore = text.slice(windowStart, d.index).toLowerCase();

            if (/from|period of|commencement|effective|issue|start|tested|test date/.test(contextBefore)) {
                bestFrom = d.dateStr;
            } else if (/to|valid until|valid to|expiry|expires|till|expiration|due/.test(contextBefore)) {
                bestTo = d.dateStr;
            }
        }

        if (bestFrom && bestTo && bestFrom !== bestTo) {
            issueDate = bestFrom;
            expiryDate = bestTo;
        } else {
            // Sort chronologically: earlier date is issue date, later date is expiry date
            dates.sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
            issueDate = dates[0].dateStr;
            expiryDate = dates[dates.length - 1].dateStr;
        }
    } else if (dates.length === 1) {
        // Single date found: determine if it's an expiry date or issue date
        const d = dates[0];
        const contextBefore = text.slice(Math.max(0, d.index - 50), d.index).toLowerCase();
        if (/expiry|expires|valid to|valid until|to\b/.test(contextBefore)) {
            expiryDate = d.dateStr;
            // Infer issue date as 1 year earlier for standard annual documents
            const dt = new Date(d.dateStr);
            dt.setFullYear(dt.getFullYear() - 1);
            issueDate = dt.toISOString().split("T")[0];
        } else {
            issueDate = d.dateStr;
            // Infer expiry date as 1 year later
            const dt = new Date(d.dateStr);
            dt.setFullYear(dt.getFullYear() + 1);
            expiryDate = dt.toISOString().split("T")[0];
        }
    }

    // 2. DOCUMENT TYPE-SPECIFIC EXTRACTIONS
    if (docType === "insurance") {
        // Check for Insurance Provider
        if (/ceylinco/i.test(text)) providerOrCenter = "Ceylinco VIP";
        else if (/sri lanka insurance|slic/i.test(text)) providerOrCenter = "Sri Lanka Insurance";
        else if (/allianz/i.test(text)) providerOrCenter = "Allianz Insurance";
        else if (/fairfirst/i.test(text)) providerOrCenter = "Fairfirst Insurance";
        else if (/aia/i.test(text)) providerOrCenter = "AIA Insurance";
        else if (/hnb assurance/i.test(text)) providerOrCenter = "HNB Assurance";
        else if (/people's insurance|peoples insurance/i.test(text)) providerOrCenter = "People's Insurance";
        else if (/amana/i.test(text)) providerOrCenter = "Amana Takaful";
        else if (/co-operative|sanasa/i.test(text)) providerOrCenter = "Co-operative Insurance";

        // Check for Policy Number
        const polMatch = text.match(/(?:Policy|Certificate|Cover Note)\s*(?:No|Number|#)?[:.\s-]*([A-Z0-9\/-]{7,25})/i);
        if (polMatch) {
            documentNumber = polMatch[1].trim();
        }

        // Coverage Type
        if (/third party/i.test(text)) {
            secondaryInfo = "Third Party Only";
        } else if (/comprehensive|full/i.test(text)) {
            secondaryInfo = "Comprehensive (Full)";
        }
    } else if (docType === "revenue") {
        // Check for Province
        if (/western/i.test(text)) secondaryInfo = "Western Province";
        else if (/southern/i.test(text)) secondaryInfo = "Southern Province";
        else if (/central/i.test(text)) secondaryInfo = "Central Province";
        else if (/north western|wayamba/i.test(text)) secondaryInfo = "North Western Province";
        else if (/sabaragamuwa/i.test(text)) secondaryInfo = "Sabaragamuwa Province";
        else if (/eastern/i.test(text)) secondaryInfo = "Eastern Province";

        // Check for License Number (e.g. WP-RL-2026-...)
        const licMatch = text.match(/(?:License|Certificate|RL)\s*(?:No|Number|#)?[:.\s-]*([A-Z0-9\/-]{6,20})/i);
        if (licMatch) {
            documentNumber = licMatch[1].trim();
        }
    } else if (docType === "emission") {
        // Check for Testing Center
        if (/drivegreen|cleanco/i.test(text)) providerOrCenter = "DriveGreen (CleanCo)";
        else if (/laugfs|eco sri/i.test(text)) providerOrCenter = "Laugfs Eco Sri";

        // Check for Certificate Number
        const certMatch = text.match(/(?:Certificate|Cert|VET)\s*(?:No|Number|#)?[:.\s-]*([A-Z0-9\/-]{6,20})/i);
        if (certMatch) {
            documentNumber = certMatch[1].trim();
        }

        // Status
        if (/pass|passed|satisfactory/i.test(text)) {
            status = "PASS";
        } else if (/fail|failed|unsatisfactory/i.test(text)) {
            status = "FAIL";
        } else {
            status = "PASS"; // Default to pass if emission test was completed
        }
    }

    return {
        rawText: text,
        issueDate,
        expiryDate,
        status,
        documentNumber,
        providerOrCenter,
        secondaryInfo,
        confidence,
    };
}

/**
 * Runs client-side Tesseract.js worker on an image file with real-time progress updates
 */
export async function scanDocumentWithOCR(
    imageFile: File,
    docType: "insurance" | "revenue" | "emission",
    onProgress?: (progressPercent: number, statusText: string) => void
): Promise<ParsedDocumentData> {
    onProgress?.(10, "Initializing OCR Engine...");

    const worker = await createWorker("eng");

    try {
        onProgress?.(30, "Analyzing Document Structure & Text...");

        const result = await worker.recognize(imageFile);
        const text = result.data.text || "";
        const confidence = result.data.confidence || 85;

        onProgress?.(85, "Extracting Dates, Status & Policy Numbers...");

        const parsed = parseDocumentIntelligence(text, docType, confidence);

        onProgress?.(100, "Extraction Complete!");
        return parsed;
    } finally {
        await worker.terminate();
    }
}
