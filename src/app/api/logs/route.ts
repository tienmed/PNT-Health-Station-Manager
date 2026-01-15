import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role === "EMPLOYEE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const rows = await readSheet("Logs!A2:D");
        // Rows: Timestamp, Email, Action, Details

        const logs = rows.map((row, index) => ({
            id: index,
            timestamp: row[0],
            email: row[1],
            action: row[2],
            details: row[3]
        }));

        return NextResponse.json(logs.reverse()); // Newest first
    } catch (error) {
        console.error("Error fetching logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
