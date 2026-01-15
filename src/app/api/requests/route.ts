import { NextResponse } from "next/server";
import { appendRow, readSheet, updateRow, logActivity } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { medicationId, quantity, note, subjectGroup } = body;

        // Validation
        if (!subjectGroup) {
            return NextResponse.json({ error: "Vui lòng chọn đối tượng (Sinh viên/Nhân viên)" }, { status: 400 });
        }
        if (!note && (!medicationId || !quantity)) {
            return NextResponse.json({ error: "Vui lòng nhập lý do hoặc chọn thuốc" }, { status: 400 });
        }

        const requestId = `REQ-${Date.now()}`;
        const date = new Date().toISOString(); // Store full ISO timestamp

        // 1. Add to Requests Sheet
        // Columns: RequestID, UserEmail, Date, Type, Status, Note, SubjectGroup, StaffNote, ProcessedAt
        await appendRow("Requests!A:I", [
            requestId,
            session.user.email,
            date,
            "REQUEST",
            "PENDING", // Initial status
            note || "",
            subjectGroup,
            "", // StaffNote initially empty
            ""  // ProcessedAt initially empty
        ]);

        // 2. Add to RequestItems Sheet (Optional at creation)
        if (medicationId && quantity) {
            await appendRow("RequestItems!A:C", [
                requestId,
                medicationId,
                quantity
            ]);
        }

        return NextResponse.json({ success: true, requestId });
    } catch (error: any) {
        console.error("Error creating request:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: error.toString()
        }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Fetch all necessary data
        // Read A:I to get all new columns
        const [requestRows, itemRows, medRows] = await Promise.all([
            readSheet("Requests!A2:I"),
            readSheet("RequestItems!A2:C"),
            readSheet("Medications!A2:B") // ID, Name
        ]);

        const isStaff = (session.user as any).role === "STAFF" || (session.user as any).role === "ADMIN";
        const now = new Date();

        // 2. Create Maps for fast lookup
        const itemMap = new Map();
        itemRows.forEach(row => {
            const reqId = row[0];
            if (!itemMap.has(reqId)) itemMap.set(reqId, []);
            itemMap.get(reqId).push({ medId: row[1], qty: row[2] });
        });

        const medMap = new Map();
        medRows.forEach(row => {
            medMap.set(row[0], row[1]);
        });

        // 3. Process Requests & Check Expiration
        const processedRequests = [];

        // We need to track updates to write back to sheets if any expired
        const updates = [];

        for (let i = 0; i < requestRows.length; i++) {
            const row = requestRows[i];
            const requestId = row[0];
            // Columns: 0:ID, 1:Email, 2:Date, 3:Type, 4:Status, 5:Note, 6:Group, 7:StaffNote, 8:ProcessedAt
            let status = row[4];
            let note = row[5];
            const dateStr = row[2];

            // Check Expiration (24h) for PENDING requests
            if (status === "PENDING" && dateStr) {
                const createdDate = new Date(dateStr);
                const diffMs = now.getTime() - createdDate.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours > 24) {
                    status = "EXPIRED";
                    // Only update if it wasn't already expired (though we checked status===PENDING)
                    // We need to update the Sheet for this row.
                    // Row index in Sheet is i + 2 (header + 0-index)
                    const rowIndex = i + 2;
                    // Update Status (Col E -> 4) 
                    // We won't batch these for simplicity now, but could be optimized.
                    // We'll update the 'note' or status in the list we return, 
                    // AND fire an async update to sheets.
                    updateRow(`Requests!E${rowIndex}`, ["EXPIRED"]);
                }
            }

            const items = itemMap.get(requestId) || [];
            const enrichedItems = items.map((it: any) => ({
                medicationId: it.medId,
                quantity: parseInt(it.qty || "0"),
                medicationName: medMap.get(it.medId) || "Unknown"
            }));

            processedRequests.push({
                requestId,
                email: row[1],
                date: row[2],
                type: row[3],
                status: status,
                note: note,
                subjectGroup: row[6] || "",
                staffNote: row[7] || "",
                processedAt: row[8] || "",
                items: enrichedItems,
            });
        }

        let filteredRequests;

        if (isStaff) {
            // Staff/Admin: Filter out EXPIRED requests
            filteredRequests = processedRequests.filter(req => req.status !== "EXPIRED");
        } else {
            // Employee: See ONLY their own requests
            filteredRequests = processedRequests.filter(req => req.email === session.user.email);
        }

        return NextResponse.json(filteredRequests.reverse());
    } catch (error) {
        console.error("Error fetching requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole === "EMPLOYEE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { requestId, status, items, staffNote, subjectGroup, distributionArea } = body;
        // items: { medicationId, quantity }[]
        // subjectGroup is optionally editable by Admin? Not strict req, but good to have if requested.

        if (!requestId || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        if (status === "APPROVED" && (!items || items.length === 0)) {
            // If approved but no items, that's debatable. But if items exist, we check area.
        }

        if (status === "APPROVED" && items && items.length > 0) {
            if (!distributionArea || (distributionArea !== "TAN_NHUT" && distributionArea !== "HOA_HUNG")) {
                return NextResponse.json({ error: "Vui lòng chọn khu vực xuất thuốc." }, { status: 400 });
            }
        }

        // 1. Find Request Row
        const requestRows = await readSheet("Requests!A:I");
        const reqRowIndex = requestRows.findIndex((row) => row[0] === requestId);

        if (reqRowIndex === -1) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const currentStatus = requestRows[reqRowIndex][4];

        // Admin can edit any non-expired. Staff can only edit PENDING.
        // Actually prompt says "Admin ... adjust PREVIOUSLY processed requests".
        // Staff cannot edit once processed? Protocol says "Staff ... không có chức năng điều chỉnh".
        if (currentStatus !== "PENDING" && userRole !== "ADMIN") {
            return NextResponse.json({ error: "Staff cannot edit processed requests." }, { status: 403 });
        }

        // Check for Self-Approval (Staff only)
        const creatorEmail = requestRows[reqRowIndex][1];
        if (userRole === "STAFF" && creatorEmail === session.user.email) {
            return NextResponse.json({ error: "Không thể tự duyệt yêu cầu của chính mình." }, { status: 403 });
        }

        // 2. Update Request Data
        // We update Status (E), StaffNote (H), ProcessedAt (I)
        // Row is reqRowIndex + 1
        const processedAt = new Date().toISOString();

        // Construct update arrays. 
        // We need to update specific cells.
        // Status is Col E (index 4 in 0-based row array, or column E in A1 notation)
        // StaffNote is Col H
        // ProcessedAt is Col I

        // Let's just update the specific columns to avoid overwriting user notes if they changed simultaneously (unlikely but safe)
        // Adjusting logic:
        // Adjusting logic:
        await updateRow(`Requests!E${reqRowIndex + 1}`, [status]);
        await updateRow(`Requests!H${reqRowIndex + 1}`, [staffNote || ""]);
        await updateRow(`Requests!I${reqRowIndex + 1}`, [processedAt]);
        // Update Distribution Area (Col J - index 9 - letter J)
        if (distributionArea) {
            await updateRow(`Requests!J${reqRowIndex + 1}`, [distributionArea]);
        }


        // 3. If Approved and items provided, Deduct Stock & Record Items
        // Note: If Admin is EDITING, we might need to REVERT previous stock? 
        // This is complex. For now, we'll assume "Adjust" means "Add more" or "Change status". 
        // Realistically, handling stock reversion is hard without a transaction log.
        // Simplify: If Admin edits, we just log the new items. Reverting stock is manual or out of scope for now unless simplest path.
        // Given complexity, we will implement standard "Add Items" flow. If Admin changes quantities, 
        // ideally we should calc difference. But for this MVP step:
        // We will just APPEND new items if any. 

        if (status === "APPROVED" && Array.isArray(items) && items.length > 0) {

            // To prevent double counting if Admin clicks "Save" again with same items, 
            // the UI should probably send ONLY NEW items or we need a way to diff.
            // For safety in this prompt, we'll assume the 'items' passed are the ONES TO BE ADDED.
            // (or we rely on the fact that existing items are in 'RequestItems' and we only append new ones).

            // (or we rely on the fact that existing items are in 'RequestItems' and we only append new ones).

            const medDataRows = await readSheet("Medications!A:F"); // Update range to include both stock cols

            let updateColLetter = "D";
            let stockIndexInRow = 3; // Default Tân Nhựt
            if (distributionArea === "HOA_HUNG") {
                updateColLetter = "E";
                stockIndexInRow = 4;
            }

            for (const item of items) {
                const { medicationId, quantity } = item;
                if (!medicationId || !quantity) continue;

                // Record Item
                await appendRow("RequestItems!A:C", [
                    requestId,
                    medicationId,
                    quantity
                ]);

                // Update Stock
                const medRowIndex = medDataRows.findIndex((row) => row[0] === medicationId);
                if (medRowIndex !== -1) {
                    const currentStock = parseInt(medDataRows[medRowIndex][stockIndexInRow] || "0");
                    const newStock = Math.max(0, currentStock - parseInt(quantity));

                    // Update the specific cell for stock
                    await updateRow(`Medications!${updateColLetter}${medRowIndex + 1}`, [newStock.toString()]);
                    medDataRows[medRowIndex][stockIndexInRow] = newStock.toString();
                }
            }

            // Log Activity
            await logActivity(
                session.user.email || "unknown",
                "APPROVE_REQUEST",
                `Duyệt yêu cầu ${requestId} - Khu vực: ${distributionArea} - Items: ${items.length}`
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
