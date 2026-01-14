# Setup Guide - Health Station Management

Follow these steps to configure your system manually.

## 1. Google Cloud & Environment Variables
1.  Go to **Google Cloud Console** (console.cloud.google.com).
2.  Create a **New Project**.
3.  **Enable APIs**: Search for and enable **Google Sheets API**.
4.  **Create Service Account**:
    - Go to "Credentials" -> "Create Credentials" -> "Service Account".
    - Name it (e.g., `sheets-manager`).
    - Click "Done".
    - Click on the new Service Account (email looks like `sheets-manager@project-id.iam.gserviceaccount.com`).
    - Go to **Keys** tab -> "Add Key" -> "Create new key" -> **JSON**.
    - Open the downloaded JSON file.
5.  **Configure `.env`**:
    - Create a file named `.env` in the project root.
    - Copy values from the JSON key:
      ```env
      GOOGLE_SERVICE_ACCOUNT_EMAIL=client_email_from_json
      GOOGLE_PRIVATE_KEY="private_key_from_json_including_\n"
      ```
    - Add your OAuth 2.0 Client ID/Secret (for Login):
      ```env
      GOOGLE_CLIENT_ID=your_oauth_client_id
      GOOGLE_CLIENT_SECRET=your_oauth_client_secret
      NEXTAUTH_URL=http://localhost:3000
      NEXTAUTH_SECRET=any_random_string
      ```

## 2. Google Sheet Setup
1.  Create a new **Google Sheet** (sheets.new).
2.  **Share** the sheet with the `client_email` from step 1 (Editor access).
3.  Copy the **Spreadsheet ID** from the URL:
    - URL structure: `docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
    - Paste it into `.env`:
      ```env
      GOOGLE_SHEET_ID=your_spreadsheet_id
      ```
4.  **Create Tabs (Sheets)** using the `+` button at the bottom. Rename them exactly as follows and add these headers in **Row 1**:

    ### Tab: `Users`
    *Only for Staff/Admins. Regular employees don't need to be here.*
    | A | B | C |
    |---|---|---|
    | **Email** | **Name** | **Role** |

    ### Tab: `Medications`
    *List of medicines available.*
    | A | B | C | D | E |
    |---|---|---|---|---|
    | **ID** | **Name** | **Unit** | **StockLevel** | **MinThreshold** |

    ### Tab: `Requests`
    *Tracks requests.*
    | A | B | C | D | E | F |
    |---|---|---|---|---|---|
    | **RequestID** | **UserEmail** | **Date** | **Type** | **Status** | **Note** |

    ### Tab: `RequestItems`
    | A | B | C |
    |---|---|---|
    | **RequestID** | **MedicationID** | **Quantity** |

    ### Tab: `Logs`
    | A | B | C | D |
    |---|---|---|---|
    | **Date** | **ActorEmail** | **Action** | **Details** |

## 3. Run the App
Now you can run the development server:
```bash
npm run dev
```

## 4. Vercel Deployment (Production)
Since you have connected GitHub to Vercel, follow these steps to make the app work online:

1.  Go to your **Vercel Dashboard** -> Select the Project (`pnt-health-station-manager`).
2.  Click **Settings** (top tab) -> **Environment Variables** (side menu).
3.  Add the following variables (copy values from your local `.env` or the JSON file):

    | Key | Value / Note |
    |---|---|
    | `GOOGLE_CLIENT_ID` | Same as local |
    | `GOOGLE_CLIENT_SECRET` | Same as local |
    | `NEXTAUTH_SECRET` | Same as local (or generate a new random string) |
    | `NEXTAUTH_URL` | `https://pnt-health-station-manager-pkpnt.vercel.app` (Your Vercel Link) |
    | `GOOGLE_SHEET_ID` | Same as local |
    | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Same as local |
    | `GOOGLE_PRIVATE_KEY` | **CRITICAL**: Copy the key *exactly* as it is in the JSON file. Vercel handles the newlines automatically now, but if you have issues, ensure the whole string is pasted. |

4.  **Redeploy**:
    - Go to **Deployments** tab.
    - Click the three dots (`...`) on the latest failed/current deployment -> **Redeploy**.
    - This ensures the new variables are picked up.

5.  **Google Cloud URI Update**:
    - Go back to **Google Cloud Console** -> Credentials -> OAuth 2.0 Client ID.
    - Add to **Authorized JavaScript origins**: `https://pnt-health-station-manager-pkpnt.vercel.app`
    - Add to **Authorized redirect URIs**: `https://pnt-health-station-manager-pkpnt.vercel.app/api/auth/callback/google`
