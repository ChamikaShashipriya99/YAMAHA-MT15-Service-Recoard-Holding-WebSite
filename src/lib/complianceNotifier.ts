"use client";

export type NotificationMilestone = "30_DAYS" | "15_DAYS" | "5_DAYS" | "EXPIRED" | "NOMINAL";

export type DocumentType = "insurance" | "revenueLicense" | "emissionTest";

export interface ComplianceNotificationItem {
    id: string;
    type: DocumentType;
    title: string;
    shortName: string;
    milestone: NotificationMilestone;
    stageNumber: 1 | 2 | 3 | 0; // 1=30d, 2=15d, 3=5d, 0=expired
    stageLabel: string;
    daysRemaining: number;
    expiryDate: string;
    message: string;
    severity: "info" | "warning" | "urgent" | "critical";
    documentNumber?: string;
    provider?: string;
}

/**
 * Maps days remaining to the 3-stage milestone model:
 * - Stage 1: Exactly 1 month before due (16 to 30 days)
 * - Stage 2: 15 days before due (6 to 15 days)
 * - Stage 3: 5 days before due (0 to 5 days)
 * - Overdue: < 0 days (Expired)
 */
export function getComplianceMilestone(daysRemaining: number): NotificationMilestone {
    if (daysRemaining < 0) return "EXPIRED";
    if (daysRemaining <= 5) return "5_DAYS";
    if (daysRemaining <= 15) return "15_DAYS";
    if (daysRemaining <= 30) return "30_DAYS";
    return "NOMINAL";
}

/**
 * Builds metadata for a given compliance document and its days remaining
 */
export function buildNotificationItem(
    type: DocumentType,
    title: string,
    shortName: string,
    expiryDate: string,
    daysRemaining: number,
    extra?: { documentNumber?: string; provider?: string }
): ComplianceNotificationItem | null {
    const milestone = getComplianceMilestone(daysRemaining);
    if (milestone === "NOMINAL") return null;

    let stageNumber: 1 | 2 | 3 | 0 = 0;
    let stageLabel = "";
    let message = "";
    let severity: "info" | "warning" | "urgent" | "critical" = "info";

    switch (milestone) {
        case "EXPIRED":
            stageNumber = 0;
            stageLabel = "COMPLIANCE EXPIRED";
            severity = "critical";
            message = `${title} expired on ${expiryDate} (${Math.abs(daysRemaining)} days ago). Operating vehicle with expired papers is legally prohibited!`;
            break;
        case "5_DAYS":
            stageNumber = 3;
            stageLabel = "STAGE 3: 5-DAY FINAL NOTICE";
            severity = "urgent";
            message = `FINAL WARNING: ${title} expires in ${daysRemaining} day(s) on ${expiryDate}. Immediate renewal mandatory!`;
            break;
        case "15_DAYS":
            stageNumber = 2;
            stageLabel = "STAGE 2: 15-DAY NOTICE";
            severity = "warning";
            message = `URGENT: ${title} renewal due in ${daysRemaining} days on ${expiryDate}. Schedule inspection or submit road tax.`;
            break;
        case "30_DAYS":
            stageNumber = 1;
            stageLabel = "STAGE 1: 30-DAY NOTICE";
            severity = "info";
            message = `ADVANCE REMINDER: ${title} renewal is coming up in ${daysRemaining} days on ${expiryDate} (1 month notice).`;
            break;
    }

    return {
        id: `${type}_${milestone}_${expiryDate}`,
        type,
        title,
        shortName,
        milestone,
        stageNumber,
        stageLabel,
        daysRemaining,
        expiryDate,
        message,
        severity,
        documentNumber: extra?.documentNumber,
        provider: extra?.provider,
    };
}

/**
 * Evaluates compliance data and returns all active notification items
 */
export function evaluateAllComplianceNotices(complianceData: any): ComplianceNotificationItem[] {
    if (!complianceData?.compliance || !complianceData?.computed) return [];

    const { compliance, computed } = complianceData;
    const notices: ComplianceNotificationItem[] = [];

    // 1. Insurance
    if (compliance.insurance?.expiryDate && computed.insurance) {
        const item = buildNotificationItem(
            "insurance",
            "Vehicle Insurance",
            "Insurance",
            compliance.insurance.expiryDate,
            computed.insurance.daysRemaining,
            {
                documentNumber: compliance.insurance.policyNumber,
                provider: compliance.insurance.provider,
            }
        );
        if (item) notices.push(item);
    }

    // 2. Revenue License
    if (compliance.revenueLicense?.expiryDate && computed.revenueLicense) {
        const item = buildNotificationItem(
            "revenueLicense",
            "Revenue License (Road Tax)",
            "Road Tax",
            compliance.revenueLicense.expiryDate,
            computed.revenueLicense.daysRemaining,
            {
                documentNumber: compliance.revenueLicense.licenseNumber,
                provider: compliance.revenueLicense.provincialCouncil,
            }
        );
        if (item) notices.push(item);
    }

    // 3. Emission Test
    if (compliance.emissionTest?.expiryDate && computed.emissionTest) {
        const item = buildNotificationItem(
            "emissionTest",
            "Vehicle Emission Test (VET)",
            "Emission Test",
            compliance.emissionTest.expiryDate,
            computed.emissionTest.daysRemaining,
            {
                documentNumber: compliance.emissionTest.certificateNumber,
                provider: compliance.emissionTest.testCenter,
            }
        );
        if (item) notices.push(item);
    }

    // Sort by severity: critical > urgent > warning > info
    const severityOrder = { critical: 0, urgent: 1, warning: 2, info: 3 };
    return notices.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Checks if browser push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "Notification" in window;
}

/**
 * Gets current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
    if (!isPushNotificationSupported()) return "unsupported";
    return Notification.permission;
}

/**
 * Requests native notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!isPushNotificationSupported()) return "unsupported";
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (err) {
        console.warn("Failed to request notification permission:", err);
        return Notification.permission;
    }
}

/**
 * Triggers a native browser notification via Service Worker or Notification API
 */
export async function sendNativeNotification(
    title: string,
    options: {
        body: string;
        tag?: string;
        icon?: string;
        badge?: string;
        data?: any;
    }
): Promise<boolean> {
    if (!isPushNotificationSupported()) return false;
    if (Notification.permission !== "granted") return false;

    const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || "/icon-192.png",
        badge: options.badge || "/favicon.png",
        tag: options.tag || "mt15_compliance",
        data: options.data,
    };

    try {
        // Prefer service worker registration for richer mobile PWA push notification
        if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && "showNotification" in registration) {
                await registration.showNotification(title, notificationOptions);
                return true;
            }
        }

        // Fallback to desktop Notification constructor
        new Notification(title, notificationOptions);
        return true;
    } catch (err) {
        console.error("Error displaying native notification:", err);
        return false;
    }
}

/**
 * Anti-Spam Notifier:
 * Inspects all active notices and sends push notifications ONLY IF they have not been
 * sent yet for this exact document, milestone, and expiry date.
 */
export async function dispatchCompliancePushAlerts(complianceData: any): Promise<number> {
    if (!isPushNotificationSupported() || Notification.permission !== "granted") {
        return 0;
    }

    const notices = evaluateAllComplianceNotices(complianceData);
    let dispatchedCount = 0;

    for (const notice of notices) {
        const storageKey = `mt15_notified_${notice.type}_${notice.milestone}_${notice.expiryDate}`;
        if (typeof window !== "undefined") {
            const alreadySent = localStorage.getItem(storageKey);
            if (alreadySent) {
                continue; // Skip, already notified at this milestone
            }

            let pushTitle = "";
            switch (notice.milestone) {
                case "EXPIRED":
                    pushTitle = `🚨 [EXPIRED] ${notice.shortName} Past Due!`;
                    break;
                case "5_DAYS":
                    pushTitle = `⚠️ [FINAL NOTICE] ${notice.shortName} Due in ${notice.daysRemaining} Days!`;
                    break;
                case "15_DAYS":
                    pushTitle = `🔔 [15-Day Notice] ${notice.shortName} Due Soon`;
                    break;
                case "30_DAYS":
                    pushTitle = `📅 [30-Day Reminder] ${notice.shortName} Renewal Window Open`;
                    break;
            }

            const success = await sendNativeNotification(pushTitle, {
                body: notice.message,
                tag: notice.id,
                data: { url: "/" },
            });

            if (success) {
                localStorage.setItem(storageKey, new Date().toISOString());
                dispatchedCount++;
            }
        }
    }

    return dispatchedCount;
}

/**
 * Triggers an immediate test notification to verify push alert mechanics
 */
export async function triggerTestPushNotification(): Promise<boolean> {
    const perm = await requestNotificationPermission();
    if (perm !== "granted") {
        return false;
    }

    return await sendNativeNotification("Yamaha MT-15 // Telemetry Alert", {
        body: "3-Stage Compliance Notification System online. You will receive alerts at 30-days, 15-days, and 5-days before due dates.",
        tag: `test_alert_${Date.now()}`,
    });
}
