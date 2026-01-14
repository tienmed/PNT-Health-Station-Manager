
import { google } from "googleapis";
import * as dotenv from "dotenv";
import path from "path";

// Load env from one level up (since we are in scripts/ or root? assume run from root)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkConnection() {
    console.log("Checking credentials...");

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!email) console.error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!privateKeyRaw) console.error("Missing GOOGLE_PRIVATE_KEY");
    if (!sheetId) console.error("Missing GOOGLE_SHEET_ID");

    if (!email || !privateKeyRaw || !sheetId) {
        process.exit(1);
    }

    // Test Key Formatting
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    console.log("Private Key length:", privateKey.length);
    console.log("Private Key starts with:", privateKey.substring(0, 30));

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    try {
        console.log("Attempting to read sheet metadata...");
        const result = await sheets.spreadsheets.get({
            spreadsheetId: sheetId
        });
        console.log("Success! Connected to sheet:", result.data.properties?.title);

        console.log("Attempting to read Users...");
        const users = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "Users!A1:C5"
        });
        console.log("Read Users success. Rows found:", users.data.values?.length || 0);

    } catch (error: any) {
        console.error("Connection Failed!");
        console.error("Error Message:", error.message);
        // console.error("Full Error:", error);
        process.exit(1);
    }
}

checkConnection();
