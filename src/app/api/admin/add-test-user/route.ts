import { NextResponse } from "next/server";
import { appendRow, getUserByEmail } from "@/lib/sheets";

export async function GET() {
    try {
        const email = "cskh.pk@pnt.edu.vn";
        const name = "CSKH Test";
        const role = "STAFF";

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({
                status: "OK",
                message: "User already exists",
                user: existingUser
            });
        }

        // Add to "Users" sheet: Email, Name, Role
        await appendRow("Users!A:C", [email, name, role]);

        return NextResponse.json({
            status: "SUCCESS",
            message: `User ${email} added as ${role}`
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.toString() }, { status: 500 });
    }
}
