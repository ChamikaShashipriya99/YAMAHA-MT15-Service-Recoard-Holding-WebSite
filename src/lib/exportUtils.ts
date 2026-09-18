import { ServiceRecord } from "@/context/ServiceContext";

/**
 * Exports service records as an Excel-compatible CSV file
 */
export function exportToCSV(records: ServiceRecord[]) {
    if (!records || records.length === 0) return;

    const headers = [
        "Date",
        "Odometer (KM)",
        "Service Type",
        "Engine Oil Changed",
        "Oil Filter Changed",
        "Cost",
        "Notes",
    ];

    const rows = records.map((r) => {
        const escapeCsv = (val: string | number | boolean | undefined) => {
            if (val === undefined || val === null) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        return [
            escapeCsv(r.date),
            escapeCsv(r.mileage),
            escapeCsv(r.type || "Maintenance"),
            escapeCsv(r.oilChange ? "YES" : "NO"),
            escapeCsv(r.filterChange ? "YES" : "NO"),
            escapeCsv(r.cost || "0"),
            escapeCsv(r.notes || ""),
        ].join(",");
    });

    // \uFEFF for UTF-8 BOM so Excel opens special characters correctly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `yamaha_mt15_service_records_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Exports service records as a JSON telemetry backup
 */
export function exportToJSON(records: ServiceRecord[]) {
    if (!records || records.length === 0) return;

    const backupData = {
        metadata: {
            application: "Yamaha MT-15 Cockpit Telemetry",
            version: "1.0",
            exportDate: new Date().toISOString(),
            totalRecords: records.length,
        },
        records,
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `yamaha_mt15_telemetry_backup_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generates and triggers a formatted printable PDF maintenance dossier
 */
export function exportToPDF(
    records: ServiceRecord[],
    stats: { totalSpent: number; currentMileage: number; totalRecords: number }
) {
    if (!records || records.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Please allow popups to generate the printable maintenance dossier.");
        return;
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const rowsHtml = records
        .map(
            (r, index) => `
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; color: #0f172a; text-align: center;">${index + 1}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 600; color: #0f172a;">${r.date}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: bold; color: #0284c7;">${r.mileage.toLocaleString()} KM</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                <span style="background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #334155;">${r.type || "Maintenance"}</span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
                ${r.oilChange ? '<span style="color: #059669; font-weight: bold;">✔ YES</span>' : '<span style="color: #94a3b8;">—</span>'}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
                ${r.filterChange ? '<span style="color: #059669; font-weight: bold;">✔ YES</span>' : '<span style="color: #94a3b8;">—</span>'}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${r.cost ? `Rs. ${r.cost}` : "—"}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; max-width: 200px;">${r.notes || "—"}</td>
        </tr>
    `
        )
        .join("");

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Yamaha MT-15 Service Dossier // ${dateStr}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            color: #090e17;
            margin: 0 0 4px 0;
        }
        .subtitle {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #0284c7;
            margin: 0;
        }
        .meta-box {
            text-align: right;
            font-size: 11px;
            color: #64748b;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
        }
        .stat-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
        }
        .stat-val {
            font-size: 20px;
            font-weight: 800;
            font-family: monospace;
            color: #0f172a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
        }
        th.text-center { text-align: center; }
        th.text-right { text-align: right; }
        .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #94a3b8;
        }
        .stamp {
            display: inline-block;
            border: 1.5px dashed #0284c7;
            padding: 6px 14px;
            border-radius: 6px;
            color: #0284c7;
            font-weight: 800;
            font-size: 10px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">YAMAHA MT-15 // SERVICE RECORD</h1>
            <p class="subtitle">Official Maintenance Dossier & Telemetry Archive</p>
        </div>
        <div class="meta-box">
            <div><strong>Date of Export:</strong> ${dateStr}</div>
            <div><strong>Model:</strong> Yamaha MT-15 (155cc VVA)</div>
            <div><strong>Status:</strong> Active Telemetry Log</div>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Verified Services</div>
            <div class="stat-val">${stats.totalRecords} Entries</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Current Odometer</div>
            <div class="stat-val">${stats.currentMileage.toLocaleString()} KM</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Maintenance Spend</div>
            <div class="stat-val">Rs. ${stats.totalSpent.toLocaleString()}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th>Date</th>
                <th>Mileage</th>
                <th>Type</th>
                <th class="text-center">Engine Oil</th>
                <th class="text-center">Oil Filter</th>
                <th class="text-right">Cost (Rs)</th>
                <th>Mechanic / Service Notes</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml}
        </tbody>
    </table>

    <div class="footer">
        <div>Generated by Yamaha MT-15 Cockpit Telemetry Console</div>
        <div class="stamp">OFFICIAL TELEMETRY ARCHIVE // VERIFIED</div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}