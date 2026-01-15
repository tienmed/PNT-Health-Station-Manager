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

        // Try to actually connect and READ data
        // Just getting client isn't enough, we must sign a JWT request
        let connectionResult = "NOT_ATTEMPTED";
        try {
            const client = await getSheetsClient();
            // Try to fetch spreadsheet metadata (lightweight)
            await client.spreadsheets.get({ spreadsheetId: sheetId });
            connectionResult = "SUCCESS";

            return NextResponse.json({
                status: "SUCCESS",
                message: "Authentication & Connection successful! (Spreadsheet accessed)",
                diagnostics,
                connectionResult
            });
        } catch (authError: any) {
            console.error("Auth Test Failed:", authError);
            return NextResponse.json({
                status: "AUTH_FAILED",
                error: authError.message,
                stack: authError.stack,
                diagnostics,
                connectionResult: "FAILED"
            }, { status: 500 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.toString() }, { status: 500 });
    }
}
