import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== "STAFF" && userRole !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");
        const type = searchParams.get("type") || "MEDICATIONS"; // MEDICATIONS | USERS

        if (!month || !year) {
            return NextResponse.json({ error: "Month and Year are required" }, { status: 400 });
        }

        // 1. Fetch Data
        const [requestRows, itemRows, medRows] = await Promise.all([
            readSheet("Requests!A2:I"),
            readSheet("RequestItems!A2:C"),
            readSheet("Medications!A2:C") // ID, Name, Unit
        ]);

        // 2. Maps
        const medMap = new Map(); // ID -> { name, unit }
        medRows.forEach(row => {
            medMap.set(row[0], { name: row[1], unit: row[2] });
        });

        const itemMap = new Map(); // RequestID -> [ { medId, qty } ]
        itemRows.forEach(row => {
            const reqId = row[0];
            if (!itemMap.has(reqId)) itemMap.set(reqId, []);
            itemMap.get(reqId).push({ medId: row[1], qty: parseInt(row[2]) });
        });

        // 3. Filter Requests by Date & Status
        // We look for APPROVED requests within the month based on ProcessedAt (Col I, index 8)
        // If ProcessedAt is missing, fallback to Date (Col C, index 2) although less accurate for dispensing time.
        const filteredRequests = requestRows.filter(row => {
            const status = row[4];
            if (status !== "APPROVED") return false;

            const dateStr = row[8] || row[2]; // ProcessedAt or Date
            if (!dateStr) return false;

            const date = new Date(dateStr);
            return date.getMonth() + 1 === month && date.getFullYear() === year;
        });

        let reportData = [];
        let sheetName = "Report";

        if (type === "MEDICATIONS") {
            // Group by Medication
            sheetName = `Thuốc_T${month}_${year}`;
            const medStats = new Map(); // MedID -> TotalQty

            filteredRequests.forEach(req => {
                const items = itemMap.get(req[0]) || [];
                items.forEach((it: any) => {
                    const current = medStats.get(it.medId) || 0;
                    medStats.set(it.medId, current + it.qty);
                });
            });

            reportData = Array.from(medStats.entries()).map(([medId, qty]) => {
                const info = medMap.get(medId) || { name: "Unknown", unit: "?" };
                return {
                    "Mã Thuốc": medId,
                    "Tên Thuốc": info.name,
                    "Đơn vị": info.unit,
                    "Tổng Đã Cấp": qty
                };
            });

            // Add header info
            if (reportData.length === 0) {
                reportData.push({ "Thông báo": "Không có dữ liệu cấp phát trong tháng này" });
            }

        } else {
            // Group by User (List of transactions)
            sheetName = `NguoiNhan_T${month}_${year}`;

            filteredRequests.forEach(req => {
                const reqId = req[0];
                const email = req[1];
                const processedAt = req[8] ? new Date(req[8]).toLocaleString("vi-VN") : "";
                const staffNote = req[7];
                const items = itemMap.get(reqId) || [];

                // Flatten items: One row per request? Or one row per item?
                // Plan said: Email | Name | Date | Medication x Qty | Staff | Note
                // Let's create a formatted string for Meds to keep 1 row per request, cleaner.
                const medsString = items.map((it: any) => {
                    const name = medMap.get(it.medId)?.name || it.medId;
                    return `${name} (${it.qty})`;
                }).join(", ");

                reportData.push({
                    "Thời gian cấp": processedAt,
                    "Người nhận (Email)": email,
                    "Đối tượng": req[6] === "STUDENT" ? "Sinh viên" : "Nhân viên",
                    "Danh sách thuốc": medsString,
                    "Ghi chú (Staff)": staffNote,
                    "Mã phiếu": reqId
                });
            });
            if (reportData.length === 0) {
                reportData.push({ "Thông báo": "Không có dữ liệu cấp phát trong tháng này" });
            }
        }

        // 4. Generate Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(reportData);

        // Auto-width (basic)
        const wscols = Object.keys(reportData[0] || {}).map(k => ({ wch: 20 }));
        worksheet['!cols'] = wscols;

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new Response(buf, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="BaoCao_${type}_T${month}_${year}.xlsx"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

    } catch (error: any) {
        console.error("Report generation error:", error);
        return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
}
