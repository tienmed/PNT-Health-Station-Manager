import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets";

export async function GET() {
    try {
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const sheetId = process.env.GOOGLE_SHEET_ID;

        const diagnostics = {
            hasEmail: !!email,
            emailValue: email, // Email is safe to show
            hasKey: !!privateKey,
            keyLength: privateKey ? privateKey.length : 0,
            keyFirstLine: privateKey ? privateKey.split("\n")[0].substring(0, 30) + "..." : "N/A",
            // Check for common issues
            isWrappedInQuotes: privateKey ? (privateKey.startsWith('"') || privateKey.startsWith("'")) : false,
            hasEscapedNewlines: privateKey ? privateKey.includes("\\n") : false,
            hasRealNewlines: privateKey ? privateKey.includes("\n") : false,
            sheetId: sheetId ? `${sheetId.substring(0, 5)}...` : "MISSING",
        };

        // Try to actually connect
        try {
            await getSheetsClient();
            return NextResponse.json({
                status: "SUCCESS",
                message: "Authentication successful!",
                diagnostics
            });
        } catch (authError: any) {
            return NextResponse.json({
                status: "AUTH_FAILED",
                error: authError.message,
                stack: authError.stack,
                diagnostics
            }, { status: 500 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.toString() }, { status: 500 });
    }
}
