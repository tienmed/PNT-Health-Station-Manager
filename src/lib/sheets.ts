import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export async function getSheetsClient() {
    if (
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !process.env.GOOGLE_PRIVATE_KEY
    ) {
        throw new Error("Missing Google Service Account credentials");
    }

    // Clean up the private key
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // 1. Remove wrapping quotes (single or double) if they exist
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
    }

    // 2. Handle JSON format (if user pasted the whole file content)
    if (privateKey.trim().startsWith("{")) {
        try {
            const jsonKey = JSON.parse(privateKey);
            if (jsonKey.private_key) {
                console.log("[DEBUG] Detected JSON format, extracting private_key field.");
                privateKey = jsonKey.private_key;
            }
        } catch (e) {
            console.error("[DEBUG] Failed to parse GOOGLE_PRIVATE_KEY as JSON", e);
        }
    }

    // 3. Replace all variations of escaped newlines
    // Some envs might give \\n, others \n
    privateKey = privateKey.replace(/\\n/g, "\n");

    // 4. Force repair of single-line keys (common copy-paste error)
    // If the key has no newlines but looks like a PEM, we insert them.
    if (!privateKey.includes("\n")) {
        console.log("[DEBUG] Key is single-line, attempting to auto-format.");
        const header = "-----BEGIN PRIVATE KEY-----";
        const footer = "-----END PRIVATE KEY-----";

        if (privateKey.includes(header) && privateKey.includes(footer)) {
            // Remove headers to get body
            let body = privateKey.replace(header, "").replace(footer, "").trim();
            // Re-construct with strict newlines
            privateKey = `${header}\n${body}\n${footer}`;
            console.log("[DEBUG] Key auto-formatted with newlines.");
        }
    }

    // 5. Debugging: Log key structure (safe, redacted)
    const lines = privateKey.split("\n");
    console.log(`[DEBUG] Processed Key: Lines=${lines.length}, Header=${lines[0].substring(0, 25)}...`);

    if (lines.length < 3) {
        console.warn("[WARNING] Private key still appears to be malformed (too few lines).");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey,
        },
        scopes: SCOPES,
    });

    return google.sheets({ version: "v4", auth });
}

export async function readSheet(range: string) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID");
    }

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values || [];
}

export async function appendRow(range: string, values: any[]) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID");
    }

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [values],
        },
    });
}

export async function updateRow(range: string, values: any[]) {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID");
    }

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [values],
        },
    });
}

export async function getUserByEmail(email: string) {
    try {
        const rows = await readSheet("Users!A:E"); // Email, Name, Role, Phone, Unit
        const userRow = rows.find((row) => row[0] === email);

        if (userRow) {
            return {
                email: userRow[0],
                name: userRow[1],
                role: userRow[2],
                phone: userRow[3] || "",
                unit: userRow[4] || "",
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user from sheets:", error);
        return null;
    }
}

export async function updateUser(email: string, name: string, role: string, phone: string, unit: string) {
    const rows = await readSheet("Users!A:A");
    const rowIndex = rows.findIndex((row) => row[0] === email);

    if (rowIndex !== -1) {
        // Update existing row (A-E)
        // Range: A(Row):E(Row)
        // We need to overwrite the whole row or specific cells. Let's overwrite B-E.
        // A=Email is key.
        const rowNum = rowIndex + 1;
        await updateRow(`Users!B${rowNum}:E${rowNum}`, [name, role, phone, unit]);
    } else {
        // Append new
        await appendRow("Users!A:E", [email, name, role || "EMPLOYEE", phone, unit]);
    }
}

export async function logActivity(email: string, action: string, details: string) {
    try {
        const timestamp = new Date().toISOString();
        // Logs Sheet: Timestamp, Email, Action, Details
        await appendRow("Logs!A:D", [timestamp, email, action, details]);
    } catch (error) {
        console.error("Failed to log activity:", error);
        // We don't throw here to avoid failing the main operation just because logging failed
    }
}
