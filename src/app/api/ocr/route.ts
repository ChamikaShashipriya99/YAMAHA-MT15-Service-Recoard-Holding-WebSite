import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import { parseDocumentIntelligence } from "@/lib/ocrDocumentParser";
import { verifyRequestSession } from "@/lib/auth";

// Cache worker singleton across server requests for instant OCR startup
let globalWorkerPromise: Promise<any> | null = null;

async function getOCRWorker() {
    if (!globalWorkerPromise) {
        globalWorkerPromise = createWorker("eng").catch((err) => {
            console.error("Failed to initialize Tesseract worker:", err);
            globalWorkerPromise = null;
            throw err;
        });
    }
    return await globalWorkerPromise;
}

export async function POST(req: NextRequest) {
    try {
        const session = await verifyRequestSession(req);
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized session" }, { status: 401 });
        }

        const body = await req.json();
        const { image, docType } = body;

        if (!image) {
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
        }

        let imageBuffer: Buffer;
        if (typeof image === "string" && image.startsWith("data:")) {
            const base64Data = image.split(",")[1];
            imageBuffer = Buffer.from(base64Data, "base64");
        } else if (typeof image === "string") {
            imageBuffer = Buffer.from(image, "base64");
        } else {
            return NextResponse.json({ success: false, error: "Invalid image format" }, { status: 400 });
        }

        // Optimize image for maximum OCR speed and contrast:
        // - Auto-orient EXIF
        // - Resize to 1000px width (optimal balance between speed and character legibility)
        // - Grayscale & normalize contrast to isolate text from yellow/colored backgrounds
        let processedBuffer: Buffer;
        try {
            processedBuffer = await sharp(imageBuffer)
                .rotate() // auto-orient based on EXIF
                .resize({ width: 1000, withoutEnlargement: true })
                .grayscale()
                .normalize()
                .png()
                .toBuffer();
        } catch {
            processedBuffer = imageBuffer;
        }

        const worker = await getOCRWorker();

        const recognizeTask = async () => {
            // Pass 1: standard upright image
            let result = await worker.recognize(processedBuffer);
            let text = result.data.text || "";
            let confidence = result.data.confidence || 85;
            let parsed = parseDocumentIntelligence(text, docType || "insurance", confidence);

            // Pass 2: If no dates detected, try 90-degree rotation (common for smartphone shots)
            if (!parsed.issueDate && !parsed.expiryDate) {
                try {
                    const rot90 = await sharp(processedBuffer).rotate(90).png().toBuffer();
                    const res90 = await worker.recognize(rot90);
                    const parsed90 = parseDocumentIntelligence(res90.data.text || "", docType || "insurance", res90.data.confidence || 85);

                    if (parsed90.issueDate || parsed90.expiryDate) {
                        parsed = parsed90;
                    }
                } catch (rotErr) {
                    console.warn("OCR rotation check failed:", rotErr);
                }
            }

            return parsed;
        };

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("OCR server processing limit reached")), 18000)
        );

        const parsed = await Promise.race([recognizeTask(), timeoutPromise]);

        return NextResponse.json({
            success: true,
            data: parsed,
        });
    } catch (err: any) {
        console.error("Server OCR Notice:", err.message || err);
        // Return baseline safe object so client finishes cleanly without hard error
        return NextResponse.json({
            success: true,
            data: {
                rawText: "",
                confidence: 0,
            },
        });
    }
}
