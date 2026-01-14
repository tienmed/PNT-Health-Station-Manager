import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Staff or Admin can view reports
    const userRole = (session.user as any).role;
    if (userRole !== "STAFF" && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM

    if (!month) {
        return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });
    }

    try {
        // 1. Fetch all necessary data
        const [requestRows, itemRows, medRows] = await Promise.all([
            readSheet("Requests!A2:F"),     // RequestID, UserEmail, Date, Type, Status, Note
            readSheet("RequestItems!A2:C"), // RequestID, MedicationID, Quantity
            readSheet("Medications!A2:B")   // ID, Name
        ]);

        // 2. Index Helpers
        // RequestItems: Map RequestID -> Array of Items { medId, qty }
        const itemsByRequest = new Map<string, { medId: string; qty: number }[]>();
        itemRows.forEach(row => {
            const reqId = row[0];
            const data = { medId: row[1], qty: parseInt(row[2] || "0") };
            if (!itemsByRequest.has(reqId)) {
                itemsByRequest.set(reqId, []);
            }
            itemsByRequest.get(reqId)?.push(data);
        });

        // Medications: Map MedID -> Name
        const medMap = new Map<string, string>();
        medRows.forEach(row => {
            medMap.set(row[0], row[1]);
        });

        // 3. Filter and Aggregate
        // We want requests where:
        // - Date starts with 'month' (YYYY-MM)
        // - Status is 'APPROVED'
        
        type ReportEntry = {
            date: string;
            medicationName: string;
            quantity: number;
            note: string;
        };

        type EmployeeReport = {
            email: string;
            totalItems: number;
            details: ReportEntry[];
        };

        // Map Email -> EmployeeReport
        const reportMap = new Map<string, EmployeeReport>();

        requestRows.forEach(row => {
            const [requestId, email, date, type, status, note] = row;

            if (status !== "APPROVED") return;
            if (!date.startsWith(month)) return;

            const items = itemsByRequest.get(requestId) || [];
            
            if (!reportMap.has(email)) {
                reportMap.set(email, {
                    email,
                    totalItems: 0,
                    details: []
                });
            }

            const employeeReport = reportMap.get(email)!;

            items.forEach(item => {
                employeeReport.totalItems += item.qty;
                employeeReport.details.push({
                    date,
                    medicationName: medMap.get(item.medId) || "Unknown",
                    quantity: item.qty,
                    note: note || ""
                });
            });
        });

        // Convert Map to Array
        const reportList = Array.from(reportMap.values());

        // Sort by Email (optional)
        reportList.sort((a, b) => a.email.localeCompare(b.email));

        return NextResponse.json(reportList);

    } catch (error) {
        console.error("Error generating report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
