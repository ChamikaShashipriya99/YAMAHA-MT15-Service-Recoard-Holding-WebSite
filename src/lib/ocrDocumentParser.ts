import { createWorker } from "tesseract.js";

export interface ParsedDocumentData {
    rawText: string;
    detectedDocType?: "insurance" | "revenue" | "emission";
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
 * Pre-cleans common OCR digit confusions (e.g., letter 'O'/'o' for '0', 'l'/'I' for '1')
 */
export function cleanOcrDateText(text: string): string {
    let t = text;
    // Replace 'O' or 'o' in year-like tokens: 2O25, 2O26, 202O
    t = t.replace(/\b2[oO](2[0-9]|3[0-9])\b/g, (m, g1) => "20" + g1);
    t = t.replace(/\b(20[2-3])[oO]\b/g, (m, g1) => g1 + "0");
    // Replace 'O' or 'o' in month/day: O1..O9
    t = t.replace(/([\/\-\.\s])[oO]([0-9])/g, (m, g1, g2) => g1 + "0" + g2);
    t = t.replace(/([0-9])[oO]([\/\-\.\s])/g, (m, g1, g2) => g1 + "0" + g2);
    // Replace letter l or I when in date context (e.g. I5/03/2025 or /0I/)
    t = t.replace(/(^|[\/\-\.\s])[lI]([0-9])/g, (m, g1, g2) => g1 + "1" + g2);
    t = t.replace(/([0-9])[lI]([\/\-\.\s])/g, (m, g1, g2) => g1 + "1" + g2);
    return t;
}

/**
 * Extracts all recognizable calendar dates from OCR text and converts to strict YYYY-MM-DD.
 * Tolerant of whitespace around slashes/dashes/dots, 2-digit years, and text months.
 */
export function extractDatesFromText(rawText: string): Array<{ dateStr: string; raw: string; index: number }> {
    const text = cleanOcrDateText(rawText);
    const results: Array<{ dateStr: string; raw: string; index: number }> = [];

    function addDate(y: string, m: string, d: string, raw: string, idx: number) {
        let yearNum = parseInt(y, 10);
        if (yearNum < 100) {
            // 2-digit year: 20-40 => 2020-2040, 50-99 => 1950-1999
            yearNum = yearNum >= 50 ? 1900 + yearNum : 2000 + yearNum;
        }
        const monthNum = parseInt(m, 10);
        const dayNum = parseInt(d, 10);

        if (yearNum >= 2000 && yearNum <= 2040 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
            const formatted = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            results.push({ dateStr: formatted, raw: raw.trim(), index: idx });
        }
    }

    // Pattern 1: DD / MM / YYYY or DD / MM / YY (with optional spaces around / - .)
    const dmyRegex = /(?:^|[^\d])([0-3]?[0-9])\s*[\/\-\.]\s*([0-1]?[0-9])\s*[\/\-\.]\s*(20[2-3][0-9]|[2-3][0-9])(?!\d)/g;
    let match;
    while ((match = dmyRegex.exec(text)) !== null) {
        addDate(match[3], match[2], match[1], match[0], match.index);
    }

    // Pattern 2: YYYY / MM / DD or YY / MM / DD
    const ymdRegex = /(?:^|[^\d])(20[2-3][0-9]|[2-3][0-9])\s*[\/\-\.]\s*([0-1]?[0-9])\s*[\/\-\.]\s*([0-3]?[0-9])(?!\d)/g;
    while ((match = ymdRegex.exec(text)) !== null) {
        addDate(match[1], match[2], match[3], match[0], match.index);
    }

    // Pattern 3: DD MMM YYYY or DD-MMM-YYYY or DD MMM YY
    const textMonthRegex = /(?:^|[^\d])([0-3]?[0-9])\s*[\s\-\/\.]\s*([A-Za-z]{3,9})\s*[\s\-\/\.]\s*(20[2-3][0-9]|[2-3][0-9])(?!\d)/g;
    while ((match = textMonthRegex.exec(text)) !== null) {
        const mon = MONTH_MAP[match[2].toLowerCase()];
        if (mon) {
            addDate(match[3], mon, match[1], match[0], match.index);
        }
    }

    // Pattern 4: MMM DD, YYYY or MMM DD YYYY
    const monthFirstRegex = /([A-Za-z]{3,9})\s+([0-3]?[0-9])(?:st|nd|rd|th)?,?\s+(20[2-3][0-9]|[2-3][0-9])(?!\d)/g;
    while ((match = monthFirstRegex.exec(text)) !== null) {
        const mon = MONTH_MAP[match[1].toLowerCase()];
        if (mon) {
            addDate(match[3], mon, match[2], match[0], match.index);
        }
    }

    // Deduplicate preserving order of appearance
    const unique: Array<{ dateStr: string; raw: string; index: number }> = [];
    const seen = new Set<string>();
    for (const item of results) {
        if (!seen.has(item.dateStr)) {
            seen.add(item.dateStr);
            unique.push(item);
        }
    }

    return unique;
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

    // Detect document type cross-reference
    const isRevenue = /revenue|licence|provincial|motor traffic|western prov|southern prov|central prov|wayamba|sabaragamuwa|rl-|ds division|tax sticker/i.test(text);
    const isInsurance = /insurance|policy|ceylinco|allianz|slic|fairfirst|cover note|hnb assurance|aia insurance|third party/i.test(text);
    const isEmission = /emission|drivegreen|cleanco|laugfs|smoke|eco sri|exhaust|gas analyzer|idle rpm/i.test(text);

    let detectedDocType: "insurance" | "revenue" | "emission" | undefined;
    if (isRevenue && !isInsurance && !isEmission) detectedDocType = "revenue";
    else if (isInsurance && !isRevenue && !isEmission) detectedDocType = "insurance";
    else if (isEmission && !isInsurance && !isRevenue) detectedDocType = "emission";

    // 1. DATES CLASSIFICATION (Issue Date vs Expiry Due Date)
    if (dates.length >= 2) {
        // Find proximity to keywords
        let bestFrom: string | undefined;
        let bestTo: string | undefined;

        for (const d of dates) {
            const windowStart = Math.max(0, d.index - 60);
            const contextBefore = text.slice(windowStart, d.index).toLowerCase();

            if (/from|period of|period|commencement|effective|issue|start|tested|test date|date of issue/.test(contextBefore)) {
                bestFrom = d.dateStr;
            } else if (/to|valid until|valid to|valid thru|expiry|expires|till|expiration|due|valid up to/.test(contextBefore)) {
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
        const contextBefore = text.slice(Math.max(0, d.index - 60), d.index).toLowerCase();
        if (/expiry|expires|valid to|valid until|valid up to|till|due|to\b/.test(contextBefore)) {
            expiryDate = d.dateStr;
            // Infer issue date as 1 year earlier (+1 day for annual document cycle)
            const dt = new Date(d.dateStr);
            dt.setFullYear(dt.getFullYear() - 1);
            dt.setDate(dt.getDate() + 1);
            issueDate = dt.toISOString().split("T")[0];
        } else {
            issueDate = d.dateStr;
            // Infer expiry date as 1 year later (-1 day for annual document cycle)
            const dt = new Date(d.dateStr);
            dt.setFullYear(dt.getFullYear() + 1);
            dt.setDate(dt.getDate() - 1);
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
        detectedDocType,
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
 * Runs OCR on an image file or base64 data URL with dual-engine reliability:
 * 1. Attempts fast client-side WebAssembly OCR.
 * 2. If client-side worker fails or extracts no dates, seamlessly falls back to server-side engine (/api/ocr)
 *    which utilizes sharp image preprocessing and multi-angle orientation detection.
 */
export async function scanDocumentWithOCR(
    imageInput: File | string,
    docType: "insurance" | "revenue" | "emission",
    onProgress?: (progressPercent: number, statusText: string) => void
): Promise<ParsedDocumentData> {
    onProgress?.(10, "Initializing AI Vision Engine...");

    try {
        // Attempt Client-Side OCR first
        const worker = await createWorker("eng", 1, {
            logger: (m) => {
                if (m.status === "recognizing text") {
                    const pct = Math.round(30 + (m.progress || 0) * 55);
                    onProgress?.(pct, `Scanning Document (${Math.round((m.progress || 0) * 100)}%)...`);
                }
            },
        });

        try {
            onProgress?.(30, "Analyzing Document Structure...");
            const result = await worker.recognize(imageInput);
            const text = result.data.text || "";
            const confidence = result.data.confidence || 85;

            onProgress?.(90, "Extracting Dates, Status & Policy Numbers...");
            const parsed = parseDocumentIntelligence(text, docType, confidence);

            // If client OCR found dates, return immediately.
            // If zero dates found, trigger server AI vision fallback for advanced rotation & sharp contrast
            if (parsed.issueDate || parsed.expiryDate) {
                onProgress?.(100, "Extraction Complete!");
                return parsed;
            }

            console.warn("Client OCR found 0 dates. Engaging Server AI Vision fallback...");
            throw new Error("Client OCR found no dates; trying Server AI Vision with rotation");
        } finally {
            await worker.terminate();
        }
    } catch (clientErr) {
        console.warn("Client-side OCR delegating to Server AI Vision fallback:", clientErr);
        onProgress?.(45, "Engaging Server AI Vision...");

        let dataUrl: string;
        if (typeof imageInput === "string") {
            dataUrl = imageInput;
        } else {
            // Convert file to base64 Data URL
            dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(imageInput);
            });
        }

        onProgress?.(65, "Server AI analyzing document...");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s safety headroom

        try {
            const res = await fetch("/api/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataUrl, docType }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            onProgress?.(85, "Processing document intelligence...");

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Document scan failed on server");
            }

            onProgress?.(100, "Extraction Complete!");
            return data.data;
        } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            console.warn("Server OCR fetch failed or timed out:", fetchErr);
            // Return baseline safe object so UI completes smoothly without hanging
            onProgress?.(100, "Scan finished");
            return {
                rawText: "",
                confidence: 0,
            };
        }
    }
}
