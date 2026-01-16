import webPush from "web-push";
import { getSubscriptions } from "./sheets";

// Configure Web Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        "mailto:support@pnt.edu.vn",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function sendNotificationToUser(email: string, title: string, body: string, url = "/") {
    // console.log(`[Push] Sending to ${email}: ${title}`);
    const subscriptions = await getSubscriptions([email]);

    if (subscriptions.length === 0) {
        // console.log(`[Push] No subscriptions found for ${email}`);
        return;
    }

    const payload = JSON.stringify({ title, body, url });

    const promises = subscriptions.map(sub =>
        webPush.sendNotification(sub, payload)
            .catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.warn("[Push] Subscription expired/invalid", sub.endpoint);
                    // TODO: Remove from sheet? Complex without Row ID. 
                    // For now, ignore.
                } else {
                    console.error("[Push] Error sending:", err);
                }
            })
    );

    await Promise.all(promises);
}

export async function sendNotificationToRole(role: "STAFF" | "ADMIN", title: string, body: string, url = "/") {
    // 1. Get all users with this role from Users sheet
    const { readSheet } = await import("./sheets");
    const rows = await readSheet("Users!A:C"); // Email, Name, Role

    // Filter emails
    const emails = rows
        .filter(r => r[2] === role)
        .map(r => r[0]);

    if (emails.length === 0) return;

    // 2. Get subscriptions for these emails
    const subscriptions = await getSubscriptions(emails);

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, url });

    // 3. Send
    const promises = subscriptions.map(sub =>
        webPush.sendNotification(sub, payload).catch(e => console.error(e))
    );

    await Promise.all(promises);
}
