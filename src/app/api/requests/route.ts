import { NextResponse } from "next/server";
import { appendRow, readSheet, updateRow } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { medicationId, quantity, note } = body;

        if (!medicationId || !quantity) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const requestId = `REQ-${Date.now()}`;
        const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // 1. Add to Requests Sheet
        // Columns: RequestID, UserEmail, Date, Type, Status, Note
        await appendRow("Requests!A:F", [
            requestId,
            session.user.email,
            date,
            "REQUEST",
            "PENDING", // Initial status
            note || "",
        ]);

        // 2. Add to RequestItems Sheet
        // Columns: RequestID, MedicationID, Quantity
        await appendRow("RequestItems!A:C", [
            requestId,
            medicationId,
            quantity
        ]);

        return NextResponse.json({ success: true, requestId });
    } catch (error) {
        console.error("Error creating request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Fetch all necessary data
        const [requestRows, itemRows, medRows] = await Promise.all([
            readSheet("Requests!A2:F"),
            readSheet("RequestItems!A2:C"),
            readSheet("Medications!A2:B") // ID, Name
        ]);

        const isStaff = (session.user as any).role === "STAFF" || (session.user as any).role === "ADMIN";

        // 2. Create Maps for fast lookup
        // Item Map: RequestID -> { medId, qty }
        const itemMap = new Map();
        itemRows.forEach(row => {
            itemMap.set(row[0], { medId: row[1], qty: row[2] });
        });

        // Med Map: MedID -> Name
        const medMap = new Map();
        medRows.forEach(row => {
            medMap.set(row[0], row[1]);
        });

        // 3. Process Requests
        const allRequests = requestRows.map((row) => {
            const requestId = row[0];
            const item = itemMap.get(requestId) || {};
            const medName = medMap.get(item.medId) || "Unknown";

            return {
                requestId,
                email: row[1],
                date: row[2],
                type: row[3],
                status: row[4],
                note: row[5],
                medicationId: item.medId,
                medicationName: medName,
                quantity: parseInt(item.qty || "0"),
            };
        });

        let filteredRequests;

        if (isStaff) {
            filteredRequests = allRequests;
        } else {
            filteredRequests = allRequests.filter(req => req.email === session.user?.email);
        }

        return NextResponse.json(filteredRequests.reverse());
    } catch (error) {
        console.error("Error fetching requests:", error);
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
        const { requestId, status, medicationId, quantity } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Find Request Row
        const requestRows = await readSheet("Requests!A:A");
        const reqRowIndex = requestRows.findIndex((row) => row[0] === requestId);

        if (reqRowIndex === -1) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // 2. Update Status (Column E -> Index 4 -> A,B,C,D,E)
        // Row is reqRowIndex + 1
        await updateRow(`Requests!E${reqRowIndex + 1}`, [status]);

        // 3. If Approved, Deduct Stock
        if (status === "APPROVED" && medicationId && quantity) {
            const medDataRows = await readSheet("Medications!A:E");
            const medRowIndex = medDataRows.findIndex((row) => row[0] === medicationId);

            if (medRowIndex !== -1) {
                const currentStock = parseInt(medDataRows[medRowIndex][3] || "0");
                const newStock = Math.max(0, currentStock - quantity);

                await updateRow(`Medications!D${medRowIndex + 1}`, [newStock.toString()]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
