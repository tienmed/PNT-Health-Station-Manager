import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets";

export async function GET() {
    try {
        const rows = await readSheet("Requests!A2:I");
        const now = new Date();

        const debugData = rows.map((row, index) => {
            const dateStr = row[2];
            let createdDate = null;
            let diffHours = -1;
            let willExpire = false;

            if (dateStr) {
                createdDate = new Date(dateStr);
                const diffMs = now.getTime() - createdDate.getTime();
                diffHours = diffMs / (1000 * 60 * 60);
                willExpire = diffHours > 24;
            }

            return {
                rowIndex: index + 2,
                id: row[0],
                status: row[4],
                rawDate: dateStr,
                parsedDate: createdDate ? createdDate.toISOString() : "INVALID",
                serverTime: now.toISOString(),
                diffHours: diffHours.toFixed(2),
                willExpire,
                isPending: row[4] === "PENDING"
            };
        });

        return NextResponse.json({
            serverTime: now.toString(),
            totalRows: rows.length,
            debugAnalysis: debugData
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.toString() });
    }
}
