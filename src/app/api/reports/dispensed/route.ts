import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== "STAFF" && userRole !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const [requestRows, itemRows, medRows, userRows] = await Promise.all([
            readSheet("Requests!A2:J"), // A:ID, B:Email, ..., E:Status, ..., I:ProcessedAt, J:Area
            readSheet("RequestItems!A2:C"), // ReqID, MedID, Qty
            readSheet("Medications!A2:C"), // ID, Name, Unit
            readSheet("Users!A:B") // Email, Name
        ]);

        // Maps for O(1) lookup
        const medMap = new Map();
        medRows.forEach(row => medMap.set(row[0], { name: row[1], unit: row[2] }));

        const userMap = new Map();
        userRows.forEach(row => userMap.set(row[0], row[1]));

        const itemMap = new Map();
        itemRows.forEach(row => {
            const reqId = row[0];
            if (!itemMap.has(reqId)) itemMap.set(reqId, []);
            itemMap.get(reqId).push({ medId: row[1], qty: parseInt(row[2]) });
        });

        // Process Data
        const dispensedItems: any[] = [];

        requestRows.forEach(req => {
            const status = req[4];
            if (status !== "APPROVED") return;

            const reqId = req[0];
            const email = req[1];
            const requesterName = userMap.get(email) || email.split('@')[0];
            const date = req[8] || req[2]; // ProcessedAt > CreatedAt
            const area = req[9] || "UNKNOWN"; // Col J
            const items = itemMap.get(reqId) || [];

            items.forEach((it: any) => {
                const med = medMap.get(it.medId) || { name: it.medId, unit: "?" };
                dispensedItems.push({
                    id: `${reqId}-${it.medId}`, // Unique Key
                    requestId: reqId,
                    medicationName: med.name,
                    unit: med.unit,
                    quantity: it.qty,
                    requesterName: requesterName,
                    requesterEmail: email,
                    area: area,
                    date: date,
                    timestamp: new Date(date).getTime()
                });
            });
        });

        // Sort by date desc
        dispensedItems.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json(dispensedItems);

    } catch (error) {
        console.error("Error fetching dispensed report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
