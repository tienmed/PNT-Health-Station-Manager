// scripts/setup-db.ts
import { config } from "dotenv";
import { google } from "googleapis";
import path from "path";

// Load environment variables from .env
config({ path: path.resolve(process.cwd(), ".env") });

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

async function main() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
        console.error("❌ Missing environment variables. Please check .env");
        console.error("Required: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID");
        process.exit(1);
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: serviceAccountEmail,
            private_key: privateKey.replace(/\\n/g, "\n"),
        },
        scopes: SCOPES,
    });

    const sheets = google.sheets({ version: "v4", auth });

    const structure = [
        {
            title: "Users",
            header: ["Email", "Name", "Role"], // A1:C1
        },
        {
            title: "Medications",
            header: ["ID", "Name", "Unit", "StockLevel", "MinThreshold"], // A1:E1
        },
        {
            title: "Requests",
            header: ["RequestID", "UserEmail", "Date", "Type", "Status", "Note"], // A1:F1
        },
        {
            title: "RequestItems",
            header: ["RequestID", "MedicationID", "Quantity"], // A1:C1
        },
        {
            title: "Logs",
            header: ["Date", "ActorEmail", "Action", "Details"], // A1:D1
        },
    ];

    console.log(`Using Sheet ID: ${spreadsheetId}`);

    for (const sheet of structure) {
        try {
            // 1. Try to add the sheet (tab)
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: sheet.title,
                                },
                            },
                        },
                    ],
                },
            });
            console.log(`✅ Created tab: ${sheet.title}`);
        } catch (error: any) {
            if (error.message.includes("already exists")) {
                console.log(`ℹ️  Tab '${sheet.title}' already exists. Skipping creation.`);
            } else {
                console.error(`❌ Error creating tab '${sheet.title}':`, error.message);
            }
        }

        // 2. Update Header Row
        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheet.title}!A1`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [sheet.header]
                }
            });
            console.log(`   Detailed headers set for ${sheet.title}`);
        } catch (error: any) {
            console.error(`   ❌ Error setting headers for ${sheet.title}:`, error.message);
        }
    }

    console.log("\n🎉 Database setup complete!");
}

main().catch(console.error);
