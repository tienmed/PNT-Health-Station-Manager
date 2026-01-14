import { NextResponse } from "next/server";
import { readSheet, appendRow, updateRow } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const rows = await readSheet("Medications!A2:E");

        const medications = rows.map((row) => ({
            id: row[0],
            name: row[1],
            unit: row[2],
            stock: parseInt(row[3] || "0", 10),
            minThreshold: parseInt(row[4] || "0", 10),
        }));

        return NextResponse.json(medications);
    } catch (error) {
        console.error("Error fetching medications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    // Only STAFF/ADMIN can manage stock
    if (!session || (session.user as any).role === "EMPLOYEE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, name, unit, stock, minThreshold } = body;

        if (!id || !name || stock === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Append to Medications Sheet
        await appendRow("Medications!A:E", [
            id,
            name,
            unit || "units",
            stock.toString(),
            minThreshold?.toString() || "0",
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adding medication:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role === "EMPLOYEE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, stock } = body;

        if (!id || stock === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Find the row index for this medication ID
        const rows = await readSheet("Medications!A:A"); // Fetch IDs only to find row
        // Note: if A:A includes header (A1), then index 0 is header.
        const rowIndex = rows.findIndex((row) => row[0] === id);

        if (rowIndex === -1) {
            return NextResponse.json({ error: "Medication not found" }, { status: 404 });
        }

        // 2. Update the Stock cell (Column D is index 3 -> A, B, C, D)
        // Row is rowIndex + 1 (1-based sheet row)
        await updateRow(`Medications!D${rowIndex + 1}`, [stock.toString()]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating medication:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
