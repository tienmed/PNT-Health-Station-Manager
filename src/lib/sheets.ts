import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export async function getSheetsClient() {
    if (
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !process.env.GOOGLE_PRIVATE_KEY
    ) {
        throw new Error("Missing Google Service Account credentials");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
        const rows = await readSheet("Users!A:C"); // Email, Name, Role
        const userRow = rows.find((row) => row[0] === email);

        if (userRow) {
            return {
                email: userRow[0],
                name: userRow[1],
                role: userRow[2],
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user from sheets:", error);
        return null;
    }
}
