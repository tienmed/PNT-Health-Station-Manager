import { NextResponse } from "next/server";
import { readSheet, appendRow, updateRow, logActivity } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Read up to Col F (MinThreshold)
        const rows = await readSheet("Medications!A2:F");

        const medications = rows.map((row) => ({
            id: row[0],
            name: row[1],
            unit: row[2],
            stockTanNhut: parseInt(row[3] || "0", 10),
            stockHoaHung: parseInt(row[4] || "0", 10),
            // Aggregate for backward compatibility
            stock: parseInt(row[3] || "0", 10) + parseInt(row[4] || "0", 10),
            minThreshold: parseInt(row[5] || "0", 10),
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
        const { id, name, unit, stockTanNhut, stockHoaHung, minThreshold } = body;

        // Validation
        if (!id || !name) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Append to Medications Sheet
        // A:ID, B:Name, C:Unit, D:StockTanNhut, E:StockHoaHung, F:MinThreshold
        await appendRow("Medications!A:F", [
            id,
            name,
            unit || "units",
            (stockTanNhut || 0).toString(),
            (stockHoaHung || 0).toString(),
            minThreshold?.toString() || "0",
        ]);

        // Log Activity
        const details = `Thêm thuốc mới: ${name} (TN: ${stockTanNhut || 0}, HH: ${stockHoaHung || 0})`;
        await logActivity(session.user.email || "unknown", "ADD_MEDICATION", details);

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
        const { id, stock, area } = body;
        // We expect 'area' ('TAN_NHUT' | 'HOA_HUNG') and the NEW 'stock' value for that area.
        // OR we might receive generic stock update? The prompt implies "Log adjust stock level".
        // Let's support updating a specific area.

        if (!id || stock === undefined || !area) {
            return NextResponse.json({ error: "Missing fields (id, stock, area)" }, { status: 400 });
        }

        // 1. Find the row index
        const rows = await readSheet("Medications!A:A");
        const rowIndex = rows.findIndex((row) => row[0] === id);
        const userEmail = session.user.email || "unknown";

        if (rowIndex === -1) {
            return NextResponse.json({ error: "Medication not found" }, { status: 404 });
        }

        // 2. Determine Column and Update
        let targetCol = "";
        let areaName = "";
        if (area === "TAN_NHUT") {
            targetCol = "D";
            areaName = "Tân Nhựt";
        } else if (area === "HOA_HUNG") {
            targetCol = "E";
            areaName = "Hòa Hưng";
        } else {
            return NextResponse.json({ error: "Invalid Area" }, { status: 400 });
        }

        // Row is rowIndex + 1
        await updateRow(`Medications!${targetCol}${rowIndex + 1}`, [stock.toString()]);

        await logActivity(userEmail, "UPDATE_STOCK", `Cập nhật kho ${areaName}: ${id} -> ${stock}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating medication:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
